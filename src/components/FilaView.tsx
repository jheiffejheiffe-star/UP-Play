import React from "react";
import { 
  Heart, Vote, Award, ShieldAlert, Sliders, Music, Zap, RefreshCw 
} from "lucide-react";
import { GymZone } from "../types";

interface FilaViewProps {
  activeZone: GymZone | null;
  likedSongs: string[];
  handleVote: (id: string) => void;
  userName: string;
}

export const FilaView: React.FC<FilaViewProps> = ({
  activeZone,
  likedSongs,
  handleVote,
  userName
}) => {
  if (!activeZone) return null;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-4 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
              🟢 Fila de Transmissão ao Vivo
            </span>
            <span className="text-[10px] font-mono text-zinc-500">• Sala de Musculação</span>
          </div>
          <h2 className="font-display font-bold text-xl text-white mt-2">
            Fila da Galera • Sala de Musculação
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            As músicas nesta lista são solicitadas pelos alunos da academia. A reprodução toca continuamente as 26 músicas do acervo oficial UP Play e, a cada 3 músicas tocadas do UP Play, insere automaticamente 1 música da Fila da Galera. O som nunca para!
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl shrink-0">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span className="font-mono text-zinc-400">Total na Fila: {activeZone.queue.length} faixas</span>
        </div>
      </div>

      {/* CORE QUEUE CARDS LIST */}
      <div className="bg-[#121214] border border-[#27272a] p-4 sm:p-6 rounded-2xl">
        <div className="flex flex-col gap-3">
          
          {/* Header Row labels (desktop only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider pb-2 border-b border-zinc-800/80 px-4">
            <div className="col-span-1 text-center">POSIÇÃO</div>
            <div className="col-span-4">MÚSICA & CAPA</div>
            <div className="col-span-2">ESTILO / RITMO</div>
            <div className="col-span-2">QUEM PEDIU</div>
            <div className="col-span-2 text-center">STATUS</div>
            <div className="col-span-1 text-right">CURTIR</div>
          </div>

          {activeZone.queue.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 text-xs border border-dashed border-zinc-800/80 rounded-xl flex flex-col items-center gap-2">
              <Music className="w-8 h-8 text-zinc-800" />
              <p className="font-semibold text-zinc-400">Nenhuma música na fila de transmissão</p>
              <p className="max-w-xs text-[11px] leading-normal text-zinc-500">
                Os alto-falantes da Sala de Musculação estão tocando o acervo curado pela UP Fitness. Adicione uma faixa agora no menu "Pedir Música"!
              </p>
            </div>
          ) : (
            activeZone.queue.map((song, index) => {
              const position = index + 1;
              const liked = likedSongs.includes(song.id);
              
              // Real requester display
              const requesterName = (song as any).requestedBy || "Geral UP Play";

              // Status definitions
              const isFirst = position === 1;
              const statusText = isFirst ? "Próxima da Fila" : "Aguardando Votos";
              const statusColor = isFirst 
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" 
                : "bg-zinc-800/80 text-zinc-400 border border-transparent";

              return (
                <div
                  key={song.id}
                  className={`bg-[#18181b] hover:bg-[#1f1f23] transition-all p-3.5 rounded-xl border flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 ${
                    isFirst ? "border-amber-500/10 bg-amber-500/5" : "border-zinc-800/80"
                  }`}
                >
                  {/* Position Column */}
                  <div className="col-span-1 flex items-center justify-between md:justify-center border-b md:border-b-0 border-zinc-850 pb-2 md:pb-0">
                    <span className="md:hidden text-[10px] font-mono text-zinc-500">POSIÇÃO NA FILA</span>
                    <span className="font-mono font-bold text-sm">
                      {position === 1 ? "🥇 1º" : position === 2 ? "🥈 2º" : position === 3 ? "🥉 3º" : `${position}º`}
                    </span>
                  </div>

                  {/* Album Cover & Song details */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow`}>
                      {song.bpm}
                    </div>
                    <div className="truncate text-xs">
                      <p className="font-bold text-white truncate">{song.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  {/* Genre column */}
                  <div className="col-span-2 flex items-center justify-between md:justify-start">
                    <span className="md:hidden text-[10px] font-mono text-zinc-500">ESTILO / RITMO</span>
                    <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1.5 py-0.5 rounded">
                      {song.genre || "Electronic"}
                    </span>
                  </div>

                  {/* Who requested column */}
                  <div className="col-span-2 flex items-center justify-between md:justify-start">
                    <span className="md:hidden text-[10px] font-mono text-zinc-500">PEDIDO POR</span>
                    <span className={`text-xs font-mono font-bold ${requesterName === userName ? "text-emerald-400" : "text-zinc-300"}`}>
                      {requesterName}
                    </span>
                  </div>

                  {/* Status column */}
                  <div className="col-span-2 flex items-center justify-between md:justify-center">
                    <span className="md:hidden text-[10px] font-mono text-zinc-500">STATUS</span>
                    <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Vote/Like column */}
                  <div className="col-span-1 flex items-center justify-between md:justify-end">
                    <span className="md:hidden text-[10px] font-mono text-zinc-500">APOIAR PEDIDO</span>
                    <button
                      onClick={() => handleVote(song.id)}
                      className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation ${
                        liked
                          ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/10"
                          : "bg-zinc-800 hover:bg-emerald-500 hover:text-black text-zinc-300"
                      }`}
                      aria-label={`Apoiar pedido de ${song.title} (${song.votes} votos)`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-black text-black" : ""}`} />
                      <span>{song.votes}</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}

        </div>
      </div>
    </div>
  );
};
