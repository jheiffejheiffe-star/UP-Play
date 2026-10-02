import { config } from "./src/config/index.ts";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import v1Router, { authMiddleware, adminMiddleware } from "./src/db/v1-router.ts";
import { seedDatabase } from "./src/db/seed.ts";
import { db, isDbConfigured, isDbConnected } from "./src/db/index.ts";
import { songs as dbSongs, announcements as dbAnnouncements } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

dotenv.config();

const app = express();
const PORT = config.server.port;

// Set up HTTP Server and Socket.IO
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket.IO Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket.IO Client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());

// Mount the API v1 Router
app.use("/api/v1", v1Router);

// Initialize Gemini SDK with defensive checks
const apiKey = config.gemini.apiKey;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API successfully initialized on UP Play server.");
  } catch (error) {
    console.error("Failed to initialize Gemini API Client:", error);
  }
} else {
  console.log("Gemini API Key is missing or default. Falling back to simulated music intelligence.");
}

// Highly resilient Gemini helper with fast model fallbacks and immediate failover on 503/429/not-found errors
async function generateContentWithRetry(aiClient: GoogleGenAI, params: {
  contents: any;
  config?: any;
}) {
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview"
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || (typeof err === 'object' ? JSON.stringify(err) : err) || "");
      const isTemporaryDemandOrNotFound = 
        errMsg.includes("503") || 
        errMsg.includes("UNAVAILABLE") || 
        errMsg.includes("not found") || 
        errMsg.includes("404") || 
        errMsg.includes("429") || 
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("high demand") ||
        err?.status === 503 ||
        err?.code === 503 ||
        err?.error?.code === 503;

      if (isTemporaryDemandOrNotFound) {
        console.log(`[Gemini Fallback] Model ${modelName} is at capacity or unavailable. Seamlessly switching to next model.`);
        continue;
      }
      
      // For other transient errors, attempt immediate fallback to next model
      console.log(`[Gemini Fallback] Model ${modelName} encountered transient error (${errMsg.slice(0, 80)}). Trying fallback.`);
    }
  }
  throw lastError;
}

// Interfaces
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  bpm: number;
  energy: number; // 1 to 10
  genre: string;
  coverGradient: string;
  votes: number;
  youtubeUrl?: string;
  youtubeId?: string;
  requestCount?: number;
  likes?: number;
  lastPlayedAt?: number;
  lastVotedAt?: number;
  language?: string;
  year?: number;
  tags?: string[];
  thumbnail?: string;
  aiModerationLevel?: string;
  smartScore?: number;
}

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = str.match(regExp);
  return match ? match[1] : null;
}

interface Dedication {
  id: string;
  userName: string;
  text: string;
  targetUser?: string;
  songTitle?: string;
  timestamp: string;
}

interface GymZone {
  id: string;
  name: string;
  icon: string;
  color: string;
  currentSong: Song | null;
  currentProgress: number; // in seconds
  isPlaying: boolean; // Authoritative playback state defined by Gestor
  playbackTimestamp: number; // Date.now() when state was synced
  version: number;
  bpmMultiplier: number;
  powerModeActive: boolean;
  powerModeTimeLeft: number; // in seconds
  queue: Song[];
  history: Song[];
  messages: Dedication[];
  consecutiveUpPlayPlayed?: number;
  catalogIndex?: number;
}

// Helper function to calculate Smart Queue Score
export function calculateSmartScore(song: Song, history: Song[] = []): number {
  const requests = song.requestCount || song.votes || 0;
  const likes = song.likes || 0;
  const now = Date.now();
  const lastPlayed = song.lastPlayedAt || (now - 120 * 60 * 1000); // 2 hours ago default
  const minutesUnplayed = Math.max(0, Math.floor((now - lastPlayed) / (60 * 1000)));
  const unplayedBonus = Math.floor(minutesUnplayed / 10);

  let recentPenalty = 0;
  if (history && history.length > 0) {
    const recentIdx = history.findIndex(h => h.id === song.id || h.title.toLowerCase() === song.title.toLowerCase());
    if (recentIdx >= 0 && recentIdx < 3) {
      recentPenalty = (3 - recentIdx) * 15;
    }
  }

  const score = (requests * 3) + (likes * 2) + unplayedBonus - recentPenalty;
  return Math.max(1, score);
}

// Persistence file for blacklisted/unavailable YouTube tracks
const UNAVAILABLE_SONGS_FILE = path.join(process.cwd(), "unavailable-songs.json");

function loadUnavailableSongs(): Set<string> {
  try {
    if (fs.existsSync(UNAVAILABLE_SONGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(UNAVAILABLE_SONGS_FILE, "utf-8"));
      if (Array.isArray(data)) {
        return new Set(data);
      }
    }
  } catch (err: any) {
    console.warn("Could not load unavailable-songs.json:", err.message);
  }
  return new Set();
}

function saveUnavailableSongs(blacklist: Set<string>) {
  try {
    fs.writeFileSync(UNAVAILABLE_SONGS_FILE, JSON.stringify(Array.from(blacklist), null, 2), "utf-8");
  } catch (err: any) {
    console.warn("Could not save unavailable-songs.json:", err.message);
  }
}

const UNAVAILABLE_SONGS_BLACKLIST: Set<string> = loadUnavailableSongs();

