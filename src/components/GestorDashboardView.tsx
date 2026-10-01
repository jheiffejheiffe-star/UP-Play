import React from "react";
import { 
  BarChart3, Users, Volume2, Megaphone, Trophy, 
  Settings, ShieldAlert, ArrowRight, Activity, Music, 
  Trash2, AlertTriangle, Play, Pause, Zap, CheckCircle, ShieldCheck
} from "lucide-react";
import { GymZone } from "../types";
import { Student } from "./GestorAlunosView";
import { Announcement } from "./GestorAnunciosView";

export interface LogEntry {
  id: string;
  type: string; // "youtube" | "chat" | "auth" | "system"
  userName: string;
  timestamp: string;
  content: string;
  status: "approved" | "flagged";
  reason: string;
}

interface GestorDashboardViewProps {
  setActiveTab: (tab: string) => void;
  zones: GymZone[];
  students: Student[];
  announcements: Announcement[];
  logs: LogEntry[];
  onRemoveLog: (id: string) => void;
  onClearLogs: () => void;
}

export const GestorDashboardView: React.FC<GestorDashboardViewProps> = ({
  setActiveTab,
  zones,
  students,
  announcements,
  logs,
  onRemoveLog,
  onClearLogs
}) => {
  const activeZone = zones[0]; // Primary Musculação zone
  const totalStudents = students.length;
  const activeAdsCount = announcements.filter((a) => a.active).length;
  const blockedCount = students.filter((s) => s.status === "Bloqueado").length;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-4 sm:p-6">
        <div>
          <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Mesa de Operações de Som
          </span>
          <h2 className="font-display font-bold text-lg sm:text-xl text-white mt-2">
            Painel do Gestor UP Play
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Controle a grade horária de anúncios, filtre e gerencie matrículas em lote, e monitore sintonias de áudio em tempo real.
          </p>
        </div>

        {/* Live system status indicator */}
        <div className="flex items-center gap-3 bg-zinc-950 px-3.5 py-2 rounded-2xl border border-zinc-850 self-start md:self-center">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-semibold text-zinc-300">UP CENTRAL ONLINE</span>
        </div>
      </div>

      {/* QUICK METRIC WIDGETS - Mobile 1 Col, Tablet 2 Col, Desktop 4 Col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Sinal de Áudio Ativo", val: "Canal Ativo", sub: "Sala de Musculação (Power Arena)", icon: Volume2, color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" },
          { label: "Alunos Monitorados", val: `${totalStudents} Alunos`, sub: `${blockedCount} bloqueios de proteção`, icon: Users, color: "text-blue-400 bg-blue-500/5 border-blue-500/10" },
          { label: "Carrossel de Anúncios", val: `${activeAdsCount} Ativos`, sub: "Mural rotativo de ofertas", icon: Megaphone, color: "text-amber-400 bg-amber-500/5 border-amber-500/10" },
          { label: "Engajamento BI", val: "94.2% OK", sub: "Média de curtidas positivas", icon: BarChart3, color: "text-purple-400 bg-purple-500/5 border-purple-500/10" }
        ].map((m, i) => (
          <div key={i} className={`bg-[#121214] border rounded-2xl p-4 sm:p-4.5 flex items-start justify-between ${m.color.split(" ").slice(2).join(" ")}`}>
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">{m.label}</span>
              <span className="text-xl font-black text-white block">{m.val}</span>
              <span className="text-[10px] text-zinc-400 block font-sans">{m.sub}</span>
            </div>
            <div className={`p-2.5 rounded-xl ${m.color.split(" ").slice(0, 2).join(" ")} bg-zinc-950 border border-zinc-850 shrink-0`}>
              <m.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* SHORTCUT PANEL (ATALHOS DA TELA 9) */}
      <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl">
        <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-4">
          Atalhos Rápidos de Navegação
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Player", tab: "gestor-player", desc: "Mesa de Som", icon: Volume2, color: "hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]" },
            { label: "Usuários", tab: "gestor-usuarios", desc: "Ver Alunos", icon: Users, color: "hover:border-blue-500/40 hover:bg-blue-500/[0.02]" },
            { label: "Lote", tab: "gestor-usuarios", desc: "Ações Coletivas", icon: ShieldAlert, color: "hover:border-rose-500/40 hover:bg-rose-500/[0.02]" },
            { label: "Anúncios", tab: "gestor-anuncios", desc: "Instagram Feed", icon: Megaphone, color: "hover:border-amber-500/40 hover:bg-amber-500/[0.02]" },
            { label: "Rankings", tab: "rankings", desc: "TOP UP Alunos", icon: Trophy, color: "hover:border-purple-500/40 hover:bg-purple-500/[0.02]" },
            { label: "Business BI", tab: "gestor-bi", desc: "Relatórios", icon: BarChart3, color: "hover:border-pink-500/40 hover:bg-pink-500/[0.02]" },
            { label: "Ajustes", tab: "gestor-config", desc: "Configuração", icon: Settings, color: "hover:border-teal-500/40 hover:bg-teal-500/[0.02]" },
            { label: "Mural Logs", tab: "gestor-dashboard", desc: "Auditoria", icon: Activity, color: "hover:border-zinc-300/40 hover:bg-zinc-100/[0.02]" }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(item.tab)}
              className={`p-3 bg-[#18181b] border border-zinc-850 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer group hover:-translate-y-0.5 ${item.color}`}
            >
              <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
                <item.icon className="w-4 h-4 text-zinc-300 group-hover:text-white" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block truncate">{item.label}</span>
                <span className="text-[9px] text-zinc-500 block truncate leading-normal">{item.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE PLAYER PREVIEW STATUS & LIVE QUEUE (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl relative overflow-hidden flex flex-col gap-4 shadow-xl">
            <div className={`absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-tr ${activeZone.currentSong?.coverGradient || "from-emerald-400/10 to-transparent"} opacity-10 rounded-full filter blur-2xl`} />
            
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3 relative z-10">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                🎧 Monitorando Canal {activeZone.name.split(" - ")[0]}
              </span>
              <button 
                onClick={() => setActiveTab("gestor-player")}
                className="text-[10px] text-zinc-400 hover:text-emerald-400 font-bold flex items-center gap-0.5 font-mono cursor-pointer"
              >
                Mesa de Som <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-tr ${activeZone.currentSong?.coverGradient || "from-zinc-800 to-zinc-900"} flex items-center justify-center text-white font-black text-sm shrink-0 border border-zinc-800 shadow-md`}>
                UP
              </div>
              <div className="truncate text-xs">
                <span className="font-bold text-white block truncate text-sm">{activeZone.currentSong?.title || "Fila de Backup Ativa"}</span>
                <span className="text-emerald-400 font-semibold block truncate mt-0.5">{activeZone.currentSong?.artist || "UP Smart System"}</span>
                <span className="text-[9px] font-mono text-zinc-500 block mt-1">Estilo: {activeZone.currentSong?.genre} • {activeZone.currentSong?.bpm} BPM</span>
              </div>
            </div>

            {/* Simulated Live status and fast volume */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850/50 flex items-center justify-between text-xs font-mono text-zinc-400 relative z-10">
              <span>Fila do Setor:</span>
              <span className="text-zinc-200 font-bold">{activeZone.queue.length} faixas aguardando</span>
            </div>
          </div>

          {/* ACTIVE AD CAMPAIGN OVERVIEW */}
          <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
              <h4 className="font-semibold text-xs text-white uppercase font-mono tracking-wider">Campanhas no Mural</h4>
              <button 
                onClick={() => setActiveTab("gestor-anuncios")}
                className="text-[10px] text-zinc-400 hover:text-amber-400 font-bold font-mono cursor-pointer"
              >
                Gerenciar <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {announcements.map((ad) => (
                <div key={ad.id} className="p-2.5 rounded-xl bg-[#18181b] border border-zinc-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="font-medium text-zinc-300 truncate" title={ad.title}>{ad.title}</span>
                  </div>
                  <span className="text-[9px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded shrink-0">
                    Prioridade {ad.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME AUDIT LOGS & CHAT MODERATION (7 COLS) */}
        <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h4 className="font-semibold text-sm text-white">Central de Monitoramento & Logs</h4>
            </div>

            <button
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className={`text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                logs.length > 0 ? "text-zinc-500 hover:text-red-400" : "text-zinc-700 cursor-not-allowed"
              }`}
            >
              Limpar Monitoramento
            </button>
          </div>

          {/* Audit events feed list */}
          <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="py-20 text-center text-zinc-600 text-xs font-mono border border-dashed border-zinc-800 rounded-xl flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-zinc-700" />
                <span>Nenhum log gerado. O sistema está escaneando de forma segura.</span>
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id}
                  className="bg-[#18181b]/70 border border-zinc-850 p-3 rounded-xl flex items-start justify-between gap-3 text-xs hover:border-zinc-800 transition-all group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Log type badge indicator */}
                    <div className="mt-0.5 shrink-0">
                      {log.status === "flagged" ? (
                        <span className="w-5 h-5 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-[9px]">
                          ⚠️
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[9px]">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 block">
                          {log.userName}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {log.timestamp}
                        </span>
                      </div>
                      
                      <p className="text-zinc-300 mt-1 leading-normal text-[11px]">
                        {log.content}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[8.5px] font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded text-zinc-500 uppercase tracking-wide">
                          Motivo: {log.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveLog(log.id)}
                    className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Remover log da auditoria"
                    aria-label="Remover log da auditoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
