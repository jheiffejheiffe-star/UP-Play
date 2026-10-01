import React, { useState } from "react";
import { 
  User, Trophy, Heart, Edit3, Check, Settings, Volume2, 
  MapPin, Sliders, Calendar, Music, ShieldCheck, HelpCircle 
} from "lucide-react";

interface PerfilViewProps {
  userName: string;
  setUserName: (val: string) => void;
  avatarGradient: string;
  setAvatarGradient: (val: string) => void;
  userRequestHistory: any[];
  preferredZoneId: string;
  setPreferredZoneId: (val: string) => void;
  pacingRange: string;
  setPacingRange: (val: string) => void;
  audioLatency: number;
  setAudioLatency: (val: number) => void;
  notificationsOn: boolean;
  setNotificationsOn: (val: boolean) => void;
}

export const PerfilView: React.FC<PerfilViewProps> = ({
  userName,
  setUserName,
  avatarGradient,
  setAvatarGradient,
  userRequestHistory,
  preferredZoneId,
  setPreferredZoneId,
  pacingRange,
  setPacingRange,
  audioLatency,
  setAudioLatency,
  notificationsOn,
  setNotificationsOn
}) => {
  const [localName, setLocalName] = useState<string>(userName);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Gradient presets for the Avatar selection
  const gradients = [
    { name: "Emerald Lift", value: "from-emerald-400 to-teal-500" },
    { name: "Cosmic Pulse", value: "from-purple-500 to-pink-500" },
    { name: "Flame Charge", value: "from-rose-500 to-orange-500" },
    { name: "Cyber Run", value: "from-blue-500 to-cyan-500" },
    { name: "Gold Medal", value: "from-amber-400 to-yellow-600" },
    { name: "Fuchsia Pulse", value: "from-fuchsia-500 to-purple-600" }
  ];

  const handleSaveName = () => {
    if (!localName.trim()) return;
    setUserName(localName.trim());
    setIsEditing(false);

    // Save user name changes to localStorage
    const saved = localStorage.getItem("up_play_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.name = localName.trim();
        localStorage.setItem("up_play_user", JSON.stringify(parsed));
      } catch (_) {}
    }
  };

  const handleSelectGradient = (val: string) => {
    setAvatarGradient(val);
    localStorage.setItem("up_play_user_avatar_gradient", val);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* 1. ATHLETE PROFILE HEADER & AVATAR EDITOR */}
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${avatarGradient} opacity-5 filter blur-3xl`} />
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Glowing Avatar */}
          <div className="relative group">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-mono font-bold text-black text-2xl shadow-xl border-4 border-[#0d0d0f] transition-transform group-hover:scale-105 duration-300`}>
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 text-xs bg-[#00ff66] text-black px-1.5 py-0.5 rounded-full font-mono font-bold border border-[#0d0d0f] shadow-md">
              #4
            </span>
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            {/* Inline Name Editor */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2 max-w-sm mx-auto md:mx-0">
                  <input
                    type="text"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="bg-[#18181b] border border-zinc-800 text-sm font-semibold rounded-lg px-3 py-1.5 focus:border-[#00ff66] outline-none text-white w-full"
                    maxLength={20}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h2 className="font-display font-bold text-xl text-white tracking-tight">
                    {userName}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-zinc-500 hover:text-emerald-400 cursor-pointer"
                    title="Editar Nome"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-400 mt-1 font-mono">
              UP Fitness ID: <span className="text-zinc-300 font-semibold">UPF-2026-0482</span> • Aluno Regular
            </p>

            {/* Custom Avatar Gradient Preset Selection (Seletor de foto/avatar) */}
            <div className="mt-4">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2 text-center md:text-left">
                Personalizar Gradiente do Avatar
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                {gradients.map((grad, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectGradient(grad.value)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${grad.value} border-2 transition-all cursor-pointer active:scale-95 ${
                      avatarGradient === grad.value ? "border-white scale-110 shadow-md shadow-white/20" : "border-transparent hover:border-zinc-700"
                    }`}
                    title={grad.name}
                    aria-label={`Escolher gradiente ${grad.name}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. CORE STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121214] border border-[#27272a] p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Posição no Ranking</span>
            <span className="text-lg font-bold text-white mt-0.5 block">#4 de 58 atletas</span>
            <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">▲ Subiu 2 posições esta semana</span>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#27272a] p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Pontos (Calorias Rítmicas)</span>
            <span className="text-lg font-bold text-white mt-0.5 block">1.850 kcal</span>
            <span className="text-[9px] text-zinc-500 block">Metabolismo ativado por batidas</span>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#27272a] p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-rose-500/25" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Curtidas Coletivas Recebidas</span>
            <span className="text-lg font-bold text-white mt-0.5 block">42 curtidas</span>
            <span className="text-[9px] text-zinc-500 block">Nos seus pedidos de música</span>
          </div>
        </div>
      </div>

      {/* 3. SETTINGS & HISTORY LAYOUT (TWO COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* BASIC SETTINGS FORM (Configurações Básicas) - 5 COLS */}
        <div className="lg:col-span-5 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-5">
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Configurações do Aplicativo</span>
          </h3>

          {/* Form items */}
          <div className="space-y-4">
            
            {/* Preferred Sector (Setor único) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 block uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-500" /> Ambiente de Treino UP
              </label>
              <div className="w-full bg-[#18181b] border border-zinc-800 text-xs px-3.5 py-2.5 rounded-xl text-zinc-200 flex items-center justify-between">
                <span className="font-semibold text-white">Sala de Musculação - Power Arena</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Som Oficial
                </span>
              </div>
            </div>

            {/* Rhythm Pacing Range Preference */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 block uppercase flex items-center gap-1">
                <Sliders className="w-3 h-3 text-zinc-500" /> Faixa de Ritmo Favorita
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "100-120", bpm: "Moderado" },
                  { label: "120-150", bpm: "Acelerado" },
                  { label: "150-180", bpm: "Insano" }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setPacingRange(item.label)}
                    type="button"
                    className={`py-2 text-[10px] font-mono font-bold rounded-xl border text-center transition-all ${
                      pacingRange === item.label
                        ? "bg-emerald-500 border-emerald-400 text-black"
                        : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span>{item.bpm}</span>
                    <span className="block text-[8px] font-normal mt-0.5">{item.label} BPM</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Latency Sync Bluetooth */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-zinc-400 block uppercase">
                  Sincronia Bluetooth (Latência)
                </label>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{audioLatency} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="400"
                step="25"
                value={audioLatency}
                onChange={(e) => setAudioLatency(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1 bg-zinc-850 rounded-lg appearance-none"
              />
              <p className="text-[8px] text-zinc-500">Ajuste se o áudio do fone estiver dessincronizado das luzes e do sinal rítmico.</p>
            </div>

            {/* Feed Announcements toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
              <div>
                <span className="text-xs font-semibold text-white block">Mural de Anúncios</span>
                <span className="text-[9px] text-zinc-500 block">Exibir comunicados rotativos no cabeçalho</span>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOn(!notificationsOn)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-all outline-none ${
                  notificationsOn ? "bg-emerald-500" : "bg-zinc-800"
                }`}
              >
                <div className={`w-4.5 h-4.5 bg-black rounded-full transition-all transform ${
                  notificationsOn ? "translate-x-4.5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-dashed border-zinc-800 flex items-start gap-2.5 mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-zinc-400 leading-relaxed">
                <span className="font-semibold text-zinc-300">Privacidade Garantida:</span> Seus dados estão em conformidade com as regras digitais da UP Fitness. Nenhuma senha de conta é exposta publicamente.
              </div>
            </div>

          </div>
        </div>

        {/* ORDER HISTORY (Histórico de Pedidos) - 7 COLS */}
        <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Histórico de Pedidos de Música</span>
          </h3>

          <div className="flex flex-col gap-3 max-h-[415px] overflow-y-auto pr-1">
            {userRequestHistory.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 text-xs">
                Você ainda não fez nenhum pedido de música na academia.
              </div>
            ) : (
              userRequestHistory.map((req) => (
                <div
                  key={req.id}
                  className="bg-[#18181b] p-3 rounded-xl border border-zinc-850 hover:border-zinc-800 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center font-mono font-semibold text-[10px] text-emerald-400 shrink-0 border border-zinc-800">
                      {req.bpm || 120}
                    </div>
                    <div className="truncate text-xs">
                      <p className="font-bold text-white truncate">{req.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{req.artist}</p>
                      <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {req.zone} • {req.date}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px] shrink-0">
                    <span className="text-emerald-400 font-bold block flex items-center gap-1 justify-end">
                      <Heart className="w-3 h-3 fill-emerald-500/20 text-emerald-400" />
                      {req.likes || 0}
                    </span>
                    <span className="text-zinc-500 text-[9px] block">curtidas</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