// Master track pool (high-energy real-world music curated for fitness)
const TRACK_POOL: Song[] = [
  // Musculação / Weightlifting (Rap, Metal, Hard Rock)
  { 
    id: "ytQ5CYE1VZw", title: "Till I Collapse", artist: "Eminem ft. Nate Dogg", album: "The Eminem Show", duration: 297, bpm: 171, energy: 10, genre: "Hip Hop / Rap", coverGradient: "from-red-600 to-black", votes: 0,
    language: "Inglês", year: 2002, tags: ["Hipertrofia", "Treino Pesado", "Supino"], requestCount: 42, likes: 28, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 3600000,
    youtubeId: "ytQ5CYE1VZw",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=350"
  },
  { 
    id: "v2AC41dglnM", title: "Thunderstruck", artist: "AC/DC", album: "The Razors Edge", duration: 292, bpm: 133, energy: 10, genre: "Classic Rock / Metal", coverGradient: "from-orange-600 to-red-900", votes: 0,
    language: "Inglês", year: 1990, tags: ["Carga Máxima", "Rock Clássico", "Supino"], requestCount: 38, likes: 29, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 5400000,
    youtubeId: "v2AC41dglnM",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=350"
  },
  { 
    id: "btPJPFnesV4", title: "Eye of the Tiger", artist: "Survivor", album: "Eye of the Tiger", duration: 245, bpm: 109, energy: 9, genre: "Rock", coverGradient: "from-amber-600 to-red-800", votes: 0,
    language: "Inglês", year: 1982, tags: ["Maromba", "Motivação", "Clássico"], requestCount: 31, likes: 22, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 7200000,
    youtubeId: "btPJPFnesV4",
    thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=350"
  },
  { 
    id: "_Yhyp-_hX2s", title: "Lose Yourself", artist: "Eminem", album: "8 Mile Soundtrack", duration: 326, bpm: 171, energy: 10, genre: "Hip Hop / Rap", coverGradient: "from-rose-700 to-zinc-900", votes: 0,
    language: "Inglês", year: 2002, tags: ["Foco Total", "Recorde Pessoal", "Hipertrofia"], requestCount: 55, likes: 44, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 4200000,
    youtubeId: "_Yhyp-_hX2s",
    thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=350"
  },
  { 
    id: "eVTXPUF4Oz4", title: "In The End", artist: "Linkin Park", album: "Hybrid Theory", duration: 216, bpm: 105, energy: 9, genre: "Nu Metal / Rock", coverGradient: "from-stone-700 to-stone-900", votes: 0,
    language: "Inglês", year: 2000, tags: ["Rock", "Treino Pesado", "Nostalgia"], requestCount: 29, likes: 21, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 8400000,
    youtubeId: "eVTXPUF4Oz4",
    thumbnail: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=350"
  },
  { 
    id: "CD-E-LDc384", title: "Enter Sandman", artist: "Metallica", album: "Metallica", duration: 331, bpm: 123, energy: 10, genre: "Heavy Metal", coverGradient: "from-neutral-800 to-black", votes: 0,
    language: "Inglês", year: 1991, tags: ["Heavy Metal", "Carga Máxima", "Deadlift"], requestCount: 34, likes: 25, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 9600000,
    youtubeId: "CD-E-LDc384",
    thumbnail: "https://images.unsplash.com/photo-1535970793482-07de93762741?q=80&w=350"
  },
  { 
    id: "d1KGgU1pQk0", title: "Can't Be Touched", artist: "Roy Jones Jr.", album: "Round One", duration: 214, bpm: 160, energy: 9, genre: "Hip Hop / Workout", coverGradient: "from-red-800 to-zinc-950", votes: 0,
    language: "Inglês", year: 2004, tags: ["Boxe", "Superação", "Força Bruta"], requestCount: 27, likes: 18, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 11000000,
    youtubeId: "d1KGgU1pQk0",
    thumbnail: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=350"
  },
  { 
    id: "PsO6Zn4VBUA", title: "Stronger", artist: "Kanye West", album: "Graduation", duration: 312, bpm: 104, energy: 9, genre: "Hip Hop / Electronic", coverGradient: "from-pink-600 to-indigo-800", votes: 0,
    language: "Inglês", year: 2007, tags: ["Ritmo Forte", "Pump", "Motivação"], requestCount: 33, likes: 26, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 6500000,
    youtubeId: "PsO6Zn4VBUA",
    thumbnail: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=350"
  },
  
  // Cardio / High Intensity (Dance, Techno, EDM, Synthwave)
  { 
    id: "gAjR4_CB4iI", title: "Harder, Better, Faster, Stronger", artist: "Daft Punk", album: "Discovery", duration: 224, bpm: 123, energy: 9, genre: "Electronic / Dance", coverGradient: "from-blue-600 to-purple-800", votes: 0,
    language: "Inglês", year: 2001, tags: ["Cardio", "Ritmo Acelerado", "Eletrônico"], requestCount: 45, likes: 32, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 2200000,
    youtubeId: "gAjR4_CB4iI",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=350"
  },
  { 
    id: "4NRXx6U8ABQ", title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: 200, bpm: 171, energy: 9, genre: "Synthwave / Pop", coverGradient: "from-rose-500 to-amber-600", votes: 0,
    language: "Inglês", year: 2020, tags: ["Esteira", "Cardio Peak", "BPM 170"], requestCount: 50, likes: 39, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 1800000,
    youtubeId: "4NRXx6U8ABQ",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=350"
  },
  { 
    id: "TUVcZfQe-Kw", title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration: 203, bpm: 103, energy: 8, genre: "Nu-Disco / Pop", coverGradient: "from-fuchsia-500 to-cyan-500", votes: 0,
    language: "Inglês", year: 2020, tags: ["Groove", "Agilidade", "Ritmo"], requestCount: 28, likes: 19, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 8800000,
    youtubeId: "TUVcZfQe-Kw",
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=350"
  },
  { 
    id: "nCg3upGOZ_A", title: "The Business", artist: "Tiësto", album: "The Business", duration: 164, bpm: 120, energy: 9, genre: "Deep House / EDM", coverGradient: "from-emerald-500 to-blue-700", votes: 0,
    language: "Inglês", year: 2020, tags: ["House", "Sprint", "Bicicleta"], requestCount: 37, likes: 24, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 4800000,
    youtubeId: "nCg3upGOZ_A",
    thumbnail: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=350"
  },
  { 
    id: "JVpTp8CXQK4", title: "Hear Me Now", artist: "Alok, Bruno Martini ft. Zeeba", album: "Hear Me Now", duration: 192, bpm: 122, energy: 8, genre: "Deep House / Dance", coverGradient: "from-cyan-400 to-fuchsia-500", votes: 0,
    language: "Inglês", year: 2016, tags: ["Aquecimento", "Groove", "Foco"], requestCount: 24, likes: 16, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 14000000,
    youtubeId: "JVpTp8CXQK4",
    thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=350"
  },
  { 
    id: "90RLzVU5x60", title: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha", album: "I'm Good (Blue)", duration: 175, bpm: 128, energy: 9, genre: "Dance Pop / EDM", coverGradient: "from-blue-500 to-indigo-700", votes: 0,
    language: "Inglês", year: 2022, tags: ["EDM", "Sprint", "Explosão"], requestCount: 40, likes: 29, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 3200000,
    youtubeId: "90RLzVU5x60",
    thumbnail: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=350"
  },
  { 
    id: "_ovdm2yX4MA", title: "Levels", artist: "Avicii", album: "Levels", duration: 198, bpm: 126, energy: 10, genre: "Progressive House", coverGradient: "from-amber-400 to-orange-600", votes: 0,
    language: "Inglês", year: 2011, tags: ["Progressive House", "Cardio Rush", "Energia"], requestCount: 48, likes: 37, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 2500000,
    youtubeId: "_ovdm2yX4MA",
    thumbnail: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=350"
  },
  { 
    id: "1y6smkh6c-0", title: "Don't You Worry Child", artist: "Swedish House Mafia", album: "Until Now", duration: 212, bpm: 129, energy: 9, genre: "EDM / Festival", coverGradient: "from-indigo-500 to-rose-600", votes: 0,
    language: "Inglês", year: 2012, tags: ["Festival", "Corrida", "Pico"], requestCount: 30, likes: 23, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 7800000,
    youtubeId: "1y6smkh6c-0",
    thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=350"
  },

  // Musculação Pesada / Treino Extremo (Rock, Dubstep, Trap)
  { 
    id: "7wtfhZwyrcc", title: "Believer", artist: "Imagine Dragons", album: "Evolve", duration: 204, bpm: 125, energy: 10, genre: "Alternative Rock / Trap", coverGradient: "from-purple-600 to-red-600", votes: 0,
    language: "Inglês", year: 2017, tags: ["Hipertrofia", "Trap Rock", "Heavy Lift"], requestCount: 62, likes: 49, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 1100000,
    youtubeId: "7wtfhZwyrcc",
    thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=350"
  },
  { 
    id: "YJVmu6yttiw", title: "Bangarang", artist: "Skrillex ft. Sirah", album: "Bangarang EP", duration: 215, bpm: 110, energy: 10, genre: "Dubstep / Bass", coverGradient: "from-rose-600 to-indigo-950", votes: 0,
    language: "Inglês", year: 2011, tags: ["Carga Máxima", "Dubstep", "Recorde"], requestCount: 46, likes: 35, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 2900000,
    youtubeId: "YJVmu6yttiw",
    thumbnail: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=350"
  },
  { 
    id: "fmI_Ndrxy14", title: "Warriors", artist: "Imagine Dragons", album: "Smoke + Mirrors", duration: 171, bpm: 78, energy: 10, genre: "Epic Rock", coverGradient: "from-amber-600 to-amber-950", votes: 0,
    language: "Inglês", year: 2014, tags: ["Força", "Heavy Lift", "Metal"], requestCount: 35, likes: 25, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 5600000,
    youtubeId: "fmI_Ndrxy14",
    thumbnail: "https://images.unsplash.com/photo-1535970793482-07de93762741?q=80&w=350"
  },
  { 
    id: "HMUDVMiITOU", title: "Turn Down for What", artist: "DJ Snake & Lil Jon", album: "Turn Down for What", duration: 213, bpm: 100, energy: 10, genre: "Trap / Bass", coverGradient: "from-yellow-500 to-red-800", votes: 0,
    language: "Inglês", year: 2013, tags: ["Bass House", "Explosão", "Resistência"], requestCount: 38, likes: 27, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 4100000,
    youtubeId: "HMUDVMiITOU",
    thumbnail: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=350"
  },
  { 
    id: "09LTT0sfnnE", title: "Down With The Sickness", artist: "Disturbed", album: "The Sickness", duration: 278, bpm: 90, energy: 10, genre: "Nu Metal / Industrial", coverGradient: "from-stone-900 to-red-950", votes: 0,
    language: "Inglês", year: 2000, tags: ["Hardcore", "Intensidade 10", "WOD"], requestCount: 41, likes: 31, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 3700000,
    youtubeId: "09LTT0sfnnE",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=350"
  },

  // Yoga / Zen / Recovery (Lofi, Ambient, Chillout, Neo-Classical)
  { 
    id: "jfKfPfyJRdk", title: "Lofi Hip Hop Chill Beats", artist: "Lofi Girl", album: "Study & Relax Sessions", duration: 240, bpm: 80, energy: 2, genre: "Lofi Hip Hop", coverGradient: "from-sky-300 to-indigo-400", votes: 0,
    language: "Instrumental", year: 2023, tags: ["Lofi", "Descompressão", "Pós-Treino"], requestCount: 19, likes: 14, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 15000000,
    youtubeId: "jfKfPfyJRdk",
    thumbnail: "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?q=80&w=350"
  },
  { 
    id: "UfcAVejslrU", title: "Weightless", artist: "Marconi Union", album: "Weightless", duration: 485, bpm: 60, energy: 1, genre: "Ambient / Meditation", coverGradient: "from-cyan-600 to-teal-800", votes: 0,
    language: "Instrumental", year: 2011, tags: ["Alongamento", "Respiração", "Zen"], requestCount: 15, likes: 11, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 20000000,
    youtubeId: "UfcAVejslrU",
    thumbnail: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=350"
  },
  { 
    id: "kcihcYEOeic", title: "Nuvole Bianche", artist: "Ludovico Einaudi", album: "Una Mattina", duration: 348, bpm: 68, energy: 2, genre: "Neo-Classical Piano", coverGradient: "from-emerald-200 to-sky-200", votes: 0,
    language: "Instrumental", year: 2004, tags: ["Piano", "Mindfulness", "Foco Leve"], requestCount: 16, likes: 12, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 26000000,
    youtubeId: "kcihcYEOeic",
    thumbnail: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=350"
  },
  { 
    id: "13EifbKEIBMT", title: "Porcelain", artist: "Moby", album: "Play", duration: 241, bpm: 96, energy: 3, genre: "Chillout / Electronica", coverGradient: "from-emerald-300 to-teal-500", votes: 0,
    language: "Inglês", year: 1999, tags: ["Yoga", "Recuperação", "Meditação"], requestCount: 14, likes: 10, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 22000000,
    youtubeId: "13EifbKEIBMT",
    thumbnail: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=350"
  },
  { 
    id: "7maJOI3QMu0", title: "River Flows In You", artist: "Yiruma", album: "First Love", duration: 215, bpm: 70, energy: 2, genre: "Contemporary Classical", coverGradient: "from-teal-300 to-blue-400", votes: 0,
    language: "Instrumental", year: 2001, tags: ["Alongamento", "Relaxamento", "Flexibilidade"], requestCount: 12, likes: 9, aiModerationLevel: "Aprovado Total", lastPlayedAt: Date.now() - 28000000,
    youtubeId: "7maJOI3QMu0",
    thumbnail: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=350"
  }
];

// ================= PERSISTENT PLAYBACK STATE ENGINE =================
const PLAYBACK_STATE_FILE = path.join(process.cwd(), "playback-state.json");

interface SavedPlaybackState {
  currentSongId?: string;
  currentSong?: Song;
  currentProgress?: number;
  catalogIndex?: number;
  consecutiveUpPlayPlayed?: number;
  history?: Song[];
  queue?: Song[];
  isPlaying?: boolean;
  bpmMultiplier?: number;
  savedAt?: number;
}

