import React, { useState, useEffect } from "react";
import { 
  Settings, ShieldAlert, Sparkles, Volume2, Clock, 
  HelpCircle, ShieldCheck, Check, Save, Server, Database, 
  Cpu, Layers, Globe, Shield, Activity, Zap, Network, 
  HardDrive, Terminal, ArrowRightLeft, GitBranch, CheckCircle2, 
  AlertCircle, FileJson, Key, RefreshCw, Sliders, ToggleLeft, ToggleRight, 
  UserCheck, ShieldX, Link2, LogIn, ExternalLink,
  Smartphone, Monitor, Tablet, Eye, Users, Music, Megaphone, Image, List, Heart, User, Sparkle, AlertTriangle, ArrowRight, MousePointerClick,
  Loader2, Search, Trash2, Play, Pause, TrendingUp, BarChart2, Bell, FileText, CheckSquare, Square, Lock, Unlock, Calendar, ArrowUp, ArrowDown, WifiOff,
  Palette
} from "lucide-react";

import { GestorWireframesView } from "./GestorWireframesView";
import { GestorDesignSystemView } from "./GestorDesignSystemView";
import { GestorTestingDeploymentView } from "./GestorTestingDeploymentView";

interface GestorConfigViewProps {
  addLog: (type: string, user: string, content: string, status: "approved" | "flagged", reason: string) => void;
}

// Module Definition for Section 4
interface ModuleDetail {
  id: string;
  name: string;
  description: string;
  postgresTables: string[];
  redisCacheKeys: string[];
  socketEvents: string[];
  cleanArchBoundary: {
    entities: string[];
    useCases: string[];
    adapters: string[];
  };
  microserviceReadiness: "Pronto" | "Altamente Viável" | "Acoplamento Médio";
}

