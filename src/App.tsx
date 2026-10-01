import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  SkipForward,
  Vote,
  MessageSquare,
  Sparkles,
  Zap,
  Activity,
  User,
  Volume2,
  VolumeX,
  Plus,
  Flame,
  Search,
  Music,
  Dumbbell,
  Compass,
  Trophy,
  Award,
  ChevronRight,
  ChevronLeft,
  Send,
  Sliders,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Megaphone,
  ShieldAlert,
  Clock,
  ThumbsUp,
  AlertTriangle,
  X,
  Menu,
  LogOut,
  Radio,
  Home,
} from "lucide-react";
import { 
  Song, 
  Dedication, 
  GymZone, 
  AISuggestion, 
  BPMChallenge, 
  LeaderboardEntry,
  AuthenticatedUser,
  UserRole,
  isGestor,
  isProfessor,
  isAluno,
  canAccessGestorPanel,
  getProfileLabel,
  normalizePerfil
} from "./types";
import { maskCpf, validateCpf, cleanCpf, formatCpf } from "./utils/cpf";
import { HomeView } from "./components/HomeView";
import { PedirMusicaView } from "./components/PedirMusicaView";
import { FilaView } from "./components/FilaView";
import { PerfilView } from "./components/PerfilView";
import { TopUpView } from "./components/TopUpView";
import { GestorDashboardView, LogEntry } from "./components/GestorDashboardView";
import { GestorAlunosView, Student } from "./components/GestorAlunosView";
import { GestorPlayerView } from "./components/GestorPlayerView";
import { GestorAnunciosView } from "./components/GestorAnunciosView";
import { GestorBIView } from "./components/GestorBIView";
import { GestorConfigView } from "./components/GestorConfigView";
import { MainTabsNav } from "./components/MainTabsNav";
import upplayLogo from "./assets/images/upplay_logo_1783699650749.jpg";
import { io } from "socket.io-client";
import { backgroundAudioEngine } from "./utils/backgroundAudioEngine";