function loadSavedPlaybackState(): SavedPlaybackState | null {
  try {
    if (fs.existsSync(PLAYBACK_STATE_FILE)) {
      const raw = fs.readFileSync(PLAYBACK_STATE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        console.log(`[Playback State] Restored saved playback from disk: "${parsed.currentSong?.title || parsed.currentSongId}", progress: ${parsed.currentProgress || 0}s, catalogIndex: ${parsed.catalogIndex}`);
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn("[Playback State] Could not read playback-state.json:", err.message);
  }
  return null;
}

function savePlaybackStateToDisk(zone?: GymZone) {
  try {
    const targetZone = zone || (GYM_ZONES && GYM_ZONES[0]);
    if (!targetZone) return;
    const stateToSave: SavedPlaybackState = {
      currentSongId: targetZone.currentSong?.id,
      currentSong: targetZone.currentSong,
      currentProgress: Math.floor(targetZone.currentProgress || 0),
      catalogIndex: targetZone.catalogIndex,
      consecutiveUpPlayPlayed: targetZone.consecutiveUpPlayPlayed,
      history: targetZone.history?.slice(0, 25),
      queue: targetZone.queue,
      isPlaying: targetZone.isPlaying,
      bpmMultiplier: targetZone.bpmMultiplier,
      savedAt: Date.now()
    };
    fs.writeFileSync(PLAYBACK_STATE_FILE, JSON.stringify(stateToSave, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("[Playback State] Could not save playback-state.json:", err.message);
  }
}

// Load saved playback state on server startup
const initialSavedState = loadSavedPlaybackState();

let initialSong: Song = TRACK_POOL[0];
let initialCatalogIndex = 1;
let initialConsecutive = 1;
let initialProgress = 0;
let initialHistory: Song[] = [];
let initialQueue: Song[] = [];
let initialIsPlaying = true;
let initialBpmMultiplier = 1.0;

if (initialSavedState) {
  if (initialSavedState.currentSong) {
    const poolMatch = TRACK_POOL.find(s => s.id === initialSavedState.currentSong?.id || s.youtubeId === initialSavedState.currentSong?.youtubeId);
    initialSong = poolMatch ? { ...poolMatch, ...initialSavedState.currentSong } : initialSavedState.currentSong;
  } else if (initialSavedState.currentSongId) {
    const poolMatch = TRACK_POOL.find(s => s.id === initialSavedState.currentSongId);
    if (poolMatch) initialSong = { ...poolMatch };
  }
  if (typeof initialSavedState.catalogIndex === "number") {
    initialCatalogIndex = initialSavedState.catalogIndex;
  }
  if (typeof initialSavedState.consecutiveUpPlayPlayed === "number") {
    initialConsecutive = initialSavedState.consecutiveUpPlayPlayed;
  }
  if (typeof initialSavedState.currentProgress === "number") {
    initialProgress = initialSavedState.currentProgress;
  }
  if (Array.isArray(initialSavedState.history)) {
    initialHistory = initialSavedState.history;
  }
  if (Array.isArray(initialSavedState.queue)) {
    initialQueue = initialSavedState.queue;
  }
  if (typeof initialSavedState.isPlaying === "boolean") {
    initialIsPlaying = initialSavedState.isPlaying;
  }
  if (typeof initialSavedState.bpmMultiplier === "number") {
    initialBpmMultiplier = initialSavedState.bpmMultiplier;
  }
}

// Initialize global gym zone state with restored or initial track
const GYM_ZONES: GymZone[] = [
  {
    id: "musculacao",
    name: "Sala de Musculação - Power Arena",
    icon: "Dumbbell",
    color: "from-rose-600 to-zinc-950",
    currentSong: { ...initialSong, votes: 0 },
    currentProgress: initialProgress,
    isPlaying: initialIsPlaying, // Authoritative global state: restored from previous session
    playbackTimestamp: Date.now(),
    version: 1,
    bpmMultiplier: initialBpmMultiplier,
    powerModeActive: false,
    powerModeTimeLeft: 0,
    consecutiveUpPlayPlayed: initialConsecutive,
    catalogIndex: initialCatalogIndex,
    queue: initialQueue, // Real student request queue (Fila da Galera)
    history: initialHistory,
    messages: []
  }
];

// Helper function to broadcast zone updates instantly via Socket.IO
function broadcastZoneUpdate(zone: GymZone) {
  savePlaybackStateToDisk(zone);
  const io = app.get("io");
  if (io) {
    io.emit("playback:state", {
      zoneId: zone.id,
      zone: {
        ...zone,
        queue: zone.queue.map(s => ({
          ...s,
          smartScore: calculateSmartScore(s, zone.history)
        }))
      }
    });
  }
}

// ================= TRACK ROTATION & QUEUE ENGINE =================
// Core Rules:
// 1. Music NEVER stops playing unless Gestor pauses or stops.
// 2. Plays sequentially through all 26+ songs from the UP Play catalog without repeating.
// 3. When all registered songs in the catalog are finished, loops back from index 0.
// 4. Interleaving Rule: Always plays 1 song from Fila da Galera (student requests) for every 3 songs played from UP Play.
function advanceZoneTrack(zone: GymZone): Song {
  if (zone.currentSong) {
    zone.history.unshift(zone.currentSong);
    if (zone.history.length > 25) zone.history.pop();
  }

  if (zone.consecutiveUpPlayPlayed === undefined) {
    zone.consecutiveUpPlayPlayed = 0;
  }

  // Purge any unavailable blacklisted songs from the student queue
  if (zone.queue && zone.queue.length > 0) {
    zone.queue = zone.queue.filter(s => 
      !UNAVAILABLE_SONGS_BLACKLIST.has(s.id) && 
      (!s.youtubeId || !UNAVAILABLE_SONGS_BLACKLIST.has(s.youtubeId))
    );
  }

  // Purge any unavailable blacklisted songs from master TRACK_POOL
  for (let i = TRACK_POOL.length - 1; i >= 0; i--) {
    const s = TRACK_POOL[i];
    if (UNAVAILABLE_SONGS_BLACKLIST.has(s.id) || (s.youtubeId && UNAVAILABLE_SONGS_BLACKLIST.has(s.youtubeId))) {
      TRACK_POOL.splice(i, 1);
    }
  }

  if (zone.catalogIndex === undefined || zone.catalogIndex < 0 || zone.catalogIndex >= TRACK_POOL.length) {
    zone.catalogIndex = 0;
  }

  let nextSong: Song;

  // Interleaving Rule: If 3 UP Play songs have played AND there is a student request in queue
  if (zone.consecutiveUpPlayPlayed >= 3 && zone.queue.length > 0) {
    nextSong = zone.queue.shift()!;
    nextSong.votes = 0;
    (nextSong as any).isRequested = true;
    zone.consecutiveUpPlayPlayed = 0; // Reset counter after playing requested song
  } else if (TRACK_POOL.length > 0) {
    // Play next sequential song from UP Play master catalog without repeating
    const catalogItem = TRACK_POOL[zone.catalogIndex % TRACK_POOL.length];

    // Increment catalog index for next turn; if reached end of catalog, loop back to 0
    zone.catalogIndex = (zone.catalogIndex + 1) % TRACK_POOL.length;

    nextSong = {
      ...catalogItem,
      votes: 0
    };
    (nextSong as any).isRequested = false;

    // Increment count of UP Play songs played
    zone.consecutiveUpPlayPlayed += 1;
  } else {
    // Fallback in the rare case all catalog songs were removed
    nextSong = {
      id: "fallback_track_rock",
      title: "Eye of the Tiger",
      artist: "Survivor",
      album: "Eye of the Tiger",
      duration: 245,
      bpm: 109,
      energy: 9,
      genre: "Rock",
      coverGradient: "from-amber-600 to-red-800",
      votes: 0,
      youtubeId: "btPJPFnesV4"
    };
  }

  nextSong.lastPlayedAt = Date.now();
  zone.currentSong = nextSong;
  zone.currentProgress = 0;
  zone.playbackTimestamp = Date.now();
  savePlaybackStateToDisk(zone);
  return nextSong;
}

let tickCounter = 0;
// Simple in-memory background timer to advance song progress ONLY when isPlaying is true
setInterval(() => {
  GYM_ZONES.forEach(zone => {
    // CRITICAL: Only advance song progress if Gestor state is PLAYING (isPlaying == true)
    if (zone.isPlaying) {
      if (zone.currentSong) {
        // Advance progress
        // Adjust speed slightly if power mode is active or multiplier is set
        const tick = zone.powerModeActive ? 1.5 : zone.bpmMultiplier;
        zone.currentProgress += tick;
        zone.playbackTimestamp = Date.now();

        // Periodically save state to disk (every 5 seconds)
        tickCounter++;
        if (tickCounter % 5 === 0) {
          savePlaybackStateToDisk(zone);
        }

        // Handle power mode timer
        if (zone.powerModeActive) {
          zone.powerModeTimeLeft = Math.max(0, zone.powerModeTimeLeft - 1);
          if (zone.powerModeTimeLeft === 0) {
            zone.powerModeActive = false;
          }
        }

        // If song finished, automatically rotate using advanceZoneTrack
        if (zone.currentProgress >= zone.currentSong.duration) {
          advanceZoneTrack(zone);
          zone.version = (zone.version || 0) + 1;
          broadcastZoneUpdate(zone);
        }
      } else {
        // If zone has no active song, initialize playback immediately
        advanceZoneTrack(zone);
        zone.version = (zone.version || 0) + 1;
        broadcastZoneUpdate(zone);
      }
    }
  });
}, 1000);

// ================= ADMINISTRATIVE STATE FOR UP PLAY GESTOR =================
export interface Announcement {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  priority?: number;
}

export interface ModerationStats {
  totalChecked: number;
  approved: number;
  flagged: number;
}

export interface ModerationLog {
  id: string;
  timestamp: string;
  userName: string;
  type: "chat" | "youtube";
  content: string;
  status: "approved" | "flagged";
  reason: string;
}

export interface AdaptiveRule {
  period: string;
  timeRange: string;
  selectedStyle: string;
  bpmTarget: number;
  intensity: string;
}

const GYM_ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", title: "🛒 Copo Térmico UP Fitness", subtitle: "Garanta o seu no balcão!", description: "Mantenha sua água ou shake gelados durante o treino todo. 15% de desconto para quem pontuar no Top 5 do Ranking de Energia!", color: "from-emerald-400 to-teal-600", active: true },
  { id: "a2", title: "🏋️‍♂️ Desafio de Supino UP", subtitle: "Sábado às 10:00!", description: "Vem mostrar a força do peitoral! Premiação exclusiva em suplementos e brindes UP Play. Inscrições gratuitas com seu treinador.", color: "from-rose-500 to-amber-500", active: true },
  { id: "a3", title: "🥤 Combo Whey Isolate pós-treino", subtitle: "Sabor Chocolate Belga no UP Café", description: "O combustível ideal para sua reconstrução muscular. Adquira logo após sua série na recepção.", color: "from-indigo-600 to-purple-600", active: true }
];

const AI_MODERATION_STATS: ModerationStats = {
  totalChecked: 0,
  approved: 0,
  flagged: 0
};

const AI_MODERATION_LOGS: ModerationLog[] = [];

const AI_PLAYLIST_ADAPTIVITY: AdaptiveRule[] = [
  { period: "Manhã (Regenerativo/Foco)", timeRange: "06:00 - 11:00", selectedStyle: "House Progressivo / Pop Acústico", bpmTarget: 115, intensity: "Moderada" },
  { period: "Tarde (Foco / Consistência)", timeRange: "11:00 - 16:00", selectedStyle: "Synthwave & Rock Clássico", bpmTarget: 125, intensity: "Moderada-Alta" },
  { period: "Noite (Pico de Carga/Intensidade)", timeRange: "16:00 - 22:00", selectedStyle: "Trap / Drum & Bass / Hardstyle", bpmTarget: 145, intensity: "Alta / Redline" }
];

// API Endpoints

// 1. Get current states for all Gym Zones with calculated Smart Scores
app.get("/api/music/zones", (req, res) => {
  const enrichedZones = GYM_ZONES.map(z => ({
    ...z,
    queue: z.queue
      .filter(s => !UNAVAILABLE_SONGS_BLACKLIST.has(s.id) && (!s.youtubeId || !UNAVAILABLE_SONGS_BLACKLIST.has(s.youtubeId)))
      .map(s => ({
        ...s,
        smartScore: calculateSmartScore(s, z.history)
      }))
  }));

  const enrichedPool = TRACK_POOL
    .filter(s => !UNAVAILABLE_SONGS_BLACKLIST.has(s.id) && (!s.youtubeId || !UNAVAILABLE_SONGS_BLACKLIST.has(s.youtubeId)))
    .map(s => ({
      ...s,
      smartScore: calculateSmartScore(s, [])
    }));

  res.json({
    success: true,
    zones: enrichedZones,
    trackPool: enrichedPool
  });
});

// 2. Vote for a song to enter/advance the zone queue
app.post("/api/music/vote", authMiddleware, (req: any, res) => {
  const { zoneId, songId } = req.body;
  const zone = GYM_ZONES.find(z => z.id === zoneId);
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  // Check if song is already in queue
  const queueIndex = zone.queue.findIndex(s => s.id === songId);
  if (queueIndex !== -1) {
    zone.queue[queueIndex].votes += 1;
    // Rule 6: likes/votes DO NOT automatically reorder the queue. Standard FIFO/insertion order persists.
    return res.json({ success: true, message: "Voto registrado com sucesso", queue: zone.queue });
  }

  // If not in queue, fetch from track pool and add
  const poolSong = TRACK_POOL.find(s => s.id === songId);
  if (!poolSong) {
    return res.status(404).json({ success: false, message: "Música não encontrada no acervo" });
  }

  const newSong: Song = { ...poolSong, votes: 1 };
  zone.queue.push(newSong);
  // Rule 6: standard insertion order, NO automatic sorting
  
  res.json({
    success: true,
    message: "Música adicionada à fila de votação",
    queue: zone.queue
  });
});

// 3. Post a dedication message with 100 character limit & AI Moderation (Rule 7)
app.post("/api/music/dedicate", authMiddleware, async (req: any, res) => {
  const { zoneId, userName, text, targetUser, songTitle } = req.body;
  const zone = GYM_ZONES.find(z => z.id === zoneId);
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  // Validation: limit to 100 characters (Rule 7)
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ success: false, message: "O texto da dedicatória não pode ser vazio." });
  }

  if (text.length > 100) {
    return res.status(400).json({ success: false, message: "Dedicatória rejeitada: limite de 100 caracteres excedido." });
  }

  const now = new Date();
  const timestamp = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  AI_MODERATION_STATS.totalChecked += 1;

  // IA Moderation for dedications
  let approved = true;
  let moderationReason = "Mensagem saudável de incentivo ao treino avaliada pelo UP Play AI.";

  if (ai) {
    try {
      const prompt = `Analise a seguinte mensagem/dedicatória enviada por um aluno de academia para outro atleta:
      - Mensagem: "${text}"
      - Destinatário: "${targetUser || "Geral"}"

      Verifique se a mensagem é saudável, motivacional e adequada para um ambiente familiar de academia (sem insultos, assédio, linguagem vulgar ou ofensiva).
      
      Retorne estritamente um JSON:
      {
        "approved": true ou false,
        "reason": "breve justificativa em português"
      }`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Você é o moderador de IA das dedicatórias do UP Play, garantindo uma convivência de alto nível, motivadora e livre de toxicidade na academia.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              approved: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ["approved", "reason"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      approved = parsed.approved;
      moderationReason = parsed.reason || moderationReason;
    } catch (e: any) {
      console.warn("Gemini dedication moderation bypassed, using local filter:", e?.message || e);
    }
  }

  // Fallback / Offline rule engine moderation
  if (approved) {
    const unsuitableKeywords = ["sad", "depre", "triste", "sono", "relax", "lento", "lofi", "meditar", "calmo", "suave", "boca", "proibido", "funk proibidão", "violencia", "guerra", "bosta", "merda", "puta", "poha", "porra", "caralho", "fuder", "foder", "otario", "lixo"];
    const textLower = text.toLowerCase();
    const isFlagged = unsuitableKeywords.some(kw => textLower.includes(kw));
    if (isFlagged) {
      approved = false;
      moderationReason = "Termos vulgares ou inadequados para o ambiente coletivo familiar detectados pela IA.";
    }
  }

  // Record moderation logs
  const logEntry: ModerationLog = {
    id: `l_${Date.now()}`,
    timestamp,
    userName: userName || "Aluno",
    type: "chat",
    content: text,
    status: approved ? "approved" : "flagged",
    reason: moderationReason
  };
  AI_MODERATION_LOGS.unshift(logEntry);
  if (AI_MODERATION_LOGS.length > 50) AI_MODERATION_LOGS.pop();

  if (!approved) {
    AI_MODERATION_STATS.flagged += 1;
    return res.json({
      success: false,
      message: `Dedicatória retida pelo Moderador IA: ${moderationReason}`
    });
  }

  AI_MODERATION_STATS.approved += 1;

  const newMessage: Dedication = {
    id: `m_${Date.now()}`,
    userName: userName || "Atleta_Anônimo",
    text,
    targetUser: targetUser || "Todos",
    songTitle,
    timestamp
  };

  zone.messages.unshift(newMessage);
  if (zone.messages.length > 50) zone.messages.pop(); // Keep chat history clean

  res.json({
    success: true,
    messages: zone.messages
  });
});

// 4. Activate Power Mode (Instructor challenge / spurt)
app.post("/api/music/power-mode", authMiddleware, (req: any, res) => {
  // STRICT RBAC: Only Instructors (PROFESSOR) or Managers (GESTOR) can activate Power Mode
  if (req.user?.perfil !== "GESTOR" && req.user?.perfil !== "PROFESSOR") {
    return res.status(403).json({ success: false, message: "Apenas instrutores ou gestores podem acionar o Modo UP Power." });
  }

  const { zoneId } = req.body;
  const zone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao"));
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  zone.powerModeActive = true;
  zone.powerModeTimeLeft = 60; // 60 seconds of high-tempo sprint!
  zone.bpmMultiplier = 1.25; // Increase cadence of player dynamically
  zone.version = (zone.version || 0) + 1;

  // Add automatic system notification to zone chat
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  zone.messages.unshift({
    id: `sys_${Date.now()}`,
    userName: "⚡ PROTETOR DO RITMO",
    text: "O INSTRUTOR ATIVOU O MODO UP POWER! 60 segundos de aceleração extrema! Bora derreter!",
    timestamp
  });

  broadcastZoneUpdate(zone);

  res.json({
    success: true,
    zone
  });
});

// 5. Adjust manual BPM multiplier (e.g. 0.9x to 1.2x) (Strictly GESTOR)
app.post("/api/music/bpm-multiplier", authMiddleware, adminMiddleware, (req: any, res) => {
  const { zoneId, multiplier } = req.body;
  const zone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao"));
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  zone.bpmMultiplier = Math.max(0.8, Math.min(1.3, multiplier));
  zone.version = (zone.version || 0) + 1;
  broadcastZoneUpdate(zone);

  res.json({ success: true, zone });
});

// Master Playback Control (Gestor authoritative control: PLAY / PAUSE / STOP / SEEK)
app.post("/api/music/playback", authMiddleware, adminMiddleware, (req: any, res) => {
  const { zoneId, isPlaying, action, position } = req.body;
  const zone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao"));
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  if (action === "stop") {
    zone.isPlaying = false;
    zone.currentProgress = 0;
  } else if (action === "pause") {
    zone.isPlaying = false;
    if (typeof position === "number" && position >= 0) {
      zone.currentProgress = position;
    }
  } else if (action === "play") {
    zone.isPlaying = true;
    if (typeof position === "number" && position >= 0) {
      zone.currentProgress = position;
    }
  } else if (typeof isPlaying === "boolean") {
    zone.isPlaying = isPlaying;
    if (typeof position === "number" && position >= 0) {
      zone.currentProgress = position;
    }
  }

  zone.playbackTimestamp = Date.now();
  zone.version = (zone.version || 0) + 1;

  broadcastZoneUpdate(zone);

  res.json({ success: true, zone });
});

// Skip to next track (Strictly GESTOR: handles both manual next and central player auto-advance)
app.post("/api/music/next-track", authMiddleware, adminMiddleware, (req: any, res) => {
  // STRICT RULE: Only GESTOR session is authorized to advance tracks (manual skip or central player auto-advance)
  if (req.user?.perfil !== "GESTOR") {
    return res.status(403).json({ success: false, message: "Apenas o gestor mestre pode avançar músicas." });
  }

  const { zoneId, isAutoAdvance } = req.body;

  const zone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao"));
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  advanceZoneTrack(zone);
  zone.playbackTimestamp = Date.now();
  zone.version = (zone.version || 0) + 1;

  broadcastZoneUpdate(zone);

  res.json({ success: true, zone });
});

// Skip to previous track from history (Strictly GESTOR)
app.post("/api/music/prev-track", authMiddleware, adminMiddleware, (req: any, res) => {
  const { zoneId } = req.body;
  const zone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao"));
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  if (zone.history.length > 0) {
    if (zone.currentSong) {
      zone.queue.unshift(zone.currentSong);
    }
    const prevSong = zone.history.shift()!;
    zone.currentSong = prevSong;
    zone.currentProgress = 0;
    if (!(prevSong as any).isRequested && zone.catalogIndex !== undefined) {
      zone.catalogIndex = (zone.catalogIndex - 1 + TRACK_POOL.length) % TRACK_POOL.length;
      zone.consecutiveUpPlayPlayed = Math.max(0, (zone.consecutiveUpPlayPlayed || 1) - 1);
    }
  }

  zone.playbackTimestamp = Date.now();
  zone.version = (zone.version || 0) + 1;

  broadcastZoneUpdate(zone);

  res.json({ success: true, zone });
});

// Force select track by Gestor
app.post("/api/music/select-track", authMiddleware, adminMiddleware, (req: any, res) => {
  const { zoneId, songId } = req.body;
  const zone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao"));
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  const targetSong = TRACK_POOL.find(s => s.id === songId) || zone.queue.find(s => s.id === songId);
  if (!targetSong) {
    return res.status(404).json({ success: false, message: "Song not found" });
  }

  // Remove from queue if present
  zone.queue = zone.queue.filter(s => s.id !== songId);

  if (zone.currentSong) {
    zone.history.unshift(zone.currentSong);
    if (zone.history.length > 25) zone.history.pop();
  }

  zone.currentSong = { ...targetSong, votes: 0 };
  zone.currentProgress = 0;
  zone.isPlaying = true;
  zone.playbackTimestamp = Date.now();
  zone.version = (zone.version || 0) + 1;

  broadcastZoneUpdate(zone);

  res.json({ success: true, zone });
});

// Add to queue manually
app.post("/api/music/queue/add", authMiddleware, (req: any, res) => {
  const { zoneId, song } = req.body;
  const zone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao"));
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  if (song && (UNAVAILABLE_SONGS_BLACKLIST.has(song.id) || (song.youtubeId && UNAVAILABLE_SONGS_BLACKLIST.has(song.youtubeId)))) {
    return res.status(400).json({ success: false, message: "Este vídeo foi detectado como indisponível no YouTube e não pode ser adicionado à lista." });
  }

  const existing = zone.queue.find(s => s.id === song.id);
  if (!existing) {
    zone.queue.push({ ...song, votes: 1 });
  } else {
    existing.votes += 1;
  }
  zone.queue.sort((a, b) => b.votes - a.votes);
  zone.version = (zone.version || 0) + 1;

  broadcastZoneUpdate(zone);

  res.json({ success: true, zone });
});

// Remove from queue manually (Strictly GESTOR)
app.post("/api/music/queue/remove", authMiddleware, adminMiddleware, (req: any, res) => {
  const { zoneId, songId } = req.body;
  const zone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao"));
  if (!zone) {
    return res.status(404).json({ success: false, message: "Zone not found" });
  }

  zone.queue = zone.queue.filter(s => s.id !== songId);
  zone.version = (zone.version || 0) + 1;

  broadcastZoneUpdate(zone);

  res.json({ success: true, zone });
});

// Suppress an unavailable YouTube video immediately from queue, catalog, and active playback (Strictly GESTOR)
app.post("/api/music/suppress-unavailable", authMiddleware, adminMiddleware, async (req, res) => {
  const { songId, youtubeId, zoneId, reason } = req.body;
  
  if (!songId && !youtubeId) {
    return res.status(400).json({ success: false, message: "songId ou youtubeId é obrigatório" });
  }

  const idToSuppress = (songId || "").trim();
  const ytToSuppress = (youtubeId || "").trim();

  console.warn(`[SUPPRESSION ENGINE] Suppressing unavailable video: ID="${idToSuppress}", YT="${ytToSuppress}", Reason="${reason || "Vídeo indisponível"}"`);

  // 1. Add to in-memory blacklist and persist to disk
  if (idToSuppress) UNAVAILABLE_SONGS_BLACKLIST.add(idToSuppress);
  if (ytToSuppress) UNAVAILABLE_SONGS_BLACKLIST.add(ytToSuppress);
  saveUnavailableSongs(UNAVAILABLE_SONGS_BLACKLIST);

  // 2. Remove permanently from master TRACK_POOL
  let suppressedTitle = "";
  for (let i = TRACK_POOL.length - 1; i >= 0; i--) {
    const s = TRACK_POOL[i];
    if ((idToSuppress && s.id === idToSuppress) || (ytToSuppress && (s.youtubeId === ytToSuppress || s.id === ytToSuppress))) {
      suppressedTitle = s.title;
      TRACK_POOL.splice(i, 1);
    }
  }

  // 3. Remove from PostgreSQL DB if configured
  if (isDbConfigured && isDbConnected) {
    try {
      if (ytToSuppress) {
        await db.delete(dbSongs).where(eq(dbSongs.youtubeId, ytToSuppress));
      }
    } catch (e: any) {
      console.warn("Could not delete suppressed song from DB:", e.message);
    }
  }

  // 4. Remove from all GYM_ZONES queues and advance if currently playing
  let updatedAnyZone = false;
  GYM_ZONES.forEach(zone => {
    const queueBefore = zone.queue.length;
    zone.queue = zone.queue.filter(s => {
      const match = (idToSuppress && s.id === idToSuppress) || 
                    (ytToSuppress && (s.youtubeId === ytToSuppress || s.id === ytToSuppress));
      return !match;
    });

    if (zone.currentSong && (
      (idToSuppress && zone.currentSong.id === idToSuppress) ||
      (ytToSuppress && (zone.currentSong.youtubeId === ytToSuppress || zone.currentSong.id === ytToSuppress))
    )) {
      if (!suppressedTitle) suppressedTitle = zone.currentSong.title;
      console.warn(`[SUPPRESSION ENGINE] Active song in zone ${zone.id} (${suppressedTitle}) is unavailable. Advancing track immediately!`);
      advanceZoneTrack(zone);
      updatedAnyZone = true;
    } else if (zone.queue.length !== queueBefore) {
      updatedAnyZone = true;
    }

    if (updatedAnyZone) {
      zone.version = (zone.version || 0) + 1;
      broadcastZoneUpdate(zone);
    }
  });

  // 5. Broadcast real-time suppression event via Socket.IO
  const io = app.get("io");
  if (io) {
    io.emit("music:suppressed", {
      songId: idToSuppress,
      youtubeId: ytToSuppress,
      title: suppressedTitle || "Vídeo Indisponível",
      reason: reason || "Vídeo indisponível ou com restrição no YouTube"
    });
  }

  const enrichedPool = TRACK_POOL
    .filter(s => !UNAVAILABLE_SONGS_BLACKLIST.has(s.id) && (!s.youtubeId || !UNAVAILABLE_SONGS_BLACKLIST.has(s.youtubeId)))
    .map(s => ({
      ...s,
      smartScore: calculateSmartScore(s, [])
    }));

  const activeZone = GYM_ZONES.find(z => z.id === (zoneId || "musculacao")) || GYM_ZONES[0];

  res.json({
    success: true,
    message: `Vídeo indisponível suprimido da lista: ${suppressedTitle || idToSuppress}`,
    suppressedId: idToSuppress,
    suppressedTitle,
    zone: activeZone,
    trackPool: enrichedPool
  });
});

// 6. Gemini: Personalized music recommendation based on target training
app.post("/api/music/suggest", async (req, res) => {
  const { workoutType, intensity, targetBpm, preferences } = req.body;

  if (!ai) {
    // Authentic real-world track fallback if no Gemini key
    const mockSuggestions = [
      { title: "Till I Collapse", artist: "Eminem", bpm: Number(targetBpm) || 171, genre: "Hip Hop / Workout", reasoning: "Baterias marcantes no ritmo de " + (targetBpm || 171) + " BPM para sincronizar com sua intensidade de força alta no supino." },
      { title: "Blinding Lights", artist: "The Weeknd", bpm: Number(targetBpm) || 171, genre: "Synthwave / Pop", reasoning: "Melodia progressiva com cadência perfeita para manter o ritmo e a concentração entre as séries pesadas." },
      { title: "Thunderstruck", artist: "AC/DC", bpm: Number(targetBpm) || 133, genre: "Rock / Metal", reasoning: "Riffs enérgicos e agressivos para aumentar a adrenalina durante as cargas máximas no agachamento." },
      { title: "Levels", artist: "Avicii", bpm: Number(targetBpm) || 126, genre: "EDM / House", reasoning: "Batidas constantes e envolventes para ritmar suas séries de musculação e hipertrofia." },
      { title: "Weightless", artist: "Marconi Union", bpm: Number(targetBpm) || 60, genre: "Ambient / Meditation", reasoning: "Ritmo desacelerado ideal para conduzir o oxigênio e relaxar a musculatura no descanso pós-treino." }
    ];
    return res.json({
      success: true,
      suggestions: mockSuggestions,
      isSimulated: true
    });
  }

  try {
    const prompt = `Crie uma lista de recomendação com 5 músicas para treino fitness de um aluno na academia.
    Os dados do treino são:
    - Tipo de Treino: ${workoutType || "Musculação Geral"}
    - Intensidade: ${intensity || "Moderada"}
    - BPM desejado: ${targetBpm || 130}
    - Preferências musicais/Observações: ${preferences || "Nenhuma"}

    Forneça músicas que existem no mundo real ou combinações motivadoras extremamente reais que encaixam com o BPM sugerido e dê um motivo fisiológico ou psicológico ("reasoning") em português focado em treino de alta performance de como essa música impulsionará o treino dele.`;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction: "Você é o Music AI Coach da UP Fitness, especialista em neurobiologia da música e fisiologia do exercício físico. Sua missão é curar a trilha sonora cientificamente perfeita para otimizar a performance física de atletas e alunos.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Nome da música ideal para o treino" },
              artist: { type: Type.STRING, description: "Artista ou produtor" },
              bpm: { type: Type.INTEGER, description: "BPM ideal para a música sugerida" },
              genre: { type: Type.STRING, description: "Gênero musical principal" },
              reasoning: { type: Type.STRING, description: "Motivo focado na neurofisiologia ou motivação do treino em português" }
            },
            required: ["title", "artist", "bpm", "genre", "reasoning"]
          }
        }
      }
    });

    const suggestions = JSON.parse(response.text || "[]");
    res.json({
      success: true,
      suggestions,
      isSimulated: false
    });
  } catch (error: any) {
    console.warn("Gemini recommendation query bypassed, using offline catalog:", error.message || error);
    const mockSuggestions = [
      { title: "Iron Core Protocol", artist: "Heavy Gainz", bpm: Number(targetBpm) || 128, genre: "Hard Rock / Metal", reasoning: "Baterias marcantes no ritmo de " + (targetBpm || 128) + " BPM para sincronizar com sua intensidade de força alta." },
      { title: "Metabolic Burn", artist: "DJ Stamina", bpm: Number(targetBpm) || 135, genre: "Trance", reasoning: "Melodia progressiva perfeita para manter o foco inabalável no cardio." },
      { title: "Peak Velocity", artist: "The Runners", bpm: Number(targetBpm) || 140, genre: "Drum & Bass", reasoning: "Rápido e agressivo para aumentar o consumo de oxigênio durante os tiros." },
      { title: "Anabolic Pulse", artist: "Cyber Gym", bpm: Number(targetBpm) || 120, genre: "Synthwave", reasoning: "Batidas constantes e envolventes para ritmar suas séries de musculação." },
      { title: "Reabsorção de Lactato", artist: "Zenith Flow", bpm: Number(targetBpm) || 85, genre: "Lofi Beats", reasoning: "Ritmo desacelerado ideal para conduzir o oxigênio e relaxar a musculatura no cooldown." }
    ];
    res.json({
      success: true,
      suggestions: mockSuggestions,
      isSimulated: true
    });
  }
});

