import React from "react";
import { 
  Music, Volume2, VolumeX, Plus, Trophy, User, Zap, Megaphone, 
  Activity, Flame, ArrowRight, Heart, Sparkles, MessageSquare,
  ChevronLeft, ChevronRight 
} from "lucide-react";
import { GymZone, Song } from "../types";
import { Student } from "./GestorAlunosView";

interface HomeViewProps {
  activeZone: GymZone | null;
  announcements: any[];
  currentAdIndex: number;
  setCurrentAdIndex: (idx: number) => void;
  setActiveTab: (tab: any) => void;
  likedSongs: string[];
  handleVote: (id: string) => void;
  soundEnabled: boolean;
  startSynthEngine: () => void;
  stopSynthEngine: () => void;
  userName: string;
  avatarGradient: string;
  handleTriggerPowerMode: () => void;
  students?: Student[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  activeZone,
  announcements,
  currentAdIndex,
  setCurrentAdIndex,
  setActiveTab,
  likedSongs,
  handleVote,
  soundEnabled,
  startSynthEngine,
  stopSynthEngine,
  userName,
  avatarGradient,
  handleTriggerPowerMode,
  students = []
}) => {
  const activeAds = announcements.filter(a => a.active);

  // Real active students list for ranking (filtering out any non-students or inactive)
  const realRanking = React.useMemo(() => {
    const list: { rank: number; name: string; points: string; avatar: string; isSelf?: boolean }[] = [];

    // Include registered students
    if (students && students.length > 0) {
      students
        .filter(s => s.status !== "Bloqueado")
        .forEach((student, idx) => {
          const isCurrent = userName && (student.name.toLowerCase() === userName.toLowerCase() || student.email?.toLowerCase() === userName.toLowerCase());
          list.push({
            rank: idx + 1,
            name: isCurrent ? `${student.name} (Você)` : student.name,
            points: `${((student.workoutsCompleted || 1) * 120 + 50).toLocaleString("pt-BR")} pts`,
            avatar: student.avatarGradient || "from-emerald-400 to-teal-500",
            isSelf: Boolean(isCurrent)
          });
        });
    }

    // If current authenticated student is not in the list, add them
    if (userName && userName !== "Visitante" && userName !== "Atleta UP") {
      const alreadyInList = list.some(item => item.isSelf || item.name.toLowerCase().includes(userName.toLowerCase()));
      if (!alreadyInList) {
        list.unshift({
          rank: 1,
          name: `${userName} (Você)`,
          points: "120 pts",
          avatar: avatarGradient || "from-emerald-400 to-teal-500",
          isSelf: true
        });
        // Recompute ranks
        list.forEach((item, idx) => {
          item.rank = idx + 1;
        });
      }
    }

    return list.slice(0, 3);
  }, [students, userName, avatarGradient]);

  // Quick-calculation for real BPM
  const baseBpm = activeZone?.currentSong?.bpm || 120;
  const multiplier = activeZone?.bpmMultiplier || 1.0;
  const realBpm = Math.round(baseBpm * multiplier);

  const handlePrevAd = () => {
    if (activeAds.length <= 1) return;
    setCurrentAdIndex((currentAdIndex - 1 + activeAds.length) % activeAds.length);
  };

  const handleNextAd = () => {
    if (activeAds.length <= 1) return;
    setCurrentAdIndex((currentAdIndex + 1) % activeAds.length);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* 1. ADVERTISING CAROUSEL (Mural de Anúncios Rotativo Coletivo com Transição Automática a cada 5s) */}
      {activeAds.length > 0 && (
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-4 md:p-5 relative overflow-hidden group shadow-lg">
          <div className={`absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-tr ${activeAds[currentAdIndex % activeAds.length]?.color || "from-[#00ff66]/10 to-transparent"} opacity-20 rounded-full filter blur-xl transition-all duration-700`} />
          
          <div className="flex items-start gap-4 relative z-10">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${activeAds[currentAdIndex % activeAds.length]?.color || "from-[#00ff66] to-teal-500"} text-black flex items-center justify-center shrink-0 shadow-lg`}>
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    ⚡ Mural Coletivo UP
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">• em rotação (5s)</span>
                </div>

                {/* Quick Arrow Navigation in Header */}
                {activeAds.length > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handlePrevAd}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Anúncio anterior"
                      aria-label="Voltar anúncio"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono text-zinc-400 px-1 select-none">
                      {(currentAdIndex % activeAds.length) + 1}/{activeAds.length}
                    </span>
                    <button
                      onClick={handleNextAd}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Próximo anúncio"
                      aria-label="Avançar anúncio"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mt-1">
                {activeAds[currentAdIndex % activeAds.length]?.title}
              </h3>
              <p className="text-xs text-[#00ff66] font-semibold mt-0.5">
                {activeAds[currentAdIndex % activeAds.length]?.subtitle}
              </p>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {activeAds[currentAdIndex % activeAds.length]?.description}
              </p>
            </div>
          </div>
          
          {/* Slide dots and bottom navigation */}
          <div className="flex items-center justify-center gap-3 mt-3 relative z-10">
            {activeAds.length > 1 && (
              <button
                onClick={handlePrevAd}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer active:scale-95"
                title="Voltar à esquerda"
                aria-label="Voltar anúncio"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-1.5">
              {activeAds.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentAdIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    (currentAdIndex % activeAds.length) === idx
                      ? "w-6 bg-[#00ff66]"
                      : "w-2 bg-zinc-700 hover:bg-zinc-600"
                  }`}
                  aria-label={`Ir para anúncio ${idx + 1}`}
                />
              ))}
            </div>

            {activeAds.length > 1 && (
              <button
                onClick={handleNextAd}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer active:scale-95"
                title="Avançar à direita"
                aria-label="Avançar anúncio"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. CORE HOME GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: ACTIVE NOW PLAYING & QUEUE TEASER (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* NOW PLAYING MODULE (Música tocando agora) */}
          {activeZone && (
            <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 relative overflow-hidden">
              {/* Glowing background representing the current song's energy */}
              <div className={`absolute -left-16 -bottom-16 w-48 h-48 bg-gradient-to-tr ${activeZone.currentSong?.coverGradient || "from-zinc-800 to-zinc-900"} opacity-10 rounded-full filter blur-3xl`} />
              
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 sm:pb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider truncate">
                    Tocando Agora • {activeZone.name.split(" - ")[0]}
                  </span>
                </div>
                
                {/* Audio Engine Trigger */}
                <button
                  onClick={soundEnabled ? stopSynthEngine : startSynthEngine}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    soundEnabled
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700"
                  }`}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Sintonia Ativa</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Sintonizar Fone</span>
                    </>
                  )}
                </button>
              </div>

              {activeZone.currentSong ? (
                <div className="flex flex-col md:flex-row items-center gap-5">
                  {/* Virtual Spinning Disc */}
                  <div className="relative group shrink-0">
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-tr ${activeZone.currentSong.coverGradient} flex items-center justify-center text-white font-black text-2xl shadow-xl border-4 border-zinc-900 animate-[spin_12s_linear_infinite] ${!soundEnabled ? "[animation-play-state:paused]" : ""}`}>
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border-2 border-zinc-800">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                    {/* Visualizer bars overlaid when playing */}
                    {soundEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                        <div className="flex gap-0.5 items-end h-6">
                          <span className="w-1 bg-emerald-400 h-3 animate-[pulse_0.4s_infinite]" />
                          <span className="w-1 bg-emerald-400 h-5 animate-[pulse_0.6s_infinite_0.1s]" />
                          <span className="w-1 bg-emerald-400 h-2 animate-[pulse_0.5s_infinite_0.2s]" />
                          <span className="w-1 bg-emerald-400 h-4 animate-[pulse_0.3s_infinite_0.15s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1.5 py-0.5 rounded">
                        {activeZone.currentSong.genre}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Energia {activeZone.currentSong.energy}/10
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-lg text-white truncate">
                      {activeZone.currentSong.title}
                    </h4>
                    <p className="text-sm text-zinc-400 truncate">
                      {activeZone.currentSong.artist}
                    </p>

                    {/* Interactive BPM Display */}
                    <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <div className="bg-[#18181b] px-3 py-1 rounded-xl border border-zinc-800 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500">RITMO OFICIAL:</span>
                        <span className="text-xs font-mono font-bold text-[#00ff66]">
                          {realBpm} BPM
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                  Nenhuma música transmitindo no setor. Ative o tocador do gestor.
                </div>
              )}

              {/* Progress Slider (Simulation) */}
              {activeZone.currentSong && (
                <div className="space-y-1.5 mt-2">
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(activeZone.currentProgress / activeZone.currentSong.duration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>
                      {Math.floor(activeZone.currentProgress / 60)}:
                      {String(Math.floor(activeZone.currentProgress % 60)).padStart(2, "0")}
                    </span>
                    <span>
                      {Math.floor(activeZone.currentSong.duration / 60)}:
                      {String(activeZone.currentSong.duration % 60).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPCOMING QUEUE TEASER (Músicas da Fila) */}
          {activeZone && (
            <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-sm text-white">
                    Fila de Espera Rítmica (Fila da Galera)
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    A fila de transmissão intercala 1 pedido da galera a cada 3 músicas do acervo oficial UP Play (sem repetição).
                  </p>
                </div>
                
                <button
                  onClick={() => setActiveTab("fila")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 group"
                >
                  <span>Ver Fila Completa</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {activeZone.queue.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800/80 rounded-xl">
                    Nenhuma música na fila. Seja o primeiro a pedir clicando no botão abaixo!
                  </div>
                ) : (
                  activeZone.queue.slice(0, 3).map((song, index) => {
                    const liked = likedSongs.includes(song.id);
                    return (
                      <div
                        key={song.id}
                        className="bg-[#18181b] hover:bg-[#1f1f23] transition-all p-3 rounded-xl flex items-center justify-between border border-zinc-800/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs font-bold text-zinc-500 w-4">
                            {index + 1}º
                          </span>
                          <div className={`w-8 h-8 rounded bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
                            {song.bpm}
                          </div>
                          <div className="truncate text-xs">
                            <p className="font-semibold text-white truncate">{song.title}</p>
                            <p className="text-[10px] text-zinc-400 truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVote(song.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                              liked
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-zinc-800 text-zinc-300 hover:bg-emerald-500 hover:text-black border border-transparent"
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${liked ? "fill-emerald-400 text-emerald-400" : ""}`} />
                            <span>{song.votes}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Massive GREEN call-to-action button to request songs */}
              <button
                onClick={() => setActiveTab("pedir-musica")}
                className="w-full mt-1 py-3 bg-[#00ff66] hover:bg-[#00e159] text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 text-black group-hover:rotate-90 transition-transform" />
                <span>PEDIR UMA MÚSICA COLETIVA AGORA</span>
              </button>
            </div>
          )}

        </div>

        {/* RIGHT PANEL: TEASERS AND NAVIGATION HIGHLIGHTS (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* USER PROFILE SUMMARY CARD (Acesso ao perfil) */}
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4">
            <h4 className="font-display font-semibold text-sm text-white">
              Seu Status UP Play
            </h4>

            <div className="bg-[#18181b] border border-zinc-800/80 p-3.5 rounded-xl flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-mono font-bold text-black text-sm shrink-0 shadow-inner`}>
                {userName ? userName.slice(0, 2).toUpperCase() : "UP"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Nível: Bronze Ativo</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="bg-zinc-900/50 border border-zinc-850 p-2.5 rounded-xl">
                <span className="text-[9px] font-mono text-zinc-500 block uppercase">Ranking Geral</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">#4 de 58</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-850 p-2.5 rounded-xl">
                <span className="text-[9px] font-mono text-zinc-500 block uppercase">Energia</span>
                <span className="text-sm font-bold text-white mt-0.5 block">1.850 kcal</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("perfil")}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-zinc-700/50 flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Acessar Meu Perfil Atleta</span>
            </button>
          </div>

          {/* TOP UP LEADERBOARD TEASER (TOP UP) */}
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>TOP UP Semanal</span>
              </h4>
              <button
                onClick={() => setActiveTab("top-up")}
                className="text-[11px] text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                Ver tudo
              </button>
            </div>

            {realRanking.length === 0 ? (
              <div className="py-5 px-3 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800/80 text-center flex flex-col items-center justify-center gap-1.5">
                <Trophy className="w-5 h-5 text-zinc-600" />
                <p className="text-xs font-semibold text-zinc-400">Nenhum aluno no ranking ainda</p>
                <p className="text-[10px] text-zinc-500 max-w-xs">
                  Os alunos reais cadastrados aparecerão aqui conforme acumulam calorias rítmicas e interações!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {realRanking.map((user) => (
                  <div
                    key={user.rank}
                    className={`p-2 rounded-xl flex items-center justify-between border transition-all ${
                      user.isSelf
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-[#18181b]/50 border-zinc-850"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold text-amber-400 w-4 text-center">
                        {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : `${user.rank}º`}
                      </span>
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${user.avatar} flex items-center justify-center text-[8px] font-bold text-black shrink-0`}>
                        {user.name.replace(" (Você)", "").slice(0, 2).toUpperCase()}
                      </div>
                      <span className={`text-[11px] font-semibold truncate ${user.isSelf ? "text-emerald-400 font-bold" : "text-zinc-300"}`}>
                        {user.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 shrink-0">
                      {user.points}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-zinc-500 leading-normal border-t border-zinc-800/60 pt-2.5">
              💡 <span className="font-semibold text-zinc-400">Dica:</span> Ganhe pontos de energia votando nas músicas tocadas em sua zona de treino e sintonizando o sintetizador!
            </p>
          </div>

          {/* INTUITIVE ZONE INFO RAIL */}
          {activeZone && (
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${activeZone.color} opacity-5 filter blur-2xl rounded-full`} />
              <h4 className="font-display font-semibold text-xs text-zinc-400 uppercase tracking-wider font-mono">
                Ambiente de Som Oficial
              </h4>
              <p className="text-sm font-bold text-white mt-1.5">{activeZone.name}</p>
              <p className="text-xs text-zinc-400 mt-1 leading-normal">
                Você está conectado ao sistema sonoro oficial da Sala de Musculação. Todas as faixas, pedidos e votações sincronizam diretamente com os alto-falantes da Power Arena.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
