import React, { useState } from "react";
import { 
  Megaphone, Plus, Trash2, Calendar, Clock, Sparkles, 
  ArrowUp, ArrowDown, LayoutGrid, ToggleLeft, ToggleRight, Check, Loader2, AlertCircle 
} from "lucide-react";

export interface Announcement {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  active: boolean;
  startDate: string;
  endDate: string;
  priority: number;
}

interface GestorAnunciosViewProps {
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  addLog: (type: string, user: string, content: string, status: "approved" | "flagged", reason: string) => void;
}

export const GestorAnunciosView: React.FC<GestorAnunciosViewProps> = ({
  announcements,
  setAnnouncements,
  addLog
}) => {
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("from-emerald-400 to-teal-600");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Helper for auth headers
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
    return {
      "Content-Type": "application/json",
      "x-user-email": userEmail,
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  // Toggle active slide
  const handleToggleActive = async (id: string, currentVal: boolean) => {
    // Optimistic UI update
    setAnnouncements((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, active: !currentVal } : ad))
    );

    const title = announcements.find((a) => a.id === id)?.title || "Anúncio";
    addLog(
      "system",
      "Administrador",
      `Alterado status do anúncio "${title}" para ${!currentVal ? "ATIVADO" : "DESATIVADO"}.`,
      "approved",
      "Configuração de campanha"
    );

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, active: !currentVal })
      });
      const data = await res.json();
      if (data.success && data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error("Erro ao alterar status do anúncio:", err);
    }
  };

  // Handle re-ordering priority up or down
  const movePriority = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === announcements.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...announcements];
    
    // Swap items
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Reassign priority ranks based on index
    const finalized = reordered.map((item, idx) => ({
      ...item,
      priority: idx + 1
    }));

    setAnnouncements(finalized);
    addLog(
      "system",
      "Administrador",
      "Reordenada prioridade dos anúncios rotativos do mural coletivo.",
      "approved",
      "Priorização de anúncios manual"
    );

    setFeedback("Prioridades de exibição atualizadas!");
    setTimeout(() => setFeedback(null), 2500);

    try {
      await fetch("/api/admin/announcements/reorder", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          list: finalized.map((a, i) => ({ id: a.id, priority: i + 1 }))
        })
      });
    } catch (err) {
      console.error("Erro ao reordenar anúncios:", err);
    }
  };

  // Handle removing announcement
  const handleRemoveAd = async (id: string) => {
    setDeletingId(id);
    const title = announcements.find((a) => a.id === id)?.title || "Anúncio";

    // Optimistic UI removal
    setAnnouncements((prev) => prev.filter((ad) => ad.id !== id));
    addLog(
      "system",
      "Administrador",
      `Removida campanha rítmica "${title}".`,
      "flagged",
      "Exclusão manual de anúncio"
    );

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.announcements) {
        setAnnouncements(data.announcements);
        setFeedback(`Campanha "${title}" excluída com sucesso!`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Erro ao excluir anúncio:", err);
      // Fallback with POST delete
      try {
        await fetch("/api/admin/announcements/delete", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ id })
        });
      } catch (_) {}
    } finally {
      setDeletingId(null);
    }
  };

  // Submit and create announcement
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      setErrorMessage("Por favor, preencha o título e a descrição do anúncio.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const newAdPayload = {
      isNew: true,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || "Oferta Exclusiva Aluno UP Fitness",
      description: newDesc.trim(),
      color: newColor,
      active: true,
      startDate: startDate,
      endDate: endDate,
      priority: announcements.length + 1
    };

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newAdPayload)
      });

      const data = await res.json();
      if (data.success) {
        if (data.announcements) {
          setAnnouncements(data.announcements);
        } else if (data.announcement) {
          setAnnouncements((prev) => [...prev, data.announcement]);
        }

        addLog(
          "system",
          "Administrador",
          `Criado e injetado novo anúncio rítmico: "${newTitle.trim()}".`,
          "approved",
          "Injeção de nova campanha no feed"
        );

        setNewTitle("");
        setNewSubtitle("");
        setNewDesc("");
        setFeedback("Campanha lançada com sucesso no feed coletivo!");
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setErrorMessage(data.message || "Erro ao salvar anúncio.");
      }
    } catch (err) {
      console.error("Erro ao registrar campanha:", err);
      setErrorMessage("Falha de rede ao registrar anúncio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-40 md:pb-48">
      {/* HEADER EXPLAINER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-4 sm:p-6 shadow-lg">
        <div>
          <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Campanhas & Patrocínios
          </span>
          <h2 className="font-display font-bold text-lg sm:text-xl text-white mt-2">
            Mural de Anúncios Coletivos (Feed)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Injete promoções do UP Café, eventos de musculação ou patrocinadores externos. Todos os anúncios são sincronizados e renderizados no topo da tela dos alunos em formato de carrossel contínuo.
          </p>
        </div>

        {feedback && (
          <div className="bg-[#00ff66]/10 border border-[#00ff66]/30 px-4 py-2.5 rounded-xl text-xs text-[#00ff66] font-medium animate-pulse flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-xl text-xs text-red-400 font-medium flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE FEED AD LIST & DRAG-SORT SIMULATION (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <h4 className="font-semibold text-sm text-white">Carrossel Ativo & Prioridade de Exibição</h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {announcements.length} campanhas cadastradas
              </span>
            </div>

            {/* List announcements */}
            <div className="flex flex-col gap-3">
              {announcements.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs font-mono border border-dashed border-zinc-800 rounded-xl">
                  Nenhum anúncio ativo no momento. Crie um novo formulário ao lado.
                </div>
              ) : (
                announcements.map((ad, idx) => (
                  <div 
                    key={ad.id || idx} 
                    className="bg-[#18181b] border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-all group shadow-sm"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Square Feed representation */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-tr ${ad.color || "from-emerald-400 to-teal-600"} flex flex-col items-center justify-center p-1 text-center shrink-0 border border-zinc-700 shadow-inner overflow-hidden text-[8px] font-black leading-tight text-white uppercase`}>
                        <span className="opacity-80 text-[7px] font-mono font-normal">UP PLAY</span>
                        <span className="truncate w-full font-sans tracking-tighter mt-0.5">{ad.title.slice(0, 10)}</span>
                      </div>

                      <div className="truncate text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold">
                            PRIORIDADE #{idx + 1}
                          </span>
                          <h5 className="font-bold text-white truncate">{ad.title}</h5>
                        </div>
                        <p className="text-[#00ff66] font-semibold mt-0.5 truncate text-[11px]">{ad.subtitle}</p>
                        
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500 font-mono">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {ad.startDate || "2026-08-20"} até {ad.endDate || "2026-08-27"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions / ordering block */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-850">
                      {/* Toggle Active status button */}
                      <button
                        onClick={() => handleToggleActive(ad.id, ad.active)}
                        className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title={ad.active ? "Desativar Anúncio" : "Ativar Anúncio"}
                      >
                        {ad.active ? (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" /> ATIVO
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono font-bold bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                            INATIVO
                          </div>
                        )}
                      </button>

                      {/* Priority buttons */}
                      <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-850">
                        <button
                          onClick={() => movePriority(idx, "up")}
                          disabled={idx === 0}
                          className={`p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md hover:bg-zinc-800 transition-all ${idx === 0 ? "text-zinc-700 cursor-not-allowed" : "text-zinc-300 cursor-pointer active:scale-95"}`}
                          title="Subir Prioridade"
                          aria-label="Subir Prioridade"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => movePriority(idx, "down")}
                          disabled={idx === announcements.length - 1}
                          className={`p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md hover:bg-zinc-800 transition-all ${idx === announcements.length - 1 ? "text-zinc-700 cursor-not-allowed" : "text-zinc-300 cursor-pointer active:scale-95"}`}
                          title="Baixar Prioridade"
                          aria-label="Baixar Prioridade"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveAd(ad.id)}
                        disabled={deletingId === ad.id}
                        className="text-zinc-500 hover:text-red-400 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-red-500/10 rounded-lg cursor-pointer transition-all disabled:opacity-50 active:scale-95"
                        title="Excluir Campanha"
                        aria-label="Excluir Campanha"
                      >
                        {deletingId === ad.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSTAGRAM SQUARE REGISTER FORM (5 COLS) */}
        <div className="lg:col-span-5 bg-[#121214] border border-[#27272a] rounded-2xl p-5 md:p-6 flex flex-col gap-4 shadow-xl">
          <div className="border-b border-zinc-850 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400/15 animate-pulse" />
            <div>
              <h4 className="font-semibold text-sm text-white">Criar Nova Campanha (Feed Square)</h4>
              <p className="text-[10px] text-zinc-500">Adicione imagens e chamadas rítmicas para veiculação no feed.</p>
            </div>
          </div>

          <form onSubmit={handleCreateAd} className="flex flex-col gap-3.5">
            {/* Visual template selector */}
            <div>
              <label className="text-[9px] font-mono text-zinc-400 block mb-1">COR / CARD ESTILIZADO DE FUNDO</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: "Verde Arena", grad: "from-emerald-400 to-teal-600" },
                  { name: "Laranja Sol", grad: "from-amber-400 to-rose-500" },
                  { name: "Roxo Cosmic", grad: "from-purple-600 to-indigo-600" },
                  { name: "Crimson Red", grad: "from-red-600 to-zinc-900" }
                ].map((bg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewColor(bg.grad)}
                    className={`p-1.5 rounded-lg border text-[8px] font-mono text-center flex flex-col items-center gap-1 transition-all ${
                      newColor === bg.grad
                        ? "bg-zinc-850 border-[#00ff66] text-white shadow-md shadow-emerald-500/10"
                        : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-tr ${bg.grad} shadow-inner shrink-0`} />
                    <span className="truncate w-full text-[7px]">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title text */}
            <div>
              <label className="text-[9px] font-mono text-zinc-400 block mb-1">TÍTULO EM DESTAQUE (Mural do Feed) *</label>
              <input
                type="text"
                required
                maxLength={40}
                placeholder="Ex: 🍿 UP Café: Desconto Whey Combo"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#18181b] border border-zinc-800 text-[11px] rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#00ff66] transition-colors"
              />
            </div>

            {/* Subtitle text */}
            <div>
              <label className="text-[9px] font-mono text-zinc-400 block mb-1">CHAMADA EM NEGRITO (Atrativo)</label>
              <input
                type="text"
                maxLength={36}
                placeholder="Ex: Compre 1 Shaker, Ganhe Shake!"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                className="w-full bg-[#18181b] border border-zinc-800 text-[11px] rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#00ff66] transition-colors"
              />
            </div>

            {/* Description Details */}
            <div>
              <label className="text-[9px] font-mono text-zinc-400 block mb-1">DESCRIÇÃO DETALHADA DO ANÚNCIO *</label>
              <textarea
                rows={3}
                required
                maxLength={180}
                placeholder="Ex: Mostre que votou na música atual e ganhe 15% de desconto em qualquer dose de Whey isolado no balcão de lanches do UP Café hoje das 17h às 21h!"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-[#18181b] border border-zinc-800 text-[11px] rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#00ff66] resize-none transition-colors"
              />
            </div>

            {/* AUTOMATIC TIMING */}
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              <div>
                <label className="text-[9px] font-mono text-zinc-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-500" /> DATA INÍCIO
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 text-[10px] rounded-lg px-2.5 py-2 text-zinc-300 outline-none font-mono focus:border-[#00ff66]"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-zinc-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" /> DATA TÉRMINO
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 text-[10px] rounded-lg px-2.5 py-2 text-zinc-300 outline-none font-mono focus:border-[#00ff66]"
                />
              </div>
            </div>

            {/* Prominent Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 px-4 bg-[#00ff66] hover:bg-[#00e159] text-black font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Salvando Anúncio...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Salvar & Lançar Campanha</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