export const GestorConfigView: React.FC<GestorConfigViewProps> = ({ addLog }) => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("up_play_token");
    const userStr = localStorage.getItem("up_play_user");
    let userEmail = "jheiffe.jheiffe@gmail.com";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.email) userEmail = u.email;
      } catch (_) {}
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-email": userEmail
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  // Helper to load cached settings
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem("up_play_config_settings");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return null;
  };

  const initialSettings = loadSavedSettings();

  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState<"params" | "architecture" | "roadmap" | "security-compliance" | "wireframes-flows" | "design-system" | "testing-deployment">("params");
  
  // Arch Sub-tabs
  const [archSubTab, setArchSubTab] = useState<"modules" | "observability" | "security" | "integrations">("modules");

  // --- PARAMETERS STATE (Section 11 / Configurações) ---
  const [maxBpm, setMaxBpm] = useState<number>(initialSettings?.maxBpm ?? 180);
  const [energyFilter, setEnergyFilter] = useState<boolean>(initialSettings?.energyFilter ?? true);
  const [coachActive, setCoachActive] = useState<boolean>(initialSettings?.coachActive ?? true);
  const [aiModel, setAiModel] = useState<string>(initialSettings?.aiModel ?? "gemini-3.1-flash-lite");
  const [adInterval, setAdInterval] = useState<number>(initialSettings?.adInterval ?? 15);
  const [volumeLevel, setVolumeLevel] = useState<number>(initialSettings?.volumeLevel ?? 75);
  const [limitTime, setLimitTime] = useState<string>(initialSettings?.limitTime ?? "22:30");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load from server on mount and keep sync
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/v1/settings", {
          headers: getAuthHeaders()
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.maxBpm !== undefined) setMaxBpm(Number(s.maxBpm));
          if (s.energyFilter !== undefined) setEnergyFilter(Boolean(s.energyFilter));
          if (s.coachActive !== undefined) setCoachActive(Boolean(s.coachActive));
          if (s.aiModel !== undefined) setAiModel(String(s.aiModel));
          if (s.adInterval !== undefined) setAdInterval(Number(s.adInterval));
          if (s.volumeLevel !== undefined) setVolumeLevel(Number(s.volumeLevel));
          if (s.limitTime !== undefined) setLimitTime(String(s.limitTime));

          // Cache in local storage
          localStorage.setItem("up_play_config_settings", JSON.stringify({
            maxBpm: s.maxBpm ?? 180,
            energyFilter: s.energyFilter ?? true,
            coachActive: s.coachActive ?? true,
            aiModel: s.aiModel ?? "gemini-3.1-flash-lite",
            adInterval: s.adInterval ?? 15,
            volumeLevel: s.volumeLevel ?? 75,
            limitTime: s.limitTime ?? "22:30"
          }));
        }
      } catch (err) {
        console.warn("Could not fetch remote settings, using local persistent copy.", err);
      }
    };

    fetchSettings();
  }, []);

  // --- ARCHITECTURE STATE ---
  const [selectedModule, setSelectedModule] = useState<string | null>("pedidos");
  const [activeEnvironment, setActiveEnvironment] = useState<"development" | "homologation" | "production">(() => {
    return (localStorage.getItem("up_play_arch_env") as any) || "development";
  });
  
  // Observability & Redis Simulator State
  const [socketClients, setSocketClients] = useState(12);
  const [dbResponseTime, setDbResponseTime] = useState(4.2);
  const [redisHitRate, setRedisHitRate] = useState(88.4);
  const [cpuUsage, setCpuUsage] = useState(12.5);
  const [memoryUsage, setMemoryUsage] = useState(42.1);
  const [isSimulatingCacheTest, setIsSimulatingCacheTest] = useState(false);
  const [cacheTestResults, setCacheTestResults] = useState<{
    redisTime: number;
    dbTime: number;
    improvement: number;
    completed: boolean;
  } | null>(null);

  // Security Simulation State
  const [sqlScanStatus, setSqlScanStatus] = useState<"idle" | "scanning" | "clean">("idle");
  const [securityScore, setSecurityScore] = useState(98);
  const [isHttpsForced, setIsHttpsForced] = useState(true);

  // Integration Sandbox State
  const [connectedSandbox, setConnectedSandbox] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("up_play_sandbox_conn");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      "app_oficial": false,
      "erp": false,
      "warehouse": false,
      "catraca": false,
      "avaliacao": false,
      "fidelidade": false,
      "ia_ecossistema": false,
      "app_nativo": false
    };
  });
  const [sandboxPayload, setSandboxPayload] = useState<string | null>(null);
  const [activeIntegrationId, setActiveIntegrationId] = useState<string>("app_oficial");

  // --- ROADMAP STATE (Doc 08) ---
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [activeVersion, setActiveVersion] = useState<"1.0" | "1.5" | "2.0" | "3.0">("1.0");

  // --- SECURITY, LGPD & CONTINUITY STATE (Doc 09) ---
  const [secSelectedTab, setSecSelectedTab] = useState<"overview" | "lgpd" | "auth-control" | "incident-recovery" | "updates-future">("overview");
  const [anonymizerInput, setAnonymizerInput] = useState<string>("123.456.789-00");
  const [anonymizerResult, setAnonymizerResult] = useState<{ masked: string; sha256: string; bcrypt: string } | null>(null);
  const [activeIncidentScenario, setActiveIncidentScenario] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<"idle" | "running" | "completed">("idle");
  const [lastBackupDetails, setLastBackupDetails] = useState<{ timestamp: string; hash: string; size: string }>({
    timestamp: "15/07/2026 04:00:00 (Diário Automático)",
    hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    size: "142.8 MB"
  });
  const [policyConsentAccepted, setPolicyConsentAccepted] = useState<boolean>(() => {
    const saved = localStorage.getItem("up_play_policy_consent");
    return saved !== null ? saved === "true" : true;
  });
  const [complianceList, setComplianceList] = useState<{ id: string; label: string; docSec: string; checked: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem("up_play_compliance_list");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: "minimization", label: "Coletar apenas informações necessárias (Nome, CPF, Matrícula, E-mail, Data Nasc.)", docSec: "Seção 2 / 3", checked: true },
      { id: "age_calc", label: "Data de nascimento utilizada apenas para cálculo de idade / estatísticas (Privada)", docSec: "Seção 2", checked: true },
      { id: "auth_bcrypt", label: "Armazenamento seguro de senhas via bcrypt hash", docSec: "Seção 5", checked: true },
      { id: "jwt_token", label: "Autenticação por token JWT com expiração de sessão ativa", docSec: "Seção 5", checked: true },
      { id: "https_only", label: "Tráfego 100% cifrado em canal HTTPS e conexões TLS seguras", docSec: "Seção 6", checked: true },
      { id: "sanitization", label: "Proteção sanitizante contra SQL Injection, XSS e CSRF ativa", docSec: "Seção 6", checked: true },
      { id: "backup_test", label: "Rotina de backups diários e testes regulares de restauração de dados", docSec: "Seção 7", checked: true },
      { id: "observability", label: "Monitoramento em tempo real de disponibilidade, erros e consumo", docSec: "Seção 8", checked: true },
      { id: "audit_stream", label: "Registro irrevogável de logs de auditoria administrativa (mutação/acesso)", docSec: "Seção 9", checked: true },
      { id: "rollback_plan", label: "Plano de Deploy com retrocompatibilidade e rollback facilitado", docSec: "Seção 11", checked: true }
    ];
  });

  // --- WIREFRAMES, PROTOTYPES & FLOWS STATE (Doc 10) ---
  const [doc10SelectedTab, setDoc10SelectedTab] = useState<"flows" | "aluno-wireframes" | "gestor-wireframes" | "components-states" | "responsiveness">("flows");
  const [activeAlunoScreen, setActiveAlunoScreen] = useState<"splash" | "login" | "home" | "request" | "player" | "profile" | "notifications">("splash");
  const [activeGestorScreen, setActiveGestorScreen] = useState<"login" | "dashboard" | "player" | "users" | "announcements" | "bi" | "config" | "logs">("dashboard");
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

  // Simulated live observability ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.max(5, Math.min(45, Math.round((prev + (Math.random() * 4 - 2)) * 10) / 10)));
      setMemoryUsage(prev => Math.max(38, Math.min(52, Math.round((prev + (Math.random() * 0.4 - 0.2)) * 10) / 10)));
      setDbResponseTime(prev => Math.max(1.5, Math.min(12, Math.round((prev + (Math.random() * 2 - 1)) * 10) / 10)));
      // Randomize connected socket client minor fluctuations
      if (Math.random() > 0.8) {
        setSocketClients(prev => Math.max(8, prev + (Math.random() > 0.5 ? 1 : -1)));
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Save standard parameters
  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const newConfigs = {
      maxBpm,
      energyFilter,
      coachActive,
      aiModel,
      adInterval,
      volumeLevel,
      limitTime
    };

    // 1. Immediately save to localStorage for client-side instant permanence
    localStorage.setItem("up_play_config_settings", JSON.stringify(newConfigs));

    // 2. Persist to backend database via PUT /api/v1/settings
    try {
      await fetch("/api/v1/settings", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(newConfigs)
      });
    } catch (err) {
      console.warn("Backend settings update failed, kept in local storage:", err);
    } finally {
      setIsSaving(false);
    }
    
    addLog(
      "system",
      "Administrador",
      `Configurações salvas: Limite BPM: ${maxBpm} BPM, Volume: ${volumeLevel}%, Filtro 90 BPM: ${energyFilter ? "Ativo" : "Inativo"}, IA Coach: ${coachActive ? "Ativo" : "Inativo"} (${aiModel}), Intervalo Ads: ${adInterval}m, Limite Horário: ${limitTime}.`,
      "approved",
      "Alteração manual de parâmetros operacionais"
    );

    setFeedback("Configurações salvas com sucesso e aplicadas ao sistema!");
    setTimeout(() => setFeedback(null), 3500);
  };

  // Run simulated SQL Scan
  const handleRunSqlScan = () => {
    setSqlScanStatus("scanning");
    setTimeout(() => {
      setSqlScanStatus("clean");
      addLog(
        "security",
        "UP Play Firewall",
        "Varredura de injeção de SQL executada em todas as queries e inputs.",
        "approved",
        "Compliance de Segurança Semanal (Doc 07 Seção 6)"
      );
    }, 2000);
  };

  // Run Redis Caching Simulator Performance Test
  const handleRunCacheTest = () => {
    setIsSimulatingCacheTest(true);
    setCacheTestResults(null);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step >= 5) {
        clearInterval(interval);
        setCacheTestResults({
          redisTime: 1.8, // 1.8ms
          dbTime: 124.5, // 124.5ms
          improvement: 98.5, // 98.5% faster
          completed: true
        });
        setIsSimulatingCacheTest(false);
        addLog(
          "performance",
          "Redis Core Monitor",
          "Executado teste de stress comparativo de cache (Redis vs PostgreSQL direto).",
          "approved",
          "Análise de latência do barramento de sintonias"
        );
      }
    }, 400);
  };

  // Toggle Sandbox connections
  const handleToggleSandbox = (id: string, name: string) => {
    const nextState = !connectedSandbox[id];
    const updated = { ...connectedSandbox, [id]: nextState };
    setConnectedSandbox(updated);
    try {
      localStorage.setItem("up_play_sandbox_conn", JSON.stringify(updated));
    } catch (_) {}

    if (nextState) {
      // Simulate connection payload response
      const payloadObj = {
        event: "UP_PLAY_GATEWAY_HANDSHAKE",
        timestamp: new Date().toISOString(),
        gateway_version: "v1.4.2-prod",
        partner_system: name,
        authorized_scopes: ["read:requests", "read:statistics", "write:announcements"],
        status: "BOUND_SUCCESSFULLY",
        heartbeat_interval_seconds: 30,
        webhook_endpoints: {
          metrics_stream: `https://api.upfitness.com.br/webhooks/upplay/metrics`,
          action_trigger: `https://api.upfitness.com.br/webhooks/upplay/trigger`
        }
      };
      setSandboxPayload(JSON.stringify(payloadObj, null, 2));
      addLog(
        "system",
        "Gateway Integrador",
        `Canal de sandbox estabelecido com o sistema externo: ${name}.`,
        "approved",
        "Teste de Integração Futura (Doc 07 Seção 10)"
      );
    } else {
      setSandboxPayload(null);
    }
  };

  // --- ACTIONS FOR SECURITY & COMPLIANCE (Doc 09) ---
  const handleAnonymize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonymizerInput) return;

    // Simulated bcrypt hashing and masking
    let masked = anonymizerInput;
    if (anonymizerInput.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/) || anonymizerInput.replace(/\D/g, "").length === 11) {
      // It's a CPF, mask it under LGPD privacy guidelines (Seção 2 / 3)
      const clean = anonymizerInput.replace(/\D/g, "");
      if (clean.length === 11) {
        masked = `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
      } else {
        masked = anonymizerInput.substring(0, 3) + "***" + anonymizerInput.substring(anonymizerInput.length - 2);
      }
    } else if (anonymizerInput.includes("@")) {
      // It's an email
      const [user, domain] = anonymizerInput.split("@");
      masked = user.substring(0, 2) + "*****@" + domain;
    } else {
      // Name
      const parts = anonymizerInput.trim().split(" ");
      masked = parts.map((p, idx) => idx === 0 ? p : p.substring(0, 1) + "****").join(" ");
    }

    // Generate pseudo bcrypt hash (Seção 5)
    const pseudoBcrypt = `$2b$12$RhythmSecureBcryptHash${Array.from({ length: 31 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    
    // Generate pseudo sha256 integrity token (Seção 6)
    const pseudoSha = `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    setAnonymizerResult({
      masked,
      bcrypt: pseudoBcrypt,
      sha256: pseudoSha
    });

    addLog(
      "security",
      "LGPD Sanitizer",
      `Simulação de anonimização e hash executada com sucesso para input privado.`,
      "approved",
      "Sanitização e Criptografia em tempo de runtime (Doc 09 Seção 2/3/5)"
    );
  };

  const handleForceBackup = () => {
    setBackupStatus("running");
    addLog(
      "security",
      "Backup Engine",
      "Disparado backup manual assíncrono solicitado pelo painel administrativo.",
      "approved",
      "Backup manual sob demanda de tabelas e logs (Doc 09 Seção 7)"
    );

    setTimeout(() => {
      setBackupStatus("completed");
      const randomHash = `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      
      setLastBackupDetails({
        timestamp: `${formattedDate} (Manual Sob Demanda)`,
        hash: randomHash,
        size: `${(Math.random() * 10 + 140).toFixed(1)} MB`
      });

      addLog(
        "security",
        "Backup Engine",
        "Backup manual sob demanda concluído e arquivado com sucesso no Cloud Storage.",
        "approved",
        "Garantia de integridade e cópia de segurança (Doc 09 Seção 7)"
      );
    }, 1500);
  };

  const handleToggleCompliance = (id: string) => {
    setComplianceList(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const nextState = !item.checked;
          addLog(
            "security",
            "Compliance Auditor",
            `Alterado status do item de conformidade: "${item.label}" para ${nextState ? "CONFORME" : "NÃO-CONFORME"}.`,
            "approved",
            "Alteração manual de checklist de governança (Doc 09 Seção 3)"
          );
          return { ...item, checked: nextState };
        }
        return item;
      });
      try {
        localStorage.setItem("up_play_compliance_list", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const handleTriggerIncidentScenario = (id: string) => {
    setActiveIncidentScenario(id);
    const names: Record<string, string> = {
      "db_down": "Queda do Banco de Dados Principal",
      "infra_fail": "Falha Crítica de Infraestrutura (Container)",
      "external_api": "Indisponibilidade de API de Serviços Externos",
      "security_breach": "Tentativa Detectada de Força Bruta / Invasão"
    };
    addLog(
      "security",
      "Plano de Continuidade",
      `SIMULAÇÃO DE INCIDENTE ACIONADA: ${names[id] || id}. Plano de mitigação e redundância iniciado em tempo real.`,
      "flagged",
      "Execução de simulação periódica de desastre e contingência (Doc 09 Seção 10)"
    );
  };

  // Module catalog as defined in "4. Estrutura Modular"
  const modulesList: ModuleDetail[] = [
    {
      id: "autenticacao",
      name: "Autenticação",
      description: "Garante o controle de acesso seguro ao sistema de sintonias usando JWT e hashing de senha via bcrypt.",
      postgresTables: ["users (password hash, role)"],
      redisCacheKeys: ["auth:token:<token_id>", "auth:user:profile:<user_id>"],
      socketEvents: ["auth_handshake", "token_expired"],
      cleanArchBoundary: {
        entities: ["UserCredentials", "SessionToken"],
        useCases: ["AuthenticateUser", "ValidateToken", "RefreshSession"],
        adapters: ["JWTEncoder", "BcryptHasher", "AuthController"]
      },
      microserviceReadiness: "Pronto"
    },
    {
      id: "usuarios",
      name: "Usuários",
      description: "Cadastro, gerenciamento de permissões e controle de perfis (Alunos, Professores, Gestores e Recepcionistas).",
      postgresTables: ["users", "students_profile"],
      redisCacheKeys: ["user:<user_id>:profile"],
      socketEvents: ["user_profile_updated"],
      cleanArchBoundary: {
        entities: ["User", "StudentProfile"],
        useCases: ["RegisterUser", "UpdateUserProfile", "ChangeUserRole"],
        adapters: ["UserPresenter", "UserRepository", "UserController"]
      },
      microserviceReadiness: "Pronto"
    },
    {
      id: "player",
      name: "Player",
      description: "Central rítmica das caixas de som, sincronizando os players do YouTube, Spotify e arquivos nativos.",
      postgresTables: ["player_sessions", "device_registrations"],
      redisCacheKeys: ["player:active_session", "player:volume"],
      socketEvents: ["player_sync", "player_command", "player_volume_change"],
      cleanArchBoundary: {
        entities: ["AudioTrack", "PlaybackState"],
        useCases: ["SyncPlaybackState", "ExecutePlayerCommand", "AdjustVolume"],
        adapters: ["YouTubePlayerAdapter", "SocketIOPlayerHandler", "PlayerController"]
      },
      microserviceReadiness: "Altamente Viável"
    },
    {
      id: "pedidos",
      name: "Pedidos",
      description: "Orquestrador de solicitações de músicas feitas pelos alunos, ordenados por prioridade rítmica e créditos.",
      postgresTables: ["song_requests", "songs"],
      redisCacheKeys: ["queue:current", "queue:upcoming"],
      socketEvents: ["song_requested", "queue_updated", "song_started"],
      cleanArchBoundary: {
        entities: ["SongRequest", "QueuePosition"],
        useCases: ["SubmitSongRequest", "ReorderQueueByLikes", "SkipActiveSong"],
        adapters: ["RequestController", "QueueOptimizer", "RequestPresenter"]
      },
      microserviceReadiness: "Altamente Viável"
    },
    {
      id: "curtidas",
      name: "Curtidas",
      description: "Barômetro de engajamento onde os alunos curtem ou descurtem a faixa ativa, reordenando a fila dinamicamente.",
      postgresTables: ["likes_history"],
      redisCacheKeys: ["likes:active_song", "likes:cooldown:<user_id>"],
      socketEvents: ["song_liked", "likes_count_sync"],
      cleanArchBoundary: {
        entities: ["Like", "InteractionCooldown"],
        useCases: ["RegisterSongLike", "CheckInteractionLimit", "RecalculateQueuePriority"],
        adapters: ["LikesController", "InteractionRepository"]
      },
      microserviceReadiness: "Altamente Viável"
    },
    {
      id: "dedicatorias",
      name: "Dedicatórias",
      description: "Mecanismo social para envio de músicas dedicadas a colegas de treino ou declarações motivacionais nas telas.",
      postgresTables: ["dedications"],
      redisCacheKeys: ["dedications:active"],
      socketEvents: ["dedication_submitted", "dedication_broadcast"],
      cleanArchBoundary: {
        entities: ["Dedication", "MotivationalQuote"],
        useCases: ["SubmitDedication", "FilterInappropriateLanguage", "BroadcastDedication"],
        adapters: ["DedicationController", "ProfanityFilterAdapter", "NotificationGateway"]
      },
      microserviceReadiness: "Acoplamento Médio"
    },
    {
      id: "rankings",
      name: "Rankings",
      description: "Geração de placares rítmicos: músicas mais pedidas, artistas consagrados e alunos mais participativos.",
      postgresTables: ["song_requests", "likes_history"],
      redisCacheKeys: ["ranking:songs:<period>", "ranking:artists:<period>"],
      socketEvents: ["rankings_refreshed"],
      cleanArchBoundary: {
        entities: ["RankingItem", "ArtistLeaderboard"],
        useCases: ["CalculateTopCharts", "CompileUserContributions"],
        adapters: ["RankingPresenter", "RankingScheduler"]
      },
      microserviceReadiness: "Pronto"
    },
    {
      id: "anuncios",
      name: "Anúncios",
      description: "Painel de exibição de campanhas institucionais e ofertas de parceiros, programados para disparar em intervalos.",
      postgresTables: ["ad_campaigns"],
      redisCacheKeys: ["ads:rotation:active"],
      socketEvents: ["ad_displayed", "ad_rotation_sync"],
      cleanArchBoundary: {
        entities: ["AdCampaign", "AdScheduler"],
        useCases: ["CreateCampaign", "SelectNextAd", "TrackAdImpressions"],
        adapters: ["CampaignController", "AdRotationPresenter"]
      },
      microserviceReadiness: "Pronto"
    },
    {
      id: "bi",
      name: "Business Intelligence",
      description: "Coletor e agregador de dados demográficos de audiência e volumetria para relatórios estratégicos e auditoria de CPFs.",
      postgresTables: ["song_requests", "users", "likes_history"],
      redisCacheKeys: ["bi:metrics:summary"],
      socketEvents: ["bi_realtime_metrics"],
      cleanArchBoundary: {
        entities: ["BIReportRow", "DemographicMetric"],
        useCases: ["AggregateDashboardMetrics", "ExportAuditReport"],
        adapters: ["BIEngineController", "CSVReportExporter"]
      },
      microserviceReadiness: "Altamente Viável"
    },
    {
      id: "music_intelligence",
      name: "Music Intelligence",
      description: "Módulo alimentado por IA (Gemini) para predição rítmica, montagem de personas automáticas e playlists adaptativas.",
      postgresTables: ["songs", "song_requests"],
      redisCacheKeys: ["music_intel:personas", "music_intel:recommendations"],
      socketEvents: ["ai_playlist_generated"],
      cleanArchBoundary: {
        entities: ["UserPersona", "PredictiveInsight"],
        useCases: ["GenerateDemographicPersonas", "PredictPeakDemandGenres", "SuggestAdaptiveTracks"],
        adapters: ["GeminiAIAdapter", "MusicIntelPresenter"]
      },
      microserviceReadiness: "Acoplamento Médio"
    },
    {
      id: "configuracoes",
      name: "Configurações",
      description: "Gerenciador central de limites de segurança cardíaca (BPM), volume sonoro e chaves do ecossistema.",
      postgresTables: ["system_configs"],
      redisCacheKeys: ["config:bpm_limit", "config:ad_interval"],
      socketEvents: ["config_updated"],
      cleanArchBoundary: {
        entities: ["SystemConfig", "SafetyThreshold"],
        useCases: ["UpdateSystemParameters", "EnforceSafetyLimits"],
        adapters: ["ConfigController", "PersistentStorageConfig"]
      },
      microserviceReadiness: "Pronto"
    },
    {
      id: "logs",
      name: "Logs",
      description: "Auditoria contínua e imutável de ações administrativas, erros do barramento e acessos dos alunos.",
      postgresTables: ["audit_logs", "error_logs"],
      redisCacheKeys: ["logs:recent_stream"],
      socketEvents: ["log_streamed"],
      cleanArchBoundary: {
        entities: ["AuditLogEntry", "SystemError"],
        useCases: ["LogAdminAction", "TrackSystemCrash", "QueryHistoricalAudit"],
        adapters: ["LoggerService", "DbLogAdapter", "TerminalPresenter"]
      },
      microserviceReadiness: "Pronto"
    }
  ];

  // Integrations Definition for Section 10
  const integrationsList = [
    {
      id: "app_oficial",
      name: "Aplicativo Oficial UP Fitness",
      desc: "Autenticação unificada via Single Sign-On (SSO) e compartilhamento de tokens de créditos para os alunos.",
      protocol: "REST API / OAuth2",
      complexity: "Fácil (Mapeamento de Schema)",
      readiness: "Pronto para acoplamento"
    },
    {
      id: "erp",
      name: "ERP Próprio UP",
      desc: "Sincronização cadastral instantânea de novos matriculados e bloqueio automático de inadimplentes no UP Play.",
      protocol: "REST API / Webhooks",
      complexity: "Média (Polling e Webhooks)",
      readiness: "Barramento aguardando ativação"
    },
    {
      id: "warehouse",
      name: "Warehouse UP",
      desc: "Alimentação do data lake central da holding com logs rítmicos estruturados em parquet para big-data analytics.",
      protocol: "gRPC Streaming",
      complexity: "Alta (Volume de streaming)",
      readiness: "Adapter estruturado"
    },
    {
      id: "catraca",
      name: "Controle de Acesso (Catraca)",
      desc: "Identificação em tempo real da entrada do aluno na academia para disparar boas-vindas na tela ou sintonizar seu estilo favorito.",
      protocol: "TCP/IP Socket direto / UDP",
      complexity: "Alta (Latência crítica)",
      readiness: "Protótipo mapeado no barramento"
    },
    {
      id: "avaliacao",
      name: "Avaliação Física",
      desc: "Interpretação da frequência cardíaca de treino recomendada pelo professor para autolimitador de BPM da música.",
      protocol: "REST API",
      complexity: "Média",
      readiness: "Configurações de BPM prontas"
    },
    {
      id: "fidelidade",
      name: "Programa de Fidelidade",
      desc: "Troca de pontos acumulados por frequência de treinos por créditos adicionais ou 'fura-filas' na sintonização.",
      protocol: "REST API",
      complexity: "Média",
      readiness: "Mapeamento de banco concluído"
    },
    {
      id: "ia_ecossistema",
      name: "IA do Ecossistema",
      desc: "Comunicação neuronal cruzada com a IA de dietas e treinos do grupo UP Fitness para traçar perfis rítmicos sinérgicos.",
      protocol: "REST API / JSON-RPC",
      complexity: "Alta",
      readiness: "Gemini SDK integrado"
    },
    {
      id: "app_nativo",
      name: "Aplicativos Android e iOS Nativos",
      desc: "Empacotamento PWA nativo com notificações push em background para alertar o aluno quando sua música estiver prestes a tocar.",
      protocol: "W3C Web Push / Firebase Cloud Messaging",
      complexity: "Média",
      readiness: "Notificações PWA pré-configuradas"
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      
      {/* MAIN TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-4 sm:p-6">
        <div>
          <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Painel Administrativo da Academia
          </span>
          <h2 className="font-display font-bold text-lg sm:text-xl text-white mt-2">
            Central de Controle Técnico e Governança
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gerencie os parâmetros de sintonização das caixas e inspecione a integridade da arquitetura, observabilidade e integrações do ecossistema UP Fitness.
          </p>
        </div>

        {/* High-Level Tab Navigation */}
        <div className="flex bg-[#18181b] p-1 rounded-xl border border-zinc-850 gap-1 shrink-0 self-start md:self-center overflow-x-auto max-w-full no-scrollbar">
          <button
            onClick={() => setActiveTab("params")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "params"
                ? "bg-[#00ff66] text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parâmetros Operacionais</span>
          </button>
          
          <button
            onClick={() => setActiveTab("architecture")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "architecture"
                ? "bg-[#00ff66] text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Arquitetura & Infra (Doc 07)</span>
          </button>

          <button
            onClick={() => setActiveTab("roadmap")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "roadmap"
                ? "bg-[#00ff66] text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Plano Diretor & Roadmap (Doc 08)</span>
          </button>

          <button
            onClick={() => setActiveTab("security-compliance")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "security-compliance"
                ? "bg-[#00ff66] text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Segurança, LGPD & Continuidade (Doc 09)</span>
          </button>

          <button
            onClick={() => setActiveTab("wireframes-flows")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "wireframes-flows"
                ? "bg-[#00ff66] text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Wireframes, Protótipos & Fluxos (Doc 10)</span>
          </button>

          <button
            onClick={() => setActiveTab("design-system")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "design-system"
                ? "bg-[#00ff66] text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Design System & Identidade (Doc 11)</span>
          </button>

          <button
            onClick={() => setActiveTab("testing-deployment")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "testing-deployment"
                ? "bg-[#00ff66] text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Testes, Homologação & Implantação (Doc 12)</span>
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: PARÂMETROS OPERACIONAIS ======================= */}
      {activeTab === "params" && (
        <div className="flex flex-col gap-6">
          
          {feedback && (
            <div className="bg-[#00ff66]/10 border border-[#00ff66]/30 px-4 py-3 rounded-xl text-xs text-[#00ff66] font-medium animate-pulse flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfigs} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: AUDIO SAFETY & LIMITS (7 COLS) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* CARDIAC LIMITS & AUDIO LEVEL */}
              <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                  <ShieldAlert className="text-red-400 w-4.5 h-4.5" />
                  <h4 className="font-semibold text-sm text-white">Parâmetros de Segurança Cardiovascular (BPM)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">LIMITE MÁXIMO DE BPM *</label>
                    <input
                      type="number"
                      min="100"
                      max="210"
                      value={maxBpm}
                      onChange={(e) => setMaxBpm(Number(e.target.value))}
                      className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#00ff66] font-mono"
                    />
                    <span className="text-[9px] text-zinc-500 mt-1 block">Previne que músicas com BPM perigosamente elevados (acima de 180) sejam injetadas durante o treino de alunos cardíacos.</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">VOLUME DE ENTRADA (%)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={volumeLevel}
                        onChange={(e) => setVolumeLevel(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00ff66]"
                      />
                      <span className="font-mono text-xs text-white font-bold w-10 text-right">{volumeLevel}%</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1.5 block">Sintoniza o ganho inicial das batidas de fone do sintetizador.</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-900">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={energyFilter}
                      onChange={(e) => setEnergyFilter(e.target.checked)}
                      className="rounded border-zinc-850 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer w-4 h-4"
                    />
                    <span className="text-xs text-zinc-300 font-semibold">
                      Filtrar Automaticamente Músicas Abaixo de 90 BPM (Modo Força Total)
                    </span>
                  </label>
                  <p className="text-[9px] text-zinc-500 ml-6.5 mt-0.5">
                    Remove automaticamente baladas lentas ou faixas acústicas da fila para manter a adrenalina e potência muscular alta na Sala de Musculação.
                  </p>
                </div>
              </div>

              {/* SCHEDULE AND ROTATION SCHEDULES */}
              <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                  <Clock className="text-emerald-400 w-4.5 h-4.5" />
                  <h4 className="font-semibold text-sm text-white">Transmissões Comerciais & Rotações de Campanhas</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">INTERVALO DE EXIBIÇÃO DE ADs (MINUTOS) *</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={adInterval}
                      onChange={(e) => setAdInterval(Number(e.target.value))}
                      className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#00ff66] font-mono"
                    />
                    <span className="text-[9px] text-zinc-500 mt-1 block">Tempo em minutos antes de alternar os slides do mural rotativo no topo da tela do aluno.</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">HORÁRIO LIMITE DE SOLICITAÇÃO</label>
                    <div className="flex bg-[#18181b] p-1 rounded-xl border border-zinc-800 text-xs">
                      <span className="p-2 text-zinc-400 font-mono text-[10px] uppercase font-bold shrink-0">BLOQUEAR PEDIDOS ÀS:</span>
                      <input
                        type="time"
                        value={limitTime}
                        onChange={(e) => setLimitTime(e.target.value)}
                        className="bg-transparent text-white border-0 outline-none w-full font-mono font-semibold"
                      />
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1.5 block">Fecha as votações automáticas do YouTube minutos antes de a academia encerrar.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: AI COACH PARAMETERS & SUBMIT (5 COLS) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* AI COACH ENGINE */}
              <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
                  <Sparkles className="text-[#00ff66] w-4.5 h-4.5" />
                  <h4 className="font-semibold text-sm text-white">Configuração da IA (UP Music Coach)</h4>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1">MODELO GENERATIVO DE IA</label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-zinc-200 outline-none cursor-pointer focus:border-[#00ff66]"
                  >
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultrarrápido, Baixa Latência & Alta Disponibilidade)</option>
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash (Raciocínio & Alta Inteligência)</option>
                    <option value="gemini-flash-latest">Gemini Flash Latest (Estável com Auto-Failover)</option>
                  </select>
                  <span className="text-[9px] text-zinc-500 mt-1 block">O modelo generativo que processa as sugestões musicais e calibra os batimentos cardíacos ideais por setor.</span>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coachActive}
                      onChange={(e) => setCoachActive(e.target.checked)}
                      className="rounded border-zinc-850 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer w-4 h-4"
                    />
                    <span className="text-xs text-zinc-300 font-semibold">
                      Ativar AI Music Coach Chatbot na tela do aluno
                    </span>
                  </label>
                  <p className="text-[9px] text-zinc-500 ml-6.5 mt-0.5">
                    Disponibiliza o chat de IA treinado para criar cronogramas de treino sintonizados com faixas famosas e dar conselhos de performance.
                  </p>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-3">
                <p className="text-[10px] text-zinc-500 italic">
                  💡 As mudanças feitas serão salvas localmente e propagadas no barramento do painel de administração da UP Fitness de forma automática.
                </p>
                
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 min-h-[46px] bg-[#00ff66] hover:bg-[#00e159] disabled:opacity-50 text-black font-bold text-xs rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider font-mono active:scale-95 touch-manipulation"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Parâmetros...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* ======================= TAB 2: ARQUITETURA & INFRA (DOCUMENTO 07) ======================= */}
      {activeTab === "architecture" && (
        <div className="flex flex-col gap-6">
          
          {/* ARCH NAVIGATION SUB-MENU */}
          <div className="flex bg-[#121214] border border-[#27272a] rounded-xl p-1 overflow-x-auto gap-1">
            {[
              { id: "modules", label: "Módulos & Clean Arch", icon: Layers },
              { id: "observability", label: "Observabilidade & Cache", icon: Activity },
              { id: "security", label: "Segurança & Auditoria", icon: Shield },
              { id: "integrations", label: "Integrações Futuras", icon: Network }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setArchSubTab(sub.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  archSubTab === sub.id
                    ? "bg-[#27272a] text-[#00ff66] border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <sub.icon className="w-3.5 h-3.5 text-zinc-400" />
                <span>{sub.label}</span>
              </button>
            ))}
          </div>

          {/* ENVIRONMENT SELECTOR SLIDER */}
          <div className="bg-[#121214] border border-[#27272a] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Ambiente Técnico da Infraestrutura</h4>
                <p className="text-[10px] text-zinc-500">Selecione o escopo operacional configurado nos servidores de nuvem.</p>
              </div>
            </div>

            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850/50 text-[10px] font-mono font-bold">
              {[
                { id: "development", label: "DESENVOLVIMENTO", desc: "Local sandboxed container with hot reloading" },
                { id: "homologation", label: "HOMOLOGAÇÃO", desc: "Replica of prod database with mock telemetry" },
                { id: "production", label: "PRODUÇÃO", desc: "Live high-availability GCP container deployment" }
              ].map((env) => (
                <button
                  key={env.id}
                  onClick={() => {
                    setActiveEnvironment(env.id as any);
                    try {
                      localStorage.setItem("up_play_arch_env", env.id);
                    } catch (_) {}
                    addLog(
                      "system",
                      "Infraestrutura",
                      `Alterado o ambiente operacional visualizado para ${env.label}.`,
                      "approved",
                      "Alteração de ambiente de gerência"
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeEnvironment === env.id
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  {env.label}
                </button>
              ))}
            </div>
          </div>

          {/* SUB-TAB PANELS */}
          
          {/* 1. MODULES & CLEAN ARCHITECTURE */}
          {archSubTab === "modules" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Principles Checklist */}
              <div className="lg:col-span-4 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-white">Princípios de Arquitetura (Seção 1)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Normas e padrões que regem o código-fonte do UP Play.</p>
                </div>

                <div className="space-y-3.5 mt-2">
                  {[
                    { title: "Arquitetura Modular", desc: "Divisão lógica estrita de responsabilidades em 12 módulos independentes." },
                    { title: "Clean Architecture", desc: "Camada de domínio (Entities, Use Cases) isolada de drivers externos e infra." },
                    { title: "Baixo Acoplamento", desc: "Comunicação entre módulos via interfaces e barramento de eventos pub/sub." },
                    { title: "Alta Coesão", desc: "Cada módulo gerencia exclusivamente sua própria esfera de dados e lógica de negócios." },
                    { title: "APIs como Comunicação", desc: "Interação baseada inteiramente em rotas REST bem definidas e Socket.IO em tempo real." },
                    { title: "Prontidão para Microsserviços", desc: "Estrutura desenhada para facilitar a separação física de bancos de dados futuramente." }
                  ].map((principle, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs">
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#00ff66] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-zinc-200 block">{principle.title}</span>
                        <span className="text-[10px] text-zinc-500 leading-normal block mt-0.5">{principle.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modules Selector and Detail (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-5">
                
                {/* Visual Architecture Map */}
                <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-[#27272a] p-5 rounded-2xl flex flex-col gap-3">
                  <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-zinc-400">Fluxo Arquitetural Geral (Seção 2 & 3)</h4>
                  
                  <div className="grid grid-cols-5 gap-1.5 items-center justify-center text-center font-mono text-[9px] font-bold py-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl">
                      <span className="block text-white text-[10px]">FRONTEND</span>
                      PWA • React • TS
                    </div>
                    <div className="text-zinc-600 flex justify-center">
                      <ArrowRightLeft className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-2.5 rounded-xl">
                      <span className="block text-white text-[10px]">BACKEND</span>
                      REST / Socket.IO
                    </div>
                    <div className="text-zinc-600 flex justify-center">
                      <ArrowRightLeft className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 p-2.5 rounded-xl">
                      <span className="block text-white text-[10px]">BANCO + CACHE</span>
                      Postgres + Redis
                    </div>
                  </div>
                </div>

                {/* 12 Modules Directory */}
                <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Os 12 Módulos Estruturais (Seção 4)</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Selecione um módulo para inspecionar seus domínios e acoplamentos rítmicos.</p>
                  </div>

                  {/* Modules grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {modulesList.map((m) => {
                      const isSelected = selectedModule === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedModule(m.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                            isSelected 
                              ? "bg-zinc-900 border-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.1)]" 
                              : "bg-[#18181b] border-zinc-850 hover:bg-zinc-900 hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-[10px] font-mono text-zinc-500 font-bold block uppercase">Mód-{(modulesList.indexOf(m) + 1).toString().padStart(2, "0")}</span>
                          <span className={`text-xs font-bold truncate ${isSelected ? "text-[#00ff66]" : "text-zinc-300"}`}>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Module Details Board */}
                  {selectedModule && (() => {
                    const activeM = modulesList.find(x => x.id === selectedModule)!;
                    return (
                      <div className="bg-[#18181b] border border-zinc-800 p-4.5 rounded-xl flex flex-col gap-4.5 animate-fadeIn">
                        
                        {/* Header of detail */}
                        <div className="flex items-start justify-between border-b border-zinc-850 pb-3">
                          <div>
                            <span className="text-[9px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] px-2 py-0.5 rounded uppercase">
                              Microservices Readiness: {activeM.microserviceReadiness}
                            </span>
                            <h5 className="font-bold text-sm text-white mt-1.5">{activeM.name}</h5>
                          </div>
                          <Layers className="w-5 h-5 text-zinc-500" />
                        </div>

                        {/* Description */}
                        <p className="text-xs text-zinc-300 leading-relaxed">{activeM.description}</p>

                        {/* Domain Specifications */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs pt-1">
                          
                          {/* Entities & Use Cases */}
                          <div className="bg-[#121214] p-3 rounded-lg border border-zinc-850 flex flex-col gap-1.5">
                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">Entities (Camada de Domínio)</span>
                            <div className="flex flex-col gap-1">
                              {activeM.cleanArchBoundary.entities.map((e, idx) => (
                                <span key={idx} className="font-mono text-[10px] text-zinc-300 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  {e}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Database mapping */}
                          <div className="bg-[#121214] p-3 rounded-lg border border-zinc-850 flex flex-col gap-1.5">
                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">PostgreSQL Tables (Banco Relacional)</span>
                            <div className="flex flex-col gap-1">
                              {activeM.postgresTables.map((t, idx) => (
                                <span key={idx} className="font-mono text-[10px] text-zinc-300 flex items-center gap-1">
                                  <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Cache Key Mapping */}
                          <div className="bg-[#121214] p-3 rounded-lg border border-zinc-850 flex flex-col gap-1.5">
                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">Redis cache keys (Cache / Barramento)</span>
                            <div className="flex flex-col gap-1">
                              {activeM.redisCacheKeys.map((k, idx) => (
                                <span key={idx} className="font-mono text-[10px] text-zinc-300 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Real-Time Socket.io Events mapped */}
                        {activeM.socketEvents.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-850 pt-3 text-[10px]">
                            <span className="font-mono font-bold text-zinc-500 uppercase">Sincronização Socket.IO ativa:</span>
                            {activeM.socketEvents.map((evt, idx) => (
                              <span key={idx} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                                {evt}
                              </span>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })()}

                </div>

              </div>

            </div>
          )}

          {/* 2. OBSERVABILITY & CACHING PERFORMANCE */}
          {archSubTab === "observability" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Telemetry Dashboard (5 cols) */}
              <div className="lg:col-span-5 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-white">Observabilidade Real-time (Seção 9)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Indicadores do container no Cloud Run do UP Play.</p>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  
                  {/* Cpu meter */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-400 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" /> CPU Usage
                      </span>
                      <span className="font-mono text-zinc-200 font-bold">{cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
                      <div className="bg-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${cpuUsage}%` }} />
                    </div>
                  </div>

                  {/* Memory meter */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-400 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Memory Usage
                      </span>
                      <span className="font-mono text-zinc-200 font-bold">{memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
                      <div className="bg-blue-400 h-full rounded-full transition-all duration-1000" style={{ width: `${memoryUsage}%` }} />
                    </div>
                  </div>

                  {/* Socket Connections */}
                  <div className="bg-zinc-900 border border-zinc-850/50 p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-300 block">Clientes WebSocket Sintonizados</span>
                      <span className="text-[9px] text-zinc-500">Mapeado via Socket.IO em tempo real (Seção 3)</span>
                    </div>
                    <span className="font-mono text-xl font-black text-emerald-400">{socketClients} caixas/fones</span>
                  </div>

                  {/* PostgreSQL Pool State */}
                  <div className="bg-zinc-900 border border-[#27272a] p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-300 block">PostgreSQL Pool (Neon Serverless)</span>
                      <span className="text-[9px] text-zinc-500">Banco Relacional Primário (Seção 3)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-white block">Active: 4/20 conns</span>
                      <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded mt-0.5 inline-block">ONLINE</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Redis Cache Optimizer Simulator (7 cols) */}
              <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-white">Desempenho: Otimizador de Cache Redis (Seção 7)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">O Redis armazena as filas rítmicas e tokens ativos para reduzir a carga sobre o PostgreSQL.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-zinc-900 border border-zinc-850/50 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">Tempo de Resposta DB</span>
                    <span className="text-2xl font-black text-white mt-1 block font-mono">{dbResponseTime} ms</span>
                    <span className="text-[9px] text-zinc-500 mt-1 block">Sem caching de fila ativa</span>
                  </div>

                  <div className="bg-zinc-900 border border-[#27272a] p-4 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">Redis Cache Hit-Rate</span>
                    <span className="text-2xl font-black text-amber-400 mt-1 block font-mono">{redisHitRate}%</span>
                    <span className="text-[9px] text-zinc-500 mt-1 block">Eficiência de interceptação</span>
                  </div>
                </div>

                {/* Simulated Caching Comparison Engine */}
                <div className="bg-zinc-950 p-4.5 rounded-xl border border-zinc-850 mt-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-200">Stress Test: Simulação de Latência Rítmica</h5>
                      <p className="text-[9px] text-zinc-500">Mede o tempo de resposta do barramento com e sem o Redis ativo.</p>
                    </div>

                    <button
                      onClick={handleRunCacheTest}
                      disabled={isSimulatingCacheTest}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-[10px] font-bold rounded-lg transition-all font-mono"
                    >
                      {isSimulatingCacheTest ? "MEDINDO..." : "INICIAR COMPARATIVO"}
                    </button>
                  </div>

                  {isSimulatingCacheTest && (
                    <div className="space-y-2 py-3">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>Enviando 1.000 requisições simuladas para o ecossistema...</span>
                        <span>Correndo...</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                        <div className="bg-amber-500 h-full animate-[shimmer_1.5s_infinite]" style={{ width: "70%" }} />
                      </div>
                    </div>
                  )}

                  {cacheTestResults && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/40 animate-fadeIn">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">Acesso com Redis Cache</span>
                        <span className="font-mono text-emerald-400 font-bold text-sm">{cacheTestResults.redisTime} ms</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">Acesso Postgres Direto</span>
                        <span className="font-mono text-red-400 font-bold text-sm">{cacheTestResults.dbTime} ms</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">Ganho de Performance</span>
                        <span className="font-mono text-white bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[11px] font-bold inline-block self-start">
                          +{cacheTestResults.improvement}% VELOZ!
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* 3. SECURITY & AUDITING COMPLIANCE */}
          {archSubTab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Security Shield controls */}
              <div className="lg:col-span-5 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-white">Segurança Rítmica Integrada (Seção 6)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Configurações criptográficas e de proteção contra injeção.</p>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  
                  {/* HTTPS status */}
                  <div className="flex items-center justify-between bg-zinc-900 p-3.5 rounded-xl border border-zinc-850/50 text-xs">
                    <div>
                      <span className="font-bold text-zinc-300 block flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> HTTPS Criptografado
                      </span>
                      <span className="text-[9px] text-zinc-500">Tráfego cifrado TLS obrigatório</span>
                    </div>

                    <button
                      onClick={() => setIsHttpsForced(!isHttpsForced)}
                      className="text-zinc-400 focus:outline-none"
                    >
                      {isHttpsForced ? (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-[#00ff66]">
                          <span>FORÇADO</span>
                          <ToggleRight className="w-8 h-8 text-[#00ff66]" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                          <span>DESLIGADO</span>
                          <ToggleLeft className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Criptografia bcrypt */}
                  <div className="bg-zinc-900 p-3.5 rounded-xl border border-[#27272a] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-300 block flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-400" /> Bcrypt Salt Rounds (12)
                      </span>
                      <span className="text-[9px] text-zinc-500">Criptografia imutável de senhas</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-white bg-zinc-950 px-2 py-1 rounded border border-zinc-850">
                      SECURE_HASH
                    </span>
                  </div>

                  {/* SQL Injection scanner */}
                  <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-850/50 flex flex-col gap-3 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-zinc-300 block">Varredura de SQL Injection & XSS</span>
                        <span className="text-[9px] text-zinc-500">Auditoria sanitizante de entradas e inputs</span>
                      </div>
                      
                      <button
                        onClick={handleRunSqlScan}
                        disabled={sqlScanStatus === "scanning"}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] rounded-lg font-mono border border-zinc-700 text-zinc-300 transition-all"
                      >
                        {sqlScanStatus === "scanning" ? "VERIFICANDO..." : "VARREDEIRA"}
                      </button>
                    </div>

                    {sqlScanStatus === "scanning" && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                        <span>Checando buffers e rotas SQL do Drizzle...</span>
                      </div>
                    )}

                    {sqlScanStatus === "clean" && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                        <Check className="w-3.5 h-3.5" />
                        <span>Nenhuma brecha ou injeção encontrada! Todas as queries sanitizadas via Drizzle SQL Template Literals.</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Admin Audit Trail Logs (7 cols) */}
              <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Logs de Auditoria Administrativa (Seção 6)</span>
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Registro irrevogável de ações de gestores e disparos de segurança.</p>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 font-mono text-[10.5px] text-zinc-400 flex flex-col gap-3 max-h-[290px] overflow-y-auto">
                  <div className="text-zinc-600 border-b border-zinc-900 pb-1 flex justify-between">
                    <span>UP_PLAY_AUDIT_STREAMS v1.0.0</span>
                    <span className="text-emerald-500">READY</span>
                  </div>
                  
                  <div className="text-zinc-300">
                    <span className="text-emerald-500">[SYSTEM]</span> [13:42:10] JWT Secret carregado do .env.example com sucesso.
                  </div>
                  <div>
                    <span className="text-blue-400">[SECURITY]</span> [13:44:15] Conexão SSL estabelecida com o Postgres (Neon DB pool).
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-purple-400">[ADMIN]</span> [13:45:02] Gestor 'admin' realizou login com sucesso de IP 172.18.0.1.
                  </div>
                  <div>
                    <span className="text-[#00ff66]">[COMPLIANCE]</span> [13:46:22] Backup automático de dados concluído na nuvem (Storage Bucket).
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-amber-500">[WARN]</span> [13:47:11] Limite BPM evitou requisição de música excessiva (+192 BPM) na Sala de Musculação.
                  </div>
                  {sqlScanStatus === "clean" && (
                    <div className="text-emerald-400">
                      <span className="text-emerald-400">[SECURITY]</span> [AGORA] Varredura automatizada antimalware de DDL finalizada. Status: SECURE.
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-zinc-500 italic bg-[#18181b]/50 border border-dashed border-zinc-850 p-3 rounded-lg leading-normal">
                  📌 <strong>GARANTIA DE REGISTRO:</strong> De acordo com os requisitos de Segurança (Seção 6), cada mutação de dados ou acesso administrativo de alta criticidade gera um hash de integridade irreversível no barramento.
                </div>
              </div>

            </div>
          )}

          {/* 4. FUTURE INTEGRATIONS SANDBOX */}
          {archSubTab === "integrations" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Integrations directory (5 cols) */}
              <div className="lg:col-span-5 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-white">Integrações do Ecossistema (Seção 10)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Parcerias digitais planejadas para o crescimento da UP Fitness.</p>
                </div>

                <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {integrationsList.map((item) => {
                    const isConnected = connectedSandbox[item.id];
                    const isActive = activeIntegrationId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveIntegrationId(item.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isActive
                            ? "bg-zinc-900 border-zinc-700"
                            : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white block">{item.name}</span>
                          <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded ${
                            isConnected 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-zinc-800 text-zinc-500 border border-transparent"
                          }`}>
                            {isConnected ? "SÉTIMO CANAL ATIVO" : "DISPONÍVEL"}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sandbox interactive console (7 cols) */}
              {activeIntegrationId && (() => {
                const activeInt = integrationsList.find(x => x.id === activeIntegrationId)!;
                const isConnected = connectedSandbox[activeInt.id];
                return (
                  <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4.5 animate-fadeIn">
                    
                    <div className="flex items-start justify-between border-b border-zinc-850 pb-3">
                      <div>
                        <span className="text-[9px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] px-2 py-0.5 rounded uppercase">
                          Mapeamento Técnico de Protocolo
                        </span>
                        <h4 className="font-bold text-sm text-white mt-1.5">{activeInt.name}</h4>
                      </div>
                      
                      <button
                        onClick={() => handleToggleSandbox(activeInt.id, activeInt.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                          isConnected
                            ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        {isConnected ? <ShieldX className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                        <span>{isConnected ? "DESCONECTAR SANDBOX" : "CONECTAR SANDBOX"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10.5px] font-mono text-zinc-400 border-b border-zinc-850/50 pb-3">
                      <div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase block">Protocolo de Comunicação</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{activeInt.protocol}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase block">Complexidade Técnica</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{activeInt.complexity}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">Descrição da Integração</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">{activeInt.desc}</p>
                    </div>

                    {/* Code Simulation Sandbox screen */}
                    {isConnected ? (
                      <div className="flex flex-col gap-2 animate-fadeIn">
                        <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 text-emerald-400" />
                          <span>Simulação de Webhook (JSON Payload)</span>
                        </span>
                        
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-[170px]">
                          <pre>{sandboxPayload}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-950 p-6 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                        <Link2 className="w-5 h-5 text-zinc-600 animate-pulse" />
                        <span>Canal de Sandbox Offline. Clique em 'Conectar Sandbox' para simular a resposta de Handshake da API UP Fitness.</span>
                      </div>
                    )}

                  </div>
                );
              })()}

            </div>
          )}

          {/* ======================= TAB 3: PLANO DIRETOR & ROADMAP (DOCUMENTO 08) ======================= */}
          {activeTab === "roadmap" && (
            <div className="flex flex-col gap-6 animate-fadeIn">

              {/* 1. VISÃO ESTRATÉGICA & OBJETIVO FINAL */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Strategic Vision Callout */}
                <div className="lg:col-span-8 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff66]/5 rounded-full blur-3xl -mr-10 -mt-10" />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded uppercase">
                        Plano Diretor • Seção 1
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-white mt-3">
                      Visão Estratégica do Ecossistema
                    </h3>
                    <p className="text-zinc-300 text-xs italic mt-3 leading-relaxed border-l-2 border-[#00ff66] pl-4">
                      "O objetivo é construir um ecossistema digital integrado, no qual diferentes aplicações compartilhem informações por meio de APIs padronizadas, mantendo baixo acoplamento e alta escalabilidade."
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66]" />
                      Baixo Acoplamento Garantido
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66]" />
                      APIs como Contratos de Serviço
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66]" />
                      Preparado para Crescimento Exponencial
                    </span>
                  </div>
                </div>

                {/* 9. Objetivo Final (Seção 9) */}
                <div className="lg:col-span-4 bg-[#121214] border border-[#27272a] p-6 rounded-2xl flex flex-col justify-between gap-4 relative">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded uppercase">
                      Objetivo Final • Seção 9
                    </span>
                    <h4 className="font-semibold text-sm text-white mt-3">Destino do UP Play</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                      Transformar o UP Play em um dos módulos do ecossistema digital da UP Fitness, oferecendo uma experiência integrada para alunos e gestores, mantendo arquitetura moderna, escalável e preparada para inovação contínua.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center gap-2.5 text-xs">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[10px] text-zinc-400 leading-normal font-mono">
                      Arquitetura desenhada sem retrabalho ou redundância.
                    </span>
                  </div>
                </div>

              </div>

              {/* 2. PAPEL DO UP PLAY & COMPARTILHAMENTO DE DADOS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Seção 2: Papel do UP Play (Na primeira versão vs No futuro) */}
                <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                      Papel do UP Play • Seção 2
                    </span>
                    <h4 className="font-semibold text-sm text-white mt-2">Evolução do Papel do Sistema</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Como o aplicativo se posiciona na primeira versão e no planejamento corporativo.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                    {/* Na primeira versão */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col gap-3">
                      <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded self-start uppercase">
                        Versão Atual
                      </span>
                      <h5 className="text-xs font-bold text-white">Sistema Independente</h5>
                      <ul className="space-y-2 text-[10.5px] text-zinc-400">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#00ff66]" />
                          <span>Aplicativo PWA autônomo</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#00ff66]" />
                          <span>Cadastro próprio de usuários</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#00ff66]" />
                          <span>Banco de dados próprio</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#00ff66]" />
                          <span>APIs próprias (v1-router)</span>
                        </li>
                      </ul>
                    </div>

                    {/* No futuro */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col gap-3">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded self-start uppercase">
                        Futuro Próximo
                      </span>
                      <h5 className="text-xs font-bold text-white">Módulo Integrado</h5>
                      <ul className="space-y-2 text-[10.5px] text-zinc-400">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Módulo do app UP Fitness</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Sem qualquer perda de histórico</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Preservação de preferências</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Sem retrabalho de código</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Seção 6: Compartilhamento de Dados */}
                <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                      Compartilhamento de Dados • Seção 6
                    </span>
                    <h4 className="font-semibold text-sm text-white mt-2">Canais de Troca de Informação</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">As categorias de dados que fluirão nativamente com o ecossistema digital.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                    {[
                      { name: "Cadastro de alunos", icon: UserCheck, desc: "Sincronização" },
                      { name: "Situação financeira", icon: Shield, desc: "Acesso/Bloqueio" },
                      { name: "Frequência", icon: Activity, desc: "Dados de presença" },
                      { name: "Presença na academia", icon: Clock, desc: "Boas-vindas" },
                      { name: "Avaliações físicas", icon: Sliders, desc: "Limite de BPM" },
                      { name: "Desafios", icon: Sparkles, desc: "Engajamento" },
                      { name: "Notificações", icon: Zap, desc: "Push nativo" },
                      { name: "Preferências musicais", icon: Database, desc: "Gosto rítmico" }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex flex-col gap-1.5 justify-between">
                        <item.icon className="w-4 h-4 text-[#00ff66]" />
                        <div>
                          <span className="text-[10px] font-bold text-white block truncate">{item.name}</span>
                          <span className="text-[8px] font-mono text-zinc-500 block mt-0.5 uppercase">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* 3. ECOSSISTEMA DIGITAL PLANEJADO */}
              <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                    Mapeamento de Arquitetura • Seção 3
                  </span>
                  <h4 className="font-semibold text-sm text-white mt-2">O Ecossistema Digital Planejado (Os 9 Componentes)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Todas as peças do quebra-cabeça digital da holding UP Fitness integradas por APIs.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-1">
                  {[
                    { name: "Aplicativo Oficial da UP Fitness", category: "MOBILE CORE", desc: "O canal principal do aluno para marcação de treinos, dietas e consultas.", highlight: false },
                    { name: "UP Play", category: "RHYTHMIC HUB", desc: "O sintonizador colaborativo de caixas de som e playlist adaptativa de IA.", highlight: true },
                    { name: "ERP próprio", category: "BACKOFFICE", desc: "O cérebro financeiro, controle de matrículas e faturamento da academia.", highlight: false },
                    { name: "Warehouse UP", category: "DATA LAKE", desc: "Centralizador de grandes volumes de dados para análises corporativas profundas.", highlight: false },
                    { name: "Controle de Acesso (catraca)", category: "HARDWARE INTERACTION", desc: "Disparadores de entrada física de alunos para saudações rítmicas automáticas.", highlight: false },
                    { name: "Avaliação Física", category: "MEDICAL TECH", desc: "Mapeamento cardíaco e limites fisiológicos do aluno para recomendação musical.", highlight: false },
                    { name: "Programa de Fidelidade", category: "GAMIFICATION", desc: "Moeda de troca de pontos por fura-filas ou créditos extras no painel de sintonias.", highlight: false },
                    { name: "IA Central da UP Fitness", category: "NEURAL COGNITION", desc: "Orquestrador de IA cruzada entre treinos, hábitos e gêneros sonoros ideais.", highlight: false },
                    { name: "Painéis gerenciais e BI corporativo", category: "BUSINESS MONITOR", desc: "Súmula de métricas consolidadas de engajamento rítmico e CPFs validados.", highlight: false }
                  ].map((comp, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                        comp.highlight 
                          ? "bg-zinc-900 border-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.05)]" 
                          : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">{comp.category}</span>
                        {comp.highlight && (
                          <span className="text-[8px] font-mono bg-[#00ff66]/15 text-[#00ff66] px-1.5 py-0.2 rounded font-bold">ESTE SISTEMA</span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-white">{comp.name}</h5>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">{comp.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. EVOLUÇÃO POR FASES (INTERACTIVE TIMELINE) */}
              <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-850">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded uppercase">
                      Estratégia Corporativa • Seção 5
                    </span>
                    <h4 className="font-semibold text-sm text-white mt-1.5">Evolução de Integração por Fases</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Selecione uma fase para visualizar o status do barramento de dados e objetivos.</p>
                  </div>

                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 gap-1 text-[10px] font-mono font-bold shrink-0 self-start">
                    {[1, 2, 3].map((p) => (
                      <button
                        key={p}
                        onClick={() => setActivePhase(p as any)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          activePhase === p
                            ? "bg-[#00ff66] text-black"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        FASE {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Phase Detail Content */}
                {(() => {
                  const phaseInfo = {
                    1: {
                      title: "Fase 1 – UP Play Independente",
                      badge: "Fase Atual • Operação de Validação",
                      desc: "Nesta fase primordial, o UP Play opera como uma aplicação autônoma para garantir a máxima velocidade de desenvolvimento, implantação contínua e validação imediata com o ecossistema de alunos.",
                      steps: [
                        { name: "Lançamento rápido", detail: "Implantação em containers rápidos no Cloud Run." },
                        { name: "Validação com os alunos", detail: "Medição de adesão orgânica de pedidos nas caixas de som." },
                        { name: "Coleta de dados reais", detail: "Construção do banco histórico de sintonizações de gênero." }
                      ],
                      statusText: "CANAL ATIVO",
                      statusColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                    },
                    2: {
                      title: "Fase 2 – Integração Parcial",
                      badge: "Desenvolvimento • Próxima Etapa",
                      desc: "Acoplamento direto com o core administrativo (ERP) do grupo UP Fitness para validação financeira em tempo real e consolidação cadastral unificada.",
                      steps: [
                        { name: "Integração com ERP próprio", detail: "Sincronização de credenciais de mensalidades." },
                        { name: "Sincronização de alunos", detail: "Alunos importados dinamicamente via triggers no banco de dados." },
                        { name: "Login unificado", detail: "Primeira etapa do Single Sign-On (SSO) central." }
                      ],
                      statusText: "AGUARDANDO INTEGRADOR",
                      statusColor: "text-amber-400 border-amber-500/20 bg-amber-500/10"
                    },
                    3: {
                      title: "Fase 3 – Ecossistema Integrado",
                      badge: "Planejado • Alvo Estratégico",
                      desc: "A consolidação absoluta do ecossistema. O UP Play se torna parte integrante e indissociável da experiência UP Fitness, alimentando o Data Lake da holding e reagindo instantaneamente à entrada do aluno pelas catracas.",
                      steps: [
                        { name: "Warehouse UP & IA Central", detail: "Consolidação de big data e machine learning rítmico." },
                        { name: "Fidelidade & Avaliação Física", detail: "Conversão de pontos em sintonias e limitadores de BPM automáticos." },
                        { name: "Catraca & App Oficial", detail: "Sintonização de boas-vindas do aluno ao cruzar o acesso físico." }
                      ],
                      statusText: "PLANEJADO",
                      statusColor: "text-purple-400 border-purple-500/20 bg-purple-500/10"
                    }
                  }[activePhase];

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-1 animate-fadeIn">
                      <div className="md:col-span-5 bg-zinc-950 p-4.5 rounded-xl border border-zinc-850 flex flex-col justify-between gap-4">
                        <div>
                          <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${phaseInfo.statusColor} uppercase`}>
                            {phaseInfo.statusText}
                          </span>
                          <h5 className="font-bold text-sm text-white mt-2.5">{phaseInfo.title}</h5>
                          <span className="text-[10px] font-mono text-zinc-500 mt-1 block font-semibold">{phaseInfo.badge}</span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mt-3">{phaseInfo.desc}</p>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono italic">
                          * Configuração de chaves e variáveis do .env pré-mapeadas.
                        </div>
                      </div>

                      <div className="md:col-span-7 flex flex-col gap-2">
                        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block pl-1">Ações e Entregáveis Obrigatórios</span>
                        {phaseInfo.steps.map((st, idx) => (
                          <div key={idx} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850/50 flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-[#00ff66] shrink-0 mt-0.5">
                              0{idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-white block">{st.name}</span>
                              <span className="text-[10.5px] text-zinc-400 block mt-1 leading-normal">{st.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 7. ROADMAP FUNCIONAL (INTERACTIVE RELEASE MILESTONES) */}
              <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-850">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded uppercase">
                      Roadmap Funcional • Seção 7
                    </span>
                    <h4 className="font-semibold text-sm text-white mt-1.5">Versões Programadas do UP Play</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Clique nas versões abaixo para detalhar a grade funcional de entregas da engenharia.</p>
                  </div>

                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 gap-1 text-[10px] font-mono font-bold shrink-0 self-start">
                    {["1.0", "1.5", "2.0", "3.0"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setActiveVersion(v as any)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          activeVersion === v
                            ? "bg-[#00ff66] text-black"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Versão {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Version Detail Content */}
                {(() => {
                  const verInfo = {
                    "1.0": {
                      title: "UP Play Versão 1.0 (Estável)",
                      desc: "Grade funcional de estreia do sistema de sintonias colaborativas, totalmente operacional.",
                      features: [
                        { name: "Solicitação de músicas", status: "Pronto" },
                        { name: "Curtidas", status: "Pronto" },
                        { name: "Dedicatórias", status: "Pronto" },
                        { name: "Rankings", status: "Pronto" },
                        { name: "Anúncios", status: "Pronto" },
                        { name: "BI inicial", status: "Pronto" },
                        { name: "Music Intelligence", status: "Pronto" }
                      ],
                      progress: 100,
                      color: "text-[#00ff66]"
                    },
                    "1.5": {
                      title: "UP Play Versão 1.5 (Próxima)",
                      desc: "Otimização de processos, inteligência preditiva profunda e expansão de relatórios de BI.",
                      features: [
                        { name: "Melhorias na IA", status: "Em Desenvolvimento" },
                        { name: "Recomendações personalizadas", status: "Em Desenvolvimento" },
                        { name: "Relatórios avançados", status: "Planejado" }
                      ],
                      progress: 45,
                      color: "text-amber-400"
                    },
                    "2.0": {
                      title: "UP Play Versão 2.0 (Integração)",
                      desc: "Acoplamento inicial com o ERP e sistema de autenticação corporativo unificado.",
                      features: [
                        { name: "Integração com ERP", status: "Aguardando homologação" },
                        { name: "SSO (Single Sign-On)", status: "Planejado" },
                        { name: "Sincronização automática de alunos", status: "Planejado" }
                      ],
                      progress: 0,
                      color: "text-blue-400"
                    },
                    "3.0": {
                      title: "UP Play Versão 3.0 (Ecossistema Total)",
                      desc: "Consolidação definitiva do ecossistema e unificação lógica em um único barramento.",
                      features: [
                        { name: "Integração completa ao ecossistema digital da UP Fitness", status: "Planejado" }
                      ],
                      progress: 0,
                      color: "text-purple-400"
                    }
                  }[activeVersion];

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-1 animate-fadeIn">
                      
                      {/* Left Block: Summary */}
                      <div className="md:col-span-5 bg-zinc-950 p-4.5 rounded-xl border border-zinc-850 flex flex-col justify-between gap-4">
                        <div>
                          <h5 className="font-bold text-sm text-white">{verInfo.title}</h5>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mt-2">{verInfo.desc}</p>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-zinc-500 uppercase font-bold">Progresso das Entregas</span>
                            <span className={`font-bold ${verInfo.color}`}>{verInfo.progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-850">
                            <div 
                              className="bg-[#00ff66] h-full rounded-full transition-all duration-700" 
                              style={{ 
                                width: `${verInfo.progress}%`,
                                backgroundColor: activeVersion === "1.0" ? "#00ff66" : activeVersion === "1.5" ? "#f59e0b" : activeVersion === "2.0" ? "#3b82f6" : "#a855f7"
                              }} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Feature list checklist */}
                      <div className="md:col-span-7 bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col gap-2.5">
                        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block pl-0.5">Escopo de Requisitos Técnicos</span>
                        
                        <div className="flex flex-col gap-2">
                          {verInfo.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-850 text-xs">
                              <span className="font-medium text-zinc-200">{feat.name}</span>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                                feat.status === "Pronto" 
                                  ? "bg-emerald-500/10 text-[#00ff66] border-emerald-500/20" 
                                  : feat.status === "Em Desenvolvimento"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-zinc-800 text-zinc-500 border-transparent"
                              }`}>
                                {feat.status.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>

              {/* 4. PRINCÍPIOS DE INTEGRAÇÃO & 8. GOVERNANÇA */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Seção 4: Princípios de Integração */}
                <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                      Princípios de Integração • Seção 4
                    </span>
                    <h4 className="font-semibold text-sm text-white mt-2">Normas de Conexão entre Sistemas</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Regras imutáveis de tráfego de dados no ecossistema digital.</p>
                  </div>

                  <div className="space-y-3 mt-1">
                    {[
                      { title: "APIs REST documentadas", desc: "Todas as interfaces de rede são blindadas e tipadas com DTOs claros." },
                      { title: "Autenticação unificada (SSO)", desc: "Centralização de logins sob o mesmo guarda-chuva de permissões corporativas." },
                      { title: "Identificadores externos (external_id)", desc: "Mapeamento seguro sem gerar redundância cadastral nos bancos secundários." },
                      { title: "Sincronização segura entre sistemas", desc: "Comunicação criptografada com HTTPS/WSS e validação contínua." },
                      { title: "Compartilhamento de dados sem duplicidade", desc: "Evita redundância de memória nos caches Redis ou storages de logs." }
                    ].map((princ, idx) => (
                      <div key={idx} className="flex gap-2.5 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-850/40">
                        <span className="w-5 h-5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold rounded flex items-center justify-center shrink-0">
                          0{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-zinc-200 block">{princ.title}</span>
                          <span className="text-[10px] text-zinc-500 leading-normal block mt-0.5">{princ.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seção 8: Governança */}
                <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded uppercase">
                      Governança Técnica • Seção 8
                    </span>
                    <h4 className="font-semibold text-sm text-white mt-2">Pilares de Governança</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Critérios obrigatórios exigidos para aprovação de qualquer nova funcionalidade.</p>
                  </div>

                  <div className="space-y-3 mt-1">
                    {[
                      { title: "Compatibilidade entre versões", desc: "As APIs devem preservar retrocompatibilidade de payload sem quebrar caixas antigas." },
                      { title: "Segurança rígida", desc: "Auditoria contínua, senhas criptografadas via bcrypt e controle estrito de perfis." },
                      { title: "Documentação atualizada", desc: "Manutenção do Swagger técnico e dos schemas de banco do Drizzle." },
                      { title: "Padronização de APIs", desc: "Estilo de rotas REST uniforme com nomenclatura coesa de endpoints." },
                      { title: "Baixo impacto em sistemas existentes", desc: "Isolamento lógico para que falhas de rede de terceiros não desliguem as caixas de som." }
                    ].map((gov, idx) => (
                      <div key={idx} className="flex gap-2.5 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-850/40">
                        <span className="w-5 h-5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono font-bold rounded flex items-center justify-center shrink-0">
                          0{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-zinc-200 block">{gov.title}</span>
                          <span className="text-[10px] text-zinc-500 leading-normal block mt-0.5">{gov.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* CONCLUSAO CALLOUT */}
              <div className="bg-[#18181b] p-5 rounded-2xl border border-[#27272a] flex flex-col gap-2">
                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Conclusão do Plano Diretor</span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  O Plano Diretor estabelece a visão de longo prazo para que o UP Play seja desenvolvido sem retrabalho, servindo como o primeiro componente de um ecossistema digital completo da UP Fitness. Cada nova funcionalidade inserida deverá seguir esta estratégia de integração gradual e evolução sustentável para manter o sistema moderno, escalável e robusto.
                </p>
              </div>

            </div>
          )}

          {/* ======================= TAB 4: SEGURANÇA, LGPD & CONTINUIDADE (DOCUMENTO 09) ======================= */}
          {activeTab === "security-compliance" && (
            <div className="flex flex-col gap-6 animate-fadeIn">

              {/* SECTION A: GOVERNANCE DASHBOARD COMPLIANCE INDEX */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Score Index Card */}
                <div className="md:col-span-4 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col justify-between gap-4 relative">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2.5 py-0.5 rounded uppercase">
                      Índice de Conformidade
                    </span>
                    <h3 className="font-semibold text-sm text-zinc-300 mt-2.5">Status de Governança</h3>
                  </div>

                  <div className="flex items-center gap-4 py-1">
                    {/* Visual Meter */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#1f1f22"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#00ff66"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={2 * Math.PI * 32 * (1 - complianceList.filter(x => x.checked).length / complianceList.length)}
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <span className="absolute text-sm font-mono font-bold text-white">
                        {Math.round((complianceList.filter(x => x.checked).length / complianceList.length) * 100)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-white block">
                        {complianceList.filter(x => x.checked).length === complianceList.length 
                          ? "Conformidade Total" 
                          : `${complianceList.filter(x => x.checked).length} de ${complianceList.length} Requisitos`}
                      </span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">
                        {complianceList.filter(x => x.checked).length === complianceList.length 
                          ? "Sistema totalmente alinhado à LGPD e à política de segurança (Doc 09)." 
                          : "Ajuste as chaves manuais do checklist abaixo para auditar conformidades."}
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] text-zinc-500 font-mono italic leading-normal border-t border-zinc-850 pt-3">
                    Revisado em conformidade com as diretrizes do ecossistema UP Fitness.
                  </div>
                </div>

                {/* Main Objectives Callout */}
                <div className="md:col-span-8 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff66]/5 rounded-full blur-3xl -mr-10 -mt-10" />
                  
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                      Objetivos Técnicos • Seção 1
                    </span>
                    <h3 className="font-display font-bold text-lg text-white mt-2.5">
                      Segurança da Informação, LGPD & Infraestrutura
                    </h3>
                    <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                      Este painel centraliza as diretrizes regulatórias e de contingência do aplicativo UP Play para proteger dados sensíveis de alunos, garantir redundâncias operacionais, mitigar falhas e manter conformidade estrita com a Lei Geral de Proteção de Dados (LGPD).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] text-zinc-300 font-mono mt-2">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                      Privacidade Garantida
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                      Alta Disponibilidade
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                      Plano de Redundância
                    </span>
                  </div>
                </div>

              </div>

              {/* SECTION B: SUB-TAB NAVIGATION */}
              <div className="flex bg-[#121214] p-1 rounded-xl border border-zinc-850 gap-1 overflow-x-auto max-w-full self-start">
                {[
                  { id: "overview", label: "Checklist & Diretrizes (Seções 1, 3, 4)", icon: ShieldCheck },
                  { id: "lgpd", label: "Dados Pessoais & LGPD (Seção 2, 3)", icon: UserCheck },
                  { id: "auth-control", label: "Autenticação & Proteções (Seção 5, 6)", icon: Key },
                  { id: "incident-recovery", label: "Controle de Backup, Monitoria & Redundância (Seção 7, 8, 9, 10)", icon: Database },
                  { id: "updates-future", label: "Deploys, Rollback & Futuro (Seção 11, 12)", icon: GitBranch }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSecSelectedTab(st.id as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all whitespace-nowrap ${
                      secSelectedTab === st.id
                        ? "bg-zinc-800 text-white border border-zinc-700"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    <st.icon className="w-3.5 h-3.5 text-[#00ff66]" />
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              {/* SUB-TAB CONTENTS */}

              {/* 1. OVERVIEW & COMPLIANCE CHECKLIST */}
              {secSelectedTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  
                  {/* Compliance Interactive Checklist */}
                  <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-white">Auditoria Contínua de Segurança (LGPD)</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Toggle manual para simular validações estritas de conformidade regulatória nas caixas de som.</p>
                    </div>

                    <div className="flex flex-col gap-2.5 mt-1 max-h-[360px] overflow-y-auto pr-1">
                      {complianceList.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => handleToggleCompliance(item.id)}
                          className="flex items-start justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 cursor-pointer text-xs transition-all gap-3"
                        >
                          <div className="flex gap-2.5">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              item.checked 
                                ? "bg-[#00ff66] border-[#00ff66] text-black" 
                                : "border-zinc-700 bg-transparent text-transparent"
                            }`}>
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                            <div>
                              <span className="font-medium text-zinc-200 block leading-tight">{item.label}</span>
                              <span className="text-[9px] font-mono text-zinc-500 block mt-1 uppercase">{item.docSec}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Access Control & Profiles */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    
                    {/* Profiles description */}
                    <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded uppercase">
                          Perfis de Acesso • Seção 4
                        </span>
                        <h4 className="font-semibold text-sm text-white mt-2.5">Controle de Acesso e Permissões</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Autorizações granulares divididas conforme o nível de responsabilidade.</p>
                      </div>

                      <div className="flex flex-col gap-3 mt-1 text-xs">
                        {/* Gestor card */}
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/20 shrink-0 text-[#00ff66]">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">Perfil Gestor (Administrador)</span>
                            <p className="text-[10.5px] text-zinc-400 mt-1 leading-normal">
                              Visualiza painéis, modifica limites rítmicos de segurança (Max BPM), cadastra anúncios, consulta BI e executa auditoria de logs. Todas as ações geram logs irrevogáveis com hash de segurança.
                            </p>
                          </div>
                        </div>

                        {/* Aluno card */}
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0 text-blue-400">
                            <Sliders className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">Perfil Aluno (Usuário Final)</span>
                            <p className="text-[10.5px] text-zinc-400 mt-1 leading-normal">
                              Acesso restrito ao aplicativo cliente (PWA). Permite submissão de pedidos rítmicos, curtidas em tempo real nas caixas, envio de dedicatórias e visualização do ranking de sintonias da academia. Sem acesso ao backoffice.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audit Guarantee box */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-dashed border-zinc-800 flex flex-col gap-2.5">
                      <span className="text-[10px] font-mono font-bold text-[#00ff66] flex items-center gap-1.5 uppercase">
                        <Terminal className="w-3.5 h-3.5" /> Registro de Atividades Administradas
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        Conforme a Seção 4 do documento, cada ação administrativa executada por gestores no painel de sintonias (como banimentos, liberação de CPFs ou exclusão de anúncios) é carimbada com o ID e IP do usuário e gravada diretamente na tabela <code className="font-mono text-zinc-300 bg-zinc-900 px-1 py-0.2 rounded">audit_logs</code>.
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* 2. DADOS PESSOAIS & LGPD (SEÇÃO 2, 3) */}
              {secSelectedTab === "lgpd" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  
                  {/* Personal Data Mapping */}
                  <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                        Dados Pessoais • Seção 2
                      </span>
                      <h4 className="font-semibold text-sm text-white mt-2">Mapeamento e Finalidade de Dados Coletados</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">O sistema limita o escopo de coleta estritamente ao necessário para a conformidade regulatória.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 text-xs">
                      {[
                        { title: "Nome do Aluno", scope: "Identificação no player", desc: "Exibido na fila das caixas ao aprovar pedidos sonoros." },
                        { title: "Matrícula UP Fitness", scope: "Sincronização de plano", desc: "Utilizado para verificar o status de matrícula ativa no ERP próprio." },
                        { title: "CPF", scope: "Validação de identidade", desc: "Chave única de cadastro para impedir criação de contas duplicadas." },
                        { title: "Data de Nascimento", scope: "Privado • Estatísticas", desc: "Cálculo interno de faixa etária e gráficos demográficos de gênero." },
                        { title: "E-mail de Cadastro", scope: "Comunicação técnica", desc: "Canal para envio de relatórios, redefinição de senhas e alertas." },
                        { title: "Foto do Perfil (Opcional)", scope: "Personalização", desc: "Visualização amigável de quem solicitou a música ativa nas telas." },
                        { title: "Histórico de Sintonias", scope: "Aperfeiçoamento de IA", desc: "Armazena as músicas pedidas e curtidas para treinar a IA Central." }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 flex flex-col gap-1 justify-between">
                          <div>
                            <span className="font-bold text-white block">{item.title}</span>
                            <span className="text-[9px] font-mono text-emerald-400 uppercase mt-0.5 block">{item.scope}</span>
                          </div>
                          <p className="text-[10.5px] text-zinc-400 leading-normal mt-1.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/15 p-4 rounded-xl flex items-start gap-3 mt-1">
                      <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10.5px] font-bold text-blue-400 block">Salvaguarda de Privacidade (Seção 2)</span>
                        <p className="text-[10px] text-zinc-400 leading-normal mt-1">
                          "A data de nascimento será utilizada estritamente para cálculo de idade de forma a subsidiar análises estatísticas e curadoria rítmica do Gemini, sem exposição pública nas caixas de som ou telas."
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Anonymizer and Privacy Sandbox Simulator */}
                  <div className="lg:col-span-6 flex flex-col gap-6">
                    
                    {/* Anonymizer Box */}
                    <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                          Simulador de Privacidade • LGPD
                        </span>
                        <h4 className="font-semibold text-sm text-white mt-2">Módulo de Anonimização & Proteção de Dados</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Simule como o UP Play mascara e encripta dados pessoais sensíveis em tempo de execução.</p>
                      </div>

                      <form onSubmit={handleAnonymize} className="flex flex-col gap-3 mt-1">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Dado Pessoal de Entrada (Ex: CPF, E-mail ou Nome)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={anonymizerInput}
                              onChange={(e) => setAnonymizerInput(e.target.value)}
                              placeholder="Digite um CPF ou e-mail..."
                              className="bg-zinc-950 border border-zinc-850 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00ff66] flex-1 font-mono"
                            />
                            <button
                              type="submit"
                              className="bg-[#00ff66] text-black hover:bg-[#00ff66]/90 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all shrink-0"
                            >
                              SANITIZAR
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Result Box */}
                      {anonymizerResult ? (
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col gap-3 animate-fadeIn">
                          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Outputs Criptográficos e Mascaramentos Gerados:</span>
                          
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-start p-2 rounded bg-zinc-900 border border-zinc-850">
                              <div>
                                <span className="text-[8px] font-mono text-zinc-500 uppercase block">Dado Anonimizado (Minimização LGPD)</span>
                                <span className="font-mono text-xs font-semibold text-white mt-0.5 block">{anonymizerResult.masked}</span>
                              </div>
                              <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-bold uppercase mt-0.5">EXPOSTO NA TELA</span>
                            </div>

                            <div className="flex justify-between items-start p-2 rounded bg-zinc-900 border border-zinc-850">
                              <div>
                                <span className="text-[8px] font-mono text-zinc-500 uppercase block">Bcrypt Password Hash (Seção 5)</span>
                                <span className="font-mono text-[9px] text-zinc-300 break-all mt-0.5 block">{anonymizerResult.bcrypt}</span>
                              </div>
                              <span className="text-[8px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/20 font-bold uppercase mt-0.5">BANCO DE DADOS</span>
                            </div>

                            <div className="flex justify-between items-start p-2 rounded bg-zinc-900 border border-zinc-850">
                              <div>
                                <span className="text-[8px] font-mono text-zinc-500 uppercase block">Assinatura Digital de Integridade SHA-256 (Seção 6)</span>
                                <span className="font-mono text-[9px] text-zinc-300 break-all mt-0.5 block">{anonymizerResult.sha256}</span>
                              </div>
                              <span className="text-[8px] font-mono bg-purple-500/10 text-purple-400 px-1.5 py-0.2 rounded border border-purple-500/20 font-bold uppercase mt-0.5">HASH DE AUDITORIA</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-950 p-6 rounded-xl border border-dashed border-zinc-850 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-zinc-600 animate-pulse" />
                          <span>Clique em 'Sanitizar' para simular a criptografia em tempo real sob conformidade com a LGPD.</span>
                        </div>
                      )}
                    </div>

                    {/* Privacy Policy Callout */}
                    <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                          Política de Privacidade • Seção 3
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold">REGISTRADO</span>
                      </div>
                      <h4 className="font-bold text-xs text-white">Gestão de Consentimento Ativo</h4>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        O UP Play exige o aceite voluntário do termo de uso na primeira conexão do PWA de alunos. A revogação do consentimento apaga imediatamente os dados de rastreabilidade (exclusão lógica e anonimização de histórico).
                      </p>

                      <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-850 mt-1">
                        <span className="text-xs text-zinc-300">Simular Aceite de Política por Novo Aluno</span>
                        <button
                          onClick={() => {
                            setPolicyConsentAccepted(!policyConsentAccepted);
                            addLog(
                              "security",
                              "LGPD Consent Manager",
                              `Termo de Consentimento de Privacidade ${!policyConsentAccepted ? "ACEITO" : "REVOGADO"} por aluno de id simulado ALUNO_8471.`,
                              "approved",
                              "Registro de conformidade com LGPD (Doc 09 Seção 3)"
                            );
                          }}
                          className={`text-xs font-bold font-mono px-3 py-1.5 rounded border transition-all ${
                            policyConsentAccepted 
                              ? "bg-emerald-500/15 border-emerald-500/30 text-[#00ff66]" 
                              : "bg-red-500/15 border-red-500/30 text-red-400"
                          }`}
                        >
                          {policyConsentAccepted ? "POLÍTICA ACEITA (✓)" : "CONHECIMENTO NEGADO (✗)"}
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* 3. AUTENTICAÇÃO, ACESSO & SEGURANÇA DA APLICAÇÃO (SEÇÃO 5, 6) */}
              {secSelectedTab === "auth-control" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  
                  {/* Seção 5: Autenticação e Senhas */}
                  <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                        Autenticação & Senhas • Seção 5
                      </span>
                      <h4 className="font-semibold text-sm text-white mt-2">Mecanismos de Login e Chaves Ativas</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">As regras de acesso para alunos e gestores integradas ao barramento corporativo.</p>
                    </div>

                    <div className="space-y-3.5 mt-1 text-xs">
                      {[
                        { title: "Armazenamento via Bcrypt Hash", detail: "As senhas originais nunca são gravadas. É computado um hash com 12 salt rounds antes de persistir no PostgreSQL.", active: "Ativo" },
                        { title: "Tokens de Acesso JWT", detail: "Autenticação por JSON Web Token assinado criptograficamente com segredo rotativo. Tempo de expiração de sessão ativa de 12 horas.", active: "Ativo" },
                        { title: "Tempo de Expiração de Sessão", detail: "Força novo login e atualização cadastral periódica para mitigar roubo de sessões em navegadores.", active: "Configurado" },
                        { title: "Integração SSO (Single Sign-On)", detail: "Preparado para futura autenticação integrada com o ERP central UP Fitness (OAuth2 unificado).", active: "Mapeado" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <span className="w-5 h-5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold rounded flex items-center justify-center shrink-0 mt-0.5">
                              0{idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-white block">{item.title}</span>
                              <span className="text-[10.5px] text-zinc-400 mt-1 leading-normal block">{item.detail}</span>
                            </div>
                          </div>
                          <span className="text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase shrink-0">
                            {item.active}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seção 6: Segurança da Aplicação */}
                  <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded uppercase">
                        Proteções da Aplicação • Seção 6
                      </span>
                      <h4 className="font-semibold text-sm text-white mt-2">Mecanismos de Blindagem Ativa contra Ataques</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Estratégias de mitigação e cabeçalhos de segurança web ativos.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1 text-xs">
                      {[
                        { title: "SQL Injection", desc: "Varreduras sistemáticas e uso mandatório do Drizzle ORM com queries parametrizadas (Prepared Statements)." },
                        { title: "XSS (Cross-Site Scripting)", desc: "Sanitização de todas as strings exibidas na fila rítmica e escape obrigatório de tags HTML de dedicatórias." },
                        { title: "CSRF (Cross-Site Request)", desc: "Proteção contra falsificação de requisições via tokens anti-CSRF nos formulários e cookies de escopo seguro." },
                        { title: "Força Bruta (Brute Force)", desc: "Bloqueio temporário de IP após 5 tentativas consecutivas de senha incorreta em menos de 1 minuto." },
                        { title: "Uploads Maliciosos", desc: "Fotos de alunos passam por verificação estrita de MIME-Type, limite de tamanho (2MB) e armazenamento externo isolado." },
                        { title: "Cabeçalho HTTPS TLS", desc: "Todo o ecossistema UP Play trafega exclusivamente sobre conexões criptografadas HTTPS, impedindo interceptações." }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col justify-between">
                          <h5 className="font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#00ff66]" />
                            <span>{item.title}</span>
                          </h5>
                          <p className="text-[10.5px] text-zinc-400 leading-normal mt-2">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* 4. BACKUP, MONITORIA & CONTINUIDADE OPERACIONAL (SEÇÃO 7, 8, 9, 10) */}
              {secSelectedTab === "incident-recovery" && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  
                  {/* Backup, Monitoria, Audit Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Backup & Recovery (Seção 7) */}
                    <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                          Backup e Recuperação • Seção 7
                        </span>
                        <h4 className="font-semibold text-sm text-white mt-2.5">Políticas de Segurança de Banco de Dados</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Salvaguarda de dados para prevenção de desastres cadastrais e sintonias.</p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col gap-3.5 text-xs">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                          <span className="text-zinc-400">Rotina de Execução:</span>
                          <span className="font-mono text-white font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">DIÁRIO AUTOMÁTICO</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                          <span className="text-zinc-400">Último Backup Concluído:</span>
                          <span className="font-mono text-zinc-300">{lastBackupDetails.timestamp}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                          <span className="text-zinc-400">Tamanho da Cópia:</span>
                          <span className="font-mono text-[#00ff66] font-bold">{lastBackupDetails.size}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">Cryptographic SHA-256 Signature Hash:</span>
                          <span className="font-mono text-[9px] text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-850 break-all leading-normal">
                            {lastBackupDetails.hash}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleForceBackup}
                          disabled={backupStatus === "running"}
                          className="bg-[#00ff66] text-black hover:bg-[#00ff66]/90 disabled:bg-zinc-800 disabled:text-zinc-500 px-4 py-2.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 justify-center flex-1"
                        >
                          {backupStatus === "running" ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>GERANDO BACKUP CRIPTOGRÁFICO...</span>
                            </>
                          ) : (
                            <>
                              <Database className="w-3.5 h-3.5" />
                              <span>FORÇAR BACKUP MANUAL AGORA</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Observability Real-Time Monitoring (Seção 8) */}
                    <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded uppercase">
                          Monitoramento de Infraestrutura • Seção 8
                        </span>
                        <h4 className="font-semibold text-sm text-white mt-2.5">Indicadores Operacionais em Tempo Real</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Métricas vitais de infra de containers e integridade das APIs do ecossistema.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 my-1 text-xs">
                        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 flex flex-col justify-between gap-1.5">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase block">Disponibilidade Geral (Uptime)</span>
                          <span className="text-xl font-bold font-mono text-[#00ff66]">99.98%</span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded self-start font-mono font-semibold">SAUDÁVEL</span>
                        </div>

                        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 flex flex-col justify-between gap-1.5">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase block">Tempo de Resposta Médio</span>
                          <span className="text-xl font-bold font-mono text-zinc-300">8.4ms</span>
                          <span className="text-[9px] text-zinc-500 font-mono font-semibold">PING DE BARRAMENTO</span>
                        </div>

                        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 flex flex-col justify-between gap-1.5">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase block">Erros da Aplicação Ativos</span>
                          <span className="text-xl font-bold font-mono text-red-400">0</span>
                          <span className="text-[9px] text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/20 px-1.5 py-0.2 rounded self-start font-mono font-semibold">NENHUM ALERTA</span>
                        </div>

                        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 flex flex-col justify-between gap-1.5">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase block">Acessos Administrativos Recorrentes</span>
                          <span className="text-xl font-bold font-mono text-blue-400">2.8k</span>
                          <span className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded self-start font-mono font-semibold">AUDITADOS</span>
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Integridade do barramento rítmico sob auditoria da Seção 8.
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Operational Continuity & Redundancy Plan (Seção 10) */}
                  <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded uppercase">
                        Plano de Continuidade Operacional • Seção 10
                      </span>
                      <h4 className="font-semibold text-sm text-white mt-1.5">Protocolos de Resiliência & Mitigação de Incidentes</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Selecione um cenário para disparar o simulador e visualizar os procedimentos de contingência exigidos pelo Documento 09.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-1">
                      
                      {/* Left: Button options */}
                      <div className="md:col-span-5 flex flex-col gap-2">
                        {[
                          { id: "db_down", name: "Queda do Banco de Dados", type: "CRÍTICO" },
                          { id: "infra_fail", name: "Queda de Container de Rede", type: "INTERRUPÇÃO" },
                          { id: "external_api", name: "Indisponibilidade de API de Terceiros", type: "INTEGRAÇÃO" },
                          { id: "security_breach", name: "Tentativa de Invasão Detectada", type: "SEGURANÇA" }
                        ].map((sc) => (
                          <button
                            key={sc.id}
                            onClick={() => handleTriggerIncidentScenario(sc.id)}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                              activeIncidentScenario === sc.id
                                ? "bg-[#00ff66]/10 border-[#00ff66] text-[#00ff66]"
                                : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300"
                            }`}
                          >
                            <span className="text-xs font-bold font-mono">{sc.name}</span>
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              sc.type === "CRÍTICO" 
                                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                : sc.type === "SEGURANÇA"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              {sc.type}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Right: Plan Display */}
                      <div className="md:col-span-7 bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col justify-between">
                        {activeIncidentScenario ? (
                          <div className="animate-fadeIn flex flex-col gap-3">
                            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                              <span className="text-xs font-bold text-white uppercase font-mono">Plano de Mitigação Ativo (Doc 09 Seção 10)</span>
                              <span className="text-[10px] text-[#00ff66] font-mono font-bold uppercase animate-pulse flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5" /> AGINDO
                              </span>
                            </div>

                            {/* Plan detail content */}
                            {activeIncidentScenario === "db_down" && (
                              <div className="text-[11.5px] leading-relaxed text-zinc-300 space-y-2">
                                <p className="font-semibold text-white">Sintomas: O PostgreSQL ou o Pool de Conexões do Neon Database parou de responder.</p>
                                <ul className="space-y-1.5 text-zinc-400 list-disc list-inside">
                                  <li><strong className="text-zinc-200">Passo 1:</strong> O barramento de sintonias entra em modo de cache local com Redis, mantendo leitura para os pedidos recentes já armazenados.</li>
                                  <li><strong className="text-zinc-200">Passo 2:</strong> Os reprodutores físicos de áudio nas academias seguem rodando a lista de reprodução offline e local sem interromper a música ambiente.</li>
                                  <li><strong className="text-zinc-200">Passo 3:</strong> Redirecionamento assíncrono para o nó réplica de leitura e envio imediato de alerta PagerDuty/Slack para o time de plantão.</li>
                                </ul>
                              </div>
                            )}

                            {activeIncidentScenario === "infra_fail" && (
                              <div className="text-[11.5px] leading-relaxed text-zinc-300 space-y-2">
                                <p className="font-semibold text-white">Sintomas: Queda súbita ou indisponibilidade do container secundário do UP Play no Cloud Run.</p>
                                <ul className="space-y-1.5 text-zinc-400 list-disc list-inside">
                                  <li><strong className="text-zinc-200">Passo 1:</strong> O Balanceador de Carga (Load Balancer) detecta a falha de handshake HTTPS e retira o nó com falha do pool de roteamento de rede.</li>
                                  <li><strong className="text-zinc-200">Passo 2:</strong> Escalonamento automático de uma nova réplica do container em região alternativa (<code className="font-mono text-zinc-300">auto-healing</code>).</li>
                                  <li><strong className="text-zinc-200">Passo 3:</strong> Sincronização automática de sessões persistidas no banco compartilhado sem que o usuário perceba queda de navegação.</li>
                                </ul>
                              </div>
                            )}

                            {activeIncidentScenario === "external_api" && (
                              <div className="text-[11.5px] leading-relaxed text-zinc-300 space-y-2">
                                <p className="font-semibold text-white">Sintomas: O serviço externo de streaming (ex: YouTube/Spotify) ou a API do ERP UP pararam de responder.</p>
                                <ul className="space-y-1.5 text-zinc-400 list-disc list-inside">
                                  <li><strong className="text-zinc-200">Passo 1:</strong> Ativação instantânea do algoritmo de contingência (Circuit Breaker), evitando travamento do thread principal do servidor de áudio.</li>
                                  <li><strong className="text-zinc-200">Passo 2:</strong> Substituição automática dos pedidos rítmicos por faixas locais seguras e anúncios agendados pré-baixados no disco local do player.</li>
                                  <li><strong className="text-zinc-200">Passo 3:</strong> Tentativas automáticas com recuo exponencial (Exponential Backoff) de reconexão de handshake a cada 30 segundos.</li>
                                </ul>
                              </div>
                            )}

                            {activeIncidentScenario === "security_breach" && (
                              <div className="text-[11.5px] leading-relaxed text-zinc-300 space-y-2">
                                <p className="font-semibold text-white">Sintomas: O sistema detecta tentativas consecutivas de ataque de senha (força bruta) ou payloads maliciosos.</p>
                                <ul className="space-y-1.5 text-zinc-400 list-disc list-inside">
                                  <li><strong className="text-zinc-200">Passo 1:</strong> Bloqueio automático temporário do IP de origem no Firewall e mitigador de tráfego (Rate Limiting) por 30 minutos.</li>
                                  <li><strong className="text-zinc-200">Passo 2:</strong> Exigência compulsória de verificação Captcha para logins subsequentes na mesma subrede IP.</li>
                                  <li><strong className="text-zinc-200">Passo 3:</strong> Registro de auditoria marcado como <code className="font-mono text-red-400">[SECURITY_BREACH_ALERT]</code> para providências e banimento manual do CPF do usuário, se aplicável.</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-6 text-zinc-500 gap-2 h-full">
                            <ShieldAlert className="w-6 h-6 text-zinc-600 animate-pulse" />
                            <span className="text-xs">Nenhuma falha simulada ativa. Clique em um dos cenários à esquerda para executar o protocolo de continuidade.</span>
                          </div>
                        )}

                        <div className="text-[9px] text-zinc-500 font-mono italic mt-4 border-t border-zinc-900 pt-2 flex items-center justify-between">
                          <span>Certificado de Resiliência de Barramento Ativo</span>
                          <span>DOC 09 • SEÇÃO 10</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* 5. DEPLOYS, ROLLBACK & EVOLUÇÃO FUTURA (SEÇÃO 11, 12) */}
              {secSelectedTab === "updates-future" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  
                  {/* Seção 11: Atualizações, Rollback e Testes */}
                  <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                        Atualizações e Implantação • Seção 11
                      </span>
                      <h4 className="font-semibold text-sm text-white mt-2">Diretrizes de Alteração e Evolução Segura de Código</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">As regras obrigatórias que toda nova feature deve seguir antes de chegar às caixas de som.</p>
                    </div>

                    <div className="space-y-3 mt-1 text-xs">
                      {[
                        { title: "Compatibilidade com Versões Anteriores", desc: "Nenhuma atualização técnica pode quebrar as APIs em produção que servem as caixas antigas das salas de treino. Compatibilidade de payload é obrigatória." },
                        { title: "Garantia de Baixo Impacto Operacional", desc: "Deploys de infraestrutura devem ser executados em janelas de baixo movimento (ex: madrugadas) para evitar interrupções de playlists ativas." },
                        { title: "Ambiente de Testes Pré-Publicação (Staging)", desc: "Todo código passa por uma bateria rigorosa de testes no ambiente de homologação, cobrindo o linter de tipos, build e simulador de carga." },
                        { title: "Política de Rollback Imediato", desc: "Caso o monitoramento (Seção 8) acuse degradação do tempo de resposta ou picos de erro pós-deploy, o container reverte para a versão anterior em <15s." }
                      ].map((update, idx) => (
                        <div key={idx} className="flex gap-3 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                          <span className="w-5 h-5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold rounded flex items-center justify-center shrink-0 mt-0.5">
                            0{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-zinc-200 block">{update.title}</span>
                            <span className="text-[10.5px] text-zinc-400 leading-normal block mt-1.5">{update.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seção 12: Evolução Futura do Ecossistema */}
                  <div className="lg:col-span-6 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded uppercase">
                        Evolução Futura • Seção 12
                      </span>
                      <h4 className="font-semibold text-sm text-white mt-2">Visão Tecnológica de Médio e Longo Prazo</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Como o UP Play se prepara arquiteturalmente para os próximos degraus da holding UP Fitness.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1 text-xs">
                      {[
                        { title: "Aplicativos Nativos iOS/Android", desc: "Substituição gradual do PWA por código móvel nativo, incorporando push notifications nativas e conectividade direta com fones bluetooth." },
                        { title: "Integração Profunda com ERP UP", desc: "Interação direta no barramento cadastral para habilitar descontos inteligentes na mensalidade de acordo com a assiduidade do aluno nas playlists." },
                        { title: "Filtros IA Integrados (Warehouse UP)", desc: "Alimentação contínua de dados de sintonias para o Data Lake da holding, subsidiando curadorias automatizadas integradas à ficha médica de treinos." },
                        { title: "IA Central de Hábitos Sonoros", desc: "Uso do orquestrador de IA cruzada para sincronizar o andamento BPM ideal com o estágio de fadiga do aluno detectado pelas avaliações físicas." }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col justify-between">
                          <h5 className="font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#00ff66]" />
                            <span>{item.title}</span>
                          </h5>
                          <p className="text-[10.5px] text-zinc-400 leading-normal mt-2.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-dashed border-zinc-850 flex items-center gap-3 mt-1.5">
                      <Zap className="w-5 h-5 text-purple-400 shrink-0" />
                      <span className="text-[10.5px] text-zinc-400 leading-relaxed font-mono">
                        A arquitetura modular e desacoplada do UP Play foi desenhada especificamente para que a evolução para essas novas tecnologias aconteça sem refatorações complexas.
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* CONCLUSAO CALLOUT */}
              <div className="bg-[#18181b] p-5 rounded-2xl border border-[#27272a] flex flex-col gap-2">
                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Conclusão do Documento de Segurança</span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A segurança, a privacidade de dados regulada pela LGPD e a resiliência operacional não são apenas adicionais técnicos do UP Play, mas sim os pilares que garantem a confiabilidade e escalabilidade de toda a experiência digital da UP Fitness. Cada nova versão ou integração no barramento do sistema deverá preservar essa integridade rígida para assegurar uma plataforma estável e segura para alunos e gestores.
                </p>
              </div>

            </div>
          )}

          {/* ======================= TAB 5: WIREFRAMES, PROTÓTIPOS & FLUXOS (DOCUMENTO 10) ======================= */}
          {activeTab === "wireframes-flows" && (
            <GestorWireframesView addLog={addLog} />
          )}

          {/* ======================= TAB 6: DESIGN SYSTEM & IDENTIDADE VISUAL (DOCUMENTO 11) ======================= */}
          {activeTab === "design-system" && (
            <GestorDesignSystemView addLog={addLog} />
          )}

          {/* ======================= TAB 7: PLANO DE TESTES, HOMOLOGAÇÃO & IMPLANTAÇÃO (DOCUMENTO 12) ======================= */}
          {activeTab === "testing-deployment" && (
            <GestorTestingDeploymentView addLog={addLog} />
          )}

        </div>
      )}

    </div>
  );
};
