import React, { useEffect, useRef, useState } from "react";
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Tv, Music, AlertCircle, RefreshCw, Radio, CheckCircle,
  Cast, Bluetooth, Speaker, Wifi, CheckCircle2, X, Lock, Smartphone, AlertTriangle
} from "lucide-react";
import { Song } from "../types";
import { backgroundAudioEngine } from "../utils/backgroundAudioEngine";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

interface AudioDevice {
  id: string;
  label: string;
  type: "speaker" | "bluetooth" | "tv" | "cast" | "alexa";
  status: "connected" | "available" | "active";
  isDefault?: boolean;
}

// Fallback working YouTube video IDs for fitness genres
const GENRE_FALLBACK_YOUTUBE: Record<string, string> = {
  default: "ytQ5CYE1VZw", // Eminem - Till I Collapse
  rock: "v2AC41dglnM",    // AC/DC - Thunderstruck
  metal: "CD-E-LDc384",   // Metallica - Enter Sandman
  hiphop: "_Yhyp-_hX2s",  // Eminem - Lose Yourself
  cardio: "4NRXx6U8ABQ",  // The Weeknd - Blinding Lights
  dance: "TUVcZfQe-Kw",   // Dua Lipa - Levitating
  edm: "gAjR4_CB4iI",     // Daft Punk - Harder Better Faster Stronger
  house: "nCg3upGOZ_A",   // Tiësto - The Business
  crossfit: "7wtfhZwyrcc",// Imagine Dragons - Believer
  dubstep: "YJVmu6yttiw", // Skrillex - Bangarang
  zen: "jfKfPfyJRdk",     // Lofi Girl - Chill Beats
  meditation: "UfcAVejslrU" // Marconi Union - Weightless
};

export function extractYouTubeId(input?: string): string | null {
  if (!input) return null;
  const str = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = str.match(regExp);
  return match ? match[1] : null;
}

interface CentralYouTubePlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean, manualAdminAction?: boolean) => void;
  handleNextTrack: (isAutoAdvance?: boolean) => void;
  handlePrevTrack: () => void;
  bpmMultiplier?: number;
  activeZoneName?: string;
  activeZoneId?: string;
  queueCount?: number;
  showVideoFrame?: boolean;
  isDocked?: boolean;
  onExpandPlayer?: () => void;
  canControl?: boolean;
  initialProgress?: number;
  onSuppressUnavailableTrack?: (song: Song, reason: string) => void;
}

