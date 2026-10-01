import React, { useState } from "react";
import {
  Sparkles, Palette, Type, Layers, Grid, Sliders, Eye, BarChart2, Cpu, Copy, Check,
  Play, Smartphone, Tablet, Monitor, Info, AlertCircle, AlertTriangle, CheckCircle,
  HelpCircle, RefreshCw, ChevronLeft, ChevronRight, CheckSquare, Square, Search, Bell,
  ChevronDown, MessageSquare, Flame, ShieldAlert, Heart, Radio, Volume2, ArrowUpRight
} from "lucide-react";

interface GestorDesignSystemViewProps {
  addLog: (type: string, user: string, content: string, status: "approved" | "flagged", reason: string) => void;
}

export const GestorDesignSystemView: React.FC<GestorDesignSystemViewProps> = ({ addLog }) => {
  // Navigation for Design System Sections
  const [activeSubTab, setActiveSubTab] = useState<
    "concept" | "colors" | "typography" | "components" | "grid-icons" | "accessibility-responsive" | "dashboards" | "ai-director"
  >("concept");

  // State for interactivity
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [customTextPreview, setCustomTextPreview] = useState("UP Play - Som no Máximo, Treino no Extremo");
  const [progressBarVal, setProgressBarVal] = useState(65);
  
  // Custom Modal Simulation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Custom Toast State
  const [toasts, setToasts] = useState<{ id: string; type: "success" | "warning" | "error" | "info"; msg: string }[]>([]);
  
  // Custom Tooltip State
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(2);
  const totalPages = 5;

  // Responsiveness interactive simulator
  const [simulatedDevice, setSimulatedDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  
  // AI Prompt Builder state
  const [aiTarget, setAiTarget] = useState<"card" | "form" | "chart" | "header" | "modal">("card");
  const [aiTone, setAiTone] = useState<"minimalist" | "energetic" | "sporty">("energetic");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(label);
    addLog("Design System", "Gestor", `Copiou ${label} para a área de transferência: ${text}`, "approved", "Acesso ao guia");
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const triggerToast = (type: "success" | "warning" | "error" | "info", msg: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, msg }]);
    addLog("Design System", "Gestor", `Disparou Toast Interativo (${type}): ${msg}`, "approved", "Simulação de UI");
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const generateAIPrompt = () => {
    let componentDesc = "";
    switch (aiTarget) {
      case "card":
        componentDesc = "um Card de Treino / Música Ativa, contendo o título da faixa, intensidade do treino, BPM atual, foto do álbum e um pequeno indicador de progresso.";
        break;
      case "form":
        componentDesc = "um Formulário de Configuração de Playlist, contendo campos para nome da playlist, gênero principal (dropdown), filtro de BPM mínimo/máximo (slider) e um checkbox de segurança cardiovascular.";
        break;
      case "chart":
        componentDesc = "um Gráfico de BI de Engajamento de Alunos por Hora, com barras verticais e marcadores de intensidade e tempo de treino.";
        break;
      case "header":
        componentDesc = "um Header Superior de Navegação, com logo do UP Play, link de status da conexão offline, perfil do gestor e menu rápido de notificações de anúncios.";
        break;
      case "modal":
        componentDesc = "um Modal de Alerta de Frequência Cardíaca Elevada, com aviso chamativo de BPM, dados do aluno, botão de suspensão de áudio imediata e botão de ignorar.";
        break;
    }

    const promptText = `Haja como um Desenvolvedor Front-end Sênior do ecossistema UP Fitness.
Gere o código de um componente React usando Tailwind CSS para o UP Play, respeitando INTEGRALMENTE o Design System oficial (Documento 11).

### DIRETRIZES DE DESIGN SYSTEM APLICAR:
1. **Paleta de Cores Estrita**:
   - Fundo principal: Preto absoluto (#000000) ou tons de cinza extremamente escuros (#09090b, #121214) para garantir estilo premium e esportivo.
   - Cor de Destaque / Oficial: Verde Limão Neon (#CCFF00) para trazer energia, tecnologia e alta visibilidade.
   - Bordas e divisorias: Cinza escuro (#27272a, #3f3f46).
   - Cores auxiliares semânticas: Vermelho (#ef4444) para alertas, Amarelo (#eab308) para avisos, Verde (#22c55e) para confirmações.
2. **Tipografia & Hierarquia**:
   - Utilize a fonte 'Inter' (sans-serif) para legibilidade.
   - Títulos em bold, tracking-tight, tamanho proporcional.
   - Textos de suporte pequenos (text-xs ou text-sm) com cinza médio (#a1a1aa) para contraste equilibrado e ar minimalista.
3. **Estilo & Espaçamento**:
   - Padding e margens baseados em múltiplos de 4px ou 8px (p-4, p-6, m-2, gap-4).
   - Cantos arredondados modernos (rounded-xl ou rounded-2xl).
   - Efeitos hover: transição suave (transition-all duration-300), escala suave (hover:scale-[1.02]) e brilho no verde-limão.
4. **Ícones**:
   - Use Lucide React de forma consistente (stroke-width="2px", visual limpo).
5. **Acessibilidade**:
   - Garanta alto contraste entre texto cinza claro/branco e o fundo preto.
   - Forneça estados :focus visíveis com anel neon (#CCFF00).

### TAREFA ESPECÍFICA:
Por favor, gere ${componentDesc}
Use um estilo visual ${aiTone === "minimalist" ? "extremamente minimalista com bordas finas e muito espaço negativo" : aiTone === "energetic" ? "altamente dinâmico com realces verde limão vibrantes, sombras de neon e visual tecnológico" : "robusto, esportivo e denso, priorizando dados e legibilidade rápida"}.

Retorne apenas o componente React funcional, documentado e estilizado com Tailwind CSS.`;

    setGeneratedPrompt(promptText);
    addLog("Design System", "Gestor", `Gerou Prompt de IA para componente: ${aiTarget}`, "approved", "Diretrizes de IA (Seção 12)");
  };

  return (
    <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 flex flex-col gap-6 w-full text-white animate-fadeIn" id="design-system-container">
      
      {/* HEADER DO DOCUMENTO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-850 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-[#ccff00]/10 p-2.5 rounded-xl border border-[#ccff00]/20">
            <Palette className="w-6 h-6 text-[#ccff00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#ccff00] font-bold uppercase tracking-wider bg-[#ccff00]/10 px-2 py-0.5 rounded-full">DOCUMENTO 11</span>
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">UP PLAY</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Design System & Guia de Identidade Visual</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Padronização de experiência, estética premium, componentes funcionais e diretrizes para IA do ecossistema UP Fitness.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#ccff00]/10 border border-[#ccff00]/30 px-3.5 py-1.5 rounded-xl text-xs text-[#ccff00] font-mono font-semibold">
          <span className="w-2 h-2 bg-[#ccff00] rounded-full animate-ping shrink-0" />
          <span>SISTEMA ATIVO</span>
        </div>
      </div>

      {/* SUB-TAB NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800">
        <button
          onClick={() => setActiveSubTab("concept")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "concept" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>1. Conceito & Marca</span>
        </button>

        <button
          onClick={() => setActiveSubTab("colors")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "colors" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>2. Paleta de Cores</span>
        </button>

        <button
          onClick={() => setActiveSubTab("typography")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "typography" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>3. Tipografia</span>
        </button>

        <button
          onClick={() => setActiveSubTab("components")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "components" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>4. Componentes Playground</span>
        </button>

        <button
          onClick={() => setActiveSubTab("grid-icons")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "grid-icons" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>5. Ícones & Espaçamento</span>
        </button>

        <button
          onClick={() => setActiveSubTab("accessibility-responsive")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "accessibility-responsive" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>6. Acessibilidade & Simulação</span>
        </button>

        <button
          onClick={() => setActiveSubTab("dashboards")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "dashboards" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>7. Dashboards</span>
        </button>

        <button
          onClick={() => setActiveSubTab("ai-director")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "ai-director" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>8. Diretrizes de IA</span>
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}
      <div className="min-h-[500px]">
        
        {/* ===================== SUB-TAB 1: CONCEITO & MARCA ===================== */}
        {activeSubTab === "concept" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BRAND CARD */}
              <div className="bg-[#09090b] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-full filter blur-3xl pointer-events-none" />
                
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-mono font-bold text-[#ccff00] uppercase tracking-widest">Identidade UP Play</span>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-3xl font-extrabold tracking-tight text-white font-sans">UP Play</h4>
                    <span className="text-xs text-zinc-400 font-mono">by UP Fitness</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-2">
                    O <strong>UP Play</strong> é a plataforma centralizadora de som ambiente e inteligência musical (Music Intelligence) para as academias da rede <strong>UP Fitness</strong>. 
                    A marca traduz a convergência entre atividade física de alta performance e tecnologia de transmissão sonora, gerando estímulos personalizados para elevar o foco e bem-estar dos alunos.
                  </p>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
                      <span><strong>Marca-mãe:</strong> UP Fitness (Sinergia de ecossistema)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
                      <span><strong>Estilo Geral:</strong> Premium, minimalista, moderno, altamente esportivo.</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
                      <span><strong>Interface:</strong> Alto contraste com fundo preto e realces fluorescentes de alta energia.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-zinc-850 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span>CONCEITO DE MARCA HOMOLOGADO</span>
                  <span>VERSÃO 1.1</span>
                </div>
              </div>

              {/* CORE VALUES (Energia, Tecnologia, Movimento, Exclusividade, Comunidade, Performance) */}
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-zinc-300 font-mono">6 Pilares de Atitude da Marca</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: "Energia", desc: "Verde Limão Neon vibrante pulsando em contraste estrito com o preto absoluto, evocando adrenalina e foco instantâneo.", icon: Flame, color: "text-amber-400 bg-amber-500/10" },
                    { title: "Tecnologia", desc: "Estruturas de dados em tempo real, transições instantâneas e automações preditivas integradas via Inteligência Artificial.", icon: Cpu, color: "text-[#ccff00] bg-[#ccff00]/10" },
                    { title: "Movimento", desc: "Animações fluidas, barras de progresso ativas e transições dinâmicas que imitam o ritmo biológico do exercício.", icon: RefreshCw, color: "text-emerald-400 bg-emerald-500/10" },
                    { title: "Exclusividade", desc: "Curadoria musical de alta patente, painéis premium fechados de Music Intelligence e controle refinado para administradores.", icon: Sparkles, color: "text-purple-400 bg-purple-500/10" },
                    { title: "Comunidade", desc: "Conexão em tempo real entre alunos e professores através da fila de pedidos e transmissão coordenada nas caixas acústicas.", icon: Info, color: "text-blue-400 bg-blue-500/10" },
                    { title: "Performance", desc: "Métricas rígidas de batimentos cardíacos, volumes regulados por IA para treinos pesados e carregamento assíncrono leve.", icon: BarChart2, color: "text-red-400 bg-red-500/10" }
                  ].map((pilar, idx) => (
                    <div key={idx} className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl flex gap-3 hover:border-zinc-700 transition-all">
                      <div className={`p-2 rounded-lg shrink-0 h-fit ${pilar.color}`}>
                        <pilar.icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h5 className="text-xs font-bold text-white font-sans">{pilar.title}</h5>
                        <p className="text-[10.5px] text-zinc-400 leading-normal">{pilar.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* APLICABILIDADE GERAL */}
            <div className="bg-[#18181b] border border-zinc-850 p-5 rounded-2xl flex flex-col gap-3">
              <h4 className="text-xs font-bold text-zinc-300 font-mono">Consistência e Unidade Visual</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cada módulo do ecossistema UP Fitness deve beber da fonte estética deste Design System. 
                Ao desenhar telas para o aluno ou painéis de monitoramento para a gerência da academia, o visual escuro, 
                esportivo e focado em alta densidade de dados deve se manter preservado, garantindo facilidade de transição cognitiva para os usuários.
              </p>
            </div>
          </div>
        )}

        {/* ===================== SUB-TAB 2: PALETA DE CORES ===================== */}
        {activeSubTab === "colors" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* COLOR CODE EXPLORATION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* COLOR SWATCHES */}
              <div className="md:col-span-8 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Paleta Oficial - Clique para Copiar o Hex</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "Verde Limão Neon", hex: "#CCFF00", role: "Primária (Marca Oficial)", usage: "Elementos de destaque, estados ativos, botões primários e marca.", bgClass: "bg-[#ccff00] text-black" },
                    { name: "Preto Absoluto", hex: "#000000", role: "Primária (Fundo Base)", usage: "Fundo principal de páginas, contrastes extremos.", bgClass: "bg-black text-white border border-zinc-800" },
                    { name: "Branco Puro", hex: "#FFFFFF", role: "Primária (Textos)", usage: "Títulos principais, ícones de alto contraste.", bgClass: "bg-white text-black" },
                    
                    { name: "Zinc 900", hex: "#18181b", role: "Secundária (Cards/Inputs)", usage: "Fundo de blocos, cartões de dados e campos de entrada de formulários.", bgClass: "bg-[#18181b] text-white border border-zinc-800" },
                    { name: "Zinc 800", hex: "#27272a", role: "Secundária (Divisórias)", usage: "Bordas de tabelas, divisórias de seções, contornos em geral.", bgClass: "bg-[#27272a] text-white" },
                    { name: "Zinc 400", hex: "#a1a1aa", role: "Secundária (Textos de Apoio)", usage: "Textos de descrição, metadados de músicas, labels secundárias.", bgClass: "bg-[#a1a1aa] text-black" },
                    
                    { name: "Confirmações (Verde)", hex: "#22c55e", role: "Semântica (Sucesso)", usage: "Toasts de sucesso, ícones de aprovação, logs aprovados.", bgClass: "bg-[#22c55e] text-white" },
                    { name: "Avisos (Amarelo)", hex: "#eab308", role: "Semântica (Aviso)", usage: "Avisos de advertência em BPM, alertas leves, pendências.", bgClass: "bg-[#eab308] text-black" },
                    { name: "Alertas (Vermelho)", hex: "#ef4444", role: "Semântica (Alerta/Erro)", usage: "Alertas críticos, cancelamentos de áudio, logs sinalizados.", bgClass: "bg-[#ef4444] text-white" }
                  ].map((color, index) => (
                    <button
                      key={index}
                      onClick={() => handleCopyText(color.hex, color.name)}
                      className="group flex flex-col bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden hover:border-[#ccff00]/40 transition-all text-left relative"
                    >
                      <div className={`h-24 w-full flex items-end p-3 font-mono font-bold text-xs ${color.bgClass}`}>
                        <div className="flex justify-between items-center w-full bg-black/40 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] text-white">
                          <span>{color.hex}</span>
                          {copiedHex === color.name ? (
                            <Check className="w-3.5 h-3.5 text-[#ccff00]" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                      <div className="p-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{color.name}</span>
                          <span className="text-[9px] font-mono text-zinc-500">{color.role}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal">{color.usage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE COMBINATION TESTER */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono font-mono">Injetor de Contraste Escuro</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4 relative">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">Simulação de Contraste Real</span>
                  
                  {/* Neon on dark test */}
                  <div className="bg-black border border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-[9px] font-mono text-[#ccff00] font-bold uppercase tracking-wider">Combinação A (Oficial)</span>
                    <h5 className="text-sm font-extrabold text-white">UP PLAY PREMIUM MUSIC</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Texto em cinza claro com destaques em <span className="text-[#ccff00] font-bold">Verde Limão Neon</span> sobre fundo preto puro. 
                      Ideal para evitar fadiga ocular na penumbra da academia.
                    </p>
                    <div className="flex gap-2 mt-1">
                      <button className="bg-[#ccff00] text-black hover:bg-[#b3e600] transition-colors text-[10px] font-extrabold px-3 py-1.5 rounded-lg">
                        BOTÃO ATIVO
                      </button>
                      <button className="border border-zinc-700 text-white hover:bg-zinc-900 transition-colors text-[10px] font-bold px-3 py-1.5 rounded-lg">
                        SECUNDÁRIO
                      </button>
                    </div>
                  </div>

                  {/* Gray block contrast test */}
                  <div className="bg-[#18181b] p-4 rounded-xl flex flex-col gap-2">
                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Combinação B (Divisórias)</span>
                    <div className="border-t border-zinc-850 my-1" />
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Info className="w-3.5 h-3.5 text-[#ccff00]" />
                      <span>Fundo Zinc 900 com divisorias Zinc 800</span>
                    </div>
                  </div>

                  {/* Semantic alerts contrast */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-mono font-bold text-red-400 block uppercase">CRÍTICO</span>
                      <span className="text-[10px] font-bold text-red-500">#ef4444</span>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-mono font-bold text-amber-400 block uppercase">AVISO</span>
                      <span className="text-[10px] font-bold text-amber-500">#eab308</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-mono font-bold text-emerald-400 block uppercase">OK</span>
                      <span className="text-[10px] font-bold text-emerald-500">#22c55e</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-dashed border-zinc-800">
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-[#ccff00] shrink-0 mt-0.5" />
                    <span className="text-[10.5px] text-zinc-400 leading-relaxed font-mono">
                      Os testes de contraste atendem ao critério <strong>AA da WCAG</strong> (mínimo de 4.5:1 para texto normal e 3:1 para texto grande) tanto para o Verde Limão Neon quanto para os tons de cinza do fundo.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===================== SUB-TAB 3: TIPOGRAFIA ===================== */}
        {activeSubTab === "typography" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* TYPOGRAPHY PREVIEW SCALE */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-bold text-zinc-300 font-mono">Hierarquia Tipográfica Oficial (Fonte: Inter / Sans-serif)</h4>
                  <span className="text-[10px] font-mono text-zinc-500">PREVIEW INTERATIVO</span>
                </div>

                <div className="flex flex-col gap-6 bg-[#09090b] border border-zinc-800 p-6 rounded-2xl">
                  
                  {/* TÍTULO PRINCIPAL */}
                  <div className="border-b border-zinc-850 pb-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                    <div className="flex flex-col gap-1 w-full md:w-3/4">
                      <span className="text-[9px] font-mono text-[#ccff00] font-bold">TÍTULO (Ex.: font-sans font-extrabold text-3xl tracking-tight text-white)</span>
                      <h1 className="text-3xl font-extrabold tracking-tight text-white">{customTextPreview}</h1>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">30px / Line-Height: 36px</span>
                  </div>

                  {/* SUBTÍTULO */}
                  <div className="border-b border-zinc-850 pb-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                    <div className="flex flex-col gap-1 w-full md:w-3/4">
                      <span className="text-[9px] font-mono text-[#ccff00] font-bold">SUBTÍTULO (Ex.: font-sans font-bold text-lg text-zinc-200)</span>
                      <h2 className="text-lg font-bold text-zinc-200">{customTextPreview}</h2>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">18px / Line-Height: 28px</span>
                  </div>

                  {/* TEXTO CORRIDO */}
                  <div className="border-b border-zinc-850 pb-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                    <div className="flex flex-col gap-1 w-full md:w-3/4">
                      <span className="text-[9px] font-mono text-[#ccff00] font-bold">TEXTO / CORPO (Ex.: font-sans text-xs text-zinc-300 leading-relaxed)</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {customTextPreview}. Este é o padrão para descrições de treinos, anúncios no som, dados de auditoria, históricos e listagens principais de alunos. Mantém excelente contraste e legibilidade reduzida.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">12px / Line-Height: 18px</span>
                  </div>

                  {/* LEGENDAS & METADADOS */}
                  <div className="border-b border-zinc-850 pb-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                    <div className="flex flex-col gap-1 w-full md:w-3/4">
                      <span className="text-[9px] font-mono text-[#ccff00] font-bold">LEGENDAS / MONO (Ex.: font-mono text-[10px] text-zinc-400 tracking-wider uppercase)</span>
                      <span className="font-mono text-[10px] text-zinc-400 tracking-wider uppercase">{customTextPreview}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">10px / Line-Height: 14px</span>
                  </div>

                  {/* BOTÕES */}
                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                    <div className="flex flex-col gap-1 w-full md:w-3/4">
                      <span className="text-[9px] font-mono text-[#ccff00] font-bold">BOTÕES (Ex.: font-sans text-xs font-extrabold uppercase tracking-wide)</span>
                      <div>
                        <button className="bg-[#ccff00] text-black font-sans text-xs font-extrabold uppercase tracking-wide px-4 py-2 rounded-lg">
                          {customTextPreview.substring(0, 16)}
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">12px / Line-Height: 16px</span>
                  </div>

                </div>
              </div>

              {/* TESTER CONTROLS */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Modificar Texto do Preview</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">DIGITE O TEXTO PARA PREVIEW</label>
                    <input
                      type="text"
                      value={customTextPreview}
                      onChange={(e) => setCustomTextPreview(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#ccff00] font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Sugestões de Atletas</span>
                    {[
                      "UP Play - Som no Máximo, Treino no Extremo",
                      "Playlist UP Cardio: 145 BPM - Foco Total",
                      "ALERTA CARDIOVASCULAR: Limite excedido",
                      "Studio Pilates UP Fitness - Novo Lote de Matrículas"
                    ].map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => setCustomTextPreview(sug)}
                        className="text-left text-[11px] text-zinc-400 hover:text-white transition-colors py-1 truncate border-b border-zinc-850"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-[#27272a] text-xs text-zinc-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#ccff00] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Diretriz de Legibilidade:</strong> Evite utilizar fontes serifadas nas telas do UP Play. A rede de academias adota fontes puramente lineares e geométricas para acentuar a atmosfera de tecnologia e esporte.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== SUB-TAB 4: COMPONENTES PLAYGROUND ===================== */}
        {activeSubTab === "components" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* COMPONENT SELECTOR & TEST TOASTS DISPLAY */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-bold text-zinc-300 font-mono">Componentes Homologados e Interativos</h4>
              <span className="text-[10px] font-mono text-[#ccff00] font-bold">CLIQUE NOS ELEMENTOS PARA INTERAGIR</span>
            </div>

            {/* LIVE COMPONENT LIST GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* BUTTONS CARD */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                <span className="text-[9px] font-mono text-[#ccff00] font-bold uppercase tracking-wider">1. Botões (Buttons)</span>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-mono block mb-1">PRIMÁRIO (High Energy Lime)</span>
                    <button 
                      onClick={() => triggerToast("success", "Botão Primário clicado com feedback!")}
                      className="w-full bg-[#ccff00] text-black font-sans text-xs font-extrabold uppercase tracking-wide py-2.5 rounded-xl hover:bg-[#b3e600] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Botão Primário</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[9px] text-zinc-500 font-mono block mb-1">SECUNDÁRIO (Outline Metal)</span>
                    <button 
                      onClick={() => triggerToast("info", "Botão Secundário acionado.")}
                      className="w-full border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 text-white font-sans text-xs font-bold py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                      Botão Secundário
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block mb-1">DANGER / ALERTA</span>
                      <button 
                        onClick={() => triggerToast("error", "Ação crítica de exclusão simulada.")}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-sans text-[11px] font-bold py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Perigo
                      </button>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block mb-1">GHOST / SECRETO</span>
                      <button 
                        onClick={() => triggerToast("warning", "Ação de depuração ativada.")}
                        className="w-full text-zinc-400 hover:text-white hover:bg-zinc-850 font-sans text-[11px] font-medium py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Ghost Button
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* INPUT FIELDS CARD */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                <span className="text-[9px] font-mono text-[#ccff00] font-bold uppercase tracking-wider">2. Campos de Texto (Inputs)</span>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">BUSCA DE MÚSICA (COM ÍCONE)</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Ex.: AC/DC, Hard Rock, Cardio..."
                        className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-xl pl-9 pr-3.5 py-2.5 text-white outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00] font-sans transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1 font-mono">CAMPO DESABILITADO (READONLY)</label>
                    <input
                      type="text"
                      disabled
                      value="API_TOKEN_SECURE_READONLY"
                      className="w-full bg-zinc-950 border border-zinc-900 text-xs rounded-xl px-3.5 py-2.5 text-zinc-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-red-400 block mb-1 font-mono">CAMPO COM ERRO DE VALIDAÇÃO</label>
                    <input
                      type="number"
                      defaultValue="245"
                      className="w-full bg-[#18181b] border border-red-500/50 text-xs rounded-xl px-3.5 py-2 text-white outline-none focus:border-red-500 font-mono"
                    />
                    <span className="text-[9px] text-red-400 block mt-1">O BPM máximo deve estar entre 100 e 210 BPM.</span>
                  </div>
                </div>
              </div>

              {/* CARDS CARD */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                <span className="text-[9px] font-mono text-[#ccff00] font-bold uppercase tracking-wider">3. Cards / Contêineres</span>
                
                <div className="flex flex-col gap-3">
                  {/* LIVE HOVERABLE PREMIUM CARD */}
                  <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl hover:border-[#ccff00]/40 hover:shadow-[0_0_12px_rgba(204,255,0,0.05)] transition-all cursor-pointer group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-mono text-red-400 font-bold uppercase">ALTA INTENSIDADE</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500">PROTÓTIPO CARD</span>
                    </div>
                    
                    <h5 className="text-xs font-bold text-white mt-2 group-hover:text-[#ccff00] transition-colors">Hard Rock Mix UP 2026</h5>
                    <p className="text-[10.5px] text-zinc-400 leading-normal mt-1">Playlist desenhada para treinos de perna e agachamento de alto impacto.</p>
                    
                    <div className="mt-3 pt-3 border-t border-zinc-850 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                      <span>16 MÚSICAS</span>
                      <span>148 BPM MED</span>
                    </div>
                  </div>

                  <div className="bg-[#121214] border border-dashed border-zinc-800 p-3 rounded-xl flex items-center gap-2.5 text-[11px] text-zinc-400 leading-normal">
                    <Info className="w-4 h-4 text-[#ccff00] shrink-0" />
                    <span>Os cards utilizam cantos arredondados de 12px (rounded-xl) por padrão para visual moderno.</span>
                  </div>
                </div>
              </div>

              {/* MODALS & MENUS PLAYGROUND */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                <span className="text-[9px] font-mono text-[#ccff00] font-bold uppercase tracking-wider">4. Modais, Menus & Toasts</span>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-[#18181b] border border-zinc-800 text-xs py-2 rounded-xl text-white font-bold hover:bg-zinc-850 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Abrir Modal de Exemplo</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#ccff00]" />
                  </button>

                  {/* TOAST TRIGGER PANEL */}
                  <div className="border border-zinc-800 bg-black p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-400 block mb-2 text-center uppercase tracking-wider">Testar Toasts Instantâneos</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button 
                        onClick={() => triggerToast("success", "Sincronização de anúncios efetuada!")}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] py-1 rounded hover:bg-[#22c55e]/20 transition-all font-semibold"
                      >
                        Trigger Success
                      </button>
                      <button 
                        onClick={() => triggerToast("warning", "Dispositivo de áudio desconectado.")}
                        className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] py-1 rounded hover:bg-amber-500/20 transition-all font-semibold"
                      >
                        Trigger Warning
                      </button>
                      <button 
                        onClick={() => triggerToast("error", "Bloqueio preventivo de ruído cardiovascular.")}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] py-1 rounded hover:bg-red-500/20 transition-all font-semibold"
                      >
                        Trigger Error
                      </button>
                      <button 
                        onClick={() => triggerToast("info", "Nova versão de software disponível.")}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] py-1 rounded hover:bg-zinc-750 transition-all font-semibold"
                      >
                        Trigger Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PROGRESS BAR & PAGINATION */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                <span className="text-[9px] font-mono text-[#ccff00] font-bold uppercase tracking-wider">5. Barras de Progresso & Paginação</span>
                
                <div className="flex flex-col gap-4">
                  {/* Interactive Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                      <span className="text-zinc-400 uppercase">Progresso do Player</span>
                      <span className="text-[#ccff00] font-bold">{progressBarVal}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-[#ccff00] rounded-full transition-all duration-300 shadow-[0_0_8px_#ccff00]"
                        style={{ width: `${progressBarVal}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <button 
                        onClick={() => setProgressBarVal(Math.max(0, progressBarVal - 10))}
                        className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded hover:text-white"
                      >
                        -10%
                      </button>
                      <button 
                        onClick={() => setProgressBarVal(Math.min(100, progressBarVal + 10))}
                        className="text-[9px] font-mono font-bold text-[#ccff00] bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded hover:text-white"
                      >
                        +10%
                      </button>
                    </div>
                  </div>

                  {/* Pagination Component */}
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Paginação de Registros</span>
                    <div className="bg-black border border-zinc-850 px-3 py-2 rounded-xl flex items-center justify-between">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="p-1 rounded bg-[#18181b] border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`text-[10px] font-bold font-mono w-5 h-5 rounded flex items-center justify-center transition-all ${
                              currentPage === page 
                                ? "bg-[#ccff00] text-black" 
                                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="p-1 rounded bg-[#18181b] border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOOLTIPS & ACTIONS CARD */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[9px] font-mono text-[#ccff00] font-bold uppercase tracking-wider">6. Tooltips & Suporte de UI</span>
                  
                  <div className="flex flex-col gap-4 mt-3">
                    <div className="relative">
                      <button
                        onMouseEnter={() => setActiveTooltip("cardio")}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="w-full bg-[#18181b] border border-zinc-800 text-xs py-2 rounded-xl text-zinc-300 hover:text-white transition-all cursor-help flex items-center justify-center gap-1.5"
                      >
                        <HelpCircle className="w-4 h-4 text-[#ccff00]" />
                        <span>Passe o Mouse para Tooltip</span>
                      </button>

                      {activeTooltip === "cardio" && (
                        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 p-2.5 rounded-lg shadow-xl animate-fadeIn">
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800 rotate-45" />
                          <p className="leading-normal">
                            <strong>Controle Cardiovascular:</strong> O UP Play sincroniza a BPM da música com os limites de segurança configurados para alunos de risco.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-[#121214] p-3 rounded-xl border border-zinc-850">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-[#ccff00]" />
                        <span className="text-xs text-white">Checkbox Ativo</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 opacity-55">
                        <Square className="w-4 h-4 text-zinc-600" />
                        <span className="text-xs text-zinc-400">Checkbox Inativo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="text-[9px] font-mono text-zinc-500 text-right block uppercase">BIBLIOTECA INTERATIVA COMPLETA</span>
              </div>

            </div>

            {/* REAL TOASTS OVERLAY SIMULATION */}
            {toasts.length > 0 && (
              <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
                {toasts.map((toast) => (
                  <div 
                    key={toast.id} 
                    className={`p-3.5 rounded-xl border flex gap-3 shadow-2xl animate-slideUp justify-between items-start bg-black ${
                      toast.type === "success" ? "border-emerald-500/40 text-emerald-300" :
                      toast.type === "warning" ? "border-amber-500/40 text-amber-300" :
                      toast.type === "error" ? "border-red-500/40 text-red-300" : "border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <div className="flex gap-2">
                      {toast.type === "success" && <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />}
                      {toast.type === "warning" && <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />}
                      {toast.type === "error" && <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />}
                      {toast.type === "info" && <Info className="w-4.5 h-4.5 text-blue-400 shrink-0" />}
                      
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-white">Notificação UP Play</span>
                        <p className="text-[11px] font-sans leading-normal">{toast.msg}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                      className="text-[9px] font-mono text-zinc-500 hover:text-white"
                    >
                      [fechar]
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* LIVE MODAL SIMULATION OVERLAY */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-[#121214] border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-scaleIn">
                  <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-bold text-white">Confirmação de Segurança</h4>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="text-zinc-500 hover:text-white text-xs font-mono"
                    >
                      [X]
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Você está prestes a modificar o BPM máximo permitido global de transmissão da academia. Esta ação afeta os filtros dinâmicos ativos em tempo real de todas as caixas de som de treino cardíaco.
                  </p>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 font-mono text-[10px] text-zinc-400">
                    <p>Módulo: Music Intelligence Core</p>
                    <p>Impacto: Elevado (Tempo Real)</p>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      onClick={() => {
                        setIsModalOpen(false);
                        triggerToast("info", "Ação de alteração de BPM cancelada pelo gestor.");
                      }}
                      className="px-3.5 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        setIsModalOpen(false);
                        triggerToast("success", "Parâmetro global homologado no banco de dados.");
                      }}
                      className="px-4 py-2 bg-[#ccff00] text-black hover:bg-[#b3e600] transition-colors rounded-xl text-xs font-extrabold uppercase tracking-wider"
                    >
                      Homologar
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ===================== SUB-TAB 5: ÍCONES & ESPAÇAMENTO ===================== */}
        {activeSubTab === "grid-icons" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* SPACING GRID SCALE */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Grid e Sistema de Espaçamento base 4px / 8px</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Para garantir fluidez e ritmo visual elegante, adotamos um sistema de layout e grids puramente baseado em múltiplos de <strong>4 px</strong> e <strong>8 px</strong>. 
                    Toda margem (margin), preenchimento (padding) e lacuna (gap) deve respeitar a escala abaixo.
                  </p>

                  <div className="flex flex-col gap-3 mt-2">
                    {[
                      { token: "p-1 / gap-1", pixels: "4px", desc: "Espaçamentos microscópicos, pequenas labels e divisórias.", widthClass: "w-4 bg-[#ccff00]" },
                      { token: "p-2 / gap-2", pixels: "8px", desc: "Margens internas de botões, itens de listas compactas.", widthClass: "w-8 bg-[#ccff00]" },
                      { token: "p-4 / gap-4", pixels: "16px", desc: "Espaçamento padrão para contêineres menores e formulários.", widthClass: "w-16 bg-[#ccff00]" },
                      { token: "p-6 / gap-6", pixels: "24px", desc: "Espaçamento de cartões (cards) principais e seções de painel.", widthClass: "w-24 bg-[#ccff00]" },
                      { token: "p-8 / gap-8", pixels: "32px", desc: "Grandes margens de seções e layouts macro de visualização.", widthClass: "w-32 bg-[#ccff00]" },
                      { token: "p-12 / gap-12", pixels: "48px", desc: "Hero banners, espaçamento externo extremo para desktop.", widthClass: "w-48 bg-[#ccff00]" }
                    ].map((space, idx) => (
                      <div key={idx} className="flex items-center gap-4 text-xs">
                        <div className="w-24 font-mono text-[#ccff00] font-bold">{space.token}</div>
                        <div className="w-16 font-mono text-zinc-500 font-semibold">{space.pixels}</div>
                        <div className="grow flex items-center gap-2">
                          <div className={`h-2.5 rounded-full ${space.widthClass} opacity-80`} />
                          <span className="text-[10.5px] text-zinc-400 truncate">{space.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ICON STYLE RULES */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Consistência de Ícones (Biblioteca Lucide)</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Todos os ícones devem compartilhar exatamente a mesma espessura e peso visual. Evite misturar ícones de linhas com ícones totalmente preenchidos na mesma visualização.
                  </p>

                  <div className="grid grid-cols-4 gap-3 text-center mt-1">
                    {[
                      { icon: Radio, name: "Radio" },
                      { icon: Volume2, name: "Volume" },
                      { icon: Heart, name: "Heart" },
                      { icon: Bell, name: "Notification" },
                      { icon: ShieldAlert, name: "Cardio" },
                      { icon: Smartphone, name: "Mobile" },
                      { icon: Info, name: "Info" },
                      { icon: Search, name: "Search" }
                    ].map((ic, i) => (
                      <div key={i} className="bg-[#18181b] border border-zinc-850 p-2.5 rounded-xl flex flex-col items-center gap-1.5 hover:border-zinc-700 transition-colors">
                        <ic.icon className="w-5 h-5 text-[#ccff00]" strokeWidth={2} />
                        <span className="text-[9px] font-mono text-zinc-500 truncate w-full">{ic.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-dashed border-zinc-800 text-[10px] text-zinc-400 leading-relaxed">
                    <strong>Regra de Produção:</strong> Os ícones devem usar <code>strokeWidth: 2</code> por padrão e estarem acompanhados de rótulos visuais curtos (Labels), facilitando a acessibilidade para leitores de tela.
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== SUB-TAB 6: ACESSIBILIDADE & SIMULAÇÃO ===================== */}
        {activeSubTab === "accessibility-responsive" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* RESPONSIVENESS PREVIEW SIMULATOR */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-bold text-zinc-300 font-mono">Simulador Responsivo da Identidade</h4>
                  
                  {/* SIMULATOR CONTROLS */}
                  <div className="flex gap-1.5 bg-[#09090b] border border-zinc-850 p-1 rounded-lg">
                    <button
                      onClick={() => setSimulatedDevice("mobile")}
                      className={`p-1.5 rounded-md transition-all ${simulatedDevice === "mobile" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-white"}`}
                      title="Smartphone View"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSimulatedDevice("tablet")}
                      className={`p-1.5 rounded-md transition-all ${simulatedDevice === "tablet" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-white"}`}
                      title="Tablet View"
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSimulatedDevice("desktop")}
                      className={`p-1.5 rounded-md transition-all ${simulatedDevice === "desktop" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-white"}`}
                      title="Desktop View"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-800 p-4 rounded-2xl flex justify-center items-center min-h-[380px] transition-all relative">
                  <span className="absolute top-2 left-2 text-[9px] font-mono text-zinc-600">Simulação de Tela</span>

                  {/* CHASSIS DESIGN */}
                  <div 
                    className={`bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-500 flex flex-col ${
                      simulatedDevice === "mobile" ? "w-[260px] h-[340px]" :
                      simulatedDevice === "tablet" ? "w-[440px] h-[320px]" : "w-full max-w-xl h-[300px]"
                    }`}
                  >
                    {/* Simulated Screen Header */}
                    <div className="bg-[#121214] border-b border-zinc-850 px-3 py-2 flex justify-between items-center text-[9px] font-mono text-zinc-400 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
                        <span className="font-bold text-white">UP PLAY LIVE</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] bg-zinc-800 px-1 rounded">OFFLINE WORK</span>
                        <span>14:17</span>
                      </div>
                    </div>

                    {/* Simulated Screen Body */}
                    <div className="p-4 flex flex-col gap-3 grow overflow-y-auto justify-center">
                      
                      <div className={`grid gap-3 ${simulatedDevice === "desktop" ? "grid-cols-2" : "grid-cols-1"}`}>
                        <div className="bg-[#18181b] border border-[#27272a] p-3.5 rounded-xl flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[8px] font-mono text-[#ccff00] font-bold uppercase tracking-wider bg-[#ccff00]/10 px-1.5 py-0.5 rounded-md">Atividade Ativa</span>
                            <span className="text-[9px] font-mono text-zinc-500">145 BPM</span>
                          </div>
                          
                          <h6 className="text-[11px] font-bold text-white mt-1.5">Hipertrofia Master UP #44</h6>
                          <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">Foco em contração muscular e intensidade.</p>
                          
                          <div className="h-1 bg-zinc-800 rounded-full mt-2.5 overflow-hidden">
                            <div className="h-full bg-[#ccff00] w-2/3 shadow-[0_0_8px_#ccff00]" />
                          </div>
                        </div>

                        {/* This part only fits in tablet/desktop view simulations */}
                        {simulatedDevice !== "mobile" && (
                          <div className="bg-[#18181b] border border-[#27272a] p-3.5 rounded-xl flex flex-col justify-between">
                            <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Music Intelligence</span>
                            
                            <div className="flex flex-col gap-1.5 mt-2">
                              <div className="flex justify-between items-center text-[9px] font-mono">
                                <span className="text-zinc-400">Energia Média</span>
                                <span className="text-[#ccff00] font-bold">92%</span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-mono">
                                <span className="text-zinc-400">Beatmatch Ativo</span>
                                <span className="text-emerald-400 font-bold">LIGADO</span>
                              </div>
                            </div>

                            <button className="bg-[#ccff00] text-black text-[9px] font-extrabold uppercase py-1 rounded mt-2.5">
                              Configurar Grade
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Simulated Screen Footer */}
                    <div className="bg-[#121214] border-t border-zinc-850 px-3 py-1.5 flex justify-around items-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACCESSIBILITY STANDARDS */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Normas de Acessibilidade Estritas</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <div className="bg-emerald-500/10 p-1.5 rounded text-emerald-400 shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-white">Alto Contraste</span>
                        <p className="text-[10px] text-zinc-400 leading-normal">Fundo preto absoluto garante a proporção de contraste máxima de 21:1 para elementos de texto brancos e verde-neon.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="bg-emerald-500/10 p-1.5 rounded text-emerald-400 shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-white">Tamanho Mínimo de Toque</span>
                        <p className="text-[10px] text-zinc-400 leading-normal">Todos os botões interativos possuem altura mínima de 44px (p-2.5 ou h-11) para evitar cliques incorretos no celular.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="bg-emerald-500/10 p-1.5 rounded text-emerald-400 shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-white">Compatível com Leitores</span>
                        <p className="text-[10px] text-zinc-400 leading-normal">As imagens e botões de controle de áudio herdam <code>aria-label</code> descritivos para leitura de tela automatizada.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-850 pt-3 flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Anel de Foco de Teclado (Focus-ring)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Clique e aperte TAB para testar o anel neon"
                        className="w-full bg-[#18181b] border border-zinc-800 text-[10px] rounded-lg px-3 py-1.5 text-white outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== SUB-TAB 7: BI & DASHBOARDS ===================== */}
        {activeSubTab === "dashboards" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* ACCORDANCE OF CHARTS AND METRICS */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Painéis de BI e Music Intelligence (Paleta Estrita)</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Os gráficos estatísticos do UP Play devem utilizar obrigatoriamente a paleta do Design System. 
                    Isso previne paletas carnavalescas que confundem o administrador e poluem visualmente as televisões e computadores da gerência da academia.
                  </p>

                  {/* VISUAL CUSTOM SVG CHART SHOWCASE */}
                  <div className="bg-black border border-zinc-850 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-400 font-bold uppercase tracking-wider">Volume de Pedidos de Música por Turno</span>
                      <span className="text-[#ccff00] font-bold">TOTAL: 1.482 HOJE</span>
                    </div>

                    {/* Simple, gorgeous SVG bar chart */}
                    <div className="h-44 w-full relative flex items-end justify-between px-6 pt-4 pb-2 border-b border-zinc-800 gap-4 mt-2">
                      {/* Grid Lines in background */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                        <div className="border-b border-white w-full" />
                        <div className="border-b border-white w-full" />
                        <div className="border-b border-white w-full" />
                        <div className="border-b border-white w-full" />
                      </div>

                      {[
                        { label: "Manhã (6h-12h)", value: 78, bpm: "135", color: "#ccff00" },
                        { label: "Almoço (12h-14h)", value: 45, bpm: "120", color: "#a1a1aa" },
                        { label: "Tarde (14h-18h)", value: 58, bpm: "128", color: "#a1a1aa" },
                        { label: "Pico Noite (18h-22h)", value: 95, bpm: "148", color: "#ccff00" },
                        { label: "Corujão (22h-0h)", value: 32, bpm: "115", color: "#a1a1aa" }
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative z-10">
                          {/* Hover Tooltip inside chart */}
                          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 border border-zinc-800 text-[9px] px-2 py-1 rounded text-center shrink-0 w-24">
                            <span className="block text-white font-bold">{bar.value}% Demanda</span>
                            <span className="block text-[#ccff00] font-mono">{bar.bpm} BPM Médio</span>
                          </div>

                          <div 
                            className="w-full rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-[0_0_10px_rgba(204,255,0,0.1)] cursor-pointer"
                            style={{ 
                              height: `${bar.value}%`, 
                              backgroundColor: bar.color 
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Labels for Chart */}
                    <div className="flex justify-between px-6 text-[9px] font-mono text-zinc-500 mt-1">
                      <span>Manhã (6h-12h)</span>
                      <span>Almoço (12h-14h)</span>
                      <span>Tarde (14h-18h)</span>
                      <span>Noite (18h-22h)</span>
                      <span>Corujão (22h-0h)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BI RULES & COMPLIANCE */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Regras de BI</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3.5">
                  <div className="bg-[#18181b] border border-zinc-850 p-3.5 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-[#ccff00] font-bold uppercase tracking-wider">Regra de Escala de Cores</span>
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      Sempre use Verde Limão Neon para a métrica principal (ex.: quantidade de pedidos ativos) e Tons de Cinza/Metálicos para séries secundárias de comparação.
                    </p>
                  </div>

                  <div className="bg-[#18181b] border border-zinc-850 p-3.5 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Métricas de Music Intelligence</span>
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      Gráficos de dispersão de BPM ou correlação de ritmo cardíaco devem colorir marcadores de forma gradual: vermelho apenas se houver risco à saúde.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-dashed border-zinc-850 flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-[#ccff00] shrink-0" />
                    <span className="text-[10.5px] text-zinc-400 leading-relaxed font-mono">
                      Todas as TVs e totens de BI da rede UP Fitness estão calibrados em sRGB para exibir o verde limão oficial na luminosidade perfeita.
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== SUB-TAB 8: DIRETRIZES DE IA ===================== */}
        {activeSubTab === "ai-director" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* IA EXPLANATION AND VALUE */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Diretrizes para Geração de Código via Inteligência Artificial</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    De acordo com a <strong>Seção 12 do Documento 11</strong>, qualquer nova tela ou componente gerado futuramente por IA (como os modelos de linguagem que expandem o ecossistema digital da UP Fitness) deve respeitar integralmente este Design System.
                  </p>

                  <div className="bg-black border border-zinc-850 p-3.5 rounded-xl flex flex-col gap-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Parâmetros do Gerador de Prompt de IA</span>
                    
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">COMPONENTE ALVO</label>
                        <select 
                          value={aiTarget} 
                          onChange={(e) => setAiTarget(e.target.value as any)}
                          className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-lg px-2.5 py-2 text-white font-sans focus:border-[#ccff00] outline-none"
                        >
                          <option value="card">Card de Treino / Música</option>
                          <option value="form">Formulário de Playlists</option>
                          <option value="chart">Gráfico de BI de Engajamento</option>
                          <option value="header">Header Superior de Navegação</option>
                          <option value="modal">Modal de Alerta Cardiovascular</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">ESTILO VISUAL / TOM</label>
                        <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                          <button 
                            onClick={() => setAiTone("minimalist")}
                            className={`text-[9px] py-1 rounded font-bold uppercase ${aiTone === "minimalist" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-white"}`}
                          >
                            Mínimo
                          </button>
                          <button 
                            onClick={() => setAiTone("energetic")}
                            className={`text-[9px] py-1 rounded font-bold uppercase ${aiTone === "energetic" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-white"}`}
                          >
                            Energia
                          </button>
                          <button 
                            onClick={() => setAiTone("sporty")}
                            className={`text-[9px] py-1 rounded font-bold uppercase ${aiTone === "sporty" ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-white"}`}
                          >
                            Esporte
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={generateAIPrompt}
                        className="w-full bg-[#ccff00] hover:bg-[#b3e600] active:scale-95 text-black font-sans text-xs font-extrabold uppercase py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Gerar Prompt do Design System</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* GENERATED PROMPT OUTPUT */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Prompt Copiável para Copilotos & Modelos de Linguagem</h4>
                
                <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between h-[380px]">
                  {generatedPrompt ? (
                    <div className="flex flex-col gap-3 h-full justify-between">
                      <div className="relative group overflow-hidden grow bg-black border border-zinc-850 p-3 rounded-xl">
                        <textarea
                          readOnly
                          value={generatedPrompt}
                          className="w-full h-full bg-transparent outline-none border-none text-[10px] font-mono text-zinc-300 resize-none scrollbar-thin select-all leading-relaxed"
                        />
                        <div className="absolute bottom-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyText(generatedPrompt, "Prompt Copiloto de IA")}
                            className="bg-[#18181b] border border-zinc-800 hover:bg-zinc-800 text-[#ccff00] px-2.5 py-1.5 rounded text-[10px] font-mono font-bold flex items-center gap-1.5"
                          >
                            {copiedHex === "Prompt Copiloto de IA" ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>COPIADO</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>COPIAR PROMPT</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-zinc-500 leading-normal">
                        Copie o prompt acima e injete-o no seu chat de IA favorito (como ChatGPT, Claude, Cursor ou Gemini). 
                        O código gerado virá 100% aderente a este Design System.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full gap-3 border border-dashed border-zinc-800 rounded-xl bg-black/30 p-6">
                      <Sparkles className="w-8 h-8 text-zinc-600 animate-pulse" />
                      <div>
                        <h5 className="text-xs font-bold text-white">Pronto para Gerar</h5>
                        <p className="text-xs text-zinc-500 leading-normal mt-1 max-w-sm">
                          Selecione o componente e o tom desejado no painel ao lado e clique em "Gerar" para obter as instruções técnicas prontas para a IA criar o código.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* CONCLUSÃO DO DESIGN SYSTEM */}
      <div className="bg-[#18181b] p-5 rounded-2xl border border-zinc-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Conclusão do Design System</span>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
            O Design System do <strong>UP Play</strong> serve como referencial primordial para as futuras evoluções e ecossistemas digitais da rede <strong>UP Fitness</strong>. 
            Ele resguarda a união visual, garante o menor tempo de carregamento assíncrono e preserva uma experiência memorável para toda a comunidade de alunos.
          </p>
        </div>
        <div className="shrink-0 text-right font-mono text-[9px] text-zinc-500 flex flex-col gap-1">
          <span>UP FITNESS DIGITAL DEPT</span>
          <span>SISTEMA DE DESIGN V1.1</span>
        </div>
      </div>

    </div>
  );
};