// 7. Gemini: Get an AI Coach Voiceover Motivation
app.post("/api/music/coach-motivate", async (req, res) => {
  const { zoneId, workoutStage, trainerName } = req.body;

  const defaultTrainers: Record<string, string> = {
    leo: "Treinador Leo (Hipertrofia & Força)",
    igor: "Coach Igor (Força Bruta & Cargas Pesadas)",
    gabi: "Instrutora Gabi (Resistência & Pump)",
    helena: "Treinadora Helena (Biomecânica & Postura)",
    musculacao: "Treinador Leo (Hipertrofia & Força)"
  };

  const selectedTrainer = trainerName || defaultTrainers[zoneId] || "Treinador Leo (Hipertrofia & Força)";

  if (!ai) {
    const defaultMotivations: Record<string, string> = {
      leo: "Não pare nas repetições confortáveis! A hipertrofia mora nas últimas 3 repetições, onde o músculo queima de verdade. Concentre e empurre essa barra!",
      igor: "Carga pesada na barra, pegada firme! Cada repetição constrói força pura. Sem desculpas hoje, bora erguer!",
      gabi: "Cadência controlada! Segure a descida do movimento e sinta o pump muscular. Respiração e foco até o final da série!",
      helena: "Postura alinhada, escápulas travadas e amplitude máxima de movimento. Faça cada repetição valer com técnica perfeita!",
      musculacao: "Não pare nas repetições confortáveis! A hipertrofia mora nas últimas 3 repetições, onde o músculo queima de verdade. Concentre e empurre essa barra!"
    };
    const speechText = defaultMotivations[zoneId] || defaultMotivations[selectedTrainer] || "Mantenha a postura correta, respire fundo e finalize essa série com força total!";
    return res.json({
      success: true,
      trainer: selectedTrainer,
      text: speechText,
      isSimulated: true
    });
  }

  try {
    const prompt = `Gere uma frase de voz ultra motivadora curta (máximo de 3 linhas) que seria transmitida nos fones de ouvido de um aluno da academia durante o treino na Sala de Musculação.
    - Setor da academia: Sala de Musculação
    - Persona do Treinador: ${selectedTrainer}
    - Momento do Treino: ${workoutStage || "No meio de uma série pesada"}

    A fala deve usar gírias saudáveis de musculação brasileiras (pump, repetição forçada, cadência, amplitude) e ser altamente motivadora. Seja incrivelmente carismático e realista.`;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction: `Você é a voz dos treinadores oficiais de musculação da UP Fitness. Sua fala deve ser impactante, curta, enérgica e direta ao ponto para ser falada por cima da música, exatamente como as chamadas especiais do Spotify ou rádio de academia de elite.`,
      }
    });

    res.json({
      success: true,
      trainer: selectedTrainer,
      text: response.text?.trim() || "Bora esmagar!",
      isSimulated: false
    });
  } catch (error: any) {
    console.warn("Gemini voice query bypassed, using offline text:", error.message || error);
    const defaultMotivations: Record<string, string> = {
      leo: "Não pare nas repetições confortáveis! A hipertrofia mora nas últimas 3 repetições, onde o músculo queima de verdade. Concentre e empurre essa barra!",
      igor: "Carga pesada na barra, pegada firme! Cada repetição constrói força pura. Sem desculpas hoje, bora erguer!",
      gabi: "Cadência controlada! Segure a descida do movimento e sinta o pump muscular. Respiração e foco até o final da série!",
      helena: "Postura alinhada, escápulas travadas e amplitude máxima de movimento. Faça cada repetição valer com técnica perfeita!",
      musculacao: "Não pare nas repetições confortáveis! A hipertrofia mora nas últimas 3 repetições, onde o músculo queima de verdade. Concentre e empurre essa barra!"
    };
    const speechText = defaultMotivations[zoneId] || defaultMotivations[selectedTrainer] || "Mantenha a postura correta, respire fundo e finalize essa série com força total!";
    res.json({
      success: true,
      trainer: selectedTrainer,
      text: speechText,
      isSimulated: true
    });
  }
});


