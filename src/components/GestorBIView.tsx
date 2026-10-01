import React, { useState, useEffect } from "react";
import { 
  BarChart3, Clock, Calendar, TrendingUp, Users, Heart, 
  Sparkles, Filter, PieChart, Activity, RefreshCw, FileText, 
  Download, Printer, User, Music, ArrowRight, BrainCircuit, Play
} from "lucide-react";
import { formatCpf } from "../utils/cpf";

interface Persona {
  nome: string;
  horario: string;
  idadeMedia: number;
  estilosPredominantes: string[];
  artistasFavoritos: string[];
  nivelParticipacao: string;
}

interface SuggestedSong {
  titulo: string;
  artista: string;
  genero: string;
}

interface PredictiveRecommendation {
  titulo: string;
  descricao: string;
}

interface DashboardData {
  summary: {
    totalRequests: number;
    totalLikes: number;
    totalDedications: number;
    avgWaitMinutes: number;
  };
  hourlyDistribution: Array<{ hour: number; count: number }>;
  genreDistribution: Array<{ genre: string; count: number }>;
  ageGroupDistribution: Array<{ age_group: string; count: number }>;
  artistRanking: Array<{ name: string; count: number }>;
  songRanking: Array<{ title: string; artist: string; genre: string; count: number; likes: number }>;
  weeklyUtilization: Array<{ day: string; count: number; pct: number }>;
  insights: string[];
  personas: Persona[];
  adaptivePlaylist: SuggestedSong[];
  predictiveRecommendations: PredictiveRecommendation[];
}