export default function App() {
  // Navigation & UI States
  const [activeZoneId, setActiveZoneId] = useState<string>("musculacao");
  const [userName, setUserName] = useState<string>(() => {
    const saved = localStorage.getItem("up_play_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return u.name || "Atleta";
      } catch (_) {}
    }
    return "Atleta_UP_" + Math.floor(Math.random() * 900 + 100);
  });
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "home" | "pedir-musica" | "fila" | "perfil" | "top-up" | "ai-coach" | "challenges" | "gestor" |
    "gestor-dashboard" | "gestor-player" | "gestor-usuarios" | "gestor-anuncios" | "gestor-bi" | "gestor-config"
  >("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // State variables for the Gestor Modules
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: string, user: string, content: string, status: "approved" | "flagged", reason: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const newLog: LogEntry = {
      id: `l_${Date.now()}`,
      type,
      userName: user,
      timestamp,
      content,
      status,
      reason
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleRemoveLog = (id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("up_play_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const handleRemoveFromQueue = async (songId: string) => {
    setZones((prevZones) =>
      prevZones.map((zone) => {
        if (zone.id === activeZoneId) {
          return {
            ...zone,
            queue: zone.queue.filter((s) => s.id !== songId),
          };
        }
        return zone;
      })
    );
    try {
      await fetch(`/api/music/queue/remove`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ zoneId: activeZoneId, songId }),
      });
    } catch (_) {}
  };

  const handleAddToQueue = async (song: Song) => {
    setZones((prevZones) =>
      prevZones.map((zone) => {
        if (zone.id === activeZoneId) {
          if (zone.queue.some((s) => s.id === song.id)) return zone;
          return {
            ...zone,
            queue: [...zone.queue, { ...song, votes: 1 }],
          };
        }
        return zone;
      })
    );
    try {
      await fetch(`/api/music/queue/add`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ zoneId: activeZoneId, song }),
      });
    } catch (_) {}
  };

  const handleTogglePlayback = async (play: boolean, manualAdminAction: boolean = false) => {
    // STRICT RULE: "a música nunca deve pausar, só se for pausada manualmente pelo adm."
    if (!play && !manualAdminAction) {
      console.log("[App] Ignored automated non-admin pause request. Playback continues uninterrupted.");
      return;
    }
    if (!isGestor(currentUser)) return;
    setIsPaused(!play);
    if (play) {
      backgroundAudioEngine.initialize();
    }
    setZones((prev) =>
      prev.map((z) => (z.id === activeZoneId ? { ...z, isPlaying: play, playbackTimestamp: Date.now() } : z))
    );

    try {
      const res = await fetch(`/api/music/playback`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          zoneId: activeZoneId,
          isPlaying: play,
          action: play ? "play" : "pause",
          position: activeZone?.currentProgress
        })
      });
      const data = await res.json();
      if (data.success && data.zone) {
        setZones((prev) => prev.map((z) => (z.id === data.zone.id ? data.zone : z)));
      }
    } catch (e) {
      console.error("Playback toggle error:", e);
    }
  };

  const handleStopPlayback = async () => {
    if (!isGestor(currentUser)) return;
    setIsPaused(true);
    setZones((prev) =>
      prev.map((z) => (z.id === activeZoneId ? { ...z, isPlaying: false, currentProgress: 0, playbackTimestamp: Date.now() } : z))
    );

    try {
      const res = await fetch(`/api/music/playback`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          zoneId: activeZoneId,
          isPlaying: false,
          action: "stop",
          position: 0
        })
      });
      const data = await res.json();
      if (data.success && data.zone) {
        setZones((prev) => prev.map((z) => (z.id === data.zone.id ? data.zone : z)));
      }
    } catch (e) {
      console.error("Playback stop error:", e);
    }
  };

  const handleNextTrack = async (isAutoAdvance: boolean = false) => {
    // If it's an auto-advance (track ended naturally or lockscreen trigger), ANY client can advance the zone track
    if (!isAutoAdvance && !isGestor(currentUser)) return;
    try {
      const res = await fetch(`/api/music/next-track`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ zoneId: activeZoneId, isAutoAdvance }),
      });
      const data = await res.json();
      if (data.success && data.zone) {
        setZones((prev) => prev.map((z) => (z.id === data.zone.id ? data.zone : z)));
      } else if (data.success) {
        fetchZones();
      }
    } catch (_) {}
  };

  const handlePrevTrack = async () => {
    if (!isGestor(currentUser)) return;
    try {
      const res = await fetch(`/api/music/prev-track`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ zoneId: activeZoneId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchZones();
      }
    } catch (_) {}
  };

  // Auxiliary state variables for the 5 requested screens (Telas 4-8)
  const [likedSongs, setLikedSongs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("up_play_liked_songs");
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });

  const [userRequestHistory, setUserRequestHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("up_play_request_history");
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });

  const [avatarGradient, setAvatarGradient] = useState<string>(() => {
    const saved = localStorage.getItem("up_play_user_avatar_gradient");
    return saved || "from-emerald-400 to-teal-500";
  });

  // Settings states
  const [preferredZoneId, setPreferredZoneId] = useState<string>("musculacao");
  const [pacingRange, setPacingRange] = useState<string>("130-150");
  const [audioLatency, setAudioLatency] = useState<number>(150);
  const [notificationsOn, setNotificationsOn] = useState<boolean>(true);

  // Pedir música preview state
  const [dedicationTarget, setDedicationTarget] = useState<string>("");
  const [dedicationMessageText, setDedicationMessageText] = useState<string>("");
  const [showOrderConfirmation, setShowOrderConfirmation] = useState<boolean>(false);
  const [lastOrderedSong, setLastOrderedSong] = useState<any>(null);

  // Top Up screen states
  const [topUpPeriod, setTopUpPeriod] = useState<"diario" | "semana" | "mes">("diario");
  const [topUpSize, setTopUpSize] = useState<number>(5);

  // Authentication & Splash States
  const [splashActive, setSplashActive] = useState<boolean>(true);
  const [splashStep, setSplashStep] = useState<string>("Sincronizando áudio espacial...");
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    const saved = localStorage.getItem("up_play_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u) {
          u.perfil = normalizePerfil(u.perfil, u.role);
          u.role = u.perfil === "GESTOR" ? "gestor" : u.perfil === "PROFESSOR" ? "professor" : "aluno";
          return u;
        }
      } catch (_) {
        return null;
      }
    }
    return null;
  });
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [regNome, setRegNome] = useState<string>("");
  const [regBirthdate, setRegBirthdate] = useState<string>("");
  const [regMatricula, setRegMatricula] = useState<string>("");
  const [regCpf, setRegCpf] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regFoto, setRegFoto] = useState<string>("from-emerald-400 to-teal-500");
  const [authError, setAuthError] = useState<string>("");
  const [authSuccess, setAuthSuccess] = useState<string>("");
  const [showForgotMsg, setShowForgotMsg] = useState<boolean>(false);

  // Server Data States
  const [zones, setZones] = useState<GymZone[]>(() => {
    try {
      const saved = localStorage.getItem("up_play_last_saved_zone");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return [parsed];
      }
    } catch (_) {}
    return [];
  });
  const [trackPool, setTrackPool] = useState<Song[]>([]);
  const [loadingZones, setLoadingZones] = useState<boolean>(true);

  // Administrative State (UP Play Gestor / BI)
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [moderationStats, setModerationStats] = useState<any>({ totalChecked: 14, approved: 12, flagged: 2 });
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [playlistRules, setPlaylistRules] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(0);

  // YouTube Request Form States
  const [ytRequestInput, setYtRequestInput] = useState<string>("");
  const [ytRequestLoading, setYtRequestLoading] = useState<boolean>(false);
  const [ytFeedback, setYtFeedback] = useState<{ success: boolean; message: string; reason?: string } | null>(null);

  // New Ad Campaign States (Gestor Panel)
  const [newAdTitle, setNewAdTitle] = useState<string>("");
  const [newAdSubtitle, setNewAdSubtitle] = useState<string>("");
  const [newAdDescription, setNewAdDescription] = useState<string>("");
  const [newAdColor, setNewAdColor] = useState<string>("from-emerald-400 to-teal-600");
  const [adFeedback, setAdFeedback] = useState<string>("");

  // Real Gym Radio Audio States (Directly synced with Central YouTube Player, 0 synthetic oscillators)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.8);

  // Interactive UI Input States
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatTarget, setChatTarget] = useState<string>("Geral");
  const [chatSong, setChatSong] = useState<string>("");

  // AI Personalized Coach Panel States
  const [workoutType, setWorkoutType] = useState<string>("Musculação");
  const [intensity, setIntensity] = useState<string>("Alta");
  const [targetBpm, setTargetBpm] = useState<number>(130);
  const [preferences, setPreferences] = useState<string>("Rap de peso ou metal motivador");
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSpeech, setAiSpeech] = useState<string>("");
  const [speechLoading, setSpeechLoading] = useState<boolean>(false);
  const [coachTrainer, setCoachTrainer] = useState<string>("musculacao");

  // Local Playback Controls
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Gamification States
  const [challenges, setChallenges] = useState<BPMChallenge[]>([
    {
      id: "c1",
      title: "Resistência na Musculação",
      description: "Treine 20 minutos com a música acima de 135 BPM para hipertrofia.",
      bpmRange: "> 135 BPM",
      targetMinutes: 20,
      progressMinutes: 12,
      badgeId: "b1",
      badgeName: "Heavy Lifter",
      badgeIcon: "Flame",
      completed: false,
    },
    {
      id: "c2",
      title: "Série Monstruosa",
      description: "Complete 15 minutos em modo Power Arena na Sala de Musculação.",
      bpmRange: "110-130 BPM",
      targetMinutes: 15,
      progressMinutes: 15,
      badgeId: "b2",
      badgeName: "Iron Master",
      badgeIcon: "Dumbbell",
      completed: true,
    },
    {
      id: "c3",
      title: "Descanso Ativo & Foco",
      description: "Mantenha o ritmo controlado entre séries de musculação por 10 minutos.",
      bpmRange: "90-110 BPM",
      targetMinutes: 10,
      progressMinutes: 4,
      badgeId: "b3",
      badgeName: "Supino de Ouro",
      badgeIcon: "Activity",
      completed: false,
    },
  ]);

  // Fetch gym zone states
  const fetchZones = async () => {
    try {
      const res = await fetch(`/api/music/zones?t=${Date.now()}`);
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const data = await res.json();
      if (data && data.success) {
        setZones(data.zones);
        setTrackPool(data.trackPool);
        try {
          if (data.zones && data.zones.length > 0) {
            localStorage.setItem("up_play_last_saved_zone", JSON.stringify(data.zones[0]));
          }
        } catch (_) {}

        // Sync authoritative isPaused state with current active zone
        const currentActive = data.zones.find((z: GymZone) => z.id === activeZoneId) || data.zones[0];
        if (currentActive && typeof currentActive.isPlaying === "boolean") {
          setIsPaused(!currentActive.isPlaying);
        }
      }
    } catch (error) {
      console.warn("Could not fetch zones:", error);
    } finally {
      setLoadingZones(false);
    }
  };

  // Real-time authoritative playback synchronization via Socket.IO
  useEffect(() => {
    let socket: any = null;
    try {
      socket = io({
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000
      });

      socket.on("connect", () => {
        fetchZones();
      });

      socket.on("playback:state", (data: { zoneId: string; zone: GymZone }) => {
        if (data && data.zone) {
          setZones((prev) =>
            prev.map((z) => (z.id === data.zone.id ? { ...z, ...data.zone } : z))
          );
          try {
            if (data.zone.id === "musculacao") {
              localStorage.setItem("up_play_last_saved_zone", JSON.stringify(data.zone));
            }
          } catch (_) {}
          if (data.zone.id === activeZoneId && typeof data.zone.isPlaying === "boolean") {
            setIsPaused(!data.zone.isPlaying);
          }
        }
      });

      socket.on("music:suppressed", (data: { songId: string; youtubeId: string; title: string; reason: string }) => {
        console.warn("[App] Video suppressed via real-time event:", data);
        // Optimistically remove from catalog and all zones' queues
        if (data.songId || data.youtubeId) {
          setTrackPool(prev => prev.filter(s => 
            s.id !== data.songId && 
            (!data.youtubeId || (s.youtubeId !== data.youtubeId && s.id !== data.youtubeId))
          ));
          setZones(prev => prev.map(z => ({
            ...z,
            queue: z.queue.filter(s => 
              s.id !== data.songId && 
              (!data.youtubeId || (s.youtubeId !== data.youtubeId && s.id !== data.youtubeId))
            )
          })));
        }
        fetchZones();
      });

      socket.on("reconnect", () => {
        fetchZones();
      });
    } catch (e) {
      console.warn("Socket.IO client init warning:", e);
    }

    const handleFocusOrOnline = () => {
      fetchZones();
      fetchAdminMetrics();
      fetchUsers();
    };

    window.addEventListener("focus", handleFocusOrOnline);
    window.addEventListener("online", handleFocusOrOnline);

    return () => {
      if (socket) {
        socket.disconnect();
      }
      window.removeEventListener("focus", handleFocusOrOnline);
      window.removeEventListener("online", handleFocusOrOnline);
    };
  }, [activeZoneId]);

  // Fetch admin BI and campaigns data (Announcements, Moderation logs, Rules)
  const fetchAdminMetrics = async () => {
    if (!isGestor(currentUser)) return;
    try {
      const token = localStorage.getItem("up_play_token");
      const res = await fetch(`/api/admin/metrics?t=${Date.now()}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const data = await res.json();
      if (data && data.success) {
        setAnnouncements(data.announcements);
        setModerationStats(data.moderationStats);
        setModerationLogs(data.moderationLogs);
        setPlaylistRules(data.playlistRules);
      }
    } catch (e) {
      console.warn("Could not fetch admin metrics:", e);
    }
  };

  // Fetch real registered users from API (mirroring clean PostgreSQL database)
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("up_play_token");
      const userStr = localStorage.getItem("up_play_user");
      let userEmail = "jheiffe.jheiffe@gmail.com";
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.email) userEmail = u.email;
        } catch (_) {}
      }
      const headers: Record<string, string> = {
        "x-user-email": userEmail
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/users?limit=100&t=${Date.now()}`, {
        headers
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.users)) {
        const mappedStudents: Student[] = data.users
          .filter((u: any) => u.perfil !== "GESTOR")
          .map((u: any) => ({
            id: u.id,
            name: u.nome,
            matricula: u.matricula || "UP-000",
            status: u.status === "BLOQUEADO" ? "Bloqueado" : "Ativo",
            email: u.email,
            cpf: formatCpf(u.cpf),
            avatarGradient: "from-emerald-400 to-teal-500",
            workoutsCompleted: 0,
            registeredAt: u.dataCadastro ? new Date(u.dataCadastro).toLocaleDateString("pt-BR") : "Hoje",
            preferredZone: "Musculação"
          }));
        setStudents(mappedStudents);
      }
    } catch (_) {}
  };

  // Splash Screen automatic duration and active session verification
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setSplashStep("Verificando credenciais de treino...");
    }, 700);

    const timer2 = setTimeout(() => {
      const saved = localStorage.getItem("up_play_user");
      if (saved) {
        try {
          const userObj = JSON.parse(saved);
          setSplashStep(`Sessão ativa encontrada! Bem-vindo(a) de volta, ${userObj.name}!`);
        } catch (_) {
          setSplashStep("Nenhuma sessão de treino ativa.");
        }
      } else {
        setSplashStep("Nenhuma sessão de treino ativa.");
      }
    }, 1500);

    const timer3 = setTimeout(() => {
      setSplashActive(false);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Poll server state every 2 seconds to match simulated progress / votes / campaign metrics / user list
  useEffect(() => {
    fetchZones();
    fetchAdminMetrics();
    fetchUsers();
    const interval = setInterval(() => {
      fetchZones();
      fetchAdminMetrics();
      fetchUsers();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Announcement auto-cycle timer for client carousel (5 seconds)
  useEffect(() => {
    if (announcements.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => {
        const activeAds = announcements.filter(a => a.active);
        if (activeAds.length <= 1) return 0;
        return (prev + 1) % activeAds.length;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements]);

  const activeZone = zones.find((z) => z.id === activeZoneId) || null;

  // Real Gym Radio Sound Control (Toggles unmuting of the real YouTube audio without any artificial oscillators)
  const startSynthEngine = () => {
    setSoundEnabled(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("up-play-unmute-audio"));
    }
  };

  const stopSynthEngine = () => {
    setSoundEnabled(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("up-play-toggle-audio"));
    }
  };

  // Synchronize soundEnabled and audioVolume with Central YouTube Player real audio events
  useEffect(() => {
    const handleAudioState = (e: any) => {
      if (e.detail) {
        setSoundEnabled(!e.detail.isMuted && e.detail.volume > 0);
        if (typeof e.detail.volume === "number") {
          setAudioVolume(e.detail.volume / 100);
        }
      }
    };
    window.addEventListener("up-play-audio-state-changed", handleAudioState);
    return () => window.removeEventListener("up-play-audio-state-changed", handleAudioState);
  }, []);

  // Vote/Like for a song (Rule 6: Each student can like a song only once)
  const handleVote = async (songId: string) => {
    if (likedSongs.includes(songId)) {
      return; // Already liked this song, do not allow voting again
    }
    try {
      const res = await fetch("/api/music/vote", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ zoneId: activeZoneId, songId }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = [...likedSongs, songId];
        setLikedSongs(updated);
        localStorage.setItem("up_play_liked_songs", JSON.stringify(updated));
        if (data.queue) {
          setZones((prevZones) =>
            prevZones.map((zone) => {
              if (zone.id === activeZoneId) {
                return {
                  ...zone,
                  queue: data.queue,
                };
              }
              return zone;
            })
          );
        }
        fetchZones();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit dedication message
  const handleSendDedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      const res = await fetch("/api/music/dedicate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          zoneId: activeZoneId,
          userName,
          text: chatMessage,
          targetUser: chatTarget,
          songTitle: chatSong || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMessage("");
        setChatSong("");
        fetchZones();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Power Mode Activation
  const handleTriggerPowerMode = async () => {
    try {
      const res = await fetch("/api/music/power-mode", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ zoneId: activeZoneId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchZones();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Manual BPM Multiplier Change
  const handleMultiplierChange = async (multiplier: number) => {
    try {
      const res = await fetch("/api/music/bpm-multiplier", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ zoneId: activeZoneId, multiplier }),
      });
      const data = await res.json();
      if (data.success) {
        fetchZones();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ask AI Music Coach for Personalized Recommendation (Gemini API)
  const handleGetAISuggestions = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/music/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutType,
          intensity,
          targetBpm,
          preferences,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // ================= AUTHENTICATION HANDLERS =================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Por favor, preencha todos os campos.");
      return;
    }

    const input = authEmail.trim();
    const pass = authPassword.trim();

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: input.includes("@") ? input : undefined,
          matricula: !input.includes("@") ? input : undefined,
          senha: pass
        })
      });

      const data = await res.json();

      if (data.success && data.user) {
        const perfilNormalized = normalizePerfil(data.user.perfil);
        const loggedUser: AuthenticatedUser = {
          id: data.user.id,
          name: data.user.nome,
          birthdate: data.user.dataNascimento || "",
          email: data.user.email,
          matricula: data.user.matricula || "",
          cpf: data.user.cpf || "",
          photo: data.user.fotoUrl || "from-emerald-400 to-teal-600",
          role: perfilNormalized === "GESTOR" ? "gestor" : perfilNormalized === "PROFESSOR" ? "professor" : "aluno",
          perfil: perfilNormalized,
          token: data.token
        };

        setAuthSuccess(`Sucesso! Entrando como ${loggedUser.name} (${getProfileLabel(loggedUser)})...`);
        localStorage.setItem("up_play_token", data.token);
        localStorage.setItem("up_play_user", JSON.stringify(loggedUser));
        
        setTimeout(() => {
          setCurrentUser(loggedUser);
          setUserName(loggedUser.name);
          setAuthEmail("");
          setAuthPassword("");
          if (isGestor(loggedUser)) {
            setActiveTab("gestor-dashboard");
            fetchAdminMetrics();
          } else {
            setActiveTab("home");
          }
        }, 800);
      } else {
        setAuthError(data.message || "Credenciais inválidas. Verifique seu usuário e senha.");
      }
    } catch (err: any) {
      setAuthError("Erro de comunicação com o servidor. Tente novamente.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!regNome.trim() || !regBirthdate.trim() || !regMatricula.trim() || !regCpf.trim() || !regEmail.trim() || !regPassword.trim()) {
      setAuthError("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    // Official Mathematical & Format CPF Validation
    const cpfValidation = validateCpf(regCpf);
    if (!cpfValidation.isValid) {
      setAuthError(cpfValidation.error || "CPF inválido. Verifique os números informados.");
      return;
    }

    const cleanCpfVal = cleanCpf(regCpf);

    // Email validation
    if (!regEmail.includes("@") || !regEmail.includes(".")) {
      setAuthError("Por favor, insira um e-mail válido.");
      return;
    }

    // Birthdate validation
    const birthDateObj = new Date(regBirthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    if (age < 12 || age > 110) {
      setAuthError("Data de nascimento inválida ou idade incompatível para treino (mínimo 12 anos).");
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: regNome.trim(),
          matricula: regMatricula.trim(),
          cpf: cleanCpfVal,
          dataNascimento: regBirthdate,
          email: regEmail.trim().toLowerCase(),
          senha: regPassword,
          perfil: "ALUNO"
        })
      });

      const data = await res.json();

      if (data.success && data.user) {
        const newUser: AuthenticatedUser = {
          id: data.user.id,
          name: data.user.nome,
          birthdate: regBirthdate,
          age: age,
          matricula: regMatricula.trim(),
          cpf: cleanCpfVal,
          email: regEmail.trim().toLowerCase(),
          photo: regFoto || "from-emerald-400 to-teal-600",
          role: "aluno",
          perfil: "ALUNO",
          token: data.token
        };

        if (data.token) {
          localStorage.setItem("up_play_token", data.token);
        }
        localStorage.setItem("up_play_user", JSON.stringify(newUser));

        setAuthSuccess("Cadastro realizado com sucesso! Conectando ao UP Play...");
        setTimeout(() => {
          setCurrentUser(newUser);
          setUserName(newUser.name);
          setRegNome("");
          setRegBirthdate("");
          setRegMatricula("");
          setRegCpf("");
          setRegEmail("");
          setRegPassword("");
          setActiveTab("home");
        }, 1000);
      } else {
        setAuthError(data.message || "Erro ao realizar cadastro.");
      }
    } catch (err: any) {
      setAuthError("Erro de comunicação com o servidor durante o cadastro.");
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("up_play_token");
    if (token) {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (_) {}
    }

    localStorage.removeItem("up_play_token");
    localStorage.removeItem("up_play_user");
    localStorage.removeItem("up_play_user_avatar_gradient");

    setCurrentUser(null);
    setUserName("Atleta_UP_" + Math.floor(Math.random() * 900 + 100));
    setAuthMode("login");
    setActiveTab("home");
    setAuthEmail("");
    setAuthPassword("");
    setAuthError("");
    setAuthSuccess("Sessão encerrada com sucesso.");
  };

  const triggerForgotPassword = () => {
    if (!authEmail.trim()) {
      setAuthError("Digite seu E-mail, Matrícula ou CPF no campo acima para recuperar a senha.");
      return;
    }
    setShowForgotMsg(true);
    setTimeout(() => {
      setShowForgotMsg(false);
    }, 6000);
  };

  // Ask AI Gym Coach for Voice Motivation (Gemini API)
  const handleGetTrainerMotivation = async (trainerId: string) => {
    speechLoadingRef.current = trainerId;
    setSpeechLoading(true);
    try {
      const res = await fetch("/api/music/coach-motivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: activeZoneId,
          workoutStage: "No pico do cansaço físico na academia",
          trainerName: trainerId === "igor" ? "Coach Igor (Militar e Motivacional)" :
                       trainerId === "gabi" ? "Instrutora Gabi (Energética e Sorridente)" :
                       trainerId === "leo" ? "Treinador Leo (Bruto e Direto)" : "Mestre Helena (Calma e Atenta)",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSpeech(data.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSpeechLoading(false);
    }
  };

  // Submit custom YouTube requests with AI Moderation
  const handleYouTubeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytRequestInput.trim()) return;
    setYtRequestLoading(true);
    setYtFeedback(null);
    try {
      const res = await fetch("/api/music/youtube-request", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          zoneId: activeZoneId,
          userName,
          youtubeUrlOrQuery: ytRequestInput,
        }),
      });
      const data = await res.json();
      setYtFeedback({
        success: data.success,
        message: data.message,
        reason: data.reason,
      });
      if (data.success) {
        setYtRequestInput("");
        if (data.song) {
          // Direct sync to user request history
          const newRecord = {
            id: "req_" + Date.now(),
            title: data.song.title,
            artist: data.song.artist,
            bpm: data.song.bpm,
            date: "Hoje, " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            zone: activeZone?.name || "Musculação - Power Arena",
            likes: 0
          };
          setUserRequestHistory((prev) => {
            const updated = [newRecord, ...prev];
            localStorage.setItem("up_play_request_history", JSON.stringify(updated));
            return updated;
          });

          setZones((prevZones) =>
            prevZones.map((zone) => {
              if (zone.id === activeZoneId) {
                if (zone.queue.some((s) => s.id === data.song.id)) return zone;
                return {
                  ...zone,
                  queue: [...zone.queue, data.song],
                };
              }
              return zone;
            })
          );
        }
        fetchZones();
        fetchAdminMetrics();
      }
    } catch (err) {
      console.error(err);
      setYtFeedback({
        success: false,
        message: "Erro de comunicação com o servidor.",
      });
    } finally {
      setYtRequestLoading(false);
    }
  };

  // Submit direct request for catalog songs (1-click fast track)
  const handleCatalogRequest = async (songId: string, target?: string, message?: string) => {
    try {
      const res = await fetch("/api/music/catalog-request", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          zoneId: activeZoneId,
          songId,
          userName,
          targetUser: target,
          messageText: message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchZones();
        fetchAdminMetrics();
        if (data.song) {
          const newRecord = {
            id: "req_" + Date.now(),
            title: data.song.title,
            artist: data.song.artist,
            bpm: data.song.bpm,
            date: "Hoje, " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            zone: activeZone?.name || "Musculação - Power Arena",
            likes: 0
          };
          setUserRequestHistory((prev) => {
            const updated = [newRecord, ...prev];
            localStorage.setItem("up_play_request_history", JSON.stringify(updated));
            return updated;
          });
        }
      }
      return data;
    } catch (err) {
      console.error(err);
      return { success: false, message: "Erro de comunicação com o servidor." };
    }
  };

  // Like a song direct action
  const handleLikeSong = async (songId: string) => {
    try {
      const res = await fetch("/api/music/like", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ songId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchZones();
      }
      return data;
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle active status of advertisements
  const handleToggleAd = async (id: string, active: boolean) => {
    try {
      const token = localStorage.getItem("up_play_token");
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id, active }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminMetrics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create new campaign/ad
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdDescription.trim()) {
      setAdFeedback("Título e descrição são obrigatórios.");
      return;
    }
    setAdFeedback("");
    try {
      const token = localStorage.getItem("up_play_token");
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          isNew: true,
          title: newAdTitle,
          subtitle: newAdSubtitle || "Campanha Especial",
          description: newAdDescription,
          color: newAdColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewAdTitle("");
        setNewAdSubtitle("");
        setNewAdDescription("");
        setAdFeedback("Campanha injetada com sucesso no carrossel do UP Play!");
        fetchAdminMetrics();
      }
    } catch (e) {
      console.error(e);
      setAdFeedback("Falha ao registrar campanha.");
    }
  };

  // Edit AI Playlist Adaptivity Settings
  const handleUpdatePlaylistRule = async (period: string, style: string, bpm: number, intensity: string) => {
    try {
      const token = localStorage.getItem("up_play_token");
      const res = await fetch("/api/admin/playlist-adaptivity", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          period,
          selectedStyle: style,
          bpmTarget: bpm,
          intensity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminMetrics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const speechLoadingRef = useRef<string>("");

  // Helper for rendering Progress bar percentage
  const getSongProgressPercent = () => {
    if (!activeZone || !activeZone.currentSong) return 0;
    return Math.min(100, (activeZone.currentProgress / activeZone.currentSong.duration) * 100);
  };

  // Helper to format remaining duration of current song
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Filter track pool on user search query
  const filteredTrackPool = trackPool.filter((song) => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.genre.toLowerCase().includes(query)
    );
  });

  return (
    <AnimatePresence mode="wait">
      {/* ================= TELA 1: SPLASH SCREEN ================= */}
      {splashActive && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-center p-6 text-white overflow-hidden"
        >
          {/* Ambient background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00ff66]/10 rounded-full filter blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col items-center max-w-sm w-full text-center relative z-10 gap-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/30 bg-[#09090b] border border-[#27272a] p-1 flex items-center justify-center"
            >
              <img
                id="logo-splash"
                src={upplayLogo}
                alt="UP PLAY Logo"
                className="w-full h-full object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <div className="space-y-2">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="font-sans font-extrabold text-4xl tracking-tighter bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent"
              >
                UP PLAY
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-zinc-500 font-mono tracking-[0.2em] uppercase"
              >
                UP FITNESS SMART AUDIO
              </motion.p>
            </div>

            {/* Simulated Active Session Check Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="w-full space-y-4"
            >
              <div className="flex items-center justify-center gap-2.5 text-xs text-zinc-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping" />
                <span>{splashStep}</span>
              </div>
              
              {/* Loader bar */}
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-zinc-850">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.3, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-[#00ff66]"
                />
              </div>
            </motion.div>
          </div>

          {/* Quick Skip button for tests */}
          <button
            onClick={() => setSplashActive(false)}
            className="absolute bottom-8 text-[11px] font-mono text-zinc-600 hover:text-[#00ff66] transition-colors border border-zinc-800 hover:border-[#00ff66]/30 px-3 py-1.5 rounded-full cursor-pointer"
          >
            Pular Abertura (Testar)
          </button>
        </motion.div>
      )}

      {/* ================= TELA 2 & 3: LOGIN / CADASTRO SCREEN ================= */}
      {!splashActive && !currentUser && (
        <motion.div
          key="auth"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 bg-[#09090b] z-45 flex items-center justify-center p-4 md:p-6 text-white overflow-y-auto"
        >
          {/* Glowing gradients */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full filter blur-[120px] pointer-events-none" />

          <div className="w-full max-w-lg bg-[#121214] border border-[#27272a] rounded-3xl overflow-hidden shadow-2xl relative z-10 my-8">
            
            {/* Top decorative color bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-[#00ff66] to-teal-500" />

            <div className="p-6 md:p-8 flex flex-col gap-6">
              
              {/* Header Branding */}
              <div className="text-center space-y-2">
                <div className="inline-flex w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/10 mb-2 bg-[#09090b] border border-[#27272a] p-1 items-center justify-center">
                  <img
                    id="logo-login"
                    src={upplayLogo}
                    alt="UP PLAY Logo"
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="font-sans font-extrabold text-2xl tracking-tighter bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  UP PLAY
                </h2>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  A sintonia inteligente da UP Fitness. Controle o ritmo da academia em tempo real.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === "login"
                      ? "bg-zinc-850 text-[#00ff66] shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === "register"
                      ? "bg-zinc-850 text-[#00ff66] shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              {/* Feedback messages */}
              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2 items-center text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="bg-[#00ff66]/10 border border-[#00ff66]/20 rounded-xl p-3 flex gap-2 items-center text-xs text-[#00ff66]">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Dynamic Forms */}
              {authMode === "login" ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                      Matrícula, CPF ou E-mail
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 88721, 11122233344 ou atleta@up.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 text-xs px-4 py-3 rounded-xl text-white outline-none focus:border-[#00ff66] transition-all placeholder-zinc-600 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={triggerForgotPassword}
                        className="text-[10px] text-zinc-500 hover:text-[#00ff66] underline font-sans cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="Sua senha secreta"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 text-xs px-4 py-3 rounded-xl text-white outline-none focus:border-[#00ff66] transition-all placeholder-zinc-600"
                    />
                  </div>

                  {showForgotMsg && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 leading-relaxed space-y-1">
                      <span className="font-bold block">💡 Recuperação Simulada Ativa:</span>
                      <p>As instruções de recuperação foram enviadas para o contato vinculado à credencial "{authEmail || 'não informada'}". Verifique seu e-mail/SMS.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#00ff66] hover:bg-[#00e159] text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/10 uppercase tracking-wider mt-2 cursor-pointer active:scale-95 touch-manipulation"
                  >
                    Entrar no Treino
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Mariana Silva"
                        value={regNome}
                        onChange={(e) => setRegNome(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#00ff66] transition-all placeholder-zinc-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        value={regBirthdate}
                        onChange={(e) => setRegBirthdate(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#00ff66] transition-all text-zinc-300 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                        Matrícula UP Fitness *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 88721"
                        value={regMatricula}
                        onChange={(e) => setRegMatricula(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#00ff66] transition-all placeholder-zinc-600 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                          CPF *
                        </label>
                        {regCpf.length === 14 && (
                          <span className={`text-[10px] font-mono ${validateCpf(regCpf).isValid ? "text-emerald-400 font-bold" : "text-rose-400"}`}>
                            {validateCpf(regCpf).isValid ? "✓ Válido" : "✗ Inválido"}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={regCpf}
                        onChange={(e) => setRegCpf(maskCpf(e.target.value))}
                        required
                        className={`w-full bg-zinc-950 border text-xs px-3.5 py-2.5 rounded-xl text-white outline-none transition-all placeholder-zinc-600 font-mono ${
                          regCpf.length === 14 
                            ? validateCpf(regCpf).isValid 
                              ? "border-emerald-500/50 focus:border-emerald-400" 
                              : "border-rose-500/50 focus:border-rose-400"
                            : "border-zinc-850 focus:border-[#00ff66]"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                        E-mail de Contato *
                      </label>
                      <input
                        type="email"
                        placeholder="Ex: mariana@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#00ff66] transition-all placeholder-zinc-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                        Senha Secreta *
                      </label>
                      <input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#00ff66] transition-all placeholder-zinc-600"
                      />
                    </div>
                  </div>

                  {/* Foto Selector (Opcional - Fitness Theme Avatars) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                      Selecione seu Avatar Temático (Foto Opcional)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "from-emerald-400 to-teal-600", label: "Arena Verde" },
                        { id: "from-amber-400 to-orange-600", label: "Força Solar" },
                        { id: "from-purple-500 to-indigo-700", label: "Glow Roxo" },
                        { id: "from-rose-500 to-red-700", label: "Red Cardio" },
                      ].map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRegFoto(av.id)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[9px] font-bold cursor-pointer ${
                            regFoto === av.id
                              ? "bg-zinc-850 border-[#00ff66] text-[#00ff66]"
                              : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400"
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-full bg-gradient-to-tr ${av.id} block shadow-inner`} />
                          <span className="truncate w-full text-center">{av.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 italic">
                    💡 A sua data de nascimento é utilizada para calibrar o som e segmentação de IA do UP Play de acordo com a sua idade.
                  </p>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#00ff66] hover:bg-[#00e159] text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/10 uppercase tracking-wider mt-2 cursor-pointer"
                  >
                    Cadastrar e Iniciar Som
                  </button>
                </form>
              )}

            </div>
          </div>
        </motion.div>
      )}

      {/* ================= TELA 4: HOME & APP PRINCIPAL ================= */}
      {!splashActive && currentUser && (
        <div id="up-play-root" className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans antialiased flex flex-col md:flex-row w-full relative">
      
      {/* MOBILE TOP HEADER (< md) */}
      <header className="flex md:hidden items-center justify-between px-3.5 sm:px-4 py-2 pt-[max(0.625rem,env(safe-area-inset-top,0px))] bg-[#121214] border-b border-[#27272a] sticky top-0 z-40 shrink-0 px-safe">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow bg-[#09090b] border border-[#27272a] p-0.5 flex items-center justify-center shrink-0">
            <img
              src={upplayLogo}
              alt="UP PLAY"
              className="w-full h-full object-contain rounded-md"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm tracking-tight text-white leading-tight">
              UP PLAY
            </h1>
            <p className="text-[9px] text-emerald-400 font-mono tracking-wider uppercase truncate max-w-[140px]">
              {activeZone?.name.split(" - ")[0] || "ACADEMIA"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Power Mode Pill if active */}
          {activeZone?.powerModeActive && (
            <span className="text-[9px] font-mono font-bold uppercase text-rose-500 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3 fill-rose-500" /> POWER
            </span>
          )}

          {/* Synth/Beat Audio Toggle */}
          <button
            onClick={soundEnabled ? stopSynthEngine : startSynthEngine}
            className={`min-w-[40px] min-h-[40px] p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
              soundEnabled
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-800 text-zinc-400"
            }`}
            title="Sintetizador"
            aria-label="Sintetizador"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-white border border-zinc-750 transition-all cursor-pointer flex items-center justify-center active:scale-95"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed top-0 bottom-0 left-0 w-[85%] max-w-sm bg-[#121214] border-r border-[#27272a] p-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pl-[max(1.25rem,env(safe-area-inset-left,0px))] z-50 flex flex-col justify-between overflow-y-auto pb-safe md:hidden"
            >
              <div className="flex flex-col gap-5">
                {/* Header with Close */}
                <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-[#09090b] border border-[#27272a] p-0.5 flex items-center justify-center">
                      <img
                        src={upplayLogo}
                        alt="UP PLAY"
                        className="w-full h-full object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-white">UP PLAY</h2>
                      <p className="text-[10px] text-emerald-400 font-mono">UP FITNESS SMART AUDIO</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/60"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Profile Card */}
                <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-xl flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-mono font-bold text-black text-sm shrink-0`}>
                    {userName ? userName.slice(0, 2).toUpperCase() : "UP"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-emerald-400 font-semibold font-mono uppercase tracking-wider">
                        {isGestor(currentUser) ? "👨‍💼 Gestor" : isProfessor(currentUser) ? "👨‍🏫 Professor" : "🏋️‍♂️ Aluno"}
                      </p>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="text-[10px] text-red-400 font-mono font-bold hover:underline"
                      >
                        Sair
                      </button>
                    </div>
                    <p className="text-sm font-semibold truncate text-white">{userName}</p>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1.5">
                  <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase px-2 mb-1">
                    {isGestor(currentUser) ? "PAINEL GESTOR" : "MENU PRINCIPAL"}
                  </p>
                  {isGestor(currentUser) ? (
                    <>
                      <button
                        onClick={() => { setActiveTab("gestor-dashboard"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "gestor-dashboard" || activeTab === "gestor"
                            ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        <span>Dashboard Geral</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("gestor-player"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "gestor-player"
                            ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Music className="w-4 h-4 text-emerald-400" />
                        <span>Player & Fila</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("gestor-usuarios"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "gestor-usuarios"
                            ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <User className="w-4 h-4 text-emerald-400" />
                        <span>Gerenciar Alunos</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("gestor-bi"); fetchAdminMetrics(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "gestor-bi"
                            ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <span>Business BI</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("gestor-anuncios"); fetchAdminMetrics(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "gestor-anuncios"
                            ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Megaphone className="w-4 h-4 text-emerald-400" />
                        <span>Anúncios na Academia</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("gestor-config"); fetchAdminMetrics(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "gestor-config"
                            ? "bg-[#27272a] text-teal-400 border-l-2 border-teal-400"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Sliders className="w-4 h-4 text-teal-400" />
                        <span>Configurações</span>
                      </button>

                      <div className="border-t border-zinc-800 my-2 pt-2">
                        <button
                          onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-400 hover:bg-[#18181b] w-full text-left"
                        >
                          <Compass className="w-4 h-4" />
                          <span>Ver como Aluno</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "home"
                            ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Music className="w-4 h-4" />
                        <span>Início (Home)</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("pedir-musica"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "pedir-musica"
                            ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Plus className="w-4 h-4 text-[#00ff66]" />
                        <span>Pedir Música</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("fila"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "fila"
                            ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Vote className="w-4 h-4" />
                        <span>Fila da Galera</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("top-up"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "top-up"
                            ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>TOP UP (Ranking)</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("perfil"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "perfil"
                            ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Perfil do Aluno</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("ai-coach"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "ai-coach"
                            ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>AI Music Coach</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("challenges"); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === "challenges"
                            ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                            : "text-zinc-300 hover:bg-[#18181b]"
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>Metas & Desafios</span>
                      </button>
                    </>
                  )}
                </nav>

                {/* Sala de Musculação - Ambiente Único */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#27272a]">
                  <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase px-2">
                    Ambiente de Som
                  </p>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="truncate text-xs">
                        <span className="font-bold text-white block">Sala de Musculação</span>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          {activeZone?.currentSong ? `${activeZone.currentSong.title}` : "Som Oficial UP Fitness"}
                        </span>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-[#27272a] text-center mt-6">
                <p className="text-[10px] text-zinc-500">UP PLAY &copy; 2026</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 1. LEFT SIDEBAR (DESKTOP: md:flex) */}
      <aside id="sidebar-panel" className="hidden md:flex md:w-80 bg-[#121214] border-r border-[#27272a] p-5 flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 bg-[#09090b] border border-[#27272a] p-0.5 flex items-center justify-center">
                <img
                  id="logo-sidebar"
                  src={upplayLogo}
                  alt="UP PLAY Logo"
                  className="w-full h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  UP PLAY
                </h1>
                <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                  UP FITNESS SMART AUDIO
                </p>
              </div>
            </div>
            
            {/* Audio Toggle indicator */}
            <button
              id="audio-toggle-btn"
              onClick={soundEnabled ? stopSynthEngine : startSynthEngine}
              className={`p-2 rounded-lg transition-all ${
                soundEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  : "bg-zinc-800 text-zinc-400 border border-transparent hover:bg-zinc-700"
              }`}
              title={soundEnabled ? "Desativar Sintetizador de Batida" : "Ativar Sintetizador de Batida"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* User Profile Card */}
          <div id="user-profile-card" className="bg-[#18181b] border border-[#27272a] p-3.5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-mono font-bold text-black text-xs shrink-0`}>
              {userName ? userName.slice(0, 2).toUpperCase() : "UP"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-emerald-400 font-semibold font-mono uppercase tracking-wider">
                  {isGestor(currentUser) ? "👨‍💼 Gestor UP Play" : isProfessor(currentUser) ? "👨‍🏫 Professor UP" : `🏋️‍♂️ Aluno (${currentUser?.age ? `${currentUser.age} anos` : "Atleta"})`}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-[10px] text-zinc-500 hover:text-red-400 cursor-pointer flex items-center gap-0.5 font-mono font-bold"
                  title="Sair da Conta"
                >
                  Sair
                </button>
              </div>
              {isEditingName ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      if (currentUser) {
                        const updated = { ...currentUser, name: e.target.value };
                        setCurrentUser(updated);
                        localStorage.setItem("up_play_user", JSON.stringify(updated));
                      }
                    }}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsEditingName(false);
                    }}
                    className="bg-[#27272a] text-xs text-white px-2 py-0.5 rounded border border-[#00ff66] outline-none w-full font-sans"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-sm font-semibold truncate text-zinc-100 font-sans">{userName}</p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-[9px] text-zinc-500 hover:text-emerald-400 underline cursor-pointer"
                  >
                    editar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation tabs */}
          <nav id="sidebar-nav" className="flex flex-col gap-1">
            {isGestor(currentUser) ? (
              <>
                <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase px-2 mb-1">
                  PAINEL ADMINISTRATIVO
                </p>
                <button
                  onClick={() => setActiveTab("gestor-dashboard")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "gestor-dashboard" || activeTab === "gestor"
                      ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Dashboard (Início)</span>
                </button>
                <button
                  onClick={() => setActiveTab("gestor-player")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "gestor-player"
                      ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Player & Fila</span>
                </button>
                <button
                  onClick={() => setActiveTab("gestor-usuarios")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "gestor-usuarios"
                      ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Gerenciar Alunos</span>
                </button>
                <button
                  onClick={() => { setActiveTab("gestor-bi"); fetchAdminMetrics(); }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "gestor-bi"
                      ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Business BI</span>
                </button>
                <button
                  onClick={() => { setActiveTab("gestor-anuncios"); fetchAdminMetrics(); }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "gestor-anuncios"
                      ? "bg-[#27272a] text-[#00ff66] border-l-2 border-[#00ff66]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Anúncios</span>
                </button>
                <button
                  onClick={() => { setActiveTab("gestor-config"); fetchAdminMetrics(); }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "gestor-config"
                      ? "bg-[#27272a] text-teal-400 border-l-2 border-teal-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-teal-400" />
                  <span>Configurações</span>
                </button>

                <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase px-2 mt-4 mb-1">
                  MODO DE VISÃO
                </p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b] w-full text-left"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "10s" }} />
                  <span>Área do Aluno</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase px-2 mb-1">
                  UP PLAY — {isProfessor(currentUser) ? "PROFESSOR" : "ALUNO"}
                </p>
                <button
                  onClick={() => setActiveTab("home")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "home"
                      ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Início (Home)</span>
                </button>
                <button
                  onClick={() => setActiveTab("pedir-musica")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "pedir-musica"
                      ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span className="flex items-center justify-between w-full">
                    <span>Pedir Música</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 rounded uppercase font-mono">YouTube</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("fila")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "fila"
                      ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Vote className="w-3.5 h-3.5" />
                  <span className="flex items-center justify-between w-full">
                    <span>Fila da Galera</span>
                    <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1 rounded font-mono">ao vivo</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("perfil")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "perfil"
                      ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Perfil do Aluno</span>
                </button>
                <button
                  onClick={() => setActiveTab("top-up")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "top-up"
                      ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>TOP UP (Ranking)</span>
                </button>

                <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase px-2 mt-3 mb-1">
                  EXTRAS & BI
                </p>
                <button
                  onClick={() => setActiveTab("ai-coach")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "ai-coach"
                      ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Music Coach</span>
                </button>
                <button
                  onClick={() => setActiveTab("challenges")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "challenges"
                      ? "bg-[#27272a] text-emerald-400 border-l-2 border-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Metas & Desafios</span>
                </button>
              </>
            )}
          </nav>

          {/* Active Sound Environment - Sala de Musculação */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase px-2 mb-1">
              Ambiente de Som
            </p>
            {loadingZones ? (
              <div className="px-2 py-4 text-xs text-zinc-400 animate-pulse">Carregando ambiente...</div>
            ) : (
              <div id="gym-zones-list" className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="truncate text-xs">
                    <span className="font-bold text-white block">Sala de Musculação</span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {activeZone?.currentSong ? `${activeZone.currentSong.title} (${activeZone.currentSong.bpm} BPM)` : "Sintonizado"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {activeZone?.powerModeActive && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Power Mode Ativo" />
                  )}
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Brand Signoff */}
        <div className="pt-4 border-t border-[#27272a] text-center">
          <p className="text-[10px] text-zinc-500">
            UP PLAY &copy; 2026. Todos os direitos reservados.
          </p>
          <p className="text-[9px] text-emerald-500/70 font-mono mt-0.5">
            Sincronizado com UP Fitness Core
          </p>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main id="main-workspace" className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative overflow-y-auto min-h-screen">
        
        {/* Dynamic Theme Banner matching selected Gym Zone */}
        {activeZone && (
          <div className="relative overflow-hidden min-h-[110px] sm:h-36 border-b border-[#27272a] bg-zinc-950 flex items-center px-4 sm:px-6 md:px-8 py-3 shrink-0">
            {/* Visual ambient gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${activeZone.color} opacity-25 filter blur-3xl`} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#09090b]" />

            <div className="relative z-10 flex items-center justify-between w-full">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] sm:text-xs font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    SETOR ATIVO
                  </span>
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl md:text-3xl text-white tracking-tight">
                  {activeZone.name}
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 max-w-lg hidden sm:block">
                  Transmissão e seleção de canais coletivos. Interaja na fila de votação e mande dedicatórias em tempo real!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MAIN TABS SWITCHER - RESPONSIVE FOR MOBILE & DESKTOP */}
        <MainTabsNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isGestorUser={isGestor(currentUser)}
          onGestorClick={() => {
            setActiveTab("gestor-dashboard");
            fetchAdminMetrics();
          }}
        />

        {/* 3. CONDITIONAL TAB CONTENTS */}
        <div className="p-3.5 sm:p-6 md:p-8 pb-[calc(11rem+env(safe-area-inset-bottom,0px))] sm:pb-52 md:pb-44 flex-1 flex flex-col gap-6 md:gap-8 px-safe">
          
          {/* ================= TELAS 4-8: UP PLAY CORE EXPERIENCES ================= */}
          {activeTab === "home" && (
            <HomeView
              activeZone={activeZone}
              announcements={announcements}
              currentAdIndex={currentAdIndex}
              setCurrentAdIndex={setCurrentAdIndex}
              setActiveTab={setActiveTab}
              likedSongs={likedSongs}
              handleVote={handleVote}
              soundEnabled={soundEnabled}
              startSynthEngine={startSynthEngine}
              stopSynthEngine={stopSynthEngine}
              userName={userName}
              avatarGradient={avatarGradient}
              handleTriggerPowerMode={handleTriggerPowerMode}
              students={students}
            />
          )}

          {activeTab === "pedir-musica" && (
            <PedirMusicaView
              activeZone={activeZone}
              trackPool={trackPool}
              ytRequestInput={ytRequestInput}
              setYtRequestInput={setYtRequestInput}
              ytRequestLoading={ytRequestLoading}
              ytFeedback={ytFeedback}
              handleYouTubeRequest={handleYouTubeRequest}
              handleCatalogRequest={handleCatalogRequest}
              handleLikeSong={handleLikeSong}
              dedicationTarget={dedicationTarget}
              setDedicationTarget={setDedicationTarget}
              dedicationMessageText={dedicationMessageText}
              setDedicationMessageText={setDedicationMessageText}
              userRequestHistory={userRequestHistory}
              setUserRequestHistory={setUserRequestHistory}
              likedSongs={likedSongs}
              handleVote={handleVote}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "fila" && (
            <FilaView
              activeZone={activeZone}
              likedSongs={likedSongs}
              handleVote={handleVote}
              userName={userName}
            />
          )}

          {activeTab === "perfil" && (
            <PerfilView
              userName={userName}
              setUserName={setUserName}
              avatarGradient={avatarGradient}
              setAvatarGradient={setAvatarGradient}
              userRequestHistory={userRequestHistory}
              preferredZoneId={preferredZoneId}
              setPreferredZoneId={setPreferredZoneId}
              pacingRange={pacingRange}
              setPacingRange={setPacingRange}
              audioLatency={audioLatency}
              setAudioLatency={setAudioLatency}
              notificationsOn={notificationsOn}
              setNotificationsOn={setNotificationsOn}
            />
          )}

          {activeTab === "top-up" && (
            <TopUpView
              userName={userName}
              students={students}
            />
          )}

          {false && activeTab === "player" && activeZone && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COL: PLAYER CARD & SOUND BOARD (8 COLS) */}
              <div className="xl:col-span-8 flex flex-col gap-6">

                {/* UP PLAY CAMPAIGN CARROSSEL / ANÚNCIOS (PRD: Carrossel de anúncios rotativos) */}
                {announcements.filter(a => a.active).length > 0 && (
                  <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 md:p-5 relative overflow-hidden group shadow-lg">
                    {/* Background visual highlight */}
                    <div className={`absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-tr ${announcements.filter(a => a.active)[currentAdIndex % announcements.filter(a => a.active).length]?.color || "from-[#00ff66]/10 to-transparent"} opacity-20 rounded-full filter blur-xl`} />
                    
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${announcements.filter(a => a.active)[currentAdIndex % announcements.filter(a => a.active).length]?.color || "from-[#00ff66] to-teal-500"} text-black flex items-center justify-center shrink-0`}>
                        <Megaphone className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-1.5 rounded uppercase tracking-wider">
                              ⚡ Mural de Anúncios UP Play
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">• rotativo coletivo (5s)</span>
                          </div>

                          {announcements.filter(a => a.active).length > 1 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  const total = announcements.filter(a => a.active).length;
                                  setCurrentAdIndex((currentAdIndex - 1 + total) % total);
                                }}
                                className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                                title="Voltar anúncio"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const total = announcements.filter(a => a.active).length;
                                  setCurrentAdIndex((currentAdIndex + 1) % total);
                                }}
                                className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                                title="Avançar anúncio"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white mt-1">
                          {announcements.filter(a => a.active)[currentAdIndex % announcements.filter(a => a.active).length]?.title}
                        </h3>
                        <p className="text-xs text-[#00ff66] font-semibold mt-0.5">
                          {announcements.filter(a => a.active)[currentAdIndex % announcements.filter(a => a.active).length]?.subtitle}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {announcements.filter(a => a.active)[currentAdIndex % announcements.filter(a => a.active).length]?.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Carousel slide indicators */}
                    <div className="flex items-center justify-center gap-2 mt-3 relative z-10">
                      {announcements.filter(a => a.active).length > 1 && (
                        <button
                          onClick={() => {
                            const total = announcements.filter(a => a.active).length;
                            setCurrentAdIndex((currentAdIndex - 1 + total) % total);
                          }}
                          className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                          title="Voltar à esquerda"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="flex items-center gap-1.5">
                        {announcements.filter(a => a.active).map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentAdIndex(index)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              (currentAdIndex % announcements.filter(a => a.active).length) === index
                                ? "w-5 bg-[#00ff66]"
                                : "w-1.5 bg-zinc-700 hover:bg-zinc-600"
                            }`}
                            aria-label={`Ir para anúncio ${index + 1}`}
                          />
                        ))}
                      </div>

                      {announcements.filter(a => a.active).length > 1 && (
                        <button
                          onClick={() => {
                            const total = announcements.filter(a => a.active).length;
                            setCurrentAdIndex((currentAdIndex + 1) % total);
                          }}
                          className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                          title="Avançar à direita"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Master Audio Player (Spotify Layout) */}
                <div id="master-player-card" className="bg-gradient-to-b from-[#18181b] to-[#0f0f11] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden group">
                  {/* Subtle progress glow in player card background */}
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                    style={{ width: `${getSongProgressPercent()}%` }}
                  />

                  {activeZone.currentSong ? (
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      
                      {/* Album Art with neon glow and dynamic sound bars */}
                      <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-xl overflow-hidden shrink-0 shadow-2xl flex-none border border-zinc-800">
                        <div className={`w-full h-full bg-gradient-to-tr ${activeZone.currentSong.coverGradient} flex flex-col items-center justify-center p-4 relative`}>
                          <Music className="w-12 h-12 text-white/40 mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-[9px] text-white/50 font-mono tracking-widest text-center uppercase font-bold">
                            {activeZone.currentSong.album}
                          </p>

                          {/* Sound wave visual bars (only when music state is emulated active) */}
                          {!isPaused && (
                            <div className="absolute bottom-3 right-3 flex items-end gap-1 h-8">
                              <span className="w-1 bg-emerald-400 animate-sound-bar rounded-sm" style={{ height: "100%", animationDelay: "0.1s" }} />
                              <span className="w-1 bg-emerald-400 animate-sound-bar rounded-sm" style={{ height: "100%", animationDelay: "0.3s" }} />
                              <span className="w-1 bg-emerald-400 animate-sound-bar rounded-sm" style={{ height: "100%", animationDelay: "0.5s" }} />
                              <span className="w-1 bg-emerald-400 animate-sound-bar rounded-sm" style={{ height: "100%", animationDelay: "0.2s" }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tracks detail & playback controls */}
                      <div className="flex-1 w-full text-center md:text-left flex flex-col justify-between h-full py-1">
                        <div>
                          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                              {activeZone.currentSong.genre}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                              {activeZone.currentSong.bpm} BPM BASE
                            </span>
                          </div>
                          
                          <h3 className="font-display font-bold text-2xl text-white tracking-tight leading-tight">
                            {activeZone.currentSong.title}
                          </h3>
                          <p className="text-sm text-zinc-400 font-medium mt-1">
                            {activeZone.currentSong.artist}
                          </p>
                        </div>

                        {/* Interactive Playback bar */}
                        <div className="my-5">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-1.5">
                            <span>{formatTime(activeZone.currentProgress)}</span>
                            <span className="text-emerald-400/80 font-bold">
                              {Math.round(activeZone.currentSong.bpm * activeZone.bpmMultiplier)} BPM REAL
                            </span>
                            <span>{formatTime(activeZone.currentSong.duration)}</span>
                          </div>
                          {/* Simulated bar container */}
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full relative overflow-hidden group cursor-pointer">
                            <div
                              className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${getSongProgressPercent()}%` }}
                            />
                          </div>
                        </div>

                        {/* Media Player Controls Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {isGestor(currentUser) ? (
                              <>
                                {/* Play / Pause Toggle */}
                                <button
                                  id="playback-play-btn"
                                  onClick={() => handleTogglePlayback(isPaused, true)}
                                  className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                                  title={isPaused ? "Tocar" : "Pausar"}
                                >
                                  {isPaused ? <Play className="w-5 h-5 fill-black ml-0.5" /> : <Pause className="w-5 h-5 fill-black" />}
                                </button>

                                {/* Skip / Fast Forward emulated */}
                                <button
                                  id="playback-skip-btn"
                                  onClick={() => {
                                    handleNextTrack(false);
                                  }}
                                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                                  title="Avançar para próxima música"
                                >
                                  <SkipForward className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              /* Read-only state for Aluno / Listener */
                              <div className="flex items-center gap-3 select-none" title="Controle exclusivo do Gestor">
                                <button
                                  disabled
                                  tabIndex={-1}
                                  className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700 flex items-center justify-center cursor-not-allowed opacity-60 pointer-events-none"
                                >
                                  {isPaused ? <Play className="w-5 h-5 fill-zinc-500 ml-0.5" /> : <Pause className="w-5 h-5 fill-zinc-500" />}
                                </button>

                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                                  🔒 Controle exclusivo do Gestor
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Dynamic CADENCE & SPEED multiplier */}
                          <div className="flex items-center gap-3 bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-zinc-800/80">
                            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                            <div className="text-xs">
                              <span className="text-[10px] text-zinc-400 block font-mono">CADÊNCIA (BPM)</span>
                              <span className="font-mono font-bold text-white text-xs block mt-0.5">
                                {activeZone.currentSong ? `${activeZone.currentSong.bpm} BPM` : "120 BPM"} (1.0x Original)
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500">Sem música ativa neste setor</div>
                  )}
                </div>

                {/* Sub-panel: Crowd Interactive voting list (FILA DE REPRODUÇÃO) */}
                <div id="voting-queue-section" className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-semibold text-base text-white">
                        Votação da Galera (Fila de Espera)
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        As músicas com maior quantidade de votos tocam primeiro. Vote na sua favorita!
                      </p>
                    </div>
                    <Vote className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {activeZone.queue.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                        Nenhuma música na fila. Adicione do acervo abaixo!
                      </div>
                    ) : (
                      activeZone.queue.map((song) => (
                        <div
                          key={song.id}
                          className="bg-[#18181b] hover:bg-[#1f1f23] transition-all p-3 rounded-xl flex items-center justify-between border border-zinc-800/60"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-md bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                              {song.bpm}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">
                              {song.votes} {song.votes === 1 ? "voto" : "votos"}
                            </span>
                            <button
                              onClick={() => handleVote(song.id)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Vote className="w-3.5 h-3.5" />
                              <span>Votar</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pedido de Música via YouTube (PRD: Pedidos de música do YouTube com moderação por IA) */}
                <div id="youtube-request-card" className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-[#ff0000]/10 text-[#ff0000] border border-[#ff0000]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        🎬 Integração YouTube
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        Moderação IA Ativa
                      </span>
                    </div>
                    <h4 className="font-display font-semibold text-base text-white mt-2">
                      Pedir Música via YouTube / Busca
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Insira o título da música ou o link do YouTube. A inteligência artificial irá analisar o ritmo, letras e adequação para aprovar e inseri-la diretamente na fila de reprodução!
                    </p>
                  </div>

                  <form onSubmit={handleYouTubeRequest} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: AC/DC - Thunderstruck ou link do YouTube"
                      value={ytRequestInput}
                      onChange={(e) => setYtRequestInput(e.target.value)}
                      disabled={ytRequestLoading}
                      className="flex-1 bg-[#18181b] border border-zinc-800 text-xs rounded-xl px-4 py-2.5 focus:border-[#00ff66] outline-none text-white placeholder-zinc-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={ytRequestLoading || !ytRequestInput.trim()}
                      className="px-4 py-2.5 bg-[#00ff66] hover:bg-[#00e159] text-black rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-[#00ff66]"
                    >
                      {ytRequestLoading ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Analisando IA...</span>
                        </span>
                      ) : (
                        <span>Pedir Música</span>
                      )}
                    </button>
                  </form>

                  {/* Dynamic Interactive AI Feedback Panels */}
                  {ytRequestLoading && (
                    <div className="bg-zinc-900/60 border border-zinc-800/85 rounded-xl p-3.5 flex items-center gap-3 animate-pulse">
                      <div className="w-5 h-5 border-2 border-[#00ff66] border-t-transparent rounded-full animate-spin shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">O Moderador IA está avaliando o seu pedido...</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Verificando BPM, adequação lírica e estilo do setor "{activeZone.name}"</p>
                      </div>
                    </div>
                  )}

                  {ytFeedback && (
                    <div className={`border rounded-xl p-4 flex gap-3 ${
                      ytFeedback.success 
                        ? "bg-emerald-950/20 border-emerald-500/30 text-zinc-300" 
                        : "bg-rose-950/20 border-rose-500/30 text-zinc-300"
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        ytFeedback.success ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {ytFeedback.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white uppercase tracking-wide">
                          {ytFeedback.success ? "Pedido Aprovado por IA!" : "Pedido Sinalizado / Retido por IA"}
                        </p>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          {ytFeedback.message}
                        </p>
                        {ytFeedback.reason && (
                          <div className="mt-2 pt-2 border-t border-zinc-800/60">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Justificativa da IA:</span>
                            <span className="text-xs text-zinc-400 italic">"{ytFeedback.reason}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-panel: Gym Curated Music Pool (ACERVO UP PLAY) */}
                <div id="track-pool-section" className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-display font-semibold text-base text-white">
                        Acervo de Treino Curado
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Músicas de altíssima energia catalogadas pela UP Fitness. Procure e adicione à fila.
                      </p>
                    </div>

                    {/* Search bar inside pool */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Pesquisar ritmo, artista..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#18181b] border border-zinc-800 text-xs rounded-xl pl-9 pr-4 py-1.5 focus:border-emerald-500 outline-none w-full md:w-56"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {filteredTrackPool.length === 0 ? (
                      <div className="py-6 text-center text-zinc-500 text-xs">
                        Nenhuma música encontrada para sua busca
                      </div>
                    ) : (
                      filteredTrackPool.map((song) => {
                        const inQueue = activeZone.queue.some((s) => s.id === song.id);
                        return (
                          <div
                            key={song.id}
                            className="bg-[#18181b] hover:bg-zinc-850 p-2.5 rounded-xl flex items-center justify-between border border-zinc-800/40 transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center font-bold text-[10px] text-white shrink-0`}>
                                {song.bpm}
                              </div>
                              <div className="truncate text-xs">
                                <p className="font-semibold text-white truncate">{song.title}</p>
                                <p className="text-[10px] text-zinc-400 truncate">{song.artist}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleVote(song.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                                inQueue
                                  ? "bg-zinc-800 text-zinc-400 cursor-default"
                                  : "bg-zinc-800 hover:bg-emerald-500 hover:text-black text-zinc-200"
                              }`}
                              disabled={inQueue}
                            >
                              <Plus className="w-3 h-3" />
                              <span>{inQueue ? "Na Fila" : "Adicionar"}</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COL: ZONE INTERACTIVE CHAT & DEDICATION BOARD (4 COLS) */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                
                {/* Gym Interactive Chat / Dedication Center */}
                <div id="chat-dedication-box" className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col h-[650px] justify-between">
                  
                  {/* Chat Header */}
                  <div className="border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-display font-semibold text-base text-white">
                        Painel de Recados e Pedidos
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Mande mensagens para parceiros de treino ou peça sua música predileta!
                    </p>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {activeZone.messages.length === 0 ? (
                      <div className="text-center py-20 text-zinc-500 text-xs">
                        Nenhuma mensagem ou dedicatória enviada. Envie a primeira abaixo!
                      </div>
                    ) : (
                      activeZone.messages.map((msg) => {
                        const isSystem = msg.userName?.includes("PROTETOR") || msg.userName?.includes("⚡");
                        return (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-xl text-xs flex flex-col gap-1 transition-all ${
                              isSystem
                                ? "bg-rose-950/30 border border-rose-500/20 text-rose-200"
                                : "bg-[#18181b] border border-zinc-800 text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-mono font-bold ${isSystem ? "text-rose-400 text-[11px]" : "text-emerald-400"}`}>
                                {msg.userName}
                              </span>
                              <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                            </div>

                            {/* Optional target receiver */}
                            {msg.targetUser && msg.targetUser !== "Geral" && (
                              <div className="text-[10px] text-zinc-400">
                                para: <span className="text-zinc-200 font-semibold">{msg.targetUser}</span>
                              </div>
                            )}

                            <p className="mt-1 leading-relaxed">{msg.text}</p>

                            {/* Dedication song indicator */}
                            {msg.songTitle && (
                              <div className="mt-1.5 flex items-center gap-1.5 bg-[#121214] px-2 py-1 rounded text-[10px] text-emerald-400 border border-emerald-500/10 inline-flex self-start">
                                <Music className="w-3 h-3 text-emerald-400" />
                                <span>Pedido: {msg.songTitle}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat input box */}
                  <form onSubmit={handleSendDedication} className="border-t border-zinc-800 pt-4 flex flex-col gap-2.5">
                    
                    {/* Optional metadata targets */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block font-mono mb-1">DESTINATÁRIO</label>
                        <input
                          type="text"
                          value={chatTarget}
                          onChange={(e) => setChatTarget(e.target.value)}
                          placeholder="Ex: Geral, Bruno"
                          className="w-full bg-[#18181b] border border-zinc-800 text-[11px] px-2 py-1.5 rounded-lg text-zinc-200 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block font-mono mb-1">MÚSICA (PEDIDO)</label>
                        <select
                          value={chatSong}
                          onChange={(e) => setChatSong(e.target.value)}
                          className="w-full bg-[#18181b] border border-zinc-800 text-[11px] px-2 py-1.5 rounded-lg text-zinc-200 focus:border-emerald-500 outline-none"
                        >
                          <option value="">Nenhum pedido</option>
                          {trackPool.map((s) => (
                            <option key={s.id} value={s.title}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Main text box */}
                    <div className="relative">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Mande sua mensagem de incentivo..."
                        maxLength={160}
                        className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-xl pl-3 pr-10 py-2.5 text-zinc-200 focus:border-emerald-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 p-1.5 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                  </form>

                </div>

              </div>

            </div>
          )}

          {/* ================= TAB 2: AI MUSIC COACH PANEL (GEMINI INTEGRATION) ================= */}
          {activeTab === "ai-coach" && (
            <div className="flex flex-col gap-8">
              
              {/* Introduction Banner */}
              <div className="bg-gradient-to-r from-emerald-950/20 to-teal-950/20 border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 filter blur-3xl rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
                      INTEGRADO COM GEMINI AI
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white">
                    UP Music Intelligence Coach
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                    Sua trilha sonora fitness não deve ser aleatória. Nossa IA analisa a neurobiologia do ritmo e a fisiologia esportiva para recomendar as frequências e batidas ideais que mantêm seus músculos oxigenados e o foco mental no pico absoluto de esforço.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-3 rounded-xl shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block font-mono">STATUS DA INTELIGÊNCIA</span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5 justify-end">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      V3.5 FLASH COCH
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid content: Custom Recommendation Form & Motivation Board */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Custom Request parameters (5 columns) */}
                <div className="lg:col-span-5 bg-[#121214] border border-[#27272a] rounded-2xl p-6 flex flex-col gap-5">
                  <h4 className="font-display font-semibold text-white text-base">
                    Monte sua Estrutura de Treino
                  </h4>

                  <div className="flex flex-col gap-4">
                    
                    {/* Workout Type */}
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1.5">TIPO DE TREINO (MUSCULAÇÃO)</label>
                      <select
                        value={workoutType}
                        onChange={(e) => setWorkoutType(e.target.value)}
                        className="w-full bg-[#18181b] border border-zinc-800 text-xs px-3 py-2.5 rounded-xl text-zinc-200 focus:border-emerald-500 outline-none"
                      >
                        <option value="Musculação - Força Bruta">Musculação - Força Bruta (Cargas Pesadas)</option>
                        <option value="Musculação - Hipertrofia">Musculação - Hipertrofia (Volume & Pump)</option>
                        <option value="Musculação - Resistência">Musculação - Resistência Muscular Localizada</option>
                        <option value="Musculação - Superiores">Musculação - Peito, Costas & Braços</option>
                        <option value="Musculação - Inferiores">Musculação - Pernas & Glúteos</option>
                      </select>
                    </div>

                    {/* Intensity */}
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1.5">INTENSIDADE DO METABOLISMO</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Leve", "Moderada", "Alta"].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setIntensity(lvl)}
                            className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                              intensity === lvl
                                ? "bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/10"
                                : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Target BPM */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-mono text-zinc-400">PULSAÇÃO ALVO (BPM)</label>
                        <span className="font-mono text-xs text-emerald-400 font-bold">{targetBpm} BPM</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="180"
                        step="5"
                        value={targetBpm}
                        onChange={(e) => setTargetBpm(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Specific preferences */}
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1.5">PREFERÊNCIAS / ESTILO MUSICAL</label>
                      <input
                        type="text"
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                        placeholder="Ex: Rap dos anos 90, House progressivo, Rock clássico"
                        className="w-full bg-[#18181b] border border-zinc-800 text-xs px-3 py-2.5 rounded-xl text-zinc-200 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {/* Submit request button */}
                    <button
                      onClick={handleGetAISuggestions}
                      disabled={aiLoading}
                      className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Analisando Metabolismo AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-black" />
                          <span>Gerar Playlist Científica</span>
                        </>
                      )}
                    </button>

                  </div>
                </div>

                {/* Right Side: AI Generated suggestions (7 columns) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  
                  {/* Music Recommendations display */}
                  <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 flex flex-col gap-4">
                    <h4 className="font-display font-semibold text-white text-base">
                      Curadoria de Frequência Gerada
                    </h4>

                    {aiSuggestions.length === 0 ? (
                      <div className="py-20 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3">
                        <Music className="w-8 h-8 text-zinc-600" />
                        <p>Configure os parâmetros ao lado e clique em "Gerar Playlist Científica" para carregar a recomendação da IA.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {aiSuggestions.map((song, idx) => (
                          <div
                            key={idx}
                            className="bg-[#18181b] border border-zinc-800/60 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                                  {idx + 1}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors">
                                    {song.title}
                                  </h5>
                                  <p className="text-xs text-zinc-400">{song.artist}</p>
                                </div>
                              </div>

                              <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                                {song.bpm} BPM
                              </span>
                            </div>

                            <p className="text-xs text-zinc-300 bg-[#121214] p-2.5 rounded-lg border border-zinc-800/30 font-serif italic mt-1 leading-relaxed">
                              &ldquo;{song.reasoning}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Real-time Trainer Motivation Broadcast */}
                  <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-semibold text-white text-base">
                        Voz de Cabine - Motivação Personalizada dos Treinadores
                      </h4>
                      <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-xs text-zinc-400">
                      Gere falas motivadoras curtas e ouça a simulação da voz dos principais treinadores da UP Fitness sobrepondo seu treino em tempo real!
                    </p>

                    {/* Trainers Selection row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {[
                        { id: "leo", label: "Treinador Leo", role: "Hipertrofia", avatar: "🦾" },
                        { id: "igor", label: "Coach Igor", role: "Força Bruta", avatar: "💀" },
                        { id: "gabi", label: "Instrutora Gabi", role: "Resistência", avatar: "⚡" },
                        { id: "helena", label: "Treinadora Helena", role: "Biomecânica", avatar: "🏋️‍♀️" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setCoachTrainer(t.id);
                            handleGetTrainerMotivation(t.id);
                          }}
                          disabled={speechLoading}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                            coachTrainer === t.id
                              ? "bg-amber-500/10 border-amber-500 text-amber-400"
                              : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-lg">{t.avatar}</span>
                          <div>
                            <span className="text-xs font-bold block">{t.label}</span>
                            <span className="text-[9px] text-zinc-500 block">{t.role}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Display speech bubble */}
                    {speechLoading ? (
                      <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl text-center text-xs text-zinc-400 animate-pulse">
                        O {coachTrainer.toUpperCase()} está ajustando o microfone da cabine...
                      </div>
                    ) : aiSpeech ? (
                      <div className="p-4 bg-gradient-to-r from-zinc-900 to-[#18181b] border border-zinc-800 rounded-xl relative">
                        <span className="absolute -top-2 left-4 text-[9px] font-mono font-bold bg-amber-500 text-black px-1.5 py-0.2 rounded uppercase">
                          Chamada de Cabine UP Play
                        </span>
                        <p className="text-xs text-zinc-100 font-medium leading-relaxed italic mt-1 font-serif">
                          &ldquo;{aiSpeech}&rdquo;
                        </p>
                      </div>
                    ) : null}

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ================= TAB 3: METAS & DESAFIOS BPM ================= */}
          {activeTab === "challenges" && (
            <div className="flex flex-col gap-6">
              
              <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6">
                <h3 className="font-display font-bold text-lg text-white">
                  Desafios Semanais de Sincronia Rítmica
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                  Sincronize seu esforço com os limites corretos de BPM (batimentos por minuto) sugeridos por nossos profissionais. Acumule tempo de treino nas zonas corretas para destravar insígnias!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {challenges.map((c) => {
                    const percent = Math.min(100, (c.progressMinutes / c.targetMinutes) * 100);
                    return (
                      <div
                        key={c.id}
                        className={`bg-[#18181b] border rounded-2xl p-4.5 flex flex-col justify-between transition-all relative overflow-hidden ${
                          c.completed ? "border-emerald-500/20 bg-emerald-950/5" : "border-zinc-800"
                        }`}
                      >
                        {c.completed && (
                          <div className="absolute top-2 right-2 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase">
                            Completo
                          </div>
                        )}

                        <div>
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl mb-3">
                            {c.badgeIcon === "Flame" ? "🔥" : c.badgeIcon === "Dumbbell" ? "💪" : "🧘‍♀️"}
                          </div>

                          <h4 className="font-semibold text-sm text-white">{c.title}</h4>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{c.description}</p>

                          <div className="mt-2.5 flex items-center gap-1.5">
                            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded">
                              {c.bpmRange}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Meta: {c.targetMinutes} min
                            </span>
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                            <span>Progresso</span>
                            <span className="font-bold text-zinc-200">
                              {c.progressMinutes}/{c.targetMinutes} min ({Math.round(percent)}%)
                            </span>
                          </div>
                          <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insígnias e Prêmios Conquistados */}
              <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6">
                <h4 className="font-display font-semibold text-white text-base mb-4">
                  Suas Conquistas Coletadas (Badges)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "b1", title: "Heavy Lifter", icon: "💪", date: "Pendente", xp: "100 XP" },
                    { id: "b2", title: "Iron Master", icon: "🏋️‍♂️", date: "Conquistado em 08/07", xp: "250 XP" },
                    { id: "b3", title: "Supino de Ouro", icon: "🏆", date: "Pendente", xp: "150 XP" },
                    { id: "b4", title: "Resistência Máxima", icon: "🚀", date: "Conquistado em 03/07", xp: "500 XP" },
                  ].map((badge) => {
                    const isEarned = badge.date !== "Pendente";
                    return (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 ${
                          isEarned
                            ? "bg-[#18181b] border-emerald-500/20 text-white"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-600"
                        }`}
                      >
                        <span className={`text-3xl ${isEarned ? "" : "grayscale"}`}>{badge.icon}</span>
                        <div>
                          <span className="text-xs font-bold block">{badge.title}</span>
                          <span className="text-[9px] text-zinc-500 block mt-0.5">{badge.date}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${isEarned ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                          {badge.xp}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 4: LEADERBOARD ================= */}
          {activeTab === "leaderboard" && (
            <TopUpView
              userName={userName}
              students={students}
            />
          )}

          {/* ================= TAB 5: PAINEL DO GESTOR (STRICTLY GUARDED BY isGestor) ================= */}
          {activeTab.startsWith("gestor") && (
            isGestor(currentUser) ? (
              <>
                {(activeTab === "gestor" || activeTab === "gestor-dashboard") && (
                  <GestorDashboardView
                    setActiveTab={setActiveTab}
                    zones={zones}
                    students={students}
                    announcements={announcements}
                    logs={logs}
                    onRemoveLog={handleRemoveLog}
                    onClearLogs={handleClearLogs}
                  />
                )}

                {activeTab === "gestor-usuarios" && (
                  <GestorAlunosView
                    students={students}
                    setStudents={setStudents}
                    addLog={addLog}
                  />
                )}

                {activeTab === "gestor-anuncios" && (
                  <GestorAnunciosView
                    announcements={announcements}
                    setAnnouncements={setAnnouncements}
                    addLog={addLog}
                  />
                )}

                {activeTab === "gestor-bi" && (
                  <GestorBIView />
                )}

                {activeTab === "gestor-config" && (
                  <GestorConfigView
                    addLog={addLog}
                  />
                )}
              </>
            ) : (
              <div className="bg-[#121214] border border-rose-500/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8 shadow-2xl">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Acesso Restrito ao Gestor</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Seu perfil atual ({getProfileLabel(currentUser)}) não possui permissão para acessar o Painel Administrativo do UP Play. Esta área é restrita exclusivamente à gestão da academia.
                </p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Voltar para a Página Inicial
                </button>
              </div>
            )
          )}

          {/* ================= PERSISTENT GYM AUDIO ENGINE & GESTOR PLAYER (NEVER UNMOUNTED) ================= */}
          <div className={activeTab === "gestor-player" && isGestor(currentUser) ? "block" : "contents"}>
            <GestorPlayerView
              zones={zones}
              activeZoneId={activeZoneId}
              setActiveZoneId={setActiveZoneId}
              trackPool={trackPool}
              handleNextTrack={handleNextTrack}
              handlePrevTrack={handlePrevTrack}
              handleTogglePlayPause={() => {
                handleTogglePlayback(isPaused, true);
              }}
              handleRemoveFromQueue={handleRemoveFromQueue}
              handleAddToQueue={handleAddToQueue}
              isSynthPlaying={!isPaused}
              isPlaying={!isPaused}
              setIsPlaying={(p, manual) => handleTogglePlayback(p, manual)}
              addLog={addLog}
              isDocked={activeTab !== "gestor-player" || !isGestor(currentUser)}
              onExpandPlayer={() => setActiveTab("gestor-player")}
              canControl={isGestor(currentUser)}
              onSuppressUnavailableTrack={(song, reason) => {
                setTrackPool(prev => prev.filter(s => s.id !== song.id && (!song.youtubeId || s.youtubeId !== song.youtubeId)));
                setZones(prev => prev.map(z => ({
                  ...z,
                  queue: z.queue.filter(s => s.id !== song.id && (!song.youtubeId || s.youtubeId !== song.youtubeId))
                })));
              }}
            />
          </div>

        </div>

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (< md) */}
      <nav id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#121214]/95 backdrop-blur-xl border-t border-[#27272a] px-2 py-1 flex items-center justify-around pb-safe px-safe">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] min-h-[46px] cursor-pointer active:scale-95 touch-manipulation ${
            activeTab === "home" ? "text-[#00ff66]" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Início</span>
        </button>

        <button
          onClick={() => setActiveTab("pedir-musica")}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] min-h-[46px] cursor-pointer active:scale-95 touch-manipulation ${
            activeTab === "pedir-musica" ? "text-[#00ff66]" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Plus className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Pedir</span>
        </button>

        <button
          onClick={() => setActiveTab("fila")}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] min-h-[46px] cursor-pointer active:scale-95 touch-manipulation ${
            activeTab === "fila" ? "text-[#00ff66]" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Vote className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Fila</span>
        </button>

        <button
          onClick={() => setActiveTab("top-up")}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] min-h-[46px] cursor-pointer active:scale-95 touch-manipulation ${
            activeTab === "top-up" ? "text-[#00ff66]" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5 text-amber-400" />
          <span className="text-[10px] font-medium leading-none">Ranking</span>
        </button>

        {isGestor(currentUser) ? (
          <button
            onClick={() => { setActiveTab("gestor-dashboard"); fetchAdminMetrics(); }}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] min-h-[46px] cursor-pointer active:scale-95 touch-manipulation ${
              activeTab.startsWith("gestor") ? "text-[#00ff66]" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sliders className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">Gestor</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab("perfil")}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] min-h-[46px] cursor-pointer active:scale-95 touch-manipulation ${
              activeTab === "perfil" ? "text-[#00ff66]" : "text-zinc-400 hover:text-white"
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">Perfil</span>
          </button>
        )}
      </nav>

        </div>
      )}
    </AnimatePresence>
  );
}