// ================= ADMINISTRATIVE DASHBOARD ENDPOINTS =================

// 8. Get BI Metrics, Announcements, and Moderation Logs
app.get("/api/admin/metrics", authMiddleware, adminMiddleware, async (req, res) => {
  if (isDbConfigured && isDbConnected()) {
    try {
      const dbAnnounceList = await db.select().from(dbAnnouncements);
      if (dbAnnounceList && dbAnnounceList.length > 0) {
        const mapped: Announcement[] = dbAnnounceList.map((a, idx) => ({
          id: a.id,
          title: a.titulo,
          subtitle: a.descricao && a.descricao.length > 35 ? a.descricao.slice(0, 35) + "..." : "Novidade UP Fitness",
          description: a.descricao || "",
          color: (a.imagem && a.imagem.startsWith("from-")) ? a.imagem : "from-emerald-400 to-teal-600",
          active: a.ativo ?? true,
          startDate: a.inicio ? a.inicio.toISOString().split("T")[0] : "2026-08-20",
          endDate: a.termino ? a.termino.toISOString().split("T")[0] : "2026-08-27",
          priority: a.prioridade !== null && a.prioridade !== undefined ? a.prioridade : (idx + 1)
        }));
        // Keep in-memory cache in sync
        GYM_ANNOUNCEMENTS.length = 0;
        GYM_ANNOUNCEMENTS.push(...mapped);
        return res.json({
          success: true,
          announcements: mapped,
          moderationStats: AI_MODERATION_STATS,
          moderationLogs: AI_MODERATION_LOGS,
          playlistRules: AI_PLAYLIST_ADAPTIVITY
        });
      }
    } catch (err: any) {
      console.warn("Could not query DB announcements for metrics endpoint, falling back:", err.message);
    }
  }

  res.json({
    success: true,
    announcements: GYM_ANNOUNCEMENTS,
    moderationStats: AI_MODERATION_STATS,
    moderationLogs: AI_MODERATION_LOGS,
    playlistRules: AI_PLAYLIST_ADAPTIVITY
  });
});

