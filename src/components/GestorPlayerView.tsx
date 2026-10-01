import React, { useState } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, Trash2, Plus, 
  Search, Sliders, Music, Zap, Layers, Volume2, ListMusic 
} from "lucide-react";
import { GymZone, Song } from "../types";
import { CentralYouTubePlayer } from "./CentralYouTubePlayer";

interface GestorPlayerViewProps {
  zones: GymZone[];
  activeZoneId: string;
  setActiveZoneId: (id: string) => void;
  trackPool: Song[];
  handleNextTrack: (isAutoAdvance?: boolean) => void;
  handlePrevTrack: () => void;
  handleTogglePlayPause: () => void;
  handleRemoveFromQueue: (songId: string) => void;
  handleAddToQueue: (song: Song) => void;
  isSynthPlaying: boolean;
  isPlaying?: boolean;
  setIsPlaying?: (playing: boolean, manualAdminAction?: boolean) => void;
  addLog: (type: string, user: string, content: string, status: "approved" | "flagged", reason: string) => void;
  isDocked?: boolean;
  onExpandPlayer?: () => void;
  canControl?: boolean;
  onSuppressUnavailableTrack?: (song: Song, reason: string) => void;
}

export const GestorPlayerView: React.FC<GestorPlayerViewProps> = ({
  zones,
  activeZoneId,
  setActiveZoneId,
  trackPool,
  handleNextTrack,
  handlePrevTrack,
  handleTogglePlayPause,
  handleRemoveFromQueue,
  handleAddToQueue,
  isSynthPlaying,
  isPlaying = true,
  setIsPlaying = () => {},
  addLog,
  isDocked = false,
  onExpandPlayer,
  canControl = true,
  onSuppressUnavailableTrack
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [customBpm, setCustomBpm] = useState(130);
  const [customGenre, setCustomGenre] = useState("Electro House");
  const [customFeedback, setCustomFeedback] = useState<string | null>(null);

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  // Search track pool to add
  const filteredTracks = trackPool.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger adding track manually from catalog
  const triggerAddTrack = (song: Song) => {
    handleAddToQueue(song);
    addLog(
      "system",
      "Administrador",
      `Música "${song.title}" adicionada manualmente à fila de ${activeZone.name}.`,
      "approved",
      "Ação manual do gestor no painel"
    );
    setCustomFeedback(`Sucesso: "${song.title}" injetada na fila.`);
    setTimeout(() => setCustomFeedback(null), 3000);
  };

  // Create & add custom song manually
  const triggerAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customArtist) return;

    const gradients = [
      "from-rose-500 to-red-600",
      "from-blue-600 to-cyan-500",
      "from-amber-400 to-orange-500",
      "from-purple-600 to-indigo-600",
      "from-emerald-400 to-teal-500"
    ];
    const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];

    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: customTitle,
      artist: customArtist,
      album: "UP Single Exclusivo",
      duration: 180,
      bpm: Number(customBpm) || 120,
      energy: 8,
      genre: customGenre,
      coverGradient: randomGrad,
      votes: 0
    };

    handleAddToQueue(newSong);
    addLog(
      "system",
      "Administrador",
      `Injetada faixa inédita "${newSong.title}" em ${activeZone.name}.`,
      "approved",
      "Upload manual de faixa no player"
    );

    setCustomFeedback(`Música "${newSong.title}" injetada com sucesso.`);
    setCustomTitle("");
    setCustomArtist("");
    setTimeout(() => setCustomFeedback(null), 3000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <>
      {/* SECTOR SELECTOR TOP BAR (Only displayed in full expanded view) */}
      {!isDocked && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 animate-fadeIn">
          <div>
            <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
              Controles Mestres de Transmissão
            </span>
            <h2 className="font-display font-bold text-lg sm:text-xl text-white mt-2">
              Mesa de Som • Sala de Musculação
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Controle a sincronia do sinal de áudio da Sala de Musculação, pulsações (BPM), UP Power e moderação da fila coletiva.
            </p>
          </div>

          {/* Setor Ativo Badge */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3.5 py-2 rounded-2xl border border-zinc-850 self-start sm:self-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {activeZone.name}
            </span>
          </div>
        </div>
      )}

      {/* CORE CONTROL GRID */}
      <div className={isDocked ? "contents" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn"}>
        
        {/* LEFT COLUMN: ACTIVE DECK & CONTROLS (7 COLS) */}
        <div className={isDocked ? "contents" : "lg:col-span-7 flex flex-col gap-6"}>
          {/* EMBEDDED REAL YOUTUBE PLAYER CENTRAL - PERSISTENT INSTANCE */}
          <CentralYouTubePlayer
            currentSong={activeZone.currentSong}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            handleNextTrack={handleNextTrack}
            handlePrevTrack={handlePrevTrack}
            bpmMultiplier={activeZone.bpmMultiplier}
            activeZoneName={activeZone.name}
            activeZoneId={activeZone.id}
            queueCount={activeZone.queue.length}
            isDocked={isDocked}
            onExpandPlayer={onExpandPlayer}
            canControl={canControl}
            initialProgress={activeZone.currentProgress || 0}
            onSuppressUnavailableTrack={onSuppressUnavailableTrack}
          />

          {/* VIEW QUEUE LIST (Fila do Setor) */}
          {!isDocked && (
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-semibold text-sm text-white">Visualização & Gestão de Fila</h4>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {activeZone.queue.length} músicas na fila
                </span>
              </div>

              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {activeZone.queue.length === 0 ? (
                  <div className="py-10 text-center text-zinc-600 text-xs font-mono border border-dashed border-zinc-800 rounded-xl">
                    Nenhuma música agendada. O robô tocará a playlist adaptativa.
                  </div>
                ) : (
                  activeZone.queue.map((song, index) => (
                    <div 
                      key={`${song.id}-${index}`}
                      className="bg-[#18181b] border border-zinc-850 p-3 rounded-xl flex items-center justify-between gap-3 group hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-zinc-850 text-[10px] font-mono text-zinc-500 flex items-center justify-center">
                          #{index + 1}
                        </div>
                        <div className="truncate text-xs">
                          <span className="font-semibold text-white block truncate">{song.title}</span>
                          <span className="text-[10px] text-zinc-500 block truncate">{song.artist}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {song.bpm} BPM
                        </span>
                        <button
                          onClick={() => handleRemoveFromQueue(song.id)}
                          className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                          title="Remover música"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MANUAL INJECTION & SEARCH (5 COLS) */}
        {!isDocked && (
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* QUICK INJECTION CATALOG */}
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 shadow-md">
              <div>
                <h4 className="font-semibold text-sm text-white">Adicionar Música do Acervo</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Selecione faixas oficiais da UP Fitness para priorização imediata.</p>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por nome, artista, ritmo..."
                  className="w-full bg-[#18181b] border border-zinc-800 text-[11px] rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Filtered Acervo Tracks list */}
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {filteredTracks.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => triggerAddTrack(song)}
                    className="w-full text-left bg-[#18181b]/60 border border-zinc-850 p-2 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-all hover:bg-zinc-850 text-xs cursor-pointer group"
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-semibold text-white block truncate group-hover:text-emerald-400 transition-colors">{song.title}</span>
                      <span className="text-[10px] text-zinc-500 block truncate">{song.artist}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1 rounded">{song.bpm} BPM</span>
                      <div className="p-1 rounded bg-emerald-500/10 text-[#00ff66]">
                        <Plus className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ADD MUSICA MANUAL FORM (Upload single simulado) */}
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
              <div>
                <h4 className="font-semibold text-sm text-white">Adicionar Manualmente (Single Inédito)</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Cadastre e injete qualquer música diretamente na mesa de som do setor.</p>
              </div>

              <form onSubmit={triggerAddCustomTrack} className="flex flex-col gap-3">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 block mb-0.5">NOME DA MÚSICA *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lose Yourself (UP Workout Mix)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 text-[11px] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#00ff66]"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 block mb-0.5">ARTISTA / PRODUTOR *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Eminem / DJ Gym"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 text-[11px] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#00ff66]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 block mb-0.5">BPM ALVO</label>
                    <input
                      type="number"
                      min="60"
                      max="220"
                      value={customBpm}
                      onChange={(e) => setCustomBpm(Number(e.target.value))}
                      className="w-full bg-[#18181b] border border-zinc-800 text-[11px] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#00ff66] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 block mb-0.5">ESTILO MUSICAL</label>
                    <input
                      type="text"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-800 text-[11px] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#00ff66]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Injetar Música na Fila
                </button>

                {customFeedback && (
                  <p className="text-[10px] text-center font-mono text-emerald-400 animate-pulse mt-1">
                    {customFeedback}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
};
