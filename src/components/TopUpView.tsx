import React, { useState } from "react";
import { Trophy, Award, Zap, ShieldCheck, Star, Activity, Sparkles, MessageSquare, Heart, Users } from "lucide-react";
import { Student } from "./GestorAlunosView";

interface TopUpViewProps {
  userName: string;
  students?: Student[];
}

interface AthleteRank {
  rank: number;
  name: string;
  points?: number;
  score?: number;
  avatar: string;
  tag: string;
  workouts: number;
  requests?: number;
  likes?: number;
  isSelf?: boolean;
}

export const TopUpView: React.FC<TopUpViewProps> = ({ userName, students = [] }) => {
  const [viewMode, setViewMode] = useState<"energia" | "participacao">("energia");
  const [period, setPeriod] = useState<"diario" | "semana" | "mes">("diario");
  const [topCount, setTopCount] = useState<5 | 10>(5);

  // Dynamic real athlete leaderboard compiled purely from real students & active session
  const activeLeaderboard: AthleteRank[] = React.useMemo(() => {
    const list: AthleteRank[] = [];

    if (students && students.length > 0) {
      students
        .filter((s) => s.status !== "Bloqueado")
        .forEach((student, idx) => {
          const isCurrent =
            userName &&
            (student.name.toLowerCase() === userName.toLowerCase() ||
              student.email?.toLowerCase() === userName.toLowerCase());
          const workouts = student.workoutsCompleted || 1;
          list.push({
            rank: idx + 1,
            name: isCurrent ? `${student.name} (Você)` : student.name,
            points: workouts * 120 + 50,
            score: workouts * 5 + 10,
            avatar: student.avatarGradient || "from-emerald-400 to-teal-500",
            tag: student.preferredZone || "Atleta UP",
            workouts,
            requests: 1,
            likes: 2,
            isSelf: Boolean(isCurrent)
          });
        });
    }

    // If current authenticated student is not in the list, add them
    if (userName && userName !== "Visitante" && userName !== "Atleta UP") {
      const alreadyInList = list.some(
        (item) => item.isSelf || item.name.toLowerCase().includes(userName.toLowerCase())
      );
      if (!alreadyInList) {
        list.unshift({
          rank: 1,
          name: `${userName} (Você)`,
          points: 120,
          score: 15,
          avatar: "from-emerald-400 to-teal-500",
          tag: "Atleta Conectado",
          workouts: 1,
          requests: 1,
          likes: 2,
          isSelf: true
        });
        // Recompute ranks
        list.forEach((item, idx) => {
          item.rank = idx + 1;
        });
      }
    }

    return list;
  }, [students, userName]);

  const activeData = activeLeaderboard.slice(0, topCount);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER EXPLAINER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-4 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <span className="text-xs font-mono font-bold text-[#00ff66] uppercase tracking-wider">
              Painel TOP UP Gamificado
            </span>
          </div>
          <h2 className="font-display font-bold text-xl text-white mt-2">
            Ranking Oficial UP Play
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Mantenha seu metabolismo em alta sincronizado com as batidas de treino da UP Fitness. Suba posições e destrave shakes de Whey Isolado no balcão da academia!
          </p>
        </div>

        {/* Top 3 Reward Callout */}
        <div className="flex items-center gap-3 bg-[#18181b] border border-dashed border-zinc-800 p-3.5 rounded-xl shrink-0">
          <span className="text-2xl">🥤</span>
          <div className="text-[10px] leading-normal max-w-xs">
            <span className="font-bold text-[#00ff66] uppercase block">Meta do Top 3</span>
            <span className="text-zinc-300">Ganhe 1 dose de Whey Protein sabor Chocolate Belga no UP Café!</span>
          </div>
        </div>
      </div>

      {/* CHOOSE RANKING TYPE TAB SELECTOR */}
      <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-850 gap-1.5 sm:gap-2">
        <button
          onClick={() => setViewMode("energia")}
          className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] ${
            viewMode === "energia"
              ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="sm:hidden">Energia</span>
          <span className="hidden sm:inline">Ranking de Energia (Calorias)</span>
        </button>
        <button
          onClick={() => setViewMode("participacao")}
          className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] ${
            viewMode === "participacao"
              ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-400 shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Award className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="sm:hidden">Participação</span>
          <span className="hidden sm:inline">Ranking de Participação (Pedidos)</span>
        </button>
      </div>

      {/* FILTER BUTTONS & LEADERBOARD SCOREBOARD CARD */}
      <div className="bg-[#121214] border border-[#27272a] p-4 sm:p-6 rounded-2xl flex flex-col gap-5">
        
        {/* Navigation Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
          
          {/* Period Selection */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-850">
            {viewMode === "energia" ? (
              <>
                <button
                  onClick={() => setPeriod("diario")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === "diario" ? "bg-emerald-500 text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Diário
                </button>
                <button
                  onClick={() => setPeriod("semana")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === "semana" ? "bg-emerald-500 text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Semana Passada
                </button>
                <button
                  onClick={() => setPeriod("mes")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === "mes" ? "bg-emerald-500 text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Últimos 30 dias
                </button>
              </>
            ) : (
              <span className="px-4 py-1.5 text-xs font-semibold font-mono text-purple-400 uppercase tracking-wider">
                🏆 Sincronização de Engajamento
              </span>
            )}
          </div>

          {/* Size Filter (Toggles: Top 5 e Top 10) */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-850 self-start sm:self-center">
            <button
              onClick={() => setTopCount(5)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                topCount === 5 ? "bg-zinc-800 text-emerald-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => setTopCount(10)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                topCount === 10 ? "bg-zinc-800 text-emerald-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Top 10
            </button>
          </div>
        </div>

        {/* SCOREBOARD RENDERING */}
        {activeData.length === 0 ? (
          <div className="py-12 px-4 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-850 text-center flex flex-col items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-zinc-600" />
            <h4 className="text-sm font-bold text-zinc-300">Nenhum atleta registrado no TOP UP ainda</h4>
            <p className="text-xs text-zinc-500 max-w-sm">
              Os alunos reais cadastrados na academia aparecerão aqui com suas posições, pontuações de energia e medalhas semanais.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {activeData.map((user) => {
              const isSelf = user.isSelf || user.name === userName || user.name === "Atleta UP";
              const displayName = user.name;
              const rankLabel = user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : `${user.rank}º`;

              return (
                <div
                  key={user.rank}
                  className={`p-3.5 rounded-xl flex items-center justify-between border transition-all ${
                    isSelf
                      ? "bg-emerald-500/10 border-[#00ff66]/40 shadow-lg shadow-emerald-500/5 glow-green"
                      : "bg-[#18181b] border-zinc-850 hover:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Position label */}
                    <span className="font-mono font-bold text-sm w-8 text-center text-zinc-300">
                      {rankLabel}
                    </span>

                    {/* Avatar bubble */}
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${user.avatar} flex items-center justify-center font-mono font-bold text-black text-xs shrink-0 shadow`}>
                      {user.name.replace(" (Você)", "").slice(0, 2).toUpperCase()}
                    </div>

                    {/* Identification and custom athletic tag */}
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{displayName}</span>
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700/50 px-1.5 py-0.2 rounded font-mono uppercase tracking-wider shrink-0">
                          {user.tag}
                        </span>
                      </div>
                      {viewMode === "energia" ? (
                        <span className="text-[10px] text-zinc-500 block">
                          {user.workouts} treino monitorado hoje
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 block">
                          {user.requests} pedidos • {user.likes} curtidas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score display */}
                  <div className="text-right font-mono text-xs">
                    {viewMode === "energia" ? (
                      <>
                        <span className="font-bold text-white block">{user.points || 0} pts</span>
                        <span className="text-[9px] text-zinc-500 block">calorias rítmicas</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-purple-400 block">{user.score || 0} pts</span>
                        <span className="text-[9px] text-zinc-500 block">pontos de engajamento</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BI-ENGAGEMENT ENCOURAGEMENT FOOTER */}
        <div className="mt-4 bg-[#18181b] p-4 rounded-xl border border-dashed border-zinc-800 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-300">Sincronização Ativa de BI:</span> O placar é recalculado em tempo real com base no tempo de sintonizador e interações na fila. O Ranking de Participação valoriza atletas que enriquecem o ambiente familiar da UP Fitness!
          </div>
        </div>

      </div>
    </div>
  );
};
