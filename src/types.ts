export interface Song {
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
  youtubeId?: string;
  // Enriched catalog metadata
  language?: string;
  year?: number;
  tags?: string[];
  thumbnail?: string;
  requestCount?: number;
  likes?: number;
  aiModerationLevel?: string; // "Aprovado Total", "Livre", "Seguro"
  lastPlayedAt?: number; // timestamp in ms
  lastVotedAt?: number; // timestamp in ms
  smartScore?: number; // calculated queue intelligence score
}

export interface Dedication {
  id: string;
  userName: string;
  text: string;
  targetUser?: string;
  songTitle?: string;
  timestamp: string;
}

export interface GymZone {
  id: string;
  name: string;
  icon: string;
  color: string;
  currentSong: Song | null;
  currentProgress: number; // in seconds
  isPlaying: boolean; // Authoritative playback state defined by Gestor
  playbackTimestamp?: number; // timestamp in ms when state/progress was updated
  version?: number; // state revision number
  bpmMultiplier: number;
  powerModeActive: boolean;
  powerModeTimeLeft: number;
  queue: Song[];
  history: Song[];
  messages: Dedication[];
}

export interface AISuggestion {
  title: string;
  artist: string;
  bpm: number;
  genre: string;
  reasoning: string;
}

export interface BPMChallenge {
  id: string;
  title: string;
  description: string;
  bpmRange: string;
  targetMinutes: number;
  progressMinutes: number;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  avatarGradient: string;
  tag: string;
  workoutsCompleted: number;
}

// User Profiles and Centralized RBAC Security Matrix
export type UserRole = "GESTOR" | "PROFESSOR" | "ALUNO" | "PLAYER";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  matricula: string;
  cpf: string;
  photo?: string;
  role: "gestor" | "professor" | "aluno" | "player";
  perfil: UserRole;
  age?: number;
  birthdate?: string;
  token?: string;
}

export function normalizePerfil(perfil?: string, role?: string): UserRole {
  const p = (perfil || role || "").trim().toUpperCase();
  if (p === "GESTOR" || p === "ADMIN" || p === "ADMINISTRADOR") return "GESTOR";
  if (p === "PROFESSOR" || p === "INSTRUTOR" || p === "COACH") return "PROFESSOR";
  if (p === "PLAYER" || p === "TV") return "PLAYER";
  return "ALUNO";
}

export function isGestor(user?: { role?: string; perfil?: string } | null): boolean {
  if (!user) return false;
  return normalizePerfil(user.perfil, user.role) === "GESTOR";
}

export function isProfessor(user?: { role?: string; perfil?: string } | null): boolean {
  if (!user) return false;
  return normalizePerfil(user.perfil, user.role) === "PROFESSOR";
}

export function isAluno(user?: { role?: string; perfil?: string } | null): boolean {
  if (!user) return false;
  return normalizePerfil(user.perfil, user.role) === "ALUNO";
}

export function isPlayer(user?: { role?: string; perfil?: string } | null): boolean {
  if (!user) return false;
  return normalizePerfil(user.perfil, user.role) === "PLAYER";
}

export function canAccessGestorPanel(user?: { role?: string; perfil?: string } | null): boolean {
  return isGestor(user);
}

export function getProfileLabel(user?: { role?: string; perfil?: string } | null): string {
  if (!user) return "Visitante";
  const perfil = normalizePerfil(user.perfil, user.role);
  switch (perfil) {
    case "GESTOR":
      return "👨‍💼 Gestor";
    case "PROFESSOR":
      return "🏋️‍♂️ Professor";
    case "PLAYER":
      return "📺 Player / TV";
    case "ALUNO":
    default:
      return "🏃 Aluno";
  }
}

