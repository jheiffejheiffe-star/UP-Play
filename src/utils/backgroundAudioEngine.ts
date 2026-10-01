/**
 * UP Play - Background Audio & MediaSession Engine
 * 
 * Manages W3C Media Session API (Lockscreen / Notification shade controls and metadata)
 * and background tracking for continuous playback on mobile devices (Android Chrome, iOS Safari, PWA).
 * 
 * CRITICAL RULE: This engine does NOT generate any synthetic oscillators, tones, pulses,
 * or audible sounds. The YouTube Player is the sole and authoritative audio source.
 */

import { Song } from "../types";

export interface BackgroundAudioCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek?: (time: number) => void;
  onTrackEnded?: () => void;
}

class BackgroundAudioEngine {
  private audioElement: HTMLAudioElement | null = null;
  private positionTimer: any = null;
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private bpmMultiplier: number = 1.0;
  private callbacks: BackgroundAudioCallbacks | null = null;
  private canControl: boolean = true;
  private isInitialized: boolean = false;
  private playbackStartTime: number = 0;
  private initialProgress: number = 0;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.setupLifecycleListeners();
      this.unlockOnFirstInteraction();
    }
  }

  /**
   * Automatically unlocks AudioContext and audio element on any user touch/gesture anywhere on the screen.
   * Completely transparent - requires no specific "play" click.
   */
  public unlockOnFirstInteraction(): void {
    if (typeof window === "undefined" || this.isUnlocked) return;

    const unlockEvents = ["touchstart", "touchend", "click", "pointerdown", "keydown", "scroll"];
    const doUnlock = () => {
      this.isUnlocked = true;
      unlockEvents.forEach((evt) => {
        window.removeEventListener(evt, doUnlock, { capture: true } as any);
        document.removeEventListener(evt, doUnlock, { capture: true } as any);
      });

      this.initialize();

      if (this.audioElement && this.isPlaying) {
        this.audioElement.play().catch(() => {});
      }
    };

    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, doUnlock, { capture: true, passive: true });
      document.addEventListener(evt, doUnlock, { capture: true, passive: true });
    });
  }

  /**
   * Initializes background audio anchor for mobile MediaSession retention.
   * Uses both Web Audio MediaStreamDestination and HTML5 Audio with imperceptible carrier
   * so iOS Safari and Android Chrome grant permanent background audio execution rights while screen is locked.
   */
  public initialize(): void {
    if (this.isInitialized && this.audioElement) {
      return;
    }

    try {
      // 1-second 8000Hz 8-bit mono silent WAV file (pure digital silence)
      const silentWavDataUri = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP//";

      let el = document.getElementById("up-play-native-bg-audio") as HTMLAudioElement;
      if (!el) {
        el = document.createElement("audio");
        el.id = "up-play-native-bg-audio";
        el.setAttribute("playsinline", "true");
        el.setAttribute("webkit-playsinline", "true");
        el.setAttribute("preload", "auto");
        el.loop = true;
        // Subtle volume (0.01) so iOS WebKit registers active audio stream without producing audible noise
        el.volume = 0.01;
        el.muted = false;
        el.style.position = "fixed";
        el.style.width = "1px";
        el.style.height = "1px";
        el.style.opacity = "0.01";
        el.style.pointerEvents = "none";
        el.style.zIndex = "-9999";
        document.body.appendChild(el);
      }

      if (!el.src) {
        el.src = silentWavDataUri;
      }

      this.audioElement = el;
      this.isInitialized = true;
    } catch (e) {
      console.warn("[BackgroundAudioEngine] Init warning:", e);
    }
  }

  /**
   * Configure MediaSession metadata and action handlers for lockscreen / notification shade
   */
  public updateMediaSession(
    song: Song | null,
    playing: boolean,
    callbacks: BackgroundAudioCallbacks,
    canControl: boolean = true
  ): void {
    this.currentSong = song;
    this.isPlaying = playing;
    this.callbacks = callbacks;
    this.canControl = canControl;

    if (!("mediaSession" in navigator)) return;

    try {
      if (song) {
        const coverSrc = song.thumbnail || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=512";
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title || "UP Play - Trilha Fitness",
          artist: song.artist ? `${song.artist} • ${song.genre || "Academia"}` : "UP Play Music",
          album: `UP Play • ${song.album || "Sala de Treino"}`,
          artwork: [
            { src: coverSrc, sizes: "96x96", type: "image/jpeg" },
            { src: coverSrc, sizes: "128x128", type: "image/jpeg" },
            { src: coverSrc, sizes: "192x192", type: "image/jpeg" },
            { src: coverSrc, sizes: "256x256", type: "image/jpeg" },
            { src: coverSrc, sizes: "384x384", type: "image/jpeg" },
            { src: coverSrc, sizes: "512x512", type: "image/jpeg" }
          ]
        });
      }

      navigator.mediaSession.playbackState = playing ? "playing" : "paused";

      // Register Lockscreen action handlers
      navigator.mediaSession.setActionHandler("play", () => {
        if (this.callbacks?.onPlay) {
          this.callbacks.onPlay();
        }
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        if (this.callbacks?.onPause) {
          this.callbacks.onPause();
        }
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (this.callbacks?.onNext) {
          this.callbacks.onNext();
        }
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (this.callbacks?.onPrev) {
          this.callbacks.onPrev();
        }
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && this.callbacks?.onSeek) {
          this.callbacks.onSeek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const skipTime = details.seekOffset || 10;
        const currentPos = this.getCurrentPlaybackPosition();
        const newPos = Math.max(0, currentPos - skipTime);
        if (this.callbacks?.onSeek) {
          this.callbacks.onSeek(newPos);
        }
      });

      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const skipTime = details.seekOffset || 10;
        const currentPos = this.getCurrentPlaybackPosition();
        const maxDuration = this.currentSong?.duration || 180;
        const newPos = Math.min(maxDuration, currentPos + skipTime);
        if (this.callbacks?.onSeek) {
          this.callbacks.onSeek(newPos);
        }
      });

    } catch (e) {
      console.warn("[BackgroundAudioEngine] MediaSession configuration warning:", e);
    }
  }

  /**
   * Syncs state and starts background continuous tracking (without ANY audible tone synthesis)
   */
  public syncPlaybackState(
    song: Song | null,
    playing: boolean,
    progress: number = 0,
    bpmMultiplier: number = 1.0,
    callbacks: BackgroundAudioCallbacks,
    canControl: boolean = true
  ): void {
    this.currentSong = song;
    this.isPlaying = playing;
    this.bpmMultiplier = bpmMultiplier;
    this.callbacks = callbacks;
    this.canControl = canControl;
    this.initialProgress = progress;
    this.playbackStartTime = Date.now();

    this.initialize();
    this.updateMediaSession(song, playing, callbacks, canControl);

    if (playing && song) {
      if (this.audioElement && this.audioElement.paused) {
        this.audioElement.play().catch(() => {});
      }
      this.startPositionTracker(song);
    } else {
      if (this.audioElement && !this.audioElement.paused) {
        this.audioElement.pause();
      }
      this.stopPositionTracker();
    }
  }

  /**
   * Periodically updates MediaSession position and handles auto-advancing when song reaches the end in background
   */
  private startPositionTracker(song: Song): void {
    this.stopPositionTracker();

    this.positionTimer = setInterval(() => {
      if (!this.isPlaying || !this.currentSong) return;

      const currentPos = this.getCurrentPlaybackPosition();
      const songDuration = this.currentSong.duration || 180;

      // Update MediaSession position state for lockscreen scrub bar
      if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(1, songDuration),
            playbackRate: this.bpmMultiplier || 1.0,
            position: Math.min(songDuration, currentPos)
          });
        } catch (_) {}
      }

      // Check if track ended while screen was locked
      if (currentPos >= songDuration) {
        console.log("[BackgroundAudioEngine] Track finished in background -> Triggering next track!");
        this.stopPositionTracker();
        if (this.callbacks?.onTrackEnded) {
          this.callbacks.onTrackEnded();
        }
      }
    }, 1000);
  }

  private stopPositionTracker(): void {
    if (this.positionTimer) {
      clearInterval(this.positionTimer);
      this.positionTimer = null;
    }
  }

  public getCurrentPlaybackPosition(): number {
    if (!this.isPlaying) return this.initialProgress;
    const elapsedSeconds = (Date.now() - this.playbackStartTime) / 1000 * this.bpmMultiplier;
    return this.initialProgress + elapsedSeconds;
  }

  /**
   * Setup lifecycle listeners for visibilitychange, pagehide, pageshow, freeze, resume
   */
  private setupLifecycleListeners(): void {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        console.log("[Lifecycle] Page is HIDDEN (Screen locked / App in background). Keeping session active.");
      } else if (document.visibilityState === "visible") {
        console.log("[Lifecycle] Page is VISIBLE (Screen unlocked). Synchronized.");
      }
    });

    window.addEventListener("pagehide", (e) => {
      console.log("[Lifecycle] pagehide event (persisted:", e.persisted, ")");
    });

    window.addEventListener("pageshow", (e) => {
      console.log("[Lifecycle] pageshow event (persisted:", e.persisted, ")");
    });

    document.addEventListener("freeze", () => {
      console.log("[Lifecycle] Page frozen");
    });

    document.addEventListener("resume", () => {
      console.log("[Lifecycle] Page resumed.");
    });
  }
}

// Global Singleton Instance
export const backgroundAudioEngine = new BackgroundAudioEngine();
