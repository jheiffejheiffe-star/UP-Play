import React, { useState, useEffect } from "react";
import {
  ShieldAlert, Settings, RefreshCw, Layers, CheckCircle2, AlertTriangle, Play, Pause,
  Terminal, Server, Activity, Users, FileCheck, Check, Clock, RotateCcw, TrendingUp,
  BarChart2, HelpCircle, ChevronRight, Zap, Info, Smartphone, FileText, ArrowRight, X
} from "lucide-react";

interface GestorTestingDeploymentViewProps {
  addLog: (type: string, user: string, content: string, status: "approved" | "flagged", reason: string) => void;
}

export const GestorTestingDeploymentView: React.FC<GestorTestingDeploymentViewProps> = ({ addLog }) => {
  // Navigation for Test Plan Sections
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "environments" | "types-scenarios" | "load-tests" | "approval-rollout" | "metrics-backlog"
  >("overview");

  // --- 1. TEST CONSOLE STATE ---
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SISTEMA] Console de testes inicializado. Pronto para execução.",
    "[INFO] Ambiente atual para execução: Homologação"
  ]);
  const [isTestingRunning, setIsTestingRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [activeTestName, setActiveTestName] = useState("");
  const [testStats, setTestStats] = useState({ passed: 14, failed: 0, pending: 11 });

  // --- 2. FUNCTIONAL SCENARIOS STATE ---
  const [functionalScenarios, setFunctionalScenarios] = useState([
    { id: "scen-1", category: "Auth", title: "Cadastro e login de alunos", status: "passed", detail: "Autenticação via token JWT e verificação de plano UP Fitness." },
    { id: "scen-2", category: "Auth", title: "Recuperação de senha", status: "passed", detail: "Envio de e-mail de redefinição seguro." },
    { id: "scen-3", category: "Core", title: "Solicitação de músicas", status: "passed", detail: "Busca na biblioteca e envio do pedido assíncrono." },
    { id: "scen-4", category: "AI", title: "Moderação por IA (Filtro Profano)", status: "passed", detail: "Filtro automático de letras profanas/explícitas via Gemini API." },
    { id: "scen-5", category: "Core", title: "Regra estrita da fila (3 UP Play : 1 Galera)", status: "passed", detail: "Garantir: 3 músicas UP Play sem repetição + 1 pedido da Fila da Galera, sem interrupções." },
    { id: "scen-6", category: "Social", title: "Curtidas e interações", status: "passed", detail: "Votação em tempo real na fila ativa." },
    { id: "scen-7", category: "Social", title: "Dedicatórias de músicas", status: "passed", detail: "Exibição de dedicatórias customizadas no telão." },
    { id: "scen-8", category: "Social", title: "Rankings semanais de alunos", status: "passed", detail: "Ordenação dos alunos mais ativos e gêneros votados." },
    { id: "scen-9", category: "Admin", title: "Carrossel de anúncios ativos", status: "passed", detail: "Sincronização offline e exibição em lote." },
    { id: "scen-10", category: "Admin", title: "Bloqueio e desbloqueio em lote", status: "pending", detail: "Moderação em lote de alunos com comportamento impróprio." },
    { id: "scen-11", category: "BI", title: "Sincronização de Dashboards BI", status: "pending", detail: "Agregação de dados de reprodução em lote." },
    { id: "scen-12", category: "BI", title: "Geração de relatórios Music Intelligence", status: "pending", detail: "Exportação de PDFs de consumo musical da holding." }
  ]);

  // --- 3. LOAD TEST SIMULATOR ---
  const [loadSimActive, setLoadSimActive] = useState(false);
  const [virtualUsers, setVirtualUsers] = useState(150);
  const [loadStats, setLoadStats] = useState({
    responseTime: 180, // ms
    cpuUsage: 12, // %
    memUsage: 35, // %
    dbConnections: 18,
    errorRate: 0.0 // %
  });
  const [loadHistory, setLoadHistory] = useState<{ uv: number; rt: number }[]>([
    { uv: 100, rt: 150 },
    { uv: 150, rt: 180 }
  ]);

  // --- 4. APPROVAL SIGN-OFF ---
  const [isApprovedByGestor, setIsApprovedByGestor] = useState(false);
  const [approverName, setApproverName] = useState("");
  const [approvedDate, setApprovedDate] = useState("");
  const [approvalHash, setApprovalHash] = useState("");

  // --- TOASTS & MODALS ---
  const [toasts, setToasts] = useState<{ id: string; type: "success" | "warning" | "error" | "info"; msg: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const triggerToast = (type: "success" | "warning" | "error" | "info", msg: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- 5. GRADUAL ROLLOUT STATE ---
  const [rolloutStage, setRolloutStage] = useState(2); // 1 = Prod Hidden, 2 = Internal Tests, 3 = Beta, 4 = General Release
  const [betaUsersCount, setBetaUsersCount] = useState(50);

  // --- 6. SUCCESS METRICS & IEM ---
  const [successMetrics, setSuccessMetrics] = useState({
    activeUsers: 850,
    songRequests: 3420,
    avgResponseTime: 145, // ms
    errorRate: 0.12, // %
    studentEngagement: 88, // %
    autoPlaylistUsage: 94, // %
    iemIndex: 78 // Índice de Engajamento Musical (IEM)
  });

  // --- 7. BACKLOG & BACKLOG DIALOG ---
  const [backlogItems, setBacklogItems] = useState([
    { version: "v1.0", status: "Pronto para Homologação", date: "Julho/2026", features: ["Player centralizado", "Fila 4+1", "Moderação de IA", "Logs de segurança"] },
    { version: "v1.1", status: "Em Planejamento", date: "Agosto/2026", features: ["Ajuste de volume inteligente por decibéis", "Novo carrossel HTML5 para TVs antigas"] },
    { version: "v1.2", status: "Backlog", date: "Setembro/2026", features: ["Integração nativa com catracas UP", "Métricas avançadas de calorias de treino baseadas no BPM"] }
  ]);

  const [rollbackPlan, setRollbackPlan] = useState(
    "Caso ocorra falha crítica em produção: 1) Desviar tráfego de DNS via Cloudflare para o cluster v0.9 (Estável). 2) Executar script de rollback do banco de dados PostgreSQL para preservar transações dos alunos. 3) Notificar equipe de engenharia e iniciar investigação pós-mortem."
  );

  // Load simulator clock
  useEffect(() => {
    let timer: any;
    if (loadSimActive) {
      timer = setInterval(() => {
        // Randomize values based on virtual users count
        const noise = Math.random() * 20 - 10;
        const targetRt = Math.round(100 + (virtualUsers * 0.8) + noise);
        const cpuNoise = Math.round((virtualUsers / 15) + Math.random() * 5);
        const memNoise = Math.round(30 + (virtualUsers / 40) + Math.random() * 2);
        const dbNoise = Math.round(10 + (virtualUsers / 10) + Math.random() * 3);
        const errNoise = virtualUsers > 1500 ? parseFloat((Math.random() * 1.5).toFixed(2)) : 0.0;

        setLoadStats({
          responseTime: targetRt,
          cpuUsage: Math.min(100, Math.max(5, cpuNoise)),
          memUsage: Math.min(100, Math.max(10, memNoise)),
          dbConnections: dbNoise,
          errorRate: errNoise
        });

        setLoadHistory(prev => {
          const updated = [...prev, { uv: virtualUsers, rt: targetRt }];
          if (updated.length > 8) updated.shift();
          return updated;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [loadSimActive, virtualUsers]);

  const executeConsoleTests = () => {
    if (isTestingRunning) return;
    setIsTestingRunning(true);
    setTestProgress(0);
    setConsoleLogs(prev => [...prev, `\n[${new Date().toLocaleTimeString()}] === INICIANDO PIPELINE DE TESTES DE INTEGRAÇÃO ===`]);

    const testsToRun = [
      { name: "Verificação de Ambiente & Conexão Banco PostgreSQL", delay: 800 },
      { name: "Autenticação e Permissão de Usuário Aluno (Doc 09)", delay: 1500 },
      { name: "Regra estrita da Fila de Espera (4 Alunos + 1 Automático)", delay: 2200 },
      { name: "Moderação de Conteúdo Impróprio via IA Gemini", delay: 3000 },
      { name: "Sincronização offline e armazenamento em cache local", delay: 3800 },
      { name: "Cenário de sobrecarga com 500 pedidos simultâneos", delay: 4500 }
    ];

    let currentStep = 0;
    
    const runNext = () => {
      if (currentStep < testsToRun.length) {
        const test = testsToRun[currentStep];
        setActiveTestName(test.name);
        
        setTimeout(() => {
          setConsoleLogs(prev => [
            ...prev,
            `[EXEC] ${test.name}...`,
            `[OK] ${test.name} concluído com sucesso em ${(Math.random() * 120 + 40).toFixed(0)}ms.`
          ]);
          setTestProgress(Math.round(((currentStep + 1) / testsToRun.length) * 100));
          
          // Toggle the functional scenario list item visually to 'passed' if matching
          if (test.name.includes("Fila de Espera")) {
            setFunctionalScenarios(prev => 
              prev.map(s => s.id === "scen-5" ? { ...s, status: "passed" } : s)
            );
            setTestStats(s => ({ ...s, passed: s.passed + 1, pending: s.pending - 1 }));
          }
          if (test.name.includes("offline")) {
            setFunctionalScenarios(prev => 
              prev.map(s => s.id === "scen-10" ? { ...s, status: "passed" } : s)
            );
            setTestStats(s => ({ ...s, passed: s.passed + 1, pending: s.pending - 1 }));
          }

          currentStep++;
          runNext();
        }, test.delay - (currentStep > 0 ? testsToRun[currentStep-1].delay : 0));
      } else {
        setTimeout(() => {
          setIsTestingRunning(false);
          setActiveTestName("");
          setConsoleLogs(prev => [
            ...prev,
            `[INFO] Pipeline concluída. Todos os testes unitários e de integração passaram.`,
            `[SUCESSO] 100% de cobertura de cenários críticos. Pronto para homologação.`
          ]);
          addLog("Qualidade/Testes", "Gestor", "Executou pipeline de testes em lote e obteve aprovação técnica", "approved", "Plano de testes");
        }, 500);
      }
    };

    runNext();
  };

  const handleSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approverName.trim()) return;

    const hash = "SIG-" + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase() + "-" + new Date().getFullYear();
    setIsApprovedByGestor(true);
    setApprovedDate(new Date().toLocaleString());
    setApprovalHash(hash);
    
    addLog("Homologação", "Gestor", `Gestor ${approverName} aprovou formalmente a homologação da versão v1.0`, "approved", "Assinatura digital de release");
  };

  return (
    <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 flex flex-col gap-6 w-full text-white animate-fadeIn" id="testing-deployment-container">
      
      {/* HEADER DO DOCUMENTO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-850 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <FileCheck className="w-6 h-6 text-[#00ff66]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#00ff66] font-bold uppercase tracking-wider bg-[#00ff66]/10 px-2 py-0.5 rounded-full">DOCUMENTO 12</span>
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">UP PLAY</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 font-sans">Plano de Testes, Homologação e Implantação</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Metodologia de garantia de qualidade, ambientes controlados, simulação de carga e homologação de releases da UP Fitness.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#00ff66]/15 border border-[#00ff66]/30 px-3.5 py-1.5 rounded-xl text-xs text-[#00ff66] font-mono font-bold">
          <Server className="w-4 h-4 shrink-0" />
          <span>CI/CD CONNECTED</span>
        </div>
      </div>

      {/* SUB-TAB NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "overview" ? "bg-[#00ff66] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>1. Objetivos & Metodologia</span>
        </button>

        <button
          onClick={() => setActiveSubTab("environments")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "environments" ? "bg-[#00ff66] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>2. Ambientes de Rede</span>
        </button>

        <button
          onClick={() => setActiveSubTab("types-scenarios")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "types-scenarios" ? "bg-[#00ff66] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>3. Tipos & Cenários Funcionais</span>
        </button>

        <button
          onClick={() => setActiveSubTab("load-tests")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "load-tests" ? "bg-[#00ff66] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>4. Testes de Carga</span>
        </button>

        <button
          onClick={() => setActiveSubTab("approval-rollout")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "approval-rollout" ? "bg-[#00ff66] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>5. Homologação & Rollout</span>
        </button>

        <button
          onClick={() => setActiveSubTab("metrics-backlog")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "metrics-backlog" ? "bg-[#00ff66] text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>6. Indicadores & Backlog</span>
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}
      <div className="min-h-[480px]">

        {/* ===================== SUB-TAB 1: OVERVIEW & OBJETIVOS ===================== */}
        {activeSubTab === "overview" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BRAND CARD */}
              <div className="bg-[#09090b] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
                
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-mono font-bold text-[#00ff66] uppercase tracking-widest">Estratégia de Engenharia</span>
                  <h4 className="text-2xl font-extrabold tracking-tight text-white font-sans">Garantia de Qualidade Unificada</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-2">
                    A estratégia de testes do <strong>UP Play</strong> foi desenhada para certificar que a experiência de streaming musical e inserção de anúncios permaneça impecável, resistente a flutuações de conexão e escalável para múltiplos estabelecimentos simultâneos da holding.
                  </p>
                  
                  <div className="mt-4 flex flex-col gap-3">
                    <h5 className="text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider">Objetivos Chave (Seção 1):</h5>
                    {[
                      { title: "Estabilidade & Qualidade Máxima", desc: "Reduzir o tempo de indisponibilidade em horários de pico nas unidades." },
                      { title: "Identificação Precoce de Falhas", desc: "Testes automatizados e CI/CD impedindo bugs em produção." },
                      { title: "Validação das Regras de Negócio", desc: "Verificar regras rígidas como a proporção da fila 4+1 e moderação." },
                      { title: "Experiência do Usuário (UX/UI Premium)", desc: "Transições leves, feedbacks visuais instantâneos e carregamentos rápidos." },
                      { title: "Implantação de Baixo Risco", desc: "Rollout gradual dividindo riscos operacionais de infraestrutura." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-2.5 items-start text-xs text-zinc-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff66] mt-1.5 shrink-0" />
                        <div className="flex flex-col">
                          <span><strong>{item.title}:</strong> <span className="text-zinc-400">{item.desc}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-zinc-850 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span>METODOLOGIA DE QUALIDADE HOMOLOGADA</span>
                  <span>v1.0</span>
                </div>
              </div>

              {/* STATS & PLAYGROUND LAUNCHER */}
              <div className="flex flex-col gap-5">
                <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">CI Pipeline & Integration Console</h4>
                
                {/* PIPELINE WIDGET */}
                <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 relative">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#00ff66]" />
                      <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Console de Integração Contínua</span>
                    </div>
                    {isTestingRunning ? (
                      <span className="text-[10px] text-[#00ff66] font-mono flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>TESTANDO...</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">STANDBY</span>
                    )}
                  </div>

                  {/* Terminal display */}
                  <div className="bg-black border border-zinc-850 p-3.5 rounded-xl font-mono text-[11px] text-zinc-300 h-48 overflow-y-auto flex flex-col gap-1 scrollbar-thin">
                    {consoleLogs.map((log, i) => (
                      <div 
                        key={i} 
                        className={`leading-relaxed whitespace-pre-wrap ${
                          log.startsWith("[OK]") ? "text-emerald-400" :
                          log.startsWith("[EXEC]") ? "text-blue-400 animate-pulse" :
                          log.startsWith("[SUCESSO]") ? "text-emerald-400 font-bold" :
                          log.startsWith("[SISTEMA]") ? "text-[#00ff66]" : "text-zinc-400"
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                    {isTestingRunning && (
                      <div className="text-[#00ff66] text-[10px] font-bold mt-2 animate-pulse">
                        &gt; {activeTestName}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {isTestingRunning && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-400">Progresso dos Testes</span>
                        <span className="text-[#00ff66]">{testProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#00ff66] rounded-full transition-all duration-300"
                          style={{ width: `${testProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={executeConsoleTests}
                      disabled={isTestingRunning}
                      className="flex-1 bg-[#00ff66] hover:bg-[#00dd55] disabled:opacity-50 text-black text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Executar Pipeline de Testes Automatizados</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setConsoleLogs([
                          "[SISTEMA] Console reiniciado.",
                          "[INFO] Pronto para nova bateria de testes."
                        ]);
                        setTestProgress(0);
                        setTestStats({ passed: 14, failed: 0, pending: 11 });
                        setFunctionalScenarios(prev => 
                          prev.map(s => s.id === "scen-5" || s.id === "scen-10" ? { ...s, status: "pending" } : s)
                        );
                      }}
                      disabled={isTestingRunning}
                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"
                      title="Reiniciar logs"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cover summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">PASSADOS</span>
                    <span className="text-xl font-bold text-emerald-400">{testStats.passed}</span>
                  </div>
                  <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">FALHADOS</span>
                    <span className="text-xl font-bold text-red-500">{testStats.failed}</span>
                  </div>
                  <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">PENDENTES</span>
                    <span className="text-xl font-bold text-amber-500">{testStats.pending}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ===================== SUB-TAB 2: AMBIENTES DE REDE ===================== */}
        {activeSubTab === "environments" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="bg-[#18181b] border border-zinc-850 p-5 rounded-2xl">
              <span className="text-[9px] font-mono text-zinc-400 block uppercase">SEÇÃO 2: DIRETRIZ DE AMBIENTES</span>
              <h4 className="text-sm font-bold text-white mt-1">Isolamento e Controle de Código</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Nenhuma modificação de código ou configuração deverá ser publicada diretamente no ambiente de Produção sem validação prévia. 
                Cada release deve progredir linearmente através do pipeline para mitigar riscos de instabilidade do som na academia.
              </p>
            </div>

            {/* THREE ENVIRONMENT CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* DESENVOLVIMENTO */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full filter blur-2xl pointer-events-none" />
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <span className="text-xs font-mono font-bold text-blue-400">01. DESENVOLVIMENTO</span>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded uppercase font-mono font-bold">SANDBOX ATIVO</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">FINALIDADE</span>
                      <span className="text-zinc-300">Testes rápidos locais, prototipação, novas rotas experimentais de IA.</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">BANCO DE DADOS</span>
                      <span className="text-zinc-300 font-mono">SQLite Local / Docker PostgreSQL</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">CONEXÃO OFFLINE</span>
                      <span className="text-zinc-300">Simulação de perdas brutas de internet via DevTools do Chrome.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>URL: ais-dev-up-play.local</span>
                  <span>v1.1.0-alpha</span>
                </div>
              </div>

              {/* HOMOLOGAÇÃO */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <span className="text-xs font-mono font-bold text-amber-400">02. HOMOLOGAÇÃO</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded uppercase font-mono font-bold">STAGING PRONTO</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">FINALIDADE</span>
                      <span className="text-zinc-300">Validação formal de fluxos de telas pelo Gestor e testes de estresse em rede física simulada.</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">BANCO DE DADOS</span>
                      <span className="text-zinc-300 font-mono">PostgreSQL (Staging Cloud SQL)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">CONEXÃO OFFLINE</span>
                      <span className="text-zinc-300">Simulação de latência de 2000ms a 5000ms e cache Service Worker.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>URL: ais-pre-up-play.local</span>
                  <span>v1.0.0-rc2</span>
                </div>
              </div>

              {/* PRODUÇÃO */}
              <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff66]/5 rounded-full filter blur-3xl pointer-events-none" />
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <span className="text-xs font-mono font-bold text-[#00ff66]">03. PRODUÇÃO</span>
                    <span className="text-[9px] bg-[#00ff66]/10 text-[#00ff66] px-1.5 py-0.5 rounded uppercase font-mono font-bold">PROD ATIVO</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">FINALIDADE</span>
                      <span className="text-zinc-300">Disponibilização geral aos alunos das academias rede UP Fitness e TVs de anúncios.</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">BANCO DE DADOS</span>
                      <span className="text-zinc-300 font-mono">PostgreSQL Cloud SQL (Replicação Ativa)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">CONEXÃO OFFLINE</span>
                      <span className="text-zinc-300">Sincronização robusta de anúncios e player resiliente sem travamentos.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>URL: upplay.upfitness.com.br</span>
                  <span>v1.0.0 (Atual)</span>
                </div>
              </div>

            </div>

            {/* PIPELINE INFRASTRUCTURE LOGO */}
            <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">CI/CD PIPELINE FLOW</span>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
                <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-xl text-center text-blue-400 text-xs font-bold w-full sm:w-1/4">
                  Commit Código Dev
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 hidden sm:block" />
                <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl text-center text-amber-400 text-xs font-bold w-full sm:w-1/4">
                  Deploy p/ Staging & Testes
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 hidden sm:block" />
                <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2.5 rounded-xl text-center text-purple-400 text-xs font-bold w-full sm:w-1/4">
                  Homologação do Gestor
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 hidden sm:block" />
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-center text-[#00ff66] text-xs font-bold w-full sm:w-1/4">
                  Rollout Gradual Produção
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ===================== SUB-TAB 3: TIPOS & CENÁRIOS FUNCIONAIS ===================== */}
        {activeSubTab === "types-scenarios" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* GRID OF TEST TYPES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Testes Unitários", desc: "Validação isolada de funções matemáticas do BPM, regras de ordenação de curtidas e algoritmos de filtragem de texto.", tag: "COBERTURA: 85%" },
                { title: "Testes de Integração", desc: "Verificação do fluxo entre o banco PostgreSQL, cache local e sincronização offline com a API central do ecossistema.", tag: "ESTADO: Aprovado" },
                { title: "Testes de APIs", desc: "Validação de endpoints RESTful do player e respostas em formato JSON dos metadados extraídos das músicas.", tag: "CENÁRIOS: 42" },
                { title: "Testes de Interface (UI)", desc: "Verificação de layout, animações suaves de transição entre telas do aluno e TV de anúncios de TVs físicas na academia.", tag: "SQUARE CHECK: OK" },
                { title: "Testes de Responsividade", desc: "Garantia de adaptabilidade gráfica impecável em Smartphones, Tablets e telas de TV panorâmicas em 1080p.", tag: "DENSIDADE: Fluida" },
                { title: "Testes de Desempenho", desc: "Garantia de que o consumo de memória RAM do player Web nas TVs das academias permaneça abaixo de 150MB.", tag: "LATÊNCIA: <50ms" },
                { title: "Testes de Segurança", desc: "Auditoria preventiva contra SQL Injection, XSS e validação de permissões de escopo OAuth e Tokens JWT (Doc 09).", tag: "GRAVIDADE: Nenhuma" },
                { title: "Testes de Acessibilidade", desc: "Contrastes mínimos para alunos com deficiência visual e navegação otimizada por teclado (Critérios AA da WCAG).", tag: "TOQUE MÍNIMO: 44px" },
                { title: "Testes de Regressão", desc: "Execução automatizada de testes anteriores a cada nova atualização para certificar que nada está quebrado.", tag: "ESTADO: Ativo" }
              ].map((type, idx) => (
                <div key={idx} className="bg-[#09090b] border border-zinc-800 p-4 rounded-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-white font-sans">{type.title}</h5>
                      <span className="text-[8px] font-mono font-bold text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 rounded uppercase">
                        {type.tag}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 leading-normal">{type.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* SEÇÃO 4: LISTA INTERATIVA DE CENÁRIOS FUNCIONAIS */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">Cenários Funcionais Críticos (Seção 4)</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Clique nas pendências para marcar como resolvidas manualmente no plano de homologação.</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-mono block">COBERTURA ATUAL</span>
                  <span className="text-xs text-[#00ff66] font-bold">
                    {Math.round((functionalScenarios.filter(s => s.status === "passed").length / functionalScenarios.length) * 100)}% CONCLUÍDO
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {functionalScenarios.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => {
                      if (scen.status === "pending") {
                        setFunctionalScenarios(prev => 
                          prev.map(s => s.id === scen.id ? { ...s, status: "passed" } : s)
                        );
                        setTestStats(s => ({ ...s, passed: s.passed + 1, pending: s.pending - 1 }));
                        triggerToast("success", `Cenário "${scen.title}" aprovado formalmente.`);
                      } else {
                        setFunctionalScenarios(prev => 
                          prev.map(s => s.id === scen.id ? { ...s, status: "pending" } : s)
                        );
                        setTestStats(s => ({ ...s, passed: s.passed - 1, pending: s.pending + 1 }));
                        triggerToast("warning", `Cenário "${scen.title}" retornado ao estado Pendente.`);
                      }
                    }}
                    className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl hover:border-zinc-700 hover:bg-zinc-900 text-left transition-all flex items-start gap-3 group"
                  >
                    <div className="mt-0.5 shrink-0">
                      {scen.status === "passed" ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00ff66]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-600 group-hover:border-[#00ff66] transition-colors" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase">{scen.category}</span>
                        <span className={`text-[9px] font-mono uppercase px-1 rounded ${
                          scen.status === "passed" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                        }`}>
                          {scen.status === "passed" ? "Aprovado" : "Pendente"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-[#00ff66] transition-colors">{scen.title}</span>
                      <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{scen.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ===================== SUB-TAB 4: TESTES DE CARGA SIMULATOR ===================== */}
        {activeSubTab === "load-tests" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="bg-[#18181b] border border-zinc-850 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[9px] font-mono text-zinc-400 block uppercase">SEÇÃO 6: TESTES DE ESTRESSE DA OPERAÇÃO</span>
                <h4 className="text-sm font-bold text-white mt-1 font-sans">Simulação de Horários de Pico</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  Para atestar a robustez do banco de dados PostgreSQL e o tempo de resposta da sincronização offline em lote, simule a atividade simultânea dos alunos enviando pedidos durante os horários de pico e treinos intensos na Sala de Musculação.
                </p>
              </div>

              <button
                onClick={() => {
                  setLoadSimActive(!loadSimActive);
                  addLog("Desempenho", "Gestor", `${!loadSimActive ? "Iniciou" : "Parou"} simulação em tempo real de testes de carga para 150-1000 conexões`, "approved", "Testes de estresse");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase transition-colors flex items-center gap-2 shrink-0 ${
                  loadSimActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[#00ff66] hover:bg-[#00dd55] text-black"
                }`}
              >
                {loadSimActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>PARAR SIMULADOR</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>INICIAR SIMULADOR</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* SLIDER AND GAUGES */}
              <div className="lg:col-span-4 flex flex-col gap-4 bg-[#09090b] border border-zinc-800 p-5 rounded-2xl">
                <div>
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-zinc-400 uppercase font-mono">Usuários Virtuais (Alunos)</span>
                    <span className="text-[#00ff66] font-bold">{virtualUsers} UVs</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={virtualUsers}
                    onChange={(e) => {
                      setVirtualUsers(parseInt(e.target.value));
                      if (!loadSimActive) {
                        // Quick update if static
                        setLoadStats(s => ({
                          ...s,
                          responseTime: Math.round(100 + (parseInt(e.target.value) * 0.75)),
                          cpuUsage: Math.round(parseInt(e.target.value) / 15),
                          memUsage: Math.round(30 + parseInt(e.target.value) / 40),
                          dbConnections: Math.round(10 + parseInt(e.target.value) / 10)
                        }));
                      }
                    }}
                    className="w-full accent-[#00ff66]"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                    <span>50 UVs (Baixo)</span>
                    <span>1000 UVs (Pico Médio)</span>
                    <span>2000 UVs (Sobrecarga)</span>
                  </div>
                </div>

                <div className="border-t border-zinc-850 pt-4 flex flex-col gap-3">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Métricas de Recursos</span>
                  
                  {/* CPU Gauge */}
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-zinc-500">Uso de CPU</span>
                      <span className={`font-bold ${loadStats.cpuUsage > 80 ? "text-red-400" : loadStats.cpuUsage > 50 ? "text-amber-400" : "text-emerald-400"}`}>{loadStats.cpuUsage}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${loadStats.cpuUsage > 80 ? "bg-red-500" : loadStats.cpuUsage > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${loadStats.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  {/* MEMORY Gauge */}
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-zinc-500">Consumo de Memória</span>
                      <span className="text-zinc-300">{loadStats.memUsage}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${loadStats.memUsage}%` }}
                      />
                    </div>
                  </div>

                  {/* DB CONNECTIONS */}
                  <div className="flex justify-between items-center text-xs border-b border-zinc-850 py-1.5 mt-1">
                    <span className="text-zinc-400 font-sans">Conexões ativas no PostgreSQL</span>
                    <span className="font-mono text-white font-bold">{loadStats.dbConnections} pools</span>
                  </div>

                  {/* ERROR RATE */}
                  <div className="flex justify-between items-center text-xs py-1.5">
                    <span className="text-zinc-400 font-sans">Índice de Erros HTTP/WS</span>
                    <span className={`font-mono font-bold ${loadStats.errorRate > 0 ? "text-red-500" : "text-emerald-400"}`}>{loadStats.errorRate}%</span>
                  </div>
                </div>

              </div>

              {/* LIVE LINE GRAPH DISPLAY (CSS based simulated chart for zero extra libraries weight) */}
              <div className="lg:col-span-8 bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">Latência do Player e Sincronização</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Tempo médio de resposta das requisições de música baseado nos usuários simultâneos.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 font-mono block">MEDIDA EM TEMPO REAL</span>
                      <span className={`text-lg font-bold font-mono ${
                        loadStats.responseTime > 1000 ? "text-red-400" : loadStats.responseTime > 500 ? "text-amber-400" : "text-emerald-400"
                      }`}>{loadStats.responseTime}ms</span>
                    </div>
                  </div>

                  {/* Visual Chart Bars Container */}
                  <div className="h-44 mt-6 flex items-end justify-between border-b border-l border-zinc-850 pb-2 pl-2 relative">
                    
                    {/* Horizontal helper lines */}
                    <div className="absolute left-0 right-0 top-0 border-t border-zinc-900 border-dashed text-[8px] font-mono text-zinc-600 pt-0.5 pointer-events-none">
                      <span>Limite Crítico (1500ms)</span>
                    </div>
                    <div className="absolute left-0 right-0 top-1/2 border-t border-zinc-900 border-dashed text-[8px] font-mono text-zinc-600 pt-0.5 pointer-events-none">
                      <span>Limite Aceitável (750ms)</span>
                    </div>

                    {loadHistory.map((item, idx) => {
                      // Normalize height (max 1500ms is 100%)
                      const heightPct = Math.min(100, (item.rt / 1500) * 100);
                      const barColor = item.rt > 1200 ? "bg-red-500/80" : item.rt > 700 ? "bg-amber-500/80" : "bg-emerald-500/80";
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group px-1">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-300 px-1.5 py-0.5 rounded pointer-events-none z-10 text-center">
                            <div>{item.rt}ms</div>
                            <div className="text-zinc-500">{item.uv} Alunos</div>
                          </div>
                          
                          <div 
                            className={`w-full rounded-t ${barColor} transition-all duration-500 hover:opacity-100`}
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[8px] font-mono text-zinc-500 block truncate w-full text-center">
                            {item.uv} UVs
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-850 text-xs text-zinc-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Conclusão do Teste de Carga:</strong> O sistema mantém latência sub-segundo (&lt;500ms) com até 800 alunos ativos fazendo requisições consecutivas. Sob estresse extremo (2000 UVs), o cluster do Express viga buffers com enfileiramento sem perdas de chamadas.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== SUB-TAB 5: HOMOLOGAÇÃO & IMPLANTAÇÃO ===================== */}
        {activeSubTab === "approval-rollout" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* HOMOLOGAÇÃO DO GESTOR FORM */}
              <div className="bg-[#09090b] border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                  <FileCheck className="w-4.5 h-4.5 text-[#00ff66]" />
                  <span className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider">Homologação Formal do Gestor</span>
                </div>
                
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Conforme a <strong>Seção 7 (Critérios de Aprovação)</strong> do Documento 12, o UP Play só poderá ser publicado em produção definitiva quando o Gestor Geral atestar e assinar formalmente a versão correspondente.
                </p>

                {isApprovedByGestor ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm font-bold text-white">TERMO DE HOMOLOGAÇÃO ATIVO</span>
                    </div>
                    
                    <div className="flex flex-col gap-2 text-xs text-zinc-300 font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">GESTOR DE IMPLANTAÇÃO</span>
                        <span className="text-white font-sans font-bold text-sm">{approverName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">DATA E HORA DO ASSINATURA</span>
                        <span className="text-white">{approvedDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">HASH DIGITAL SHA-256 SIMULADO</span>
                        <span className="text-emerald-400 font-bold">{approvalHash}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsApprovedByGestor(false);
                        setApproverName("");
                        addLog("Homologação", "Gestor", "Cancelou termo de homologação para nova revisão de código", "approved", "Revisão requerida");
                      }}
                      className="mt-2 text-center text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors py-1 hover:underline"
                    >
                      CANCELAR HOMOLOGAÇÃO / REABRIR REVISÃO
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSignOff} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Nome do Gestor Responsável</label>
                      <input
                        type="text"
                        placeholder="Ex.: Jheiffe Jheiffe, Gerente Geral UP Fitness"
                        required
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#00ff66] font-sans"
                      />
                    </div>

                    <div className="flex flex-col gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Declaração de Conformidade</span>
                      <p className="text-[10.5px] text-zinc-400 leading-normal">
                        Declaro para os devidos fins operacionais que validei os fluxos de áudio, segurança, moderação automática de IA e limites de BPM do UP Play, considerando a versão v1.0 apta para disponibilização na infraestrutura física da academia.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#00ff66] hover:bg-[#00dd55] text-black font-sans text-xs font-extrabold uppercase tracking-wide py-3 rounded-xl cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Homologar e Assinar Termo de Publicação</span>
                    </button>
                  </form>
                )}
              </div>

              {/* SEÇÃO 8: IMPLANTAÇÃO GRADUAL STEPPER */}
              <div className="bg-[#09090b] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-zinc-850 pb-3 mb-4">
                    <Layers className="w-4.5 h-4.5 text-[#00ff66]" />
                    <span className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider">Estratégia de Implantação Gradual (Seção 8)</span>
                  </div>

                  <div className="flex flex-col gap-5">
                    {[
                      { step: 1, title: "Ambiente de Produção Ativo", desc: "Código empacotado no container Cloud Run, protegido com variáveis de ambiente fechadas.", badge: "INFRAESTRUTURA" },
                      { step: 2, title: "Testes Internos Privados", desc: "Validação efetuada pelos professores, gerência e equipe técnica local nas caixas da academia de testes.", badge: "ALINHAMENTO OPERACIONAL" },
                      { step: 3, title: "Liberação Controlada (Beta)", desc: "Estreia para um grupo reduzido de alunos convidados visando validar comportamento real de celulares.", badge: "DADOS REALÍSTICOS" },
                      { step: 4, title: "Lançamento Geral UP Fitness", desc: "Expansão para todos os alunos matriculados ativos em todas as esteiras, salas de ginástica e TVs.", badge: "PRODUÇÃO FINAL" }
                    ].map((st) => (
                      <button
                        key={st.step}
                        onClick={() => {
                          setRolloutStage(st.step);
                          addLog("Implantação", "Gestor", `Alterou fase de rollout para Etapa ${st.step}: ${st.title}`, "approved", "Gerência de implantação");
                          triggerToast("info", `Rollout atualizado para a Etapa ${st.step}.`);
                        }}
                        className={`text-left flex gap-3 p-3 rounded-xl border transition-all ${
                          rolloutStage === st.step
                            ? "bg-zinc-900 border-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.05)]"
                            : rolloutStage > st.step
                            ? "bg-[#09090b]/40 border-emerald-900/30 opacity-70"
                            : "bg-[#09090b] border-zinc-850 opacity-40 hover:opacity-70"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                          rolloutStage === st.step 
                            ? "bg-[#00ff66] text-black" 
                            : rolloutStage > st.step 
                            ? "bg-emerald-900/40 text-emerald-400" 
                            : "bg-zinc-800 text-zinc-500"
                        }`}>
                          {st.step}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{st.badge}</span>
                            {rolloutStage === st.step && (
                              <span className="text-[8px] font-mono uppercase bg-[#00ff66]/10 text-[#00ff66] px-1 py-0.2 rounded font-bold animate-pulse">EM EXECUÇÃO</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-white">{st.title}</span>
                          <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{st.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-850 pt-4 mt-6 text-[10px] font-mono text-zinc-500 flex justify-between items-center">
                  <span>ROTEIRO HOMOLOGADO</span>
                  <span>Fase Atual: {rolloutStage}/4</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== SUB-TAB 6: SUCESS METRICS & BACKLOG ===================== */}
        {activeSubTab === "metrics-backlog" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* SUCCESS METRICS ROW (Seção 11) */}
            <div className="bg-[#09090b] border border-zinc-800 p-5 rounded-2xl">
              <div className="flex justify-between items-start border-b border-zinc-850 pb-3 mb-4">
                <div>
                  <span className="text-[9px] font-mono text-[#00ff66] block uppercase tracking-wider font-bold">SEÇÃO 11: METRICAS E INDICADORES DE SUCESSO</span>
                  <h4 className="text-sm font-bold text-white mt-1">Health & Success Dashboard (Pós-Implantação)</h4>
                </div>
                <button
                  onClick={() => {
                    // Refresh metrics with slight random noise
                    setSuccessMetrics({
                      activeUsers: Math.round(800 + Math.random() * 100),
                      songRequests: Math.round(3300 + Math.random() * 200),
                      avgResponseTime: Math.round(135 + Math.random() * 20),
                      errorRate: parseFloat((0.1 + Math.random() * 0.1).toFixed(2)),
                      studentEngagement: Math.round(85 + Math.random() * 10),
                      autoPlaylistUsage: Math.round(90 + Math.random() * 8),
                      iemIndex: Math.round(75 + Math.random() * 8)
                    });
                    triggerToast("info", "Indicadores de sucesso atualizados.");
                    addLog("Qualidade", "Gestor", "Atualizou métricas de telemetria de sucesso operacional", "approved", "Acompanhamento pós-implantação");
                  }}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title="Atualizar métricas"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: "Alunos Ativos", val: successMetrics.activeUsers, icon: Users, desc: "Acessos diários reais" },
                  { label: "Músicas Pedidas", val: successMetrics.songRequests, icon: RotateCcw, desc: "Total do mês" },
                  { label: "Latência Média", val: `${successMetrics.avgResponseTime}ms`, icon: Clock, desc: "Tempo resposta HTTP" },
                  { label: "Índice de Erros", val: `${successMetrics.errorRate}%`, icon: ShieldAlert, desc: "Falhas de conexões" },
                  { label: "Engajamento", val: `${successMetrics.studentEngagement}%`, icon: TrendingUp, desc: "Satisfação reportada" },
                  { label: "Uso Playlists Auto", val: `${successMetrics.autoPlaylistUsage}%`, icon: Layers, desc: "Fatia de 1 automático" },
                  { label: "Índice IEM", val: `${successMetrics.iemIndex}/100`, icon: BarChart2, desc: "Índice Engajamento Musical" }
                ].map((met, i) => (
                  <div key={i} className="bg-[#18181b] border border-zinc-850 p-3.5 rounded-xl flex flex-col gap-1.5 hover:border-zinc-700 transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-zinc-500 font-bold block leading-tight">{met.label}</span>
                      <met.icon className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight font-sans mt-1">{met.val}</span>
                    <span className="text-[8.5px] text-zinc-400 font-mono leading-none">{met.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* EVOLUÇÃO CONTÍNUA & PLANO DE ROLLBACK (Seção 10) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* BACKLOG SEMÂNTICO LIST */}
              <div className="lg:col-span-7 bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                  <span className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider">Evolução Contínua & Backlog (Seção 10)</span>
                  <span className="text-[9px] font-mono text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 rounded font-bold uppercase">VERSIONAMENTO SEMÂNTICO</span>
                </div>

                <div className="flex flex-col gap-3">
                  {backlogItems.map((item, idx) => (
                    <div key={idx} className="bg-[#18181b] border border-zinc-800 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white font-sans">{item.version}</span>
                          <span className="text-[9px] font-mono text-zinc-500">• {item.date}</span>
                          <span className={`text-[9px] font-mono uppercase px-1 rounded ${
                            item.status === "Pronto para Homologação" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 mt-1.5">
                          {item.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2 text-xs text-zinc-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROLLBACK PLAN CARD */}
              <div className="lg:col-span-5 bg-[#09090b] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-850 pb-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">Plano de Contingência / Rollback</span>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Em conformidade estrita com o roteiro de segurança operacional, as notas de atualização devem sempre conter um plano de rollback seguro e documentado.
                  </p>

                  <div className="flex flex-col gap-1 bg-red-950/20 border border-red-900/30 p-3 rounded-xl text-[11px] text-zinc-300">
                    <span className="text-[9px] font-mono font-bold text-red-400 block uppercase mb-1">ROTEIRO DE DESVIO CRÍTICO</span>
                    <textarea
                      value={rollbackPlan}
                      onChange={(e) => setRollbackPlan(e.target.value)}
                      rows={5}
                      className="w-full bg-black/40 border border-red-900/20 text-[10.5px] font-mono p-2 rounded text-zinc-300 outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2.5 rounded-xl border border-zinc-850 text-[10.5px] text-zinc-400 leading-normal">
                    <Info className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                    <span>Os arquivos de build anteriores permanecem cacheados no Cloud Run permitindo reversão de versão em menos de 10 segundos.</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* TOAST PANEL SIMULATOR CONTAINER */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex gap-3 items-start animate-slideIn ${
              t.type === "success" ? "bg-emerald-950 border-emerald-500/30 text-emerald-300" :
              t.type === "warning" ? "bg-amber-950 border-amber-500/30 text-amber-300" :
              t.type === "error" ? "bg-red-950 border-red-500/30 text-red-300" :
              "bg-zinc-900 border-zinc-800 text-zinc-200"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {t.type === "error" && <ShieldAlert className="w-4 h-4 text-red-400" />}
              {t.type === "info" && <Info className="w-4 h-4 text-zinc-400" />}
            </div>
            <div className="flex-1 text-xs">
              <span className="font-semibold block font-sans">UP Play - Mensagem de Sistema</span>
              <p className="mt-0.5 leading-normal opacity-90">{t.msg}</p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* INTERACTIVE SAMPLE MODAL SIMULATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-md w-full p-6 flex flex-col gap-4 relative shadow-2xl">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-sans">Simulação de Alerta do Aluno</h4>
                <p className="text-xs text-zinc-400 font-mono">CENÁRIO FUNCIONAL REA-401</p>
              </div>
            </div>

            <div className="border-t border-b border-zinc-850 py-3 flex flex-col gap-2 my-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Aluno Notificado:</span>
                <span className="font-bold text-white">Rodrigo Melo (UP-2026-441)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Frequência Cardíaca (BPM):</span>
                <span className="font-bold text-red-500 font-mono">198 BPM (Excedido)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Dispositivo Associado:</span>
                <span className="text-zinc-300">Cinturão Polar H10</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-normal">
              O sistema detectou que a frequência cardíaca do aluno ultrapassou o limite operacional de segurança em 198 BPM. O player enviou um sinal de suspensão automática do áudio de alta energia no fone Bluetooth.
            </p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  triggerToast("success", "Suspensão automática de áudio ativada e log registrada.");
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                Suspender Áudio Imediato
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  triggerToast("warning", "Alerta ignorado sob responsabilidade operacional.");
                }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-white font-sans text-xs font-medium py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                Ignorar Aviso
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