// 8.1 Direct GET /api/admin/announcements
app.get("/api/admin/announcements", authMiddleware, adminMiddleware, async (req, res) => {
  if (isDbConfigured && isDbConnected()) {
    try {
      const dbAnnounceList = await db.select().from(dbAnnouncements);
      if (dbAnnounceList && dbAnnounceList.length > 0) {
        const mapped: Announcement[] = dbAnnounceList.map((a, idx) => ({
          id: a.id,
          title: a.titulo,
          subtitle: a.descricao && a.descricao.length > 35 ? a.descricao.slice(0, 35) + "..." : "Novidade UP Fitness",
          description: a.descricao || "",
          color: (a.imagem && a.imagem.startsWith("from-")) ? a.imagem : "from-emerald-400 to-teal-600",
          active: a.ativo ?? true,
          startDate: a.inicio ? a.inicio.toISOString().split("T")[0] : "2026-08-20",
          endDate: a.termino ? a.termino.toISOString().split("T")[0] : "2026-08-27",
          priority: a.prioridade !== null && a.prioridade !== undefined ? a.prioridade : (idx + 1)
        }));
        GYM_ANNOUNCEMENTS.length = 0;
        GYM_ANNOUNCEMENTS.push(...mapped);
        return res.json({ success: true, announcements: mapped });
      }
    } catch (err: any) {
      console.warn("Error fetching DB announcements:", err.message);
    }
  }
  return res.json({ success: true, announcements: GYM_ANNOUNCEMENTS });
});

// 9. Add or Update announcements (Carrossel de anúncios)
app.post("/api/admin/announcements", authMiddleware, adminMiddleware, async (req, res) => {
  const { id, title, subtitle, description, color, active, startDate, endDate, priority, isNew } = req.body;

  if (isNew) {
    const newId = id || `ad_${Date.now()}`;
    const newAd: Announcement = {
      id: newId,
      title: title || "Anúncio sem título",
      subtitle: subtitle || "Promoção Especial",
      description: description || "",
      color: color || "from-emerald-400 to-teal-600",
      active: active !== undefined ? active : true,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      priority: priority || (GYM_ANNOUNCEMENTS.length + 1)
    };
    GYM_ANNOUNCEMENTS.push(newAd);

    if (isDbConfigured && isDbConnected()) {
      try {
        await db.insert(dbAnnouncements).values({
          titulo: newAd.title,
          descricao: newAd.description,
          imagem: newAd.color,
          prioridade: newAd.priority,
          inicio: new Date(newAd.startDate || Date.now()),
          termino: new Date(newAd.endDate || Date.now() + 7 * 86400000),
          ativo: newAd.active,
          externalId: newId
        } as any);
      } catch (err: any) {
        console.warn("Could not insert announcement in DB, cached in memory:", err.message);
      }
    }

    return res.json({ success: true, message: "Anúncio criado com sucesso!", announcements: GYM_ANNOUNCEMENTS, announcement: newAd });
  }

  // Update existing
  const ad = GYM_ANNOUNCEMENTS.find(a => a.id === id);
  if (!ad) {
    // If not in memory but requested update, create it
    const newAd: Announcement = {
      id: id || `ad_${Date.now()}`,
      title: title || "Anúncio",
      subtitle: subtitle || "Novidade UP Fitness",
      description: description || "",
      color: color || "from-emerald-400 to-teal-600",
      active: active !== undefined ? active : true,
      startDate: startDate || "2026-08-20",
      endDate: endDate || "2026-08-27",
      priority: priority || 1
    };
    GYM_ANNOUNCEMENTS.push(newAd);
    return res.json({ success: true, message: "Anúncio salvo!", announcements: GYM_ANNOUNCEMENTS });
  }

  if (active !== undefined) ad.active = active;
  if (title !== undefined) ad.title = title;
  if (subtitle !== undefined) ad.subtitle = subtitle;
  if (description !== undefined) ad.description = description;
  if (color !== undefined) ad.color = color;
  if (startDate !== undefined) ad.startDate = startDate;
  if (endDate !== undefined) ad.endDate = endDate;
  if (priority !== undefined) ad.priority = priority;

  if (isDbConfigured && isDbConnected()) {
    try {
      await db.update(dbAnnouncements).set({
        titulo: ad.title,
        descricao: ad.description,
        imagem: ad.color,
        prioridade: ad.priority,
        ativo: ad.active,
        updatedAt: new Date()
      } as any).where(eq(dbAnnouncements.id as any, id));
    } catch (err: any) {
      console.warn("Could not update DB announcement:", err.message);
    }
  }

  res.json({
    success: true,
    message: "Anúncio atualizado com sucesso!",
    announcements: GYM_ANNOUNCEMENTS
  });
});

// 9.1 Delete announcement (DELETE or POST /delete)
app.delete("/api/admin/announcements/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const index = GYM_ANNOUNCEMENTS.findIndex(a => a.id === id);
  if (index !== -1) {
    GYM_ANNOUNCEMENTS.splice(index, 1);
  }

  if (isDbConfigured && isDbConnected()) {
    try {
      await db.delete(dbAnnouncements).where(eq(dbAnnouncements.id as any, id));
    } catch (err: any) {
      console.warn("Could not delete from DB announcements table:", err.message);
    }
  }

  res.json({
    success: true,
    message: "Anúncio removido com sucesso!",
    announcements: GYM_ANNOUNCEMENTS
  });
});

// Support POST delete as well for maximum client compatibility
app.post("/api/admin/announcements/delete", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "ID necessário." });

  const index = GYM_ANNOUNCEMENTS.findIndex(a => a.id === id);
  if (index !== -1) {
    GYM_ANNOUNCEMENTS.splice(index, 1);
  }

  if (isDbConfigured && isDbConnected()) {
    try {
      await db.delete(dbAnnouncements).where(eq(dbAnnouncements.id as any, id));
    } catch (err: any) {
      console.warn("Could not delete from DB announcements table:", err.message);
    }
  }

  res.json({
    success: true,
    message: "Anúncio removido com sucesso!",
    announcements: GYM_ANNOUNCEMENTS
  });
});

