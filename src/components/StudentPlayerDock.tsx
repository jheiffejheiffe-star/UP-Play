import React, { useState, useEffect } from "react";
import { Music, Radio, Volume2, ListMusic, PlusCircle, Disc3 } from "lucide-react";
import { Song } from "../types";

interface StudentPlayerDockProps {
  currentSong: Song | null;
  isPlaying: boolean;
  zoneName: string;
  queueCount: number;
  currentProgress?: number;
  playbackTimestamp?: number;
  onOpenQueue?: () => void;
  onOpenCatalog?: () => void;
}

export const StudentPlayerDock: React.FC<StudentPlayerDockProps> = ({
  currentSong,
  isPlaying,
  zoneName = "Musculação",
  queueCount = 0,
  currentProgress = 0,
  playbackTimestamp = Date.now(),
  onOpenQueue,
  onOpenCatalog
}) => {
  const [elapsed, setElapsed] = useState<number>(currentProgress);

  // Synchronize elapsed time smoothly based on server playback timestamp
  useEffect(() => {
    setElapsed(currentProgress);
  }, [currentProgress, currentSong?.id]);

  useEffect(() => {
    if (!isPlaying || !currentSong) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const maxDuration = currentSong.duration || 180;
        if (prev >= maxDuration) return maxDuration;
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  const duration = currentSong?.duration || 180;
  const progressPercent = Math.min(100, Math.max(0, (elapsed / duration) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <aside
      id="student-player-dock"
      aria-label="Transmissão de Áudio da Academia"
      className="fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-40 bg-[#0d0d10]/95 backdrop-blur-xl border-t border-[#27272a] shadow-2xl px-3 sm:px-6 py-2 sm:py-2.5 transition-all duration-300 pointer-events-auto select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        
        {/* LEFT: Current Track Info with artwork */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 max-w-[50%] sm:max-w-[40%]">
          {/* Cover Art / Thumbnail */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 shadow-md bg-zinc-900 border border-zinc-800">
            {currentSong?.coverUrl ? (
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${
                  currentSong?.coverGradient || "from-emerald-500 to-teal-700"
                } flex items-center justify-center`}
              >
                <Music className="w-5 h-5 text-white/80" />
              </div>
            )}

            {/* Spinning disc indicator when playing */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <Disc3 className="w-4 h-4 text-[#00ff66] animate-spin" />
              </div>
            )}
          </div>

          {/* Titles & Sector info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse shrink-0" />
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider truncate">
                {zoneName} • Som da Academia
              </p>
            </div>
            <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight mt-0.5">
              {currentSong?.title || "Sintonia UP Play"}
            </p>
            <p className="text-[11px] text-zinc-400 truncate leading-tight">
              {currentSong?.artist || "Aguardando próxima faixa..."}
            </p>
          </div>
        </div>

        {/* CENTER: Status Indicator & Visual Progress Bar */}
        <div className="flex-1 max-w-md hidden sm:flex flex-col items-center gap-1">
          {/* Status badge */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            {isPlaying ? (
              <span className="text-[#00ff66] flex items-center gap-1.5 font-bold">
                <span className="inline-flex items-center gap-0.5">
                  <span className="w-0.5 h-2.5 bg-[#00ff66] animate-pulse" />
                  <span className="w-0.5 h-4 bg-[#00ff66] animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-0.5 h-2 bg-[#00ff66] animate-pulse" style={{ animationDelay: "300ms" }} />
                </span>
                AO VIVO NO SOM CENTRAL
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                TRANSMISSÃO PAUSADA
              </span>
            )}
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">
              {formatTime(elapsed)} / {formatTime(duration)}
            </span>
          </div>

          {/* Read-only synced progress track */}
          <div className="w-full bg-zinc-800/90 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-[#00ff66] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* RIGHT: Student Participation Actions (Ver Fila & Pedir Música) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-time listener pill */}
          <div
            className="hidden lg:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-xl text-zinc-400 text-xs font-mono"
            title="O áudio é reproduzido pelo equipamento central da academia. Alunos acompanham e votam."
          >
            <Volume2 className="w-3.5 h-3.5 text-[#00ff66]" />
            <span className="text-[10px]">Transmissão Central</span>
          </div>

          {onOpenQueue && (
            <button
              onClick={onOpenQueue}
              className="px-2.5 sm:px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Visualizar a fila de reprodução da sala"
            >
              <ListMusic className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Fila</span>
              {queueCount > 0 && (
                <span className="bg-emerald-500/20 text-[#00ff66] px-1.5 py-0.2 rounded text-[10px] font-bold">
                  {queueCount}
                </span>
              )}
            </button>
          )}

          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="px-3 sm:px-4 py-1.5 bg-[#00ff66] hover:bg-[#00e159] text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95"
              title="Pedir uma nova música para a sala"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Pedir Som</span>
            </button>
          )}
        </div>

      </div>
    </aside>
  );
};