export const GestorBIView: React.FC = () => {
  // Tabs & filters state
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "rankings" | "ai" | "export">("overview");
  const [period, setPeriod] = useState<"diario" | "semanal" | "mensal">("semanal");
  const [timeFilter, setTimeFilter] = useState<"todos" | "manha" | "tarde" | "noite">("todos");
  
  // Advanced filters (Documento 06 Seção 12)
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [genre, setGenre] = useState<string>("");
  const [artist, setArtist] = useState<string>("");
  const [persona, setPersona] = useState<string>("");

  // Server state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Table rows for export tab
  const [exportRows, setExportRows] = useState<any[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState<boolean>(false);

  // Retrieve auth token
  const getAuthToken = () => {
    const userRaw = localStorage.getItem("up_play_user");
    let token = "";
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw);
        token = parsed.token || parsed.accessToken || "";
      } catch (_) {}
    }
    if (!token) {
      token = localStorage.getItem("up_play_token") || "";
    }
    return token;
  };

  // Fetch Dashboard Analytics
  const fetchDashboardData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const queryParams = new URLSearchParams({
        period,
        timeFilter,
        ...(ageGroup && { ageGroup }),
        ...(genre && { genre }),
        ...(artist && { artist }),
        ...(persona && { persona }),
      });

      const res = await fetch(`/api/v1/statistics/bi-dashboard?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      } else {
        setError(data.message || "Erro ao carregar dados do BI.");
      }
    } catch (err: any) {
      setError("Não foi possível conectar ao servidor de BI de UP Play.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch report rows for Export Tab
  const fetchExportRows = async () => {
    setIsLoadingRows(true);
    try {
      const token = getAuthToken();
      const queryParams = new URLSearchParams({
        period,
        timeFilter,
        ...(ageGroup && { ageGroup }),
        ...(genre && { genre }),
        ...(artist && { artist }),
        ...(persona && { persona }),
        format: "json"
      });

      const res = await fetch(`/api/v1/statistics/export?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();
      if (data.success) {
        setExportRows(data.rows || []);
      }
    } catch (err) {
      console.error("Error fetching export rows:", err);
    } finally {
      setIsLoadingRows(false);
    }
  };

  // Reload statistics whenever a filter is changed
  useEffect(() => {
    fetchDashboardData();
  }, [period, timeFilter, ageGroup, genre, artist, persona]);

  // Fetch export rows when Export tab is active
  useEffect(() => {
    if (activeSubTab === "export") {
      fetchExportRows();
    }
  }, [activeSubTab, period, timeFilter, ageGroup, genre, artist, persona]);

  // Handle excel/CSV download
  const handleExportCSV = () => {
    const token = getAuthToken();
    const queryParams = new URLSearchParams({
      period,
      timeFilter,
      ...(ageGroup && { ageGroup }),
      ...(genre && { genre }),
      ...(artist && { artist }),
      ...(persona && { persona }),
      format: "csv",
      token // Pass token as query parameter for easy direct download if needed, or trigger download link
    });

    // Create a temporary hidden anchor to trigger download
    const link = document.createElement("a");
    link.href = `/api/v1/statistics/export?${queryParams.toString()}&Bearer=${token}`;
    link.setAttribute("download", `upplay_bi_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger printable view for PDF generation
  const handlePrintPDF = () => {
    window.print();
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
    if (activeSubTab === "export") {
      fetchExportRows();
    }
  };

  // Clean filter parameters
  const handleClearFilters = () => {
    setAgeGroup("");
    setGenre("");
    setArtist("");
    setPersona("");
    setPeriod("semanal");
    setTimeFilter("todos");
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn print:bg-white print:text-black print:p-0">
      
      {/* HEADER WITH FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-6 print:hidden">
        <div>
          <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Módulo Exclusivo de Business Intelligence (BI)
          </span>
          <h2 className="font-display font-bold text-xl text-white mt-2">
            Music Intelligence • Analítica Avançada & IA
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Análise comportamental integrada com IA Adaptativa, IA Preditiva e Personas Automáticas.
          </p>
        </div>

        {/* Refresh controls */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 self-start lg:self-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl text-xs font-semibold text-zinc-300 transition-all border border-zinc-700/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          <span>Atualizar Relatórios</span>
        </button>
      </div>

      {/* DYNAMIC FILTER CONTROL PANEL */}
      <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold text-sm">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Filtros Estratégicos de BI (Seção 12)</span>
          </div>
          {(ageGroup || genre || artist || persona || period !== "semanal" || timeFilter !== "todos") && (
            <button 
              onClick={handleClearFilters}
              className="text-xs text-red-400 hover:text-red-300 font-mono"
            >
              [ LIMPAR FILTROS ]
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          {/* 1. Period */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Período</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
            >
              <option value="diario">Diário (Hoje)</option>
              <option value="semanal">Semanal (7 dias)</option>
              <option value="mensal">Mensal (30 dias)</option>
            </select>
          </div>

          {/* 2. Horário */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Horário / Turno</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
            >
              <option value="todos">Funcionamento Integral</option>
              <option value="manha">Manhã (06:00 - 11:00)</option>
              <option value="tarde">Tarde (12:00 - 17:00)</option>
              <option value="noite">Noite (18:00 - 22:00)</option>
            </select>
          </div>

          {/* 3. Faixa Etária */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Faixa Etária</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
            >
              <option value="">Todas as idades</option>
              <option value="Até 17">Até 17 anos</option>
              <option value="18-25">18–25 anos</option>
              <option value="26-35">26–35 anos</option>
              <option value="36-45">36–45 anos</option>
              <option value="46-60">46–60 anos</option>
              <option value="Acima de 60">Acima de 60 anos</option>
            </select>
          </div>

          {/* 4. Gênero Musical */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Gênero Musical</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
            >
              <option value="">Todos os gêneros</option>
              <option value="Eletrônica">Eletrônica</option>
              <option value="Hip Hop">Hip Hop</option>
              <option value="Rock">Rock</option>
              <option value="Sertanejo">Sertanejo</option>
              <option value="Pop">Pop</option>
              <option value="Funk">Funk</option>
              <option value="Flashback">Flashback</option>
            </select>
          </div>

          {/* 5. Artista */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Artista</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Eminem, Alok, etc..."
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>

          {/* 6. Persona */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Persona Inteligente</label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
            >
              <option value="">Todas as personas</option>
              <option value="Treinadores da Manhã">Treinadores da Manhã</option>
              <option value="Energia do Almoço">Energia do Almoço</option>
              <option value="Treino Intenso">Treino Intenso</option>
            </select>
          </div>

        </div>
      </div>

      {/* SUB TAB NAVIGATION */}
      <div className="flex border-b border-zinc-800 gap-4 overflow-x-auto pb-px print:hidden">
        {[
          { id: "overview", label: "Métricas & Distribuição", icon: BarChart3 },
          { id: "rankings", label: "Top Charts Acumulado", icon: TrendingUp },
          { id: "ai", label: "Music Intelligence (IA)", icon: Sparkles },
          { id: "export", label: "Relatórios & Exportação", icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs transition-all ${
              activeSubTab === tab.id 
                ? "border-emerald-500 text-emerald-400 font-bold" 
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ERROR OR LOADING STATE */}
      {error && (
        <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs p-4 rounded-xl print:hidden">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-24 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-3 print:hidden">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Calculando métricas multidimensionais na central BI...</span>
        </div>
      ) : !dashboardData ? (
        <div className="py-24 text-center text-zinc-500 text-xs border border-dashed border-[#27272a] rounded-2xl print:hidden">
          Nenhum dado retornado do servidor de BI. Tente redefinir os filtros.
        </div>
      ) : (
        <>
          {/* OVERVIEW STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Volume de Pedidos", val: dashboardData.summary.totalRequests, sub: "Sintonizados pelo YouTube/Acervo", color: "text-[#00ff66]", icon: Music },
              { label: "Curtidas Positivas", val: dashboardData.summary.totalLikes, sub: "Likes dados por alunos", color: "text-blue-400", icon: Heart },
              { label: "Dedicatórias", val: dashboardData.summary.totalDedications, sub: "Mensagens entre alunos", color: "text-purple-400", icon: Users },
              { label: "Média de Espera", val: `${dashboardData.summary.avgWaitMinutes} min`, sub: "Tempo médio de reprodução", color: "text-amber-400", icon: Clock }
            ].map((card, i) => (
              <div key={i} className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex items-start justify-between print:border-zinc-300 print:text-black">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">{card.label}</span>
                  <span className={`text-2xl font-black block mt-2 ${card.color} print:text-black`}>{card.val}</span>
                  <span className="text-[10px] text-zinc-400 mt-1 block leading-normal print:text-zinc-700">{card.sub}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-500 shrink-0 print:hidden">
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          {/* ================= SUB TAB: METRICS & DISTRIBUTION ================= */}
          {activeSubTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Hourly Distribution (Bar Chart representation) */}
              <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                <div>
                  <h4 className="font-semibold text-sm text-white print:text-black">Distribuição Horária de Pedidos (Picos)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 print:text-zinc-600">Acompanhamento de sintonias por hora de funcionamento da academia.</p>
                </div>

                <div className="flex flex-col gap-3.5 mt-2">
                  {dashboardData.hourlyDistribution.length === 0 ? (
                    <div className="text-center text-zinc-500 text-xs py-10 font-mono">Nenhum pedido registrado nesta faixa horária.</div>
                  ) : (
                    dashboardData.hourlyDistribution.map((h, i) => {
                      const maxVal = Math.max(...dashboardData.hourlyDistribution.map(item => item.count), 1);
                      const percentage = (h.count / maxVal) * 100;
                      return (
                        <div key={i} className="flex items-center gap-4 text-xs">
                          <span className="w-14 text-zinc-400 font-mono text-[11px] font-bold shrink-0 print:text-black">{h.hour}:00 h</span>
                          <div className="flex-1 bg-zinc-900 h-6 rounded-lg overflow-hidden border border-zinc-850/30 flex items-center pr-3 print:bg-zinc-100">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-700 ease-out print:bg-zinc-600"
                              style={{ width: `${percentage}%` }}
                            />
                            <span className="ml-3 font-mono text-[10px] text-zinc-300 font-bold relative z-10 shrink-0 print:text-black">
                              {h.count} pedidos
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-2 text-[10px] font-mono text-zinc-500 italic bg-[#18181b]/50 border border-dashed border-zinc-850 p-3 rounded-lg leading-normal print:hidden">
                  💡 <strong>OPERAÇÃO:</strong> Use os picos de tráfego para programar disparos de anúncios estratégicos (Seção 12).
                </div>
              </div>

              {/* Genre & Demographics list */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Style ranking */}
                <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                  <div>
                    <h4 className="font-semibold text-sm text-white print:text-black">Participação por Gênero Musical</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 print:text-zinc-600">Representatividade rítmica no período filtrado.</p>
                  </div>

                  <div className="flex flex-col gap-4 mt-2">
                    {dashboardData.genreDistribution.length === 0 ? (
                      <div className="text-center text-zinc-500 text-xs py-8 font-mono">Sem dados de gênero.</div>
                    ) : (
                      dashboardData.genreDistribution.map((style, i) => {
                        const total = dashboardData.summary.totalRequests || 1;
                        const pct = Math.round((style.count / total) * 100);
                        return (
                          <div key={i} className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-300 font-semibold print:text-black">{style.genre}</span>
                              <span className="font-mono text-zinc-400 font-bold print:text-black">{style.count} votos ({pct}%)</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-850/50 print:bg-zinc-200">
                              <div 
                                className="bg-emerald-400 h-full rounded-full transition-all duration-700 print:bg-zinc-600"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Age Group Distribution */}
                <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                  <div>
                    <h4 className="font-semibold text-sm text-white print:text-black">Segmentação Demográfica por Faixa Etária</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 print:text-zinc-600">Participação de alunos dividida por grupo de idade.</p>
                  </div>

                  <div className="flex flex-col gap-3 mt-2">
                    {dashboardData.ageGroupDistribution.length === 0 ? (
                      <div className="text-center text-zinc-500 text-xs py-6 font-mono">Sem dados demográficos.</div>
                    ) : (
                      dashboardData.ageGroupDistribution.map((age, i) => {
                        const total = dashboardData.summary.totalRequests || 1;
                        const pct = Math.round((age.count / total) * 100);
                        return (
                          <div key={i} className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-850/40 text-xs print:bg-zinc-100 print:text-black print:border-zinc-300">
                            <span className="font-medium text-zinc-300 print:text-black">{age.age_group}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-zinc-400 font-bold print:text-black">{age.count} pedidos</span>
                              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/10 font-bold print:bg-zinc-200 print:text-black">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================= SUB TAB: TOP CHARTS ================= */}
          {activeSubTab === "rankings" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Songs Ranking */}
              <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                <div>
                  <h4 className="font-semibold text-sm text-white print:text-black">Músicas Mais Solicitadas (Top 10)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 print:text-zinc-600">As faixas preferidas dos alunos sintonizadas no ecossistema UP Play.</p>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  {dashboardData.songRanking.length === 0 ? (
                    <div className="text-center text-zinc-500 text-xs py-12 font-mono">Nenhuma música registrada com o filtro selecionado.</div>
                  ) : (
                    dashboardData.songRanking.map((song, idx) => (
                      <div key={idx} className="bg-[#18181b]/60 border border-zinc-850/50 p-3 rounded-xl flex items-center justify-between text-xs print:bg-zinc-100 print:border-zinc-300 print:text-black">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono font-bold text-zinc-500 w-5 text-center">#{idx + 1}</span>
                          <div className="truncate">
                            <span className="font-bold text-zinc-200 block truncate print:text-black">{song.title}</span>
                            <span className="text-[10px] text-zinc-500 block truncate print:text-zinc-700">{song.artist} • <span className="font-mono text-zinc-600">{song.genre}</span></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 font-mono text-[10px]">
                          <span className="bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg print:bg-zinc-200 print:text-black">
                            {song.count} pedidos
                          </span>
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/10 flex items-center gap-1 shrink-0 print:bg-zinc-200 print:text-black print:border-none">
                            <Heart className="w-3 h-3 fill-emerald-500 text-emerald-500 print:text-zinc-600 print:fill-zinc-600" />
                            {song.likes} likes
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Artists & Weekly utilization */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Artists ranking */}
                <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                  <div>
                    <h4 className="font-semibold text-sm text-white print:text-black">Artistas Consagrados (Top 10)</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 print:text-zinc-600">Cantores e bandas com maior recorrência de pedidos individuais.</p>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    {dashboardData.artistRanking.length === 0 ? (
                      <div className="text-center text-zinc-500 text-xs py-8 font-mono">Sem dados de artistas.</div>
                    ) : (
                      dashboardData.artistRanking.map((art, idx) => (
                        <div key={idx} className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850/40 flex items-center justify-between text-xs print:bg-zinc-100 print:border-zinc-300 print:text-black">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-zinc-500 w-4">#{idx + 1}</span>
                            <span className="font-semibold text-zinc-200 print:text-black">{art.name}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded print:bg-zinc-200 print:text-black">
                            {art.count} pedidos
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Weekly Utilization */}
                <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                  <div>
                    <h4 className="font-semibold text-sm text-white print:text-black">Adesão Semanal do UP Play</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 print:text-zinc-600">Frequência proporcional de pedidos de música por dia da semana.</p>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-1">
                    {dashboardData.weeklyUtilization.map((item, i) => (
                      <div key={i} className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-xl flex items-center justify-between text-xs print:bg-zinc-100 print:border-zinc-300 print:text-black">
                        <span className="font-semibold text-zinc-200 print:text-black">{item.day}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800 print:bg-zinc-200 print:border-none">
                            <div 
                              className="bg-emerald-500 h-full rounded-full print:bg-zinc-600"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-white text-right w-12 print:text-black">{item.count} ({item.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================= SUB TAB: MUSIC INTELLIGENCE (IA) ================= */}
          {activeSubTab === "ai" && (
            <div className="flex flex-col gap-6">
              
              {/* Sparkles glow banner */}
              <div className="bg-gradient-to-r from-emerald-950/30 to-purple-950/20 border border-emerald-500/15 p-6 rounded-2xl flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between print:hidden">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <BrainCircuit className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                      Motor Cognitivo Music Intelligence Ativo
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed max-w-2xl">
                      A central cognitiva do UP Play avaliou as dezenas de sintonias executadas e gerou uma leitura diagnóstica profunda. A IA adapta o som para reduzir a fadiga de treino e elevar a neurotransmissão coletiva dos atletas.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>GEMINI COGNITIVE CORE</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Insights Area & Playlists (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  
                  {/* AI Insights Card */}
                  <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                    <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                      <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-500/10" />
                      <h4 className="font-semibold text-sm text-white print:text-black">Insights Automáticos da IA (Seção 11)</h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      {dashboardData.insights.map((insight, idx) => (
                        <div key={idx} className="bg-zinc-900/50 border border-zinc-850/40 p-3.5 rounded-xl text-xs text-zinc-300 flex items-start gap-3 leading-relaxed print:bg-zinc-100 print:text-black print:border-zinc-300">
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] mt-0.5 print:bg-zinc-300 print:text-black">
                            {idx + 1}
                          </span>
                          <p>{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adaptive Playlist */}
                  <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-purple-400 fill-purple-500/10" />
                        <h4 className="font-semibold text-sm text-white print:text-black">Playlist Automática • IA Adaptativa (Seção 9)</h4>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-500/15 border border-purple-500/20 px-2.5 py-0.5 rounded uppercase">
                        Sugerida para Turno: {timeFilter === "todos" ? "Integral" : timeFilter}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-normal mb-1 print:text-zinc-600">
                      Montada dinamicamente com base nas preferências coletivas deste horário para sintonizar as caixas de som quando o volume de pedidos dos alunos for baixo.
                    </p>

                    <div className="flex flex-col gap-2.5">
                      {dashboardData.adaptivePlaylist.map((song, idx) => (
                        <div key={idx} className="bg-zinc-900 p-3 rounded-xl border border-zinc-850/50 flex items-center justify-between text-xs print:bg-zinc-100 print:border-zinc-300 print:text-black">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-zinc-500 text-[10px] font-bold">FAIXA {idx + 1}</span>
                            <div>
                              <span className="font-bold text-zinc-200 block print:text-black">{song.titulo}</span>
                              <span className="text-[10px] text-zinc-500 block print:text-zinc-700">{song.artista}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded print:bg-zinc-200 print:text-black">
                            {song.genero}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Personas & Predictive recommendations (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* Personas Inteligentes */}
                  <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                    <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                      <User className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-semibold text-sm text-white print:text-black">Personas Automáticas (Seção 8)</h4>
                    </div>

                    <div className="flex flex-col gap-4">
                      {dashboardData.personas.map((per, idx) => (
                        <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850/50 flex flex-col gap-3 print:bg-zinc-100 print:border-zinc-300 print:text-black">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5 print:text-black">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {per.nome}
                            </span>
                            <span className="text-[8px] font-mono font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded print:bg-zinc-200 print:text-zinc-600">
                              Participação: {per.nivelParticipacao}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400 border-t border-b border-zinc-850/40 py-2 print:border-zinc-300 print:text-zinc-600">
                            <div>
                              <span className="block text-zinc-500 uppercase text-[8px] font-bold">Faixa Horária</span>
                              <span className="font-semibold text-zinc-300 print:text-black truncate block">{per.horario}</span>
                            </div>
                            <div>
                              <span className="block text-zinc-500 uppercase text-[8px] font-bold">Idade Média</span>
                              <span className="font-semibold text-zinc-300 print:text-black block">{per.idadeMedia} anos</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] font-mono uppercase font-bold text-zinc-500">Estilos & Artistas Favoritos</span>
                            <div className="flex flex-wrap gap-1">
                              {per.estilosPredominantes.map((style, sIdx) => (
                                <span key={sIdx} className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded print:bg-zinc-200 print:text-black print:border-none">
                                  {style}
                                </span>
                              ))}
                              {per.artistasFavoritos.map((art, aIdx) => (
                                <span key={aIdx} className="text-[9px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.2 rounded print:bg-zinc-200 print:text-black print:border-none">
                                  {art}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* IA Preditiva */}
                  <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 print:border-zinc-300">
                    <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-semibold text-sm text-white print:text-black">IA Preditiva & Recomendações (Seção 10)</h4>
                    </div>

                    <div className="flex flex-col gap-3.5">
                      {dashboardData.predictiveRecommendations.map((rec, i) => (
                        <div key={i} className="flex flex-col gap-1 text-xs">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 print:text-black">
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            {rec.titulo}
                          </span>
                          <p className="text-[11px] text-zinc-400 pl-5 leading-normal print:text-zinc-600">
                            {rec.descricao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ================= SUB TAB: EXPORT REPORTS ================= */}
          {activeSubTab === "export" && (
            <div className="bg-[#121214] border border-[#27272a] p-6 rounded-2xl flex flex-col gap-6 print:border-none print:bg-white print:text-black print:p-0">
              
              {/* Export Panel Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-5 print:hidden">
                <div>
                  <h4 className="font-semibold text-sm text-white">Central de Exportação de Relatórios</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Baixe arquivos formatados ou envie relatórios de BI auditados para a diretoria.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* CSV Export */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-xs font-bold text-black transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Excel (CSV)</span>
                  </button>

                  {/* Print / PDF Export */}
                  <button
                    onClick={handlePrintPDF}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-700"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir / Gerar PDF</span>
                  </button>
                </div>
              </div>

              {/* Advanced criteria summary print header */}
              <div className="hidden print:flex flex-col gap-2 border-b border-zinc-300 pb-4 mb-4">
                <span className="text-xl font-bold uppercase tracking-wide text-zinc-950">Relatório Auditado de Atividades Rítmicas - UP Play</span>
                <span className="text-xs text-zinc-600">Filtros aplicados: Período: {period} | Turno: {timeFilter} | Gênero: {genre || "Todos"} | Persona: {persona || "Todas"}</span>
                <span className="text-[10px] text-zinc-500 font-mono">Gerado em: {new Date().toLocaleString("pt-BR")} | UP Fitness BI System</span>
              </div>

              {/* Table rendering list */}
              <div className="overflow-x-auto rounded-xl border border-zinc-800 print:border-zinc-300">
                {isLoadingRows ? (
                  <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>Sincronizando logs de auditoria...</span>
                  </div>
                ) : exportRows.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                    Nenhum pedido de música corresponde aos filtros avançados selecionados.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950/80 border-b border-zinc-850 text-zinc-400 font-mono uppercase text-[9px] print:bg-zinc-100 print:text-zinc-800 print:border-zinc-300">
                        <th className="py-3 px-4">Aluno</th>
                        <th className="py-3 px-4">Idade</th>
                        <th className="py-3 px-4">CPF Aluno</th>
                        <th className="py-3 px-4">Música Sintonizada</th>
                        <th className="py-3 px-4">Artista</th>
                        <th className="py-3 px-4">Gênero</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Dedicatória</th>
                        <th className="py-3 px-4">Data Pedido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 print:divide-zinc-200">
                      {exportRows.map((row) => (
                        <tr key={row.request_id} className="hover:bg-zinc-900/20 text-zinc-300 print:text-black print:hover:bg-transparent">
                          <td className="py-3 px-4 font-semibold text-zinc-100 print:text-black">{row.user_name}</td>
                          <td className="py-3 px-4 font-mono">{row.user_age} anos</td>
                          <td className="py-3 px-4 font-mono text-zinc-400 print:text-zinc-700">{formatCpf(row.user_cpf) || "---"}</td>
                          <td className="py-3 px-4 font-bold text-white print:text-black">{row.song_title}</td>
                          <td className="py-3 px-4">{row.song_artist}</td>
                          <td className="py-3 px-4 font-mono text-zinc-500 print:text-zinc-600">{row.song_genre}</td>
                          <td className="py-3 px-4 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === "Finalizada" ? "bg-emerald-500/10 text-emerald-400 print:bg-zinc-200 print:text-black" : "bg-zinc-800 text-zinc-400"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-500 print:text-zinc-600">{row.dedicated ? "Sim" : "Não"}</td>
                          <td className="py-3 px-4 font-mono text-zinc-400 print:text-zinc-700">
                            {new Date(row.requested_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
};