// 9.2 Reorder announcement priorities
app.post("/api/admin/announcements/reorder", authMiddleware, adminMiddleware, async (req, res) => {
  const { list } = req.body; // Array of { id: string, priority: number }
  if (Array.isArray(list)) {
    for (const item of list) {
      const ad = GYM_ANNOUNCEMENTS.find(a => a.id === item.id);
      if (ad) {
        ad.priority = item.priority;
      }
      if (isDbConfigured && isDbConnected()) {
        try {
          await db.update(dbAnnouncements).set({ prioridade: item.priority }).where(eq(dbAnnouncements.id as any, item.id));
        } catch (_) {}
      }
    }
    // Re-sort in-memory
    GYM_ANNOUNCEMENTS.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  res.json({
    success: true,
    message: "Prioridades de anúncios salvas com sucesso!",
    announcements: GYM_ANNOUNCEMENTS
  });
});

// 10. Update AI Playlist Adaptivity settings
app.post("/api/admin/playlist-adaptivity", authMiddleware, adminMiddleware, (req, res) => {
  const { period, selectedStyle, bpmTarget, intensity } = req.body;
  const rule = AI_PLAYLIST_ADAPTIVITY.find(r => r.period === period);
  if (rule) {
    if (selectedStyle !== undefined) rule.selectedStyle = selectedStyle;
    if (bpmTarget !== undefined) rule.bpmTarget = Number(bpmTarget);
    if (intensity !== undefined) rule.intensity = intensity;
    return res.json({ success: true, message: "Regra adaptativa atualizada!", rules: AI_PLAYLIST_ADAPTIVITY });
  }
  res.status(404).json({ success: false, message: "Período não encontrado" });
});

// Helper to fetch real YouTube metadata without API key using public oEmbed
async function fetchYouTubeOEmbed(youtubeUrl: string): Promise<{ title: string; author: string; thumbnail_url?: string; videoId?: string } | null> {
  try {
    let targetUrl = youtubeUrl.trim();
    const extractedId = extractYouTubeId(targetUrl);
    if (extractedId) {
      targetUrl = `https://www.youtube.com/watch?v=${extractedId}`;
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data: any = await response.json();
      if (data && data.title) {
        let title = data.title;
        let author = data.author_name || "YouTube";

        // Try to split "Artist - Title" if present in video title
        if (title.includes(" - ")) {
          const parts = title.split(" - ");
          author = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        } else if (title.includes(" – ")) {
          const parts = title.split(" – ");
          author = parts[0].trim();
          title = parts.slice(1).join(" – ").trim();
        }

        // Clean common YouTube title tags
        title = title
          .replace(/\(Official Video\)/gi, "")
          .replace(/\(Official Music Video\)/gi, "")
          .replace(/\(Official Audio\)/gi, "")
          .replace(/\(Audio\)/gi, "")
          .replace(/\(Lyric Video\)/gi, "")
          .replace(/\[Official Video\]/gi, "")
          .replace(/\[Official Music Video\]/gi, "")
          .replace(/\[HD\]/gi, "")
          .replace(/\[4K\]/gi, "")
          .trim();

        const thumbnail = data.thumbnail_url || (extractedId ? `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg` : undefined);

        return {
          title: title || data.title,
          author: author || data.author_name || "Artista YouTube",
          thumbnail_url: thumbnail,
          videoId: extractedId || undefined
        };
      }
    }
  } catch (err) {
    console.warn("Error fetching YouTube oEmbed:", err);
  }
  return null;
}

// Endpoint for real-time YouTube live preview metadata detection
app.get("/api/music/youtube-preview", async (req, res) => {
  const url = req.query.url as string;
  if (!url || !url.trim()) {
    return res.status(400).json({ success: false, message: "URL ou termo do YouTube necessário." });
  }

  const cleanInput = url.trim();
  const extractedId = extractYouTubeId(cleanInput);

  if (extractedId && UNAVAILABLE_SONGS_BLACKLIST.has(extractedId)) {
    return res.status(400).json({
      success: false,
      message: "Este vídeo foi detectado como indisponível no YouTube e suprimido da lista do UP Play."
    });
  }

  const realOEmbed = await fetchYouTubeOEmbed(cleanInput);

  if (realOEmbed) {
    const isFast = /remix|funk|dance|electro|gym|workout|power|rock|metal|trap|psy|harder|hyper|drill/i.test(realOEmbed.title + " " + realOEmbed.author);
    const estimatedBpm = isFast ? 138 : 122;
    const estimatedGenre = isFast ? "Electronic / Power Gym" : "Treino & Performance";
    const thumbnail = realOEmbed.thumbnail_url || (extractedId ? `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg` : `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80`);

    return res.json({
      success: true,
      videoId: extractedId || realOEmbed.videoId || null,
      title: realOEmbed.title,
      artist: realOEmbed.author,
      bpm: estimatedBpm,
      energy: isFast ? 9 : 7,
      genre: estimatedGenre,
      coverGradient: isFast ? "from-rose-600 to-amber-600" : "from-emerald-600 to-teal-900",
      duration: 210,
      thumbnail: thumbnail,
      youtubeUrl: extractedId ? `https://www.youtube.com/watch?v=${extractedId}` : cleanInput
    });
  }

  if (extractedId) {
    return res.json({
      success: true,
      videoId: extractedId,
      title: `Música do YouTube`,
      artist: "Artista do YouTube",
      bpm: 125,
      energy: 8,
      genre: "Treino & Performance",
      coverGradient: "from-blue-600 to-indigo-900",
      duration: 210,
      thumbnail: `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`,
      youtubeUrl: `https://www.youtube.com/watch?v=${extractedId}`
    });
  }

  return res.json({
    success: true,
    videoId: null,
    title: cleanInput,
    artist: "Busca no YouTube",
    bpm: 128,
    energy: 8,
    genre: "Sinal de Áudio",
    coverGradient: "from-purple-600 to-zinc-900",
    duration: 210,
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
    youtubeUrl: cleanInput
  });
});

// 11. Custom YouTube music requests with AI Moderation (Rule 3 & 4)
app.post("/api/music/youtube-request", authMiddleware, async (req: any, res) => {
  const { zoneId, userName, youtubeUrlOrQuery } = req.body;
  
  if (!youtubeUrlOrQuery || !youtubeUrlOrQuery.trim()) {
    return res.status(400).json({ success: false, message: "Por favor, cole o link do YouTube." });
  }

  // Rule 3: Requests MUST be performed exclusively via YouTube links
  const isYoutube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(youtubeUrlOrQuery.trim());
  if (!isYoutube) {
    return res.status(400).json({ 
      success: false, 
      message: "Erro de solicitação: Os pedidos de música devem ser realizados exclusivamente por meio de links válidos do YouTube." 
    });
  }

  const zone = GYM_ZONES.find(z => z.id === zoneId);
  if (!zone) {
    return res.status(404).json({ success: false, message: "Setor da academia não encontrado." });
  }

  const requestedYtId = extractYouTubeId(youtubeUrlOrQuery.trim());
  if (requestedYtId && UNAVAILABLE_SONGS_BLACKLIST.has(requestedYtId)) {
    return res.status(400).json({
      success: false,
      message: "Este vídeo do YouTube foi detectado como indisponível ou restrito e foi suprimido do sistema."
    });
  }

  AI_MODERATION_STATS.totalChecked += 1;
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // 1. Fetch real YouTube metadata via public oEmbed
  const realOEmbed = await fetchYouTubeOEmbed(youtubeUrlOrQuery.trim());

  // Use Gemini to analyze the song and determine suitability if available
  if (ai) {
    try {
      const prompt = `Analise a música do YouTube solicitada por um aluno para a academia:
      - Link: "${youtubeUrlOrQuery}"
      - Título do vídeo detectado: "${realOEmbed ? realOEmbed.title : "Vídeo do YouTube"}"
      - Canal/Artista detectado: "${realOEmbed ? realOEmbed.author : "Desconhecido"}"
      - Setor destinado: "${zone.name}"

      Sua tarefa como moderador inteligente do UP Play é:
      1. Confirmar ou refinar os dados da música:
         - title: o título limpo real da música (ex: "${realOEmbed ? realOEmbed.title : "Título Real"}")
         - artist: o nome do artista principal (ex: "${realOEmbed ? realOEmbed.author : "Artista Real"}")
         - duration: a duração aproximada da música em segundos (ex: 210)
         - bpm: o BPM estimado (um número inteiro entre 80 e 160)
         - genre: o gênero musical correspondente (ex: "Hip-Hop", "Rock", "EDM", "Pop")
         - coverGradient: um gradiente de 2 cores CSS do Tailwind adequado para o estilo (ex: "from-emerald-600 to-black")
      2. Verificar se essa música é adequada para tocar em uma academia (sem termos extremamente vulgares, apologia explícita a drogas/violência ou ritmos lentos/depressivos).

      Retorne estritamente um JSON contendo:
      - approved: true se for adequada, false caso contrário
      - title: nome limpo da música
      - artist: nome do artista principal
      - duration: número de segundos
      - bpm: bpm estimado da música
      - genre: gênero musical correspondente
      - coverGradient: string do gradiente CSS (from-... to-...)
      - reason: uma explicação curta em português.`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Você é o moderador de IA do UP Play, filtrando e catalogando pedidos de música de alunos no YouTube para garantir o clima de treino perfeito.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              approved: { type: Type.BOOLEAN },
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              duration: { type: Type.INTEGER },
              bpm: { type: Type.INTEGER },
              genre: { type: Type.STRING },
              coverGradient: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["approved", "title", "artist", "duration", "bpm", "genre", "coverGradient", "reason"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      const logEntry: ModerationLog = {
        id: `l_${Date.now()}`,
        timestamp,
        userName: userName || "Aluno",
        type: "youtube",
        content: youtubeUrlOrQuery,
        status: result.approved ? "approved" : "flagged",
        reason: result.reason || "Processado por Inteligência Artificial"
      };
      
      AI_MODERATION_LOGS.unshift(logEntry);
      if (AI_MODERATION_LOGS.length > 50) AI_MODERATION_LOGS.pop();

      if (result.approved) {
        AI_MODERATION_STATS.approved += 1;

        const extractedVideoId = extractYouTubeId(youtubeUrlOrQuery.trim());

        const newSong: Song = {
          id: `yt_${Date.now()}`,
          title: result.title || (realOEmbed ? realOEmbed.title : "Pedido YouTube"),
          artist: result.artist || (realOEmbed ? realOEmbed.author : "Artista Desconhecido"),
          album: "Pedido via YouTube",
          duration: result.duration || 210,
          bpm: result.bpm || 120,
          energy: (result.bpm || 120) > 130 ? 9 : 7,
          genre: result.genre || "Academia",
          coverGradient: result.coverGradient || "from-emerald-500 to-teal-800",
          votes: 1,
          youtubeUrl: youtubeUrlOrQuery.trim(),
          youtubeId: extractedVideoId || undefined
        };

        // If zone has no active song or if current song is finished/null, make newSong the currentSong immediately
        let isNowPlaying = false;
        if (!zone.currentSong) {
          zone.currentSong = newSong;
          zone.currentProgress = 0;
          isNowPlaying = true;
        } else {
          // Add to active zone queue
          zone.queue.push(newSong);
        }

        // Automatically save to global TRACK_POOL catalog so future students can pick it instantly with 1-click
        if (!TRACK_POOL.some(s => s.title.toLowerCase() === newSong.title.toLowerCase() && s.artist.toLowerCase() === newSong.artist.toLowerCase())) {
          TRACK_POOL.unshift(newSong);
        }

        // Add message to chat as public update
        zone.messages.unshift({
          id: `m_yt_${Date.now()}`,
          userName: "🤖 MODERADOR AI",
          text: `Pedido aprovado e cadastrado no Catálogo: "${newSong.title}" - ${newSong.artist} (${newSong.bpm} BPM) foi adicionado à fila!`,
          timestamp
        });

        zone.version = (zone.version || 0) + 1;
        broadcastZoneUpdate(zone);

        return res.json({
          success: true,
          approved: true,
          song: newSong,
          zone: zone,
          isNowPlaying,
          reason: result.reason,
          message: `Sua música "${newSong.title}" - ${newSong.artist} foi aprovada e salva no Catálogo Permanente do UP Play!`
        });
      } else {
        AI_MODERATION_STATS.flagged += 1;
        return res.json({
          success: false,
          approved: false,
          reason: result.reason,
          message: "A música solicitada não atende às diretrizes de treino da UP Fitness: " + result.reason
        });
      }

    } catch (err: any) {
      console.warn("Gemini youtube requests bypassed: ", err?.message || err);
      // Fallback below
    }
  }

  // Offline/Fallback simulation rule engine using real oEmbed data if retrieved
  const queryLower = (realOEmbed ? `${realOEmbed.title} ${realOEmbed.author}` : youtubeUrlOrQuery).toLowerCase();
  
  // Basic filtering list
  const unsuitableKeywords = ["sad", "depre", "triste", "dormir", "sono", "relax", "lento", "lofi", "meditar", "calmo", "suave", "boca", "proibido", "funk proibidão", "violencia", "guerra"];
  const isFlagged = unsuitableKeywords.some(keyword => queryLower.includes(keyword));

  let cleanTitle = realOEmbed ? realOEmbed.title : "Música Solicitada";
  let artist = realOEmbed ? realOEmbed.author : "YouTube";
  let genre = "Treino / Academia";
  let bpm = 120 + (youtubeUrlOrQuery.length % 5) * 6;
  let duration = 210;
  let coverGradient = "from-[#00ff66]/30 to-zinc-950";
  let reason = `Música "${cleanTitle}" identificada via YouTube e aprovada para o treino no setor ${zone.name}.`;

  if (!realOEmbed) {
    if (queryLower.includes("eye") || queryLower.includes("tiger") || queryLower.includes("survivor")) {
      cleanTitle = "Eye of the Tiger";
      artist = "Survivor";
      genre = "Classic Rock";
      bpm = 109;
      duration = 245;
      coverGradient = "from-amber-500 to-yellow-600";
    } else if (queryLower.includes("lose") || queryLower.includes("yourself")) {
      cleanTitle = "Lose Yourself";
      artist = "Eminem";
      genre = "Hip-Hop";
      bpm = 171;
      duration = 320;
      coverGradient = "from-stone-700 to-stone-900";
    } else if (queryLower.includes("harder") || queryLower.includes("faster") || queryLower.includes("daft")) {
      cleanTitle = "Harder, Better, Faster, Stronger";
      artist = "Daft Punk";
      genre = "Electronic";
      bpm = 123;
      duration = 224;
      coverGradient = "from-purple-600 to-blue-600";
    } else if (queryLower.includes("thunder") || queryLower.includes("acdc")) {
      cleanTitle = "Thunderstruck";
      artist = "AC/DC";
      genre = "Hard Rock";
      bpm = 133;
      duration = 292;
      coverGradient = "from-yellow-500 to-stone-800";
    }
  }

  if (isFlagged) {
    const reasonText = "Contém termos considerados inadequados ou lentos demais para o clima coletivo de alta performance.";
    const logEntry: ModerationLog = {
      id: `l_${Date.now()}`,
      timestamp,
      userName: userName || "Aluno",
      type: "youtube",
      content: youtubeUrlOrQuery,
      status: "flagged",
      reason: reasonText
    };
    AI_MODERATION_LOGS.unshift(logEntry);
    AI_MODERATION_STATS.flagged += 1;

    return res.json({
      success: false,
      approved: false,
      reason: reasonText,
      message: "O pedido foi retido pela IA de Moderação: ritmo incompatível ou termos restritos."
    });
  }

  // Approved fallback
  const logEntry: ModerationLog = {
    id: `l_${Date.now()}`,
    timestamp,
    userName: userName || "Aluno",
    type: "youtube",
    content: youtubeUrlOrQuery,
    status: "approved",
    reason
  };
  AI_MODERATION_LOGS.unshift(logEntry);
  AI_MODERATION_STATS.approved += 1;

  const extractedFallbackVideoId = extractYouTubeId(youtubeUrlOrQuery.trim());

  const newSong: Song = {
    id: `yt_${Date.now()}`,
    title: cleanTitle,
    artist: artist,
    album: "Pedido via YouTube",
    duration: duration,
    bpm: bpm,
    energy: bpm > 130 ? 9 : 7,
    genre: genre,
    coverGradient: coverGradient,
    votes: 1,
    youtubeUrl: youtubeUrlOrQuery.trim(),
    youtubeId: extractedFallbackVideoId || undefined
  };

  let isNowPlayingFallback = false;
  if (!zone.currentSong) {
    zone.currentSong = newSong;
    zone.currentProgress = 0;
    isNowPlayingFallback = true;
  } else {
    zone.queue.push(newSong);
  }

  if (!TRACK_POOL.some(s => s.title.toLowerCase() === newSong.title.toLowerCase() && s.artist.toLowerCase() === newSong.artist.toLowerCase())) {
    TRACK_POOL.unshift(newSong);
  }

  zone.messages.unshift({
    id: `m_yt_${Date.now()}`,
    userName: "🤖 MODERADOR AI",
    text: `Pedido aprovado e cadastrado no Catálogo: "${newSong.title}" - ${newSong.artist} (${newSong.bpm} BPM) foi adicionado à fila!`,
    timestamp
  });

  zone.version = (zone.version || 0) + 1;
  broadcastZoneUpdate(zone);

  return res.json({
    success: true,
    approved: true,
    song: newSong,
    zone: zone,
    isNowPlaying: isNowPlayingFallback,
    reason,
    message: `Sua música "${newSong.title}" - ${newSong.artist} foi aprovada e salva no Catálogo Permanente do UP Play!`
  });
});

// 12. Direct Catalog Song Request (1-click request for catalog/approved songs)
app.post("/api/music/catalog-request", authMiddleware, (req: any, res) => {
  const { zoneId, songId, userName, targetUser, messageText } = req.body;
  
  if (!zoneId || !songId) {
    return res.status(400).json({ success: false, message: "Parâmetros 'zoneId' e 'songId' são obrigatórios." });
  }

  const zone = GYM_ZONES.find(z => z.id === zoneId);
  if (!zone) {
    return res.status(404).json({ success: false, message: "Setor da academia não encontrado." });
  }

  const catalogSong = TRACK_POOL.find(s => s.id === songId);
  if (!catalogSong) {
    return res.status(404).json({ success: false, message: "Música não encontrada no catálogo." });
  }

  if (UNAVAILABLE_SONGS_BLACKLIST.has(songId) || (catalogSong.youtubeId && UNAVAILABLE_SONGS_BLACKLIST.has(catalogSong.youtubeId))) {
    return res.status(400).json({ success: false, message: "Esta música foi detectada como indisponível no YouTube e foi suprimida da lista." });
  }

  // Increment catalog song popularity metrics
  catalogSong.requestCount = (catalogSong.requestCount || 0) + 1;
  catalogSong.lastVotedAt = Date.now();

  // Check if already in queue
  const existingInQueue = zone.queue.find(s => s.id === songId);
  let finalSong: Song;

  if (existingInQueue) {
    existingInQueue.votes += 1;
    existingInQueue.requestCount = (existingInQueue.requestCount || 0) + 1;
    finalSong = existingInQueue;
  } else {
    finalSong = {
      ...catalogSong,
      id: catalogSong.id.startsWith("yt_") || catalogSong.id.startsWith("cat_") ? catalogSong.id : `req_${catalogSong.id}_${Date.now()}`,
      votes: 1,
      requestCount: (catalogSong.requestCount || 1)
    };
    (finalSong as any).isRequested = true;
    (finalSong as any).requestedBy = userName || "Aluno";
    zone.queue.push(finalSong);
  }

  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Add dedication message if provided
  if (messageText && messageText.trim()) {
    zone.messages.unshift({
      id: `m_cat_${Date.now()}`,
      userName: userName || "Aluno",
      text: messageText.trim(),
      targetUser: targetUser?.trim() || "Galera",
      songTitle: catalogSong.title,
      timestamp
    });
  }

  // Add notification in channel chat
  zone.messages.unshift({
    id: `m_notify_${Date.now()}`,
    userName: "⚡ CATÁLOGO UP PLAY",
    text: `"${catalogSong.title}" - ${catalogSong.artist} foi adicionada à fila por ${userName || "um aluno"}!`,
    timestamp
  });

  zone.version = (zone.version || 0) + 1;
  broadcastZoneUpdate(zone);

  return res.json({
    success: true,
    approved: true,
    song: finalSong,
    message: `"${catalogSong.title}" adicionada diretamente do Catálogo para a fila com 1 clique!`
  });
});

// 13. Like / Curtida Direct Action Endpoint
app.post("/api/music/like", authMiddleware, (req: any, res) => {
  const { songId } = req.body;
  if (!songId) {
    return res.status(400).json({ success: false, message: "Parâmetro 'songId' é obrigatório." });
  }

  const catalogSong = TRACK_POOL.find(s => s.id === songId);
  if (catalogSong) {
    catalogSong.likes = (catalogSong.likes || 0) + 1;
    catalogSong.lastVotedAt = Date.now();
  }

  GYM_ZONES.forEach(z => {
    if (z.currentSong && (z.currentSong.id === songId || z.currentSong.title === catalogSong?.title)) {
      z.currentSong.likes = (z.currentSong.likes || 0) + 1;
    }
    const qSong = z.queue.find(s => s.id === songId || s.title === catalogSong?.title);
    if (qSong) {
      qSong.likes = (qSong.likes || 0) + 1;
    }
  });

  return res.json({
    success: true,
    likes: catalogSong ? catalogSong.likes : 1,
    message: "Curtida registrada com sucesso!"
  });
});

async function syncTrackPoolFromDb() {
  if (!isDbConfigured || !isDbConnected()) {
    return;
  }
  try {
    const list = await db.select().from(dbSongs);
    if (list && list.length > 0) {
      const mapped: Song[] = list.map(s => {
        const existing = TRACK_POOL.find(p => p.id === (s.youtubeId || s.id) || p.youtubeId === s.youtubeId || p.title.toLowerCase() === s.titulo.toLowerCase());
        if (existing) {
          return {
            ...existing,
            id: s.youtubeId || s.id,
            youtubeId: s.youtubeId || s.id,
            duration: s.duracao || existing.duration
          };
        }
        return {
          id: s.youtubeId || s.id,
          youtubeId: s.youtubeId || s.id,
          title: s.titulo,
          artist: s.artista,
          album: s.album || "UP Fitness Catalog",
          duration: s.duracao || 210,
          bpm: 125,
          energy: 8,
          genre: s.genero || "Fitness Beats",
          coverGradient: "from-indigo-600 to-purple-900",
          votes: 0
        };
      });
      
      const customAdded = TRACK_POOL.filter(p => !mapped.some(m => m.title.toLowerCase() === p.title.toLowerCase()));
      TRACK_POOL.length = 0;
      TRACK_POOL.push(...mapped, ...customAdded);
      console.log(`[REAL MODE] Loaded ${mapped.length} tracks from PostgreSQL into active track pool cache.`);
    }
  } catch (err: any) {
    console.warn("Could not sync TRACK_POOL from database, using simulated default catalog:", err.message);
  }
}

// Serve Vite or Static files depending on environment
async function startServer() {
  if (config.server.env !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`UP Play Server running on http://localhost:${PORT}`);
  });

  // Background non-blocking check and seed the database with core entities on boot
  seedDatabase()
    .then(() => syncTrackPoolFromDb())
    .catch((err: any) => {
      console.warn("Database initialization completed with in-memory fallback:", err.message);
    });
}

startServer();
