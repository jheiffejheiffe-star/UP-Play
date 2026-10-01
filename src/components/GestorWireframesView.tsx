import React, { useState } from "react";
import {
  Smartphone, Monitor, Tablet, Eye, Users, Music, Megaphone, Image, List, Heart, User, Sparkles, AlertTriangle, ArrowRight,
  Loader2, Search, CheckCircle2, Key, Sliders, Play, ArrowUp, ArrowDown, BarChart2, Check, HelpCircle, WifiOff, Bell, Sparkle,
  Layers, LogIn, Home, GitBranch
} from "lucide-react";

interface GestorWireframesViewProps {
  addLog: (type: string, user: string, content: string, status: "approved" | "flagged", reason: string) => void;
}

export const GestorWireframesView: React.FC<GestorWireframesViewProps> = ({ addLog }) => {
  // --- WIREFRAMES, PROTOTYPES & FLOWS STATE (Doc 10) ---
  const [doc10SelectedTab, setDoc10SelectedTab] = useState<"flows" | "aluno-wireframes" | "gestor-wireframes" | "components-states" | "responsiveness">("flows");
  const [activeAlunoScreen, setActiveAlunoScreen] = useState<"splash" | "login" | "home" | "request" | "player" | "profile" | "notifications">("splash");
  const [activeGestorScreen, setActiveGestorScreen] = useState<"login" | "dashboard" | "users" | "announcements" | "bi">("dashboard");
  const [activeSimState, setActiveSimState] = useState<"loading" | "empty" | "error" | "success" | "offline">("success");
  const [activeSimDevice, setActiveSimDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  
  // Custom interactive state for Gestor screens mockups
  const [alunoSearchTerm, setAlunoSearchTerm] = useState("");
  const [alunoFilterStatus, setAlunoFilterStatus] = useState<"all" | "active" | "blocked">("all");
  const [selectedAlunos, setSelectedAlunos] = useState<string[]>([]);
  const [mockAlunos, setMockAlunos] = useState([
    { id: "1", name: "Lucas Andrade", enrollment: "UP-2026-092", cpf: "123.456.789-01", status: "active", photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&auto=format&q=80" },
    { id: "2", name: "Mariana Souza", enrollment: "UP-2026-118", cpf: "987.654.321-02", status: "active", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&auto=format&q=80" },
    { id: "3", name: "Rodrigo Melo", enrollment: "UP-2026-441", cpf: "456.789.123-03", status: "blocked", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&auto=format&q=80" },
    { id: "4", name: "Ana Beatriz", enrollment: "UP-2026-312", cpf: "321.654.987-04", status: "active", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&auto=format&q=80" }
  ]);
  
  // Custom interactive state for Announcements
  const [mockAnnouncements, setMockAnnouncements] = useState([
    { id: "ann-1", title: "Inauguração Studio Pilates", start: "2026-07-01", end: "2026-07-31", priority: 1, image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&fit=crop&auto=format&q=80" },
    { id: "ann-2", title: "Suplementos Whey Pro UP", start: "2026-07-10", end: "2026-08-10", priority: 2, image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=400&fit=crop&auto=format&q=80" },
    { id: "ann-3", title: "Desafio 30 Dias Seca Gordura", start: "2026-07-15", end: "2026-08-15", priority: 3, image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&fit=crop&auto=format&q=80" }
  ]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-zinc-900 to-black p-6 rounded-2xl border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 text-[10px] font-bold rounded-full font-mono uppercase tracking-wider">
              Documento 10
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">v1.0 • Completo</span>
          </div>
          <h3 className="font-extrabold text-xl text-white tracking-tight">Wireframes, Protótipos & Fluxos de Telas</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Especificações visuais e fluxo de telas para o aplicativo UP Play, orientando a experiência do usuário de forma mobile-first, consistente, moderna e premium para a holding UP Fitness.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 self-stretch md:self-auto justify-center">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 font-mono">STATUS DO PROTÓTIPO</span>
            <span className="text-xs text-[#00ff66] font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#00ff66] rounded-full animate-ping"></span>
              ALTA FIDELIDADE
            </span>
          </div>
        </div>
      </div>

      {/* SECTION NAVIGATION TABS */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/40 p-1.5 rounded-xl gap-1">
        {[
          { id: "flows", label: "Fluxos de Navegação", icon: GitBranch },
          { id: "aluno-wireframes", label: "Protótipos do Aluno (Mobile)", icon: Smartphone },
          { id: "gestor-wireframes", label: "Painel do Gestor (Desktop)", icon: Monitor },
          { id: "components-states", label: "Componentes & Estados", icon: Layers },
          { id: "responsiveness", label: "Responsividade & Conclusão", icon: Tablet }
        ].map((t) => {
          const Icon = t.icon as any;
          return (
            <button
              key={t.id}
              onClick={() => setDoc10SelectedTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                doc10SelectedTab === t.id
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: FLOWS */}
      {doc10SelectedTab === "flows" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ALUNO FLOW */}
          <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="text-[#00ff66] w-4.5 h-4.5" />
                <h4 className="font-bold text-sm text-white">Fluxo Geral do Aluno (UX Journey)</h4>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase">Mobile First</span>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Representação do fluxo sequencial que o aluno da UP Fitness realiza. Clique em qualquer etapa para visualizar os objetivos de interação:
            </p>

            <div className="flex flex-col gap-2 mt-2">
              {[
                { id: "splash", label: "1. Splash Screen", desc: "Abertura com animação da marca e carregamento do ecossistema.", icon: Sparkle },
                { id: "login", label: "2. Login/Cadastro", desc: "Autenticação via CPF, matrícula ou e-mail, integração direta e recuperação.", icon: LogIn },
                { id: "home", label: "3. Home (Lar)", desc: "Anúncios, música atual, próximas músicas, TOP UP e acesso ao perfil.", icon: Home },
                { id: "request", label: "4. Solicitar Música", desc: "Colagem direta do link do YouTube com visualização em tempo real e dedicatórias.", icon: Music },
                { id: "player", label: "5. Fila de Reprodução / Player", desc: "Player imersivo com barra de progresso, curtidas e posição atual.", icon: List },
                { id: "profile", label: "6. Perfil do Aluno", desc: "Painel pessoal com estatísticas, ranking de sintonias e histórico.", icon: User },
                { id: "notifications", label: "7. Notificações", desc: "Alertas push de pedidos atendidos, VIP slots liberados.", icon: Bell }
              ].map((node) => {
                const NodeIcon = node.icon as any;
                const isSelected = activeAlunoScreen === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setActiveAlunoScreen(node.id as any);
                      setDoc10SelectedTab("aluno-wireframes");
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#00ff66]/10 border-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.1)]"
                        : "bg-zinc-950 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-[#00ff66] text-black" : "bg-zinc-900 text-zinc-400"}`}>
                        <NodeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{node.label}</span>
                        <span className="text-[10.5px] text-zinc-400 block mt-0.5">{node.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-zinc-500 font-mono uppercase hidden sm:inline">Ver Protótipo</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#00ff66]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GESTOR FLOW */}
          <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="text-[#00ff66] w-4.5 h-4.5" />
                <h4 className="font-bold text-sm text-white">Fluxo do Gestor (Operational Hub)</h4>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase">Desktop Console</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Caminho de navegação administrativa e supervisão do ecossistema de sonorização UP Play. Clique em qualquer módulo para inspecionar:
            </p>

            <div className="flex flex-col gap-2 mt-2">
              {[
                { id: "login", label: "1. Login Administrativo", desc: "Acesso por credenciais seguras e autenticação.", icon: Key },
                { id: "dashboard", label: "2. Dashboard (Painel)", desc: "Música atual, fila de espera, KPI rápidos e alertas de BPM.", icon: Sliders },
                { id: "users", label: "3. Usuários (Gestão de Alunos)", desc: "Pesquisa, filtros em lote e controle de bloquear/desbloquear.", icon: Users },
                { id: "announcements", label: "4. Gestão de Anúncios", desc: "Upload de imagens, datas de início/fim e prioridade drag/drop.", icon: Megaphone },
                { id: "bi", label: "5. BI / Music Intelligence", desc: "Insights de sintonias, relatórios de gênero por hora e personas.", icon: BarChart2 }
              ].map((node) => {
                const NodeIcon = node.icon as any;
                const isSelected = activeGestorScreen === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setActiveGestorScreen(node.id as any);
                      setDoc10SelectedTab("gestor-wireframes");
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#00ff66]/10 border-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.1)]"
                        : "bg-zinc-950 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-[#00ff66] text-black" : "bg-zinc-900 text-zinc-400"}`}>
                        <NodeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{node.label}</span>
                        <span className="text-[10.5px] text-zinc-400 block mt-0.5">{node.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-zinc-500 font-mono uppercase hidden sm:inline">Ver Protótipo</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#00ff66]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ALUNO WIREFRAMES */}
      {doc10SelectedTab === "aluno-wireframes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: CONTROLS */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-white mb-3 border-b border-zinc-850 pb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#00ff66]" />
                <span>Selecione a Tela (Aluno)</span>
              </h4>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "splash", label: "Splash Screen" },
                  { id: "login", label: "Login / Cadastro" },
                  { id: "home", label: "Home (Lar)" },
                  { id: "request", label: "Solicitar Música" },
                  { id: "player", label: "Player / Fila" },
                  { id: "profile", label: "Perfil do Aluno" },
                  { id: "notifications", label: "Notificações" }
                ].map((scr) => (
                  <button
                    key={scr.id}
                    onClick={() => setActiveAlunoScreen(scr.id as any)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      activeAlunoScreen === scr.id
                        ? "bg-[#00ff66]/15 border border-[#00ff66]/30 text-[#00ff66] font-bold"
                        : "bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-transparent"
                    }`}
                  >
                    <span>{scr.label}</span>
                    <span className="text-[9px] font-mono text-zinc-500">Wireframe</span>
                  </button>
                ))}
              </div>
            </div>

            {/* UX SPEC ANNOTATION */}
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-3">
              <h5 className="font-bold text-xs text-zinc-300 uppercase tracking-wider font-mono">Especificação UX (Doc 10)</h5>
              <div className="text-xs text-zinc-400 space-y-2.5 leading-relaxed">
                {activeAlunoScreen === "splash" && (
                  <p><strong>Splash Screen:</strong> Logo centralizado em fundo de alto contraste. Representa a abertura standalone sem bordas de navegador.</p>
                )}
                {activeAlunoScreen === "login" && (
                  <p><strong>Login:</strong> Campos CPF, Matrícula ou E-mail com suporte a recuperação. Botão Entrar com toque mínimo de 44px.</p>
                )}
                {activeAlunoScreen === "home" && (
                  <p><strong>Home (Lar):</strong> Carrossel de anúncios rotativo, música atual tocando, próximas músicas, ranqueamento TOP UP dinâmico e o proeminente botão "Solicitar Música".</p>
                )}
                {activeAlunoScreen === "request" && (
                  <p><strong>Solicitar Música:</strong> Campo para colar link do YouTube, caixa de preview do vídeo com metadados do vídeo e campo de dedicatória opcional.</p>
                )}
                {activeAlunoScreen === "player" && (
                  <p><strong>Player:</strong> Capa, título, artista, contagem de curtidas interativa, dedicatória e barra de progresso.</p>
                )}
                {activeAlunoScreen === "profile" && (
                  <p><strong>Perfil:</strong> Foto, nome, ranking de fidelidade, pontuação ativa e histórico de pedidos efetuados.</p>
                )}
                {activeAlunoScreen === "notifications" && (
                  <p><strong>Notificações:</strong> Canal rápido para alertar sobre o andamento e aceitação das músicas solicitadas.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: SMARTPHONE PORTRAIT VIEW */}
          <div className="lg:col-span-8 flex justify-center bg-zinc-950 p-6 rounded-2xl border border-zinc-850">
            <div className="w-[340px] h-[640px] bg-black rounded-[40px] border-[8px] border-zinc-800 shadow-[0_0_30px_rgba(0,255,102,0.15)] relative overflow-hidden flex flex-col">
              
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-black flex justify-center items-center z-50">
                <div className="w-24 h-4 bg-zinc-900 rounded-b-xl"></div>
              </div>

              {/* Screen Body */}
              <div className="flex-1 flex flex-col bg-[#0b0b0c] text-white pt-6 overflow-hidden">
                
                {/* STATUS BAR */}
                <div className="px-5 py-1 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span>09:41</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold text-[#00ff66]">5G LTE</span>
                    <div className="w-4 h-2 border border-zinc-500 rounded-sm p-0.5 flex">
                      <div className="w-2/3 h-full bg-[#00ff66]"></div>
                    </div>
                  </div>
                </div>

                {/* VIEWPORT AREA */}
                <div className="flex-1 overflow-y-auto px-4 py-2 relative flex flex-col justify-between">
                  
                  {/* SPLASH SCREEN */}
                  {activeAlunoScreen === "splash" && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 animate-fadeIn">
                      <div className="w-20 h-20 bg-gradient-to-tr from-[#00ff66] to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg mb-4">
                        <Sparkles className="w-10 h-10 text-black" />
                      </div>
                      <h1 className="text-xl font-extrabold tracking-widest text-white">UP PLAY</h1>
                      <p className="text-[9px] text-zinc-500 font-mono tracking-wider mt-1 uppercase">Sintonize seu Treino</p>
                      <div className="mt-8 flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 text-[#00ff66] animate-spin" />
                      </div>
                    </div>
                  )}

                  {/* LOGIN SCREEN */}
                  {activeAlunoScreen === "login" && (
                    <div className="flex-1 flex flex-col justify-center gap-4 py-4 animate-fadeIn">
                      <div className="text-center">
                        <h1 className="text-xl font-black text-white">UP PLAY</h1>
                        <p className="text-[10px] text-zinc-400">Insira suas credenciais de acesso</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">CPF, Matrícula ou E-mail</label>
                          <input type="text" placeholder="000.000.000-00" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white" disabled />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Senha</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white" disabled />
                        </div>
                        <button className="w-full bg-[#00ff66] text-black text-xs font-bold py-2.5 rounded-lg mt-1">Entrar</button>
                      </div>
                      <div className="text-center text-[10px] text-zinc-500">
                        <span>Criar conta</span> • <span>Recuperar senha</span>
                      </div>
                    </div>
                  )}

                  {/* HOME SCREEN */}
                  {activeAlunoScreen === "home" && (
                    <div className="flex-1 flex flex-col gap-3.5 py-1 animate-fadeIn">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                        <div>
                          <span className="text-[8px] font-mono text-[#00ff66] block">BEM-VINDO</span>
                          <h4 className="text-xs font-bold">Lucas Andrade</h4>
                        </div>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800">
                          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&auto=format&q=80" className="w-full h-full object-cover" />
                        </div>
                      </div>

                      {/* Announcement Carousel Preview */}
                      <div className="bg-[#121214] p-2.5 rounded-xl border border-zinc-800">
                        <span className="text-[8px] text-zinc-500 font-mono">ANÚNCIO ATIVO</span>
                        <h5 className="text-[10px] font-bold mt-0.5 text-white">Inauguração Studio Pilates</h5>
                        <p className="text-[9px] text-zinc-400">Reserve sua aula experimental!</p>
                      </div>

                      {/* Playing Now Box */}
                      <div className="bg-[#121214] p-2 rounded-xl border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                            <Music className="w-4.5 h-4.5 text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-[8px] text-red-400 font-bold block uppercase">Tocando Agora</span>
                            <h6 className="text-[10px] font-bold truncate">Blinding Lights</h6>
                            <span className="text-[8px] text-zinc-400 block">The Weeknd</span>
                          </div>
                        </div>
                        <span className="text-[8px] bg-[#00ff66]/15 text-[#00ff66] px-1 py-0.5 rounded">135 BPM</span>
                      </div>

                      {/* Request Button */}
                      <button onClick={() => setActiveAlunoScreen("request")} className="w-full bg-[#00ff66] text-black font-extrabold text-xs py-2 rounded-lg flex items-center justify-center gap-1">
                        <Music className="w-3 h-3" />
                        <span>Solicitar Música</span>
                      </button>

                      {/* TOP UP Sections */}
                      <div>
                        <span className="text-[8px] text-zinc-400 font-bold uppercase block mb-1">TOP UP</span>
                        <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/50 p-0.5 rounded text-[8px] text-center font-bold">
                          <span className="bg-[#00ff66] text-black p-0.5 rounded">Diário</span>
                          <span className="text-zinc-500 p-0.5">Semana</span>
                          <span className="text-zinc-500 p-0.5">30 Dias</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REQUEST SCREEN */}
                  {activeAlunoScreen === "request" && (
                    <div className="flex-1 flex flex-col gap-3.5 py-1 animate-fadeIn justify-between">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-zinc-900">
                          <button onClick={() => setActiveAlunoScreen("home")} className="text-zinc-500 text-xs">←</button>
                          <h4 className="text-xs font-bold">Solicitar Música</h4>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-400 uppercase">Link do YouTube</label>
                          <input type="text" value="https://www.youtube.com/watch?v=kJQP7kiw5Fk" className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white" disabled />
                        </div>
                        <div className="bg-zinc-900 p-2 rounded border border-zinc-800 flex items-center gap-2">
                          <div className="w-8 h-6 bg-zinc-800 rounded flex items-center justify-center">
                            <Image className="w-3.5 h-3.5 text-zinc-500" />
                          </div>
                          <div>
                            <span className="text-[8px] bg-red-500/10 text-red-400 px-1 py-0.2 rounded font-mono block">YT PREVIEW</span>
                            <span className="text-[9.5px] font-bold block truncate">Workout Electro Mix</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-400 uppercase">Dedicatória</label>
                          <input type="text" placeholder="Dedicado ao treino das 18h!" className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white" disabled />
                        </div>
                      </div>
                      <button onClick={() => setActiveAlunoScreen("player")} className="w-full bg-[#00ff66] text-black font-extrabold text-xs py-2 rounded-lg mt-2">
                        Confirmar Pedido
                      </button>
                    </div>
                  )}

                  {/* PLAYER SCREEN */}
                  {activeAlunoScreen === "player" && (
                    <div className="flex-1 flex flex-col justify-between py-1 animate-fadeIn">
                      <div className="text-center">
                        <span className="text-[8px] font-mono text-[#00ff66]">EM REPRODUÇÃO</span>
                      </div>
                      <div className="flex flex-col items-center gap-3 my-auto">
                        <div className="w-32 h-32 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                          <Music className="w-12 h-12 text-emerald-400 animate-pulse" />
                        </div>
                        <div className="text-center">
                          <h4 className="text-xs font-bold text-white">Workout Electro Mix</h4>
                          <p className="text-[10px] text-zinc-400">128 BPM • Posição: #3</p>
                        </div>
                        <button className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-[10px] text-[#00ff66]">
                          <Heart className="w-3 h-3 fill-[#00ff66]" />
                          <span>24 Curtidas</span>
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-[#00ff66] h-full w-1/3"></div>
                        </div>
                        <div className="flex justify-between text-[7px] text-zinc-500 font-mono">
                          <span>01:15</span>
                          <span>03:45</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROFILE SCREEN */}
                  {activeAlunoScreen === "profile" && (
                    <div className="flex-1 flex flex-col gap-3 py-1 animate-fadeIn">
                      <div className="flex flex-col items-center gap-1.5 pb-2 border-b border-zinc-900 text-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-[#00ff66]">
                          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&auto=format&q=80" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">Lucas Andrade</h4>
                          <span className="text-[8px] bg-[#00ff66]/10 text-[#00ff66] px-1.5 py-0.2 rounded font-mono">Ouro • 480 PTS</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-center text-[10px]">
                        <div className="bg-zinc-900 p-1.5 rounded">
                          <span className="text-[#00ff66] font-bold block">18</span>
                          <span className="text-[8px] text-zinc-500 font-mono">Pedidos</span>
                        </div>
                        <div className="bg-zinc-900 p-1.5 rounded">
                          <span className="text-[#00ff66] font-bold block">92</span>
                          <span className="text-[8px] text-zinc-500 font-mono">Curtidas</span>
                        </div>
                      </div>
                      <div className="bg-[#121214] p-2 rounded">
                        <span className="text-[8px] text-zinc-500 block">HISTÓRICO</span>
                        <div className="text-[9px] text-zinc-400 mt-1 space-y-1">
                          <div className="flex justify-between"><span>Blinding Lights</span><span className="text-[#00ff66]">Aprovado</span></div>
                          <div className="flex justify-between"><span>Till I Collapse</span><span className="text-[#00ff66]">Aprovado</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTIFICATIONS SCREEN */}
                  {activeAlunoScreen === "notifications" && (
                    <div className="flex-1 flex flex-col gap-2 py-1 animate-fadeIn">
                      <span className="text-[8px] font-bold text-zinc-400 border-b border-zinc-900 pb-1 uppercase">Notificações</span>
                      <div className="flex flex-col gap-1.5">
                        <div className="bg-zinc-900/50 p-2 rounded text-[10px]">
                          <span className="font-bold text-[#00ff66] block">Aprovada!</span>
                          <p className="text-zinc-400 mt-0.5">Seu pedido Workout Electro Mix foi aceito pelo curador da academia.</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* BOTTOM TAB BAR */}
                <div className="h-11 bg-[#121214] border-t border-zinc-900 flex justify-between items-center px-2">
                  {[
                    { id: "home", label: "Home", icon: Home },
                    { id: "request", label: "Música", icon: Music },
                    { id: "player", label: "Player", icon: Play },
                    { id: "profile", label: "Perfil", icon: User },
                    { id: "notifications", label: "Notif", icon: Bell }
                  ].map((btn) => {
                    const BtnIcon = btn.icon as any;
                    return (
                      <button key={btn.id} onClick={() => setActiveAlunoScreen(btn.id as any)} className={`flex flex-col items-center justify-center gap-0.5 text-[8px] font-bold flex-1 ${activeAlunoScreen === btn.id ? "text-[#00ff66]" : "text-zinc-500"}`}>
                        <BtnIcon className="w-3.5 h-3.5" />
                        <span>{btn.label}</span>
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: GESTOR WIREFRAMES */}
      {doc10SelectedTab === "gestor-wireframes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT CONTROLS */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-white mb-3 border-b border-zinc-850 pb-2 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#00ff66]" />
                <span>Console Gestor</span>
              </h4>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "login", label: "1. Login Gestor" },
                  { id: "dashboard", label: "2. Dashboard Inicial" },
                  { id: "users", label: "3. Gestão de Alunos" },
                  { id: "announcements", label: "4. Gestão de Anúncios" },
                  { id: "bi", label: "5. Dashboards & BI" }
                ].map((gscr) => (
                  <button
                    key={gscr.id}
                    onClick={() => setActiveGestorScreen(gscr.id as any)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      activeGestorScreen === gscr.id
                        ? "bg-[#00ff66]/15 border border-[#00ff66]/30 text-[#00ff66] font-bold"
                        : "bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-transparent"
                    }`}
                  >
                    <span>{gscr.label}</span>
                    <span className="text-[9px] font-mono text-zinc-500">Console</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: DESKTOP SIMULATOR */}
          <div className="lg:col-span-9 bg-zinc-950 p-4 rounded-2xl border border-zinc-850 flex flex-col gap-3">
            <div className="bg-zinc-900 px-4 py-1.5 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
              <span className="text-[#00ff66]">http://play.gestor.upfitness/admin</span>
              <span className="text-zinc-500">Console do Gestor</span>
            </div>

            <div className="bg-[#0b0b0c] rounded-2xl border border-zinc-850 p-5 min-h-[440px] text-white flex flex-col justify-between gap-4">
              
              {/* LOGIN SCREEN */}
              {activeGestorScreen === "login" && (
                <div className="max-w-md mx-auto w-full my-auto flex flex-col gap-4 p-5 bg-zinc-900 rounded-xl border border-zinc-800 animate-fadeIn">
                  <div className="text-center">
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold rounded-full font-mono uppercase">Área Restrita</span>
                    <h3 className="text-sm font-extrabold text-white mt-1">UP Play Gestor Console</h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-zinc-400">Identificador</label>
                      <input type="text" placeholder="gestor.unidade@upfitness.com.br" className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white" disabled />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-zinc-400">Senha</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white" disabled />
                    </div>
                    <button className="w-full bg-[#00ff66] text-black text-xs font-bold py-2 rounded shadow">Acessar Painel</button>
                  </div>
                </div>
              )}

              {/* DASHBOARD INITIAL SCREEN */}
              {activeGestorScreen === "dashboard" && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="border-b border-zinc-800 pb-2">
                    <span className="text-[9px] font-mono text-[#00ff66]">DASHBOARD INICIAL (SEÇÃO 8)</span>
                    <h3 className="text-sm font-extrabold">Indicadores de Desempenho e Alertas</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: "Música Atual", val: "Blinding Lights", sub: "The Weeknd" },
                      { label: "Fila", val: "3 na Fila", sub: "Espere: 12m" },
                      { label: "Pedidos Hoje", val: "142 pedidos", sub: "12 pendentes" },
                      { label: "Membros Ativos", val: "38 alunos", sub: "Sintonizados" },
                      { label: "Média BPM", val: "128 BPM", sub: "BPM Otimizado" }
                    ].map((card, i) => (
                      <div key={i} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                        <span className="text-[8px] text-zinc-500 uppercase block">{card.label}</span>
                        <span className="text-[11px] font-bold block truncate mt-1 text-[#00ff66]">{card.val}</span>
                        <span className="text-[9px] text-zinc-400 block truncate mt-0.5">{card.sub}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-white">Alerta de BPM Muscular Elevado</h5>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Andamento de 178 BPM detectado. O limite para este horário é de 160 BPM para evitar fadiga extrema.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* GESTÃO DE ALUNOS SCREEN */}
              {activeGestorScreen === "users" && (
                <div className="flex flex-col gap-3 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono text-[#00ff66]">GESTÃO DE ALUNOS (SEÇÃO 9)</span>
                      <h3 className="text-sm font-extrabold">Tabela Geral de Usuários</h3>
                    </div>

                    {selectedAlunos.length > 0 && (
                      <div className="flex items-center gap-2 bg-[#00ff66]/10 px-2 py-1 rounded border border-[#00ff66]/20">
                        <span className="text-[9px] font-bold">{selectedAlunos.length} em lote</span>
                        <button 
                          onClick={() => {
                            setMockAlunos(prev => prev.map(a => selectedAlunos.includes(a.id) ? { ...a, status: "blocked" } : a));
                            setSelectedAlunos([]);
                            addLog("CONTR_ACESSO", "admin", `Bloqueou ${selectedAlunos.length} alunos em lote`, "approved", "Conformidade administrativa");
                          }}
                          className="text-[9px] bg-red-600 px-1.5 py-0.5 rounded text-white"
                        >
                          Bloquear
                        </button>
                        <button 
                          onClick={() => {
                            setMockAlunos(prev => prev.map(a => selectedAlunos.includes(a.id) ? { ...a, status: "active" } : a));
                            setSelectedAlunos([]);
                            addLog("CONTR_ACESSO", "admin", `Liberou ${selectedAlunos.length} alunos em lote`, "approved", "Aprovado manual");
                          }}
                          className="text-[9px] bg-[#00ff66] px-1.5 py-0.5 rounded text-black"
                        >
                          Liberar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <input 
                      type="text" 
                      placeholder="Busque por nome, CPF ou matrícula..." 
                      value={alunoSearchTerm}
                      onChange={(e) => setAlunoSearchTerm(e.target.value)}
                      className="md:col-span-8 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                    />
                    <select 
                      value={alunoFilterStatus}
                      onChange={(e) => setAlunoFilterStatus(e.target.value as any)}
                      className="md:col-span-4 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="all">Status: Todos</option>
                      <option value="active">Ativo</option>
                      <option value="blocked">Bloqueado</option>
                    </select>
                  </div>

                  <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-950 text-zinc-500 font-mono text-[8px] uppercase">
                        <tr>
                          <th className="p-2 w-8">
                            <input 
                              type="checkbox" 
                              checked={selectedAlunos.length === mockAlunos.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedAlunos(mockAlunos.map(a => a.id));
                                else setSelectedAlunos([]);
                              }}
                              className="rounded bg-zinc-900 text-[#00ff66]"
                            />
                          </th>
                          <th className="p-2">Nome</th>
                          <th className="p-2">Matrícula</th>
                          <th className="p-2">CPF</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {mockAlunos
                          .filter(a => {
                            const matchSearch = a.name.toLowerCase().includes(alunoSearchTerm.toLowerCase()) || a.cpf.includes(alunoSearchTerm);
                            const matchStatus = alunoFilterStatus === "all" || a.status === alunoFilterStatus;
                            return matchSearch && matchStatus;
                          })
                          .map(aluno => (
                            <tr key={aluno.id} className="hover:bg-zinc-850/35">
                              <td className="p-2">
                                <input 
                                  type="checkbox" 
                                  checked={selectedAlunos.includes(aluno.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedAlunos(p => [...p, aluno.id]);
                                    else setSelectedAlunos(p => p.filter(id => id !== aluno.id));
                                  }}
                                  className="rounded bg-zinc-900 text-[#00ff66]"
                                />
                              </td>
                              <td className="p-2 font-bold">{aluno.name}</td>
                              <td className="p-2 text-zinc-400 font-mono">{aluno.enrollment}</td>
                              <td className="p-2 text-zinc-400">{aluno.cpf}</td>
                              <td className="p-2">
                                <span className={`px-1 rounded text-[9px] uppercase font-bold ${aluno.status === "active" ? "text-[#00ff66] bg-[#00ff66]/10" : "text-red-400 bg-red-400/10"}`}>
                                  {aluno.status === "active" ? "Ativo" : "Bloqueado"}
                                </span>
                              </td>
                              <td className="p-2 text-right">
                                <button 
                                  onClick={() => {
                                    setMockAlunos(prev => prev.map(a => a.id === aluno.id ? { ...a, status: a.status === "active" ? "blocked" : "active" } : a));
                                    addLog("CONTR_ACESSO", "admin", `Alterou status de ${aluno.name}`, "approved", "Conformidade individual");
                                  }}
                                  className="text-[9px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded hover:border-[#00ff66]"
                                >
                                  {aluno.status === "active" ? "Bloquear" : "Liberar"}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ANNOUNCEMENTS SCREEN */}
              {activeGestorScreen === "announcements" && (
                <div className="flex flex-col gap-3 animate-fadeIn">
                  <div className="border-b border-zinc-800 pb-1.5">
                    <span className="text-[9px] font-mono text-[#00ff66]">GESTÃO DE ANÚNCIOS (SEÇÃO 10)</span>
                    <h3 className="text-sm font-extrabold">Campanhas Ativas e Priorização por Ordem</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 flex flex-col gap-2">
                      <span className="text-[9px] text-zinc-500 font-mono">ARRASTAR/MOVER PRIORIDADE</span>
                      {mockAnnouncements
                        .sort((a, b) => a.priority - b.priority)
                        .map((ann, idx) => (
                          <div key={ann.id} className="bg-zinc-900 p-2 rounded-lg border border-zinc-800 flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#00ff66] text-black px-1.5 rounded font-bold font-mono">#{ann.priority}</span>
                              <span className="font-bold truncate max-w-[150px]">{ann.title}</span>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  if (idx === 0) return;
                                  const updated = [...mockAnnouncements];
                                  const t = updated[idx].priority;
                                  updated[idx].priority = updated[idx-1].priority;
                                  updated[idx-1].priority = t;
                                  setMockAnnouncements(updated);
                                }}
                                disabled={idx === 0}
                                className="p-0.5 bg-zinc-950 border border-zinc-800 rounded"
                              >
                                ▲
                              </button>
                              <button 
                                onClick={() => {
                                  if (idx === mockAnnouncements.length - 1) return;
                                  const updated = [...mockAnnouncements];
                                  const t = updated[idx].priority;
                                  updated[idx].priority = updated[idx+1].priority;
                                  updated[idx+1].priority = t;
                                  setMockAnnouncements(updated);
                                }}
                                disabled={idx === mockAnnouncements.length - 1}
                                className="p-0.5 bg-zinc-950 border border-zinc-800 rounded"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="md:col-span-5 bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
                      <span className="text-[9px] text-zinc-400 font-mono">UPLOAD FEED INSTAGRAM</span>
                      <div className="border border-dashed border-zinc-700 rounded p-4 text-center cursor-pointer text-[10px] text-zinc-500 hover:border-[#00ff66]">
                        Arraste imagem do Instagram (.jpg/png)
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[9px] text-zinc-400">
                        <span>Início: 15/07/2026</span>
                        <span>Fim: 15/08/2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BI SCREEN */}
              {activeGestorScreen === "bi" && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="border-b border-zinc-800 pb-2">
                    <span className="text-[9px] font-mono text-[#00ff66]">DASHBOARDS & BI (SEÇÃO 11)</span>
                    <h3 className="text-sm font-extrabold">Music Intelligence Analítico</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850">
                      <span className="text-[8px] text-zinc-500 block">PEDIDOS POR HORÁRIO</span>
                      <div className="flex items-end justify-between h-20 gap-1 mt-2">
                        {[20, 40, 80, 100, 70, 40].map((h, i) => (
                          <div key={i} className="flex-1 bg-[#00ff66] rounded-t" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 space-y-1.5">
                      <span className="text-[8px] text-zinc-500 block">GÊNEROS MUSICAIS %</span>
                      {[
                        { label: "Eletrônica", val: "52%" },
                        { label: "Rock", val: "24%" },
                        { label: "Pop", val: "14%" }
                      ].map((g, idx) => (
                        <div key={idx} className="text-[9px] flex justify-between">
                          <span className="text-zinc-400">{g.label}</span>
                          <span className="text-[#00ff66] font-bold">{g.val}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 space-y-1.5">
                      <span className="text-[8px] text-zinc-500 block">SINTONIA PERSONAS</span>
                      {[
                        { p: "Hiperativos (18-25)", v: "45%" },
                        { p: "Resistência (26-35)", v: "35%" }
                      ].map((p, index) => (
                        <div key={index} className="text-[9.5px] flex justify-between">
                          <span className="text-zinc-300 font-bold">{p.p}</span>
                          <span className="text-[#00ff66] font-mono">{p.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 p-3 rounded-lg border border-[#00ff66]/10 text-[10px] text-zinc-400 leading-normal">
                    💡 <strong>Music Intelligence Insight:</strong> O pico de treino das 18h30 na Musculação exige batidas acima de 128 BPM. O sistema direcionou automaticamente a subfila para Heavy Rock/Eletronic.
                  </div>
                </div>
              )}

              <div className="border-t border-zinc-850 pt-2 flex justify-between text-[8px] text-zinc-500 font-mono">
                <span>Holding UP Fitness Group • © 2026</span>
                <span className="text-[#00ff66]">Seguro via Barramento Central</span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: COMPONENTS & STATES */}
      {doc10SelectedTab === "components-states" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* REUSABLE COMPONENTS */}
          <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
            <h4 className="font-bold text-sm text-white mb-1 border-b border-zinc-850 pb-2 flex items-center gap-2">
              <Layers className="text-[#00ff66] w-4.5 h-4.5" />
              <span>Seção 13: Componentes Reutilizáveis</span>
            </h4>

            <div className="flex flex-col gap-3">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                <span className="text-[8px] text-zinc-500 font-mono block mb-1.5">BOTÕES COMPONENT</span>
                <div className="flex flex-wrap gap-2">
                  <button className="bg-[#00ff66] text-black text-[10px] font-bold px-2.5 py-1.5 rounded">Ativo Primário</button>
                  <button className="bg-zinc-900 text-zinc-500 text-[10px] px-2.5 py-1.5 rounded cursor-not-allowed">Desabilitado</button>
                  <button className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2.5 py-1.5 rounded">Perigo</button>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                <span className="text-[8px] text-zinc-500 font-mono block mb-1">MOCK CARDS</span>
                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded flex items-center gap-2 text-xs">
                  <span className="text-[#00ff66]">♫</span>
                  <div>
                    <span className="font-bold block">Suplemento Whey UP</span>
                    <span className="text-[9px] text-zinc-400 block">Anúncio do carrossel</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                <span className="text-[8px] text-zinc-500 font-mono block mb-1">ALERTAS FEEDBACK</span>
                <div className="bg-[#00ff66]/10 border border-[#00ff66]/20 p-2 rounded text-[10px] text-[#00ff66] flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>Música adicionada com sucesso na fila #4!</span>
                </div>
              </div>
            </div>
          </div>

          {/* SCREEN STATES */}
          <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-white mb-1 border-b border-zinc-850 pb-2 flex items-center gap-2">
                <HelpCircle className="text-[#00ff66] w-4.5 h-4.5" />
                <span>Seção 14: Estados das Telas</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-normal mb-3">
                Selecione um dos cinco estados abaixo para ver a renderização correspondente:
              </p>

              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { id: "loading", label: "Loading" },
                  { id: "empty", label: "Empty" },
                  { id: "error", label: "Erro" },
                  { id: "success", label: "Sucesso" },
                  { id: "offline", label: "Offline" }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setActiveSimState(st.id as any)}
                    className={`py-1.5 px-0.5 rounded text-[9px] font-bold border transition-all ${
                      activeSimState === st.id ? "bg-[#00ff66] text-black border-transparent" : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-900 min-h-[140px] flex flex-col items-center justify-center text-center gap-2">
              {activeSimState === "loading" && (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="w-6 h-6 text-[#00ff66] animate-spin" />
                  <span className="text-xs font-bold mt-1">Carregando sintonias...</span>
                </div>
              )}
              {activeSimState === "empty" && (
                <div className="flex flex-col items-center gap-1 text-zinc-500">
                  <Music className="w-6 h-6" />
                  <span className="text-xs font-bold">Nenhum dado cadastrado</span>
                </div>
              )}
              {activeSimState === "error" && (
                <div className="flex flex-col items-center gap-1 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                  <span className="text-xs font-bold">Falha no processamento do link</span>
                </div>
              )}
              {activeSimState === "success" && (
                <div className="flex flex-col items-center gap-1 text-emerald-400">
                  <Check className="w-6 h-6 bg-emerald-400/10 rounded-full p-1" />
                  <span className="text-xs font-bold">Operação realizada com sucesso!</span>
                </div>
              )}
              {activeSimState === "offline" && (
                <div className="flex flex-col items-center gap-1 text-yellow-400">
                  <WifiOff className="w-6 h-6" />
                  <span className="text-xs font-bold">Sem conexão com a internet</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: RESPONSIVENESS */}
      {doc10SelectedTab === "responsiveness" && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
            <h4 className="font-bold text-sm text-white border-b border-zinc-850 pb-2">
              Seção 15: Responsividade e Resoluções de Dispositivos
            </h4>
            <p className="text-xs text-zinc-400">
              O layout é 100% responsivo para smartphones, tablets e computadores:
            </p>

            <div className="flex justify-center gap-2 max-w-sm mx-auto">
              {[
                { id: "mobile", label: "Mobile", desc: "Smartphone: Área de toque 44px, barra inferior condensada, coluna única." },
                { id: "tablet", label: "Tablet", desc: "Tablet: Bento-grid compactado com visualização em carrossel e painéis." },
                { id: "desktop", label: "Desktop", desc: "Computador: Sidebar fixa, tabelas completas com seleções em lote e painéis BI." }
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveSimDevice(d.id as any)}
                  className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                    activeSimDevice === d.id ? "bg-[#00ff66]/10 text-white border-[#00ff66]" : "bg-zinc-900 text-zinc-500 border-transparent"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-dashed border-zinc-850 text-xs text-zinc-400">
              <span className="font-bold text-white block uppercase mb-1">Adaptação de Resolução:</span>
              {activeSimDevice === "mobile" && "Smartphone: Otimizado para facilidade de uso com toque em movimento."}
              {activeSimDevice === "tablet" && "Tablet: Grades de duas colunas, adaptável para monitores e recepções."}
              {activeSimDevice === "desktop" && "Desktop: Controle denso e painel multi-tabela para supervisão gerencial."}
            </div>
          </div>

          {/* CONCLUSION CALLOUT */}
          <div className="bg-gradient-to-r from-zinc-900 to-black p-6 rounded-2xl border border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#00ff66]" />
              <h4 className="font-bold text-sm text-white">Conclusão do Documento de Interfaces (Documento 10)</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              O projeto visual do UP Play estabelece a harmonia exata entre a tecnologia, a inovação e o alto padrão exclusivo característico do ecossistema UP Fitness. Ao fornecer fluxos lógicos e wireframes mobile-first imersivos inspirados em serviços modernos de streaming de alta fidelidade, o aplicativo garante pouquíssimos cliques para o aluno solicitar sua música, garantindo que o foco principal permaneça na saúde, no treino de alta performance e no bem-estar físico.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