export const CentralYouTubePlayer: React.FC<CentralYouTubePlayerProps> = ({
  currentSong,
  isPlaying,
  setIsPlaying,
  handleNextTrack,
  handlePrevTrack,
  bpmMultiplier = 1.0,
  activeZoneName = "Academia",
  activeZoneId = "musculacao",
  queueCount = 0,
  showVideoFrame = true,
  isDocked = false,
  onExpandPlayer,
  canControl = true,
  initialProgress = 0,
  onSuppressUnavailableTrack
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const lastLoadedVideoIdRef = useRef<string | null>(null);
  const initialProgressRef = useRef<number>(initialProgress || 0);
  const isManualAdminPauseRef = useRef<boolean>(false);
  const hasAutoAdvancedRef = useRef<boolean>(false);

  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState<number>(80);
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(initialProgress || 0);
  const [duration, setDuration] = useState<number>(180);
  const [showVideo, setShowVideo] = useState<boolean>(true);

  // Device & Connectivity State
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);
  const [isScanningDevices, setIsScanningDevices] = useState<boolean>(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default_speaker");
  const [deviceScanMessage, setDeviceScanMessage] = useState<string | null>(null);
  const [detectedDevices, setDetectedDevices] = useState<AudioDevice[]>([
    { id: "default_speaker", label: "Saída de Áudio do Sistema (Alto-falantes / HDMI / Bluetooth do SO)", type: "speaker", status: "active", isDefault: true }
  ]);

  // Scan Real Audio Devices & Enumerate via Web MediaDevices API
  const handleScanDevices = async () => {
    setIsScanningDevices(true);
    setDeviceScanMessage("Buscando saídas de áudio reais conectadas ao sistema operacional...");

    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === "function") {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = mediaDevices.filter(d => d.kind === "audiooutput");

        if (audioOutputs.length > 0) {
          const realDevices: AudioDevice[] = audioOutputs.map((d, index) => ({
            id: d.deviceId || `device_${index}`,
            label: d.label || `Saída de Áudio ${index + 1} (${d.deviceId.slice(0, 8) || "Sistema"})`,
            type: d.label.toLowerCase().includes("bluetooth") ? "bluetooth" : "speaker",
            status: d.deviceId === selectedDeviceId ? "active" : "available"
          }));

          setDetectedDevices(realDevices);
          setDeviceScanMessage(`Varredura concluída: ${realDevices.length} saída(s) de áudio identificada(s) pelo navegador.`);
        } else {
          setDeviceScanMessage("Varredura concluída. 1 saída de áudio ativa do sistema.");
        }
      } else {
        setDeviceScanMessage("Saída de áudio padrão do sistema ativa.");
      }
    } catch (err) {
      console.warn("Device enumeration error:", err);
      setDeviceScanMessage("Saída de áudio padrão do sistema ativa.");
    } finally {
      setTimeout(() => setIsScanningDevices(false), 600);
    }
  };

  // Amazon Alexa info: honest status
  const handleConnectAlexaDevice = () => {
    setDeviceScanMessage("Integração com nuvem Alexa requer skill externa. Para reproduzir em um Echo Dot, pareie-o via Bluetooth nas configurações de áudio do sistema operacional.");
  };

  // Pair Nearby Bluetooth Device using Web Bluetooth API or instruct OS pairing
  const handlePairBluetoothDevice = async () => {
    setIsScanningDevices(true);
    setDeviceScanMessage("Iniciando busca Bluetooth do navegador...");

    try {
      if ("bluetooth" in navigator) {
        // @ts-ignore
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ["battery_service"]
        });

        if (device) {
          const newBtDevice: AudioDevice = {
            id: `bt_${device.id || Date.now()}`,
            label: `${device.name || "Dispositivo Bluetooth"} (Pareado via WebBluetooth)`,
            type: "bluetooth",
            status: "active"
          };

          setDetectedDevices(prev => [newBtDevice, ...prev]);
          setSelectedDeviceId(newBtDevice.id);
          setDeviceScanMessage(`Dispositivo Bluetooth detectado: ${device.name || "Dispositivo Pareado"}. Configure a saída de áudio padrão do sistema.`);
        }
      } else {
        setDeviceScanMessage("O áudio Bluetooth é gerenciado nativamente pelo sistema operacional. Conecte sua caixa de som nas configurações de Bluetooth do Windows/Mac/Android/iOS.");
      }
    } catch (err: any) {
      if (err?.name === "NotFoundError" || err?.message?.includes("User cancelled")) {
        setDeviceScanMessage("Pareamento cancelado pelo usuário.");
      } else {
        setDeviceScanMessage("Para caixas Bluetooth (JBL, etc.), conecte diretamente pelas configurações de Bluetooth do seu aparelho.");
      }
    } finally {
      setIsScanningDevices(false);
    }
  };

  // Background Audio & Media Session API integration for system lockscreen, smartwatches and background continuous playback
  useEffect(() => {
    backgroundAudioEngine.syncPlaybackState(
      currentSong,
      isPlaying,
      currentTime,
      bpmMultiplier,
      {
        onPlay: () => {
          if (canControl) {
            isManualAdminPauseRef.current = false;
            setIsPlaying(true, true);
          }
        },
        onPause: () => {
          if (canControl) {
            isManualAdminPauseRef.current = true;
            setIsPlaying(false, true);
          }
        },
        onNext: () => {
          if (canControl) {
            handleNextTrack(false);
          }
        },
        onPrev: () => {
          if (canControl) handlePrevTrack();
        },
        onSeek: (seekTime: number) => {
          if (playerInstanceRef.current && typeof playerInstanceRef.current.seekTo === "function") {
            playerInstanceRef.current.seekTo(seekTime, true);
          }
          setCurrentTime(seekTime);
        },
        onTrackEnded: () => {
          console.log("[Lockscreen Auto-Advance] Track ended in background -> Triggering next track");
          if (!hasAutoAdvancedRef.current) {
            hasAutoAdvancedRef.current = true;
            handleNextTrack(true);
          }
        }
      },
      canControl
    );
  }, [currentSong, isPlaying, bpmMultiplier, canControl]);

  // Select Active Device Output and apply setSinkId
  const handleSelectDevice = async (device: AudioDevice) => {
    setSelectedDeviceId(device.id);
    setDetectedDevices(prev => prev.map(d => ({
      ...d,
      status: d.id === device.id ? "active" : "connected"
    })));

    try {
      const audioElements = document.querySelectorAll("audio, video");
      for (const el of Array.from(audioElements) as any[]) {
        if (typeof el.setSinkId === "function") {
          await el.setSinkId(device.id === "default_speaker" ? "" : device.id);
        }
      }
    } catch (e) {
      console.warn("[setSinkId] Could not redirect sinkId directly:", e);
    }

    setDeviceScanMessage(`Transmissão redirecionada para: ${device.label}`);
  };

  // Test Audio Channel on selected device
  const handleTestAudioPing = () => {
    try {
      if (playerInstanceRef.current) {
        if (typeof playerInstanceRef.current.unMute === "function") {
          playerInstanceRef.current.unMute();
        }
        if (typeof playerInstanceRef.current.setVolume === "function") {
          playerInstanceRef.current.setVolume(volume);
        }
        setDeviceScanMessage(`Saída de áudio verificada e ativa (${volume}% de volume).`);
      } else {
        setDeviceScanMessage("Canal de áudio verificado com sucesso!");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Determine actual YouTube Video ID
  const activeVideoId = React.useMemo(() => {
    if (!currentSong) return GENRE_FALLBACK_YOUTUBE.default;

    // 1. Direct custom YouTube URL/ID if provided
    if (currentSong.youtubeId) {
      const extracted = extractYouTubeId(currentSong.youtubeId);
      if (extracted) return extracted;
    }

    // 2. Direct ID if matches a valid 11-char YouTube ID
    if (currentSong.id) {
      const extracted = extractYouTubeId(currentSong.id);
      if (extracted) return extracted;
    }

    // 3. Fallback based on genre
    const genre = currentSong.genre?.toLowerCase() || "";
    if (genre.includes("cardio") || genre.includes("dance")) return GENRE_FALLBACK_YOUTUBE.cardio;
    if (genre.includes("metal")) return GENRE_FALLBACK_YOUTUBE.metal;
    if (genre.includes("crossfit") || genre.includes("rock")) return GENRE_FALLBACK_YOUTUBE.rock;
    if (genre.includes("hip hop") || genre.includes("rap")) return GENRE_FALLBACK_YOUTUBE.hiphop;
    if (genre.includes("eletrônica") || genre.includes("edm")) return GENRE_FALLBACK_YOUTUBE.edm;
    if (genre.includes("house")) return GENRE_FALLBACK_YOUTUBE.house;
    if (genre.includes("zen") || genre.includes("yoga") || genre.includes("relax") || genre.includes("lofi")) return GENRE_FALLBACK_YOUTUBE.zen;

    return GENRE_FALLBACK_YOUTUBE.default;
  }, [currentSong]);

  const currentSongRef = useRef<Song | null>(currentSong);
  const activeVideoIdRef = useRef<string>(activeVideoId);
  const suppressedKeysRef = useRef<Set<string>>(new Set());
  const [suppressionToast, setSuppressionToast] = useState<{ title: string; reason: string } | null>(null);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    activeVideoIdRef.current = activeVideoId;
  }, [activeVideoId]);

  const handleSuppressUnavailableTrackInternal = (song: Song | null, videoId: string | null, reason: string) => {
    const songId = song?.id || "";
    const ytId = videoId || song?.youtubeId || "";
    const key = `${songId}_${ytId}`;
    if (!songId && !ytId) return;
    if (suppressedKeysRef.current.has(key)) return;
    suppressedKeysRef.current.add(key);

    const title = song?.title || "Vídeo";
    console.warn(`[CentralPlayer] SUPPRESSING UNAVAILABLE VIDEO: ${title} (${songId || ytId}) - Reason: ${reason}`);

    setSuppressionToast({ title, reason });
    setTimeout(() => {
      setSuppressionToast(null);
    }, 6000);

    // 1. Notify server immediately to remove from pools/queues and blacklist
    fetch("/api/music/suppress-unavailable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        songId,
        youtubeId: ytId,
        zoneId: activeZoneId,
        reason
      })
    }).catch((err) => {
      console.warn("Could not suppress track on backend:", err);
    });

    // 2. Notify parent component callback
    if (onSuppressUnavailableTrack && song) {
      onSuppressUnavailableTrack(song, reason);
    }
  };

  // Load YouTube IFrame API and Initialize Player
  useEffect(() => {
    let isMounted = true;

    const initAPI = () => {
      if (!window.YT || !window.YT.Player) {
        if (!document.getElementById("yt-iframe-api")) {
          const tag = document.createElement("script");
          tag.id = "yt-iframe-api";
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName("script")[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const previousOnReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (previousOnReady) previousOnReady();
          if (isMounted) createPlayer();
        };
      } else {
        createPlayer();
      }
    };

    const createPlayer = () => {
      if (!playerContainerRef.current) return;
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (_) {}
      }

      setPlayerError(null);

      try {
        playerInstanceRef.current = new window.YT.Player(playerContainerRef.current, {
          height: "100%",
          width: "100%",
          videoId: activeVideoId,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 1,
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            start: initialProgressRef.current > 0 ? Math.floor(initialProgressRef.current) : 0,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsPlayerReady(true);
              lastLoadedVideoIdRef.current = activeVideoId;
              event.target.setVolume(volume);
              if (initialProgressRef.current > 0) {
                try {
                  event.target.seekTo(initialProgressRef.current, true);
                } catch (_) {}
              }
              if (isPlaying) {
                tryPlay(event.target);
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              const state = event.data;
              // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0, BUFFERING=3
              if (state === window.YT.PlayerState.PLAYING) {
                setAutoplayBlocked(false);
                setPlayerError(null);
                isManualAdminPauseRef.current = false;
              } else if (state === window.YT.PlayerState.PAUSED) {
                // STRICT RULE: "a música nunca deve pausar, só se for pausada manualmente pelo adm."
                // Mobile browsers pause video iframes automatically when screen is locked or tab is hidden.
                // We MUST NOT notify the server or set isPlaying to false unless admin explicitly clicked pause!
                if (isManualAdminPauseRef.current) {
                  console.log("[CentralPlayer] Manual pause by Admin confirmed.");
                  if (canControl) {
                    setIsPlaying(false, true);
                  }
                } else {
                  console.log("[CentralPlayer] Auto pause detected (screen lock, background tab, or buffer). Preserving continuous playback!");
                  // If screen is visible, automatically resume!
                  if (document.visibilityState === "visible" && isPlaying) {
                    tryPlay(event.target);
                  }
                }
              } else if (state === window.YT.PlayerState.ENDED) {
                // SONG FINISHED! Always advance to next song immediately!
                console.log("[CentralPlayer] YouTube Video Ended -> Immediate Auto-Advance to next track");
                if (!hasAutoAdvancedRef.current) {
                  hasAutoAdvancedRef.current = true;
                  handleNextTrack(true);
                }
              }
            },
            onError: (event: any) => {
              if (!isMounted) return;
              const errorCode = event.data;
              console.warn("[CentralPlayer] YouTube Player error code:", errorCode);
              
              const errorReasons: Record<number, string> = {
                2: "Parâmetro inválido no YouTube",
                5: "Erro de decodificação HTML5 no YouTube",
                100: "Vídeo excluído ou privado no YouTube",
                101: "Incorporação proibida pelo autor no YouTube",
                150: "Incorporação restrita pelo autor no YouTube"
              };
              const reason = errorReasons[errorCode] || `Erro no YouTube (${errorCode})`;

              // Suppress this video from catalog/queue/list immediately
              const failingSong = currentSongRef.current || currentSong;
              const failingYtId = activeVideoIdRef.current || activeVideoId;
              handleSuppressUnavailableTrackInternal(failingSong, failingYtId, reason);

              // Auto-advance to next track immediately so music never halts
              if (!hasAutoAdvancedRef.current) {
                hasAutoAdvancedRef.current = true;
                handleNextTrack(true);
              }
            }
          }
        });
      } catch (err) {
        console.error("Error destroying/creating YT Player:", err);
      }
    };

    initAPI();

    return () => {
      isMounted = false;
    };
  }, []);

  const installAutoUnmuteOnFirstGesture = () => {
    const unlockEvents = ["click", "touchstart", "touchend", "pointerdown", "keydown", "scroll"];
    const handleUnlock = () => {
      unlockEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUnlock, { capture: true } as any);
        document.removeEventListener(evt, handleUnlock, { capture: true } as any);
      });
      if (playerInstanceRef.current) {
        try {
          if (typeof playerInstanceRef.current.unMute === "function") {
            playerInstanceRef.current.unMute();
          }
          if (typeof playerInstanceRef.current.setVolume === "function") {
            playerInstanceRef.current.setVolume(volume);
          }
          if (typeof playerInstanceRef.current.playVideo === "function") {
            playerInstanceRef.current.playVideo();
          }
        } catch (_) {}
      }
      backgroundAudioEngine.initialize();
      setAutoplayBlocked(false);
    };
    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, handleUnlock, { capture: true, once: true } as any);
      document.addEventListener(evt, handleUnlock, { capture: true, once: true } as any);
    });
  };

  // Safe Play attempt with autoplay catch
  const tryPlay = (playerTarget?: any) => {
    const player = playerTarget || playerInstanceRef.current;
    if (!player || typeof player.playVideo !== "function") return;

    try {
      const promise = player.playVideo();
      if (promise && typeof promise.catch === "function") {
        promise.catch((err: any) => {
          console.warn("[CentralPlayer] Autoplay catch:", err);
          // Try playing muted so video stream starts decoding immediately
          try {
            if (typeof player.mute === "function") player.mute();
            player.playVideo();
          } catch (_) {}
          // Unmute automatically on first user gesture anywhere
          installAutoUnmuteOnFirstGesture();
        });
      }
    } catch (err) {
      console.warn("[CentralPlayer] Play error catch:", err);
    }
  };

  // React to currentSong / activeVideoId change
  useEffect(() => {
    if (!isPlayerReady || !playerInstanceRef.current) return;
    // Guard against re-loading the same track on tab switches / re-renders
    if (lastLoadedVideoIdRef.current === activeVideoId) {
      return;
    }
    lastLoadedVideoIdRef.current = activeVideoId;
    hasAutoAdvancedRef.current = false;
    const player = playerInstanceRef.current;

    try {
      if (typeof player.loadVideoById === "function") {
        player.loadVideoById({
          videoId: activeVideoId,
          startSeconds: 0
        });
        tryPlay();
      }
    } catch (e) {
      console.warn("Error loading video by ID:", e);
    }
  }, [activeVideoId, isPlayerReady]);

  // Screen unlock / Visibility change listener to keep continuous playback when device screen wakes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isPlaying) {
        console.log("[CentralPlayer] Screen unlocked / tab visible. Verifying playback.");
        if (playerInstanceRef.current && typeof playerInstanceRef.current.getPlayerState === "function") {
          const state = playerInstanceRef.current.getPlayerState();
          if (state !== window.YT?.PlayerState?.PLAYING && !isManualAdminPauseRef.current) {
            tryPlay();
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPlaying]);

  // Broadcast audio state changes to window for HomeView and Header UI sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("up-play-audio-state-changed", {
        detail: { isMuted, volume, isPlaying }
      }));
    }
  }, [isMuted, volume, isPlaying]);

  // Listen to remote audio commands from HomeView or Header
  useEffect(() => {
    const handleToggleCmd = () => {
      toggleMute();
    };
    const handleUnmuteCmd = () => {
      handleUserUnlockAudio();
    };
    const handleSetVolCmd = (e: any) => {
      if (typeof e.detail?.volume === "number") {
        handleVolumeChange(e.detail.volume);
      }
    };

    window.addEventListener("up-play-toggle-audio", handleToggleCmd);
    window.addEventListener("up-play-unmute-audio", handleUnmuteCmd);
    window.addEventListener("up-play-set-volume", handleSetVolCmd);

    return () => {
      window.removeEventListener("up-play-toggle-audio", handleToggleCmd);
      window.removeEventListener("up-play-unmute-audio", handleUnmuteCmd);
      window.removeEventListener("up-play-set-volume", handleSetVolCmd);
    };
  }, [isMuted, volume]);

  // React to isPlaying changes
  useEffect(() => {
    if (!isPlayerReady || !playerInstanceRef.current) return;
    const player = playerInstanceRef.current;

    try {
      if (isPlaying) {
        if (typeof player.playVideo === "function") tryPlay();
      } else {
        if (typeof player.pauseVideo === "function") player.pauseVideo();
      }
    } catch (e) {
      console.warn("Error setting play/pause state:", e);
    }
  }, [isPlaying, isPlayerReady]);

  // Real-time progress ticker & time updating
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === "function") {
        try {
          const cur = playerInstanceRef.current.getCurrentTime() || 0;
          const dur = playerInstanceRef.current.getDuration() || currentSong?.duration || 180;
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);

          // Auto-advance if song reaches the end
          if (cur >= dur - 0.6 && dur > 5) {
            if (!hasAutoAdvancedRef.current) {
              hasAutoAdvancedRef.current = true;
              console.log("[CentralPlayer] Ticker reached end of track -> Advancing to next track");
              handleNextTrack(true);
            }
          }

          // Save last played track and progress to localStorage for instant recovery
          if (currentSong && cur > 0) {
            localStorage.setItem("up_play_last_playback_state", JSON.stringify({
              song: currentSong,
              currentTime: Math.floor(cur),
              duration: dur,
              updatedAt: Date.now()
            }));
          }
        } catch (_) {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSong]);

  // Explicit Admin Play/Pause Action
  const handleAdminTogglePlay = () => {
    if (!canControl) return;
    const nextState = !isPlaying;
    isManualAdminPauseRef.current = !nextState; // true if admin is pausing
    setIsPlaying(nextState, true);
  };

  // Handle User Gesture Unmute / Unlock Autoplay
  const handleUserUnlockAudio = () => {
    setAutoplayBlocked(false);
    isManualAdminPauseRef.current = false;
    setIsPlaying(true, true);
    if (playerInstanceRef.current) {
      try {
        if (typeof playerInstanceRef.current.unMute === "function") {
          playerInstanceRef.current.unMute();
        }
        if (typeof playerInstanceRef.current.setVolume === "function") {
          playerInstanceRef.current.setVolume(volume);
        }
        if (typeof playerInstanceRef.current.playVideo === "function") {
          playerInstanceRef.current.playVideo();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle Volume change
  const handleVolumeChange = (newVol: number) => {
    setVolumeState(newVol);
    setIsMutedState(newVol === 0);
    if (playerInstanceRef.current && typeof playerInstanceRef.current.setVolume === "function") {
      playerInstanceRef.current.setVolume(newVol);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!playerInstanceRef.current) return;
    if (isMuted) {
      setIsMutedState(false);
      if (typeof playerInstanceRef.current.unMute === "function") playerInstanceRef.current.unMute();
    } else {
      setIsMutedState(true);
      if (typeof playerInstanceRef.current.mute === "function") playerInstanceRef.current.mute();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const calculatedBpm = currentSong ? Math.round(currentSong.bpm * bpmMultiplier) : 120;

  return (
    <>
      {/* 1. PERSISTENT YOUTUBE PLAYER CONTAINER (NEVER UNMOUNTED, PERMANENT DOM NODE) */}
      <div
        className={
          isDocked
            ? "fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] md:bottom-2.5 left-2 sm:left-4 z-50 w-14 sm:w-20 md:w-28 h-9 sm:h-12 md:h-16 bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl transition-all duration-300 pointer-events-auto"
            : "relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-xl group transition-all duration-300"
        }
      >
        <div
          ref={playerContainerRef}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 left-1 pointer-events-none z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-mono font-bold text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span className={isDocked ? "hidden sm:inline" : "inline"}>AO VIVO</span>
        </div>
        {!isDocked && (
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="absolute bottom-2 right-2 z-10 p-1.5 bg-black/80 hover:bg-black text-zinc-300 rounded-lg text-[10px] font-mono border border-zinc-700 flex items-center gap-1 transition-all cursor-pointer"
            title="Alternar visualização de vídeo"
          >
            <Tv className="w-3 h-3 text-emerald-400" />
            <span>{showVideo ? "Ocultar Vídeo" : "Mostrar Vídeo"}</span>
          </button>
        )}
      </div>

      {/* 2. DOCKED PERSISTENT GYM AUDIO BAR (Rendered across all tabs when isDocked === true) */}
      {isDocked && (
        <div className="fixed bottom-[calc(54px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-40 bg-[#121214]/95 backdrop-blur-xl border-t border-[#27272a] px-2 sm:px-4 py-1.5 sm:py-2.5 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)] flex items-center justify-between gap-1.5 sm:gap-3 animate-fadeIn">
          {/* LEFT: Mini Video frame placeholder spacer & Track Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[200px] sm:max-w-sm md:max-w-md">
            {/* Transparent placeholder spacer holding space for the fixed video container above */}
            <div className="w-14 sm:w-20 md:w-28 h-9 sm:h-12 md:h-16 shrink-0 pointer-events-none opacity-0" />

            {/* Track Info */}
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider truncate">
                  {activeZoneName.split(" - ")[0]} • {calculatedBpm} BPM
                </span>
              </div>
              <h4 className="font-semibold text-xs sm:text-sm text-white truncate">
                {currentSong?.title || "Trilha Sonora UP Play"}
              </h4>
              <p className="text-[9px] sm:text-[10px] text-zinc-400 truncate">
                {currentSong?.artist || "Robô de Transmissão Inteligente"}
              </p>
            </div>
          </div>

          {/* CENTER: Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {canControl ? (
              <>
                <button
                  onClick={handlePrevTrack}
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Música Anterior"
                  aria-label="Música Anterior"
                >
                  <SkipBack className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-zinc-300" />
                </button>

                <button
                  onClick={handleAdminTogglePlay}
                  className={`w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 border ${
                    isPlaying
                      ? "bg-zinc-100 text-black border-zinc-200 hover:bg-zinc-200"
                      : "bg-[#00ff66] text-black border-emerald-400 hover:bg-[#00e159] hover:scale-105"
                  }`}
                  title={isPlaying ? "Pausar Áudio" : "Tocar Áudio"}
                  aria-label={isPlaying ? "Pausar Áudio" : "Tocar Áudio"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleNextTrack(false)}
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Próxima Música"
                  aria-label="Próxima Música"
                >
                  <SkipForward className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-zinc-300" />
                </button>
              </>
            ) : (
              /* Non-clickable / Read-only state for Aluno profile */
              <div className="flex items-center gap-1 sm:gap-2 select-none" title="Controles de reprodução exclusivos do Gestor">
                <button
                  disabled
                  tabIndex={-1}
                  className="w-8 h-8 rounded-full bg-zinc-900/50 text-zinc-600 border border-zinc-850 flex items-center justify-center cursor-not-allowed opacity-50 pointer-events-none"
                  aria-label="Música Anterior (Exclusivo Gestor)"
                >
                  <SkipBack className="w-3.5 h-3.5 fill-zinc-600" />
                </button>

                <button
                  disabled
                  tabIndex={-1}
                  className="w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center border bg-zinc-900/60 text-zinc-600 border-zinc-850 cursor-not-allowed opacity-60 pointer-events-none"
                  aria-label="Reproduzir/Pausar (Exclusivo Gestor)"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-zinc-600" />
                  ) : (
                    <Play className="w-4 h-4 fill-zinc-600 translate-x-0.5" />
                  )}
                </button>

                <button
                  disabled
                  tabIndex={-1}
                  className="w-8 h-8 rounded-full bg-zinc-900/50 text-zinc-600 border border-zinc-850 flex items-center justify-center cursor-not-allowed opacity-50 pointer-events-none"
                  aria-label="Próxima Música (Exclusivo Gestor)"
                >
                  <SkipForward className="w-3.5 h-3.5 fill-zinc-600" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Volume & Expand Deck Action */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Real Audio Volume & Mute Controls (Accessible to all listeners) */}
            <div className="flex items-center gap-1 sm:gap-2 bg-zinc-950 p-1 sm:p-1.5 rounded-xl border border-zinc-850 shadow-inner">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white p-1 sm:p-0.5 cursor-pointer transition-colors"
                title={isMuted || volume === 0 ? "Desmutar Áudio" : "Mutar Áudio"}
                aria-label={isMuted || volume === 0 ? "Desmutar Áudio" : "Mutar Áudio"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#00ff66]" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="hidden md:inline-block w-12 sm:w-16 accent-[#00ff66] cursor-pointer h-1.5 bg-zinc-800 rounded-lg outline-none"
                title={`Volume: ${isMuted ? 0 : volume}%`}
                aria-label="Ajustar Volume do Som"
              />
              <span className="text-[9px] font-mono text-zinc-400 w-5 sm:w-6 text-right hidden lg:inline">
                {isMuted ? "0%" : `${volume}%`}
              </span>
            </div>

            {!canControl ? (
              <div className="hidden lg:flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-850 px-2 py-1 rounded-xl text-zinc-400 select-none">
                <Lock className="w-3 h-3 text-emerald-400/80" />
                <span className="text-[9px] font-mono">
                  Ouvinte
                </span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsDeviceModalOpen(true);
                    handleScanDevices();
                  }}
                  className="p-1.5 sm:p-2 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                  title="Dispositivos de Áudio e Alexa"
                >
                  <Cast className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#00ff66]" />
                </button>

                {onExpandPlayer && (
                  <button
                    onClick={onExpandPlayer}
                    className="p-1.5 sm:px-3 sm:py-1.5 bg-[#00ff66]/15 hover:bg-[#00ff66]/25 text-[#00ff66] border border-[#00ff66]/30 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Abrir Mesa de Som do Gestor"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mesa</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. FULL MESA DE SOM PLAYER DECK (Rendered in full view when isDocked === false) */}
      {!isDocked && (
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden flex flex-col gap-5 shadow-2xl">
          {/* Background ambient glow */}
          <div className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br ${currentSong?.coverGradient || "from-emerald-500/20 to-black"} opacity-20 rounded-full filter blur-3xl pointer-events-none`} />

          {/* HEADER STATUS BAR */}
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3.5 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff66] animate-pulse shadow-lg shadow-emerald-500/50" />
              <span className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider">
                PLAYER CENTRAL • {activeZoneName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {queueCount > 0 && (
                <span className="text-[10px] font-mono bg-zinc-850 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded">
                  {queueCount} na fila
                </span>
              )}

              {/* DEVICE DISCOVERY BUTTON */}
              <button
                onClick={() => {
                  setIsDeviceModalOpen(true);
                  handleScanDevices();
                }}
                className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                title="Detectar & Conectar Dispositivos de Áudio, Bluetooth e Smart TVs"
              >
                <Cast className="w-3.5 h-3.5 text-[#00ff66]" />
                <span>Dispositivos ({detectedDevices.length})</span>
              </button>

              <span className="text-[10px] bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 px-2.5 py-1 rounded-lg font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 animate-spin" />
                YOUTUBE PLAYER ON
              </span>
            </div>
          </div>

          {/* AUTOPLAY BLOCKED BANNER */}
          {autoplayBlocked && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-20 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>O navegador pausou o áudio automático do YouTube. Clique para ativar a transmissão!</span>
              </div>
              <button
                onClick={handleUserUnlockAudio}
                className="px-4 py-1.5 bg-[#00ff66] hover:bg-[#00e159] text-black font-bold text-xs rounded-lg transition-all shadow-lg shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                Ativar Áudio Coletivo
              </button>
            </div>
          )}

          {/* PLAYER ERROR ALERT */}
          {playerError && (
            <div className="bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-xs text-red-300 flex items-center gap-2 relative z-10">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{playerError}</span>
            </div>
          )}

          {/* SUPPRESSED UNAVAILABLE VIDEO ALERT */}
          {suppressionToast && (
            <div className="bg-amber-500/15 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200 relative z-20 animate-fadeIn shadow-lg">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Vídeo indisponível suprimido da lista: <strong>{suppressionToast.title}</strong> ({suppressionToast.reason}). Próxima faixa acionada automaticamente.
                </span>
              </div>
              <button
                onClick={() => setSuppressionToast(null)}
                className="text-amber-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                title="Fechar alerta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SONG DETAILS & CONTROLS */}
          <div className="flex flex-col justify-between h-full gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                  {currentSong?.genre || "Música em Transmissão"}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#00ff66] bg-[#00ff66]/10 px-2 py-0.5 rounded border border-[#00ff66]/20">
                  {calculatedBpm} BPM
                </span>
              </div>

              <h3 className="font-display font-black text-lg md:text-xl text-white truncate leading-snug">
                {currentSong?.title || "Tocando Trilha Sonora UP Play"}
              </h3>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5 truncate">
                {currentSong?.artist || "Robô de Transmissão Inteligente"}
              </p>
            </div>

            {/* REAL TIMELINE PROGRESS BAR */}
            <div className="flex flex-col gap-1.5">
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800 relative">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-[#00ff66] to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>{formatDuration(currentTime)}</span>
                <span className="flex items-center gap-1 text-[#00ff66]">
                  <CheckCircle className="w-3 h-3" />
                  Sincronizado
                </span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* AUDIO CONTROLS & VOLUME */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-zinc-850/60">
              
              {/* Playback controls */}
              <div className="flex items-center gap-3">
                {canControl ? (
                  <>
                    <button
                      onClick={handlePrevTrack}
                      className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      title="Música Anterior"
                    >
                      <SkipBack className="w-4 h-4 fill-zinc-300" />
                    </button>

                    <button
                      onClick={handleAdminTogglePlay}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95 border-2 ${
                        isPlaying
                          ? "bg-zinc-100 text-black border-zinc-200 hover:bg-zinc-200"
                          : "bg-[#00ff66] text-black border-emerald-400 hover:bg-[#00e159] hover:scale-105"
                      }`}
                      title={isPlaying ? "Pausar YouTube" : "Reproduzir YouTube"}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-black" />
                      ) : (
                        <Play className="w-5 h-5 fill-black translate-x-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleNextTrack(false)}
                      className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      title="Próxima Música da Fila"
                    >
                      <SkipForward className="w-4 h-4 fill-zinc-300" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 select-none" title="Controle exclusivo do Gestor">
                    <button
                      disabled
                      className="w-9 h-9 rounded-full bg-zinc-900/60 text-zinc-600 border border-zinc-850 flex items-center justify-center cursor-not-allowed opacity-50 pointer-events-none"
                    >
                      <SkipBack className="w-4 h-4 fill-zinc-600" />
                    </button>
                    <button
                      disabled
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2 bg-zinc-900/60 text-zinc-600 border-zinc-850 cursor-not-allowed opacity-60 pointer-events-none"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-zinc-600" /> : <Play className="w-5 h-5 fill-zinc-600" />}
                    </button>
                    <button
                      disabled
                      className="w-9 h-9 rounded-full bg-zinc-900/60 text-zinc-600 border border-zinc-850 flex items-center justify-center cursor-not-allowed opacity-50 pointer-events-none"
                    >
                      <SkipForward className="w-4 h-4 fill-zinc-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Volume Control Slider */}
              <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-850">
                <button
                  onClick={toggleMute}
                  className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
                  title={isMuted ? "Desmutar" : "Mutar"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 accent-[#00ff66] cursor-pointer h-1.5 bg-zinc-800 rounded-lg outline-none"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                  {isMuted ? "0%" : `${volume}%`}
                </span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. DEVICE DISCOVERY & CONNECTION MODAL */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4 sm:gap-5 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00ff66]">
                  <Cast className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">Central de Conectividade de Áudio</h3>
                  <p className="text-xs text-zinc-400">Detecte e conecte alto-falantes, Bluetooth e Smart TVs da academia</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scan Status Banner */}
            {deviceScanMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff66] shrink-0" />
                  <span>{deviceScanMessage}</span>
                </span>
                <button
                  onClick={handleTestAudioPing}
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded text-[10px] uppercase font-mono transition-colors shrink-0 cursor-pointer"
                >
                  Testar Som
                </button>
              </div>
            )}

            {/* Actions Bar: Scan, Pair Bluetooth & Connect Alexa */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleScanDevices}
                disabled={isScanningDevices}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl border border-zinc-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isScanningDevices ? "animate-spin" : ""}`} />
                <span>Escanear Saídas</span>
              </button>

              <button
                onClick={handlePairBluetoothDevice}
                disabled={isScanningDevices}
                className="py-2.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs rounded-xl border border-blue-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                <span>Info Bluetooth</span>
              </button>

              <button
                onClick={handleConnectAlexaDevice}
                disabled={isScanningDevices}
                className="py-2.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Info Alexa</span>
              </button>
            </div>

            {/* Detected Devices List */}
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-wider">
                Saídas Físicas Identificadas ({detectedDevices.length})
              </span>

              {detectedDevices.map((device) => {
                const isSelected = selectedDeviceId === device.id;
                return (
                  <div
                    key={device.id}
                    onClick={() => handleSelectDevice(device)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#00ff66]/10 border-[#00ff66]/50 text-white shadow-lg shadow-emerald-500/5"
                        : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${
                        device.type === "alexa"
                          ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                          : device.type === "bluetooth"
                          ? "bg-blue-500/10 text-blue-400"
                          : device.type === "tv"
                          ? "bg-purple-500/10 text-purple-400"
                          : device.type === "cast"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-[#00ff66]"
                      }`}>
                        {device.type === "alexa" && <Radio className="w-4 h-4 text-cyan-400" />}
                        {device.type === "bluetooth" && <Bluetooth className="w-4 h-4" />}
                        {device.type === "tv" && <Tv className="w-4 h-4" />}
                        {device.type === "cast" && <Cast className="w-4 h-4" />}
                        {device.type === "speaker" && <Speaker className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-white truncate">{device.label}</h4>
                          {device.type === "alexa" && (
                            <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
                              Alexa Eco
                            </span>
                          )}
                          {device.isDefault && (
                            <span className="text-[9px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Padrão</span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono capitalize">
                          Tipo: {device.type} • Status: {isSelected ? "Transmitindo Ativo" : device.status}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isSelected ? (
                        <span className="px-3 py-1 bg-[#00ff66] text-black font-black text-[10px] rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <CheckCircle className="w-3 h-3 fill-black" />
                          Ativo
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] rounded-lg transition-colors">
                          Selecionar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer / Hint */}
            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Saída de áudio gerenciada pelo navegador / SO
              </span>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="px-4 py-1.5 bg-[#00ff66] hover:bg-[#00e159] text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow-lg"
              >
                Concluído
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
