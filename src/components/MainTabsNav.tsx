import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Home,
  Plus,
  Vote,
  User,
  Trophy,
  Sparkles,
  Award,
  Sliders,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export type TabType =
  | "home"
  | "pedir-musica"
  | "fila"
  | "perfil"
  | "top-up"
  | "ai-coach"
  | "challenges"
  | "gestor"
  | "gestor-dashboard"
  | "gestor-player"
  | "gestor-usuarios"
  | "gestor-anuncios"
  | "gestor-bi"
  | "gestor-config";

interface MainTabsNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isGestorUser: boolean;
  onGestorClick?: () => void;
}

export const MainTabsNav: React.FC<MainTabsNavProps> = ({
  activeTab,
  setActiveTab,
  isGestorUser,
  onGestorClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  // Center active tab automatically on change or screen resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const activeButton = el.querySelector<HTMLElement>(`[data-active="true"]`);
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeTab]);

  const scrollByAmount = (offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const isGestorActive = activeTab.startsWith("gestor");

  return (
    <div
      id="main-tabs-navbar-wrapper"
      className="relative border-b border-[#27272a] bg-[#0d0d0f] sticky top-[calc(53px+env(safe-area-inset-top,0px))] md:top-0 z-20 select-none px-safe"
    >
      {/* Subtle Left Fade Mask */}
      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-7 bg-gradient-to-r from-[#0d0d0f] via-[#0d0d0f]/80 to-transparent z-10 transition-opacity duration-300 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Subtle Left Scroll Button (desktop/tablet hint) */}
      {canScrollLeft && (
        <button
          onClick={() => scrollByAmount(-140)}
          className="hidden md:flex absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 items-center justify-center rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 shadow-md cursor-pointer transition-all"
          title="Rolar abas para a esquerda"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Main Scrollable Tabs Container */}
      <div
        ref={containerRef}
        className="flex items-center px-2.5 sm:px-6 py-2 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x overscroll-x-contain"
      >
        {/* 1. Início / Home */}
        <button
          data-active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 min-h-[34px] cursor-pointer ${
            activeTab === "home"
              ? "bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/25"
              : "text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/70"
          }`}
        >
          <Home className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Início</span>
          <span className="hidden sm:inline">Início (Home)</span>
        </button>

        {/* 2. Pedir Música */}
        <button
          data-active={activeTab === "pedir-musica"}
          onClick={() => setActiveTab("pedir-musica")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 min-h-[34px] cursor-pointer ${
            activeTab === "pedir-musica"
              ? "bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/25"
              : "text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/70"
          }`}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Pedir</span>
          <span className="hidden sm:inline">Pedir Música</span>
        </button>

        {/* 3. Fila da Galera */}
        <button
          data-active={activeTab === "fila"}
          onClick={() => setActiveTab("fila")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 min-h-[34px] cursor-pointer ${
            activeTab === "fila"
              ? "bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/25"
              : "text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/70"
          }`}
        >
          <Vote className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Fila</span>
          <span className="hidden sm:inline">Fila da Galera</span>
        </button>

        {/* 4. Perfil do Aluno */}
        <button
          data-active={activeTab === "perfil"}
          onClick={() => setActiveTab("perfil")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 min-h-[34px] cursor-pointer ${
            activeTab === "perfil"
              ? "bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/25"
              : "text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/70"
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Perfil</span>
          <span className="hidden sm:inline">Perfil do Aluno</span>
        </button>

        {/* 5. TOP UP */}
        <button
          data-active={activeTab === "top-up"}
          onClick={() => setActiveTab("top-up")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 min-h-[34px] cursor-pointer ${
            activeTab === "top-up"
              ? "bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/25"
              : "text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/70"
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>TOP UP</span>
        </button>

        {/* 6. AI Coach */}
        <button
          data-active={activeTab === "ai-coach"}
          onClick={() => setActiveTab("ai-coach")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 min-h-[34px] cursor-pointer ${
            activeTab === "ai-coach"
              ? "bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/25"
              : "text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/70"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="sm:hidden">Coach</span>
          <span className="hidden sm:inline">AI Coach</span>
        </button>

        {/* 7. Desafios */}
        <button
          data-active={activeTab === "challenges"}
          onClick={() => setActiveTab("challenges")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 min-h-[34px] cursor-pointer ${
            activeTab === "challenges"
              ? "bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/25"
              : "text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/70"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Desafios</span>
        </button>

        {/* 8. Painel do Gestor (apenas gestores) */}
        {isGestorUser && (
          <button
            id="btn-gestor-top"
            data-active={isGestorActive}
            onClick={() => {
              if (onGestorClick) {
                onGestorClick();
              } else {
                setActiveTab("gestor-dashboard");
              }
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 min-h-[34px] cursor-pointer ${
              isGestorActive
                ? "bg-[#00ff66] text-black font-bold shadow-sm shadow-[#00ff66]/25"
                : "text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/70"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span className="sm:hidden">Gestor</span>
            <span className="hidden sm:inline">Painel do Gestor</span>
          </button>
        )}
      </div>

      {/* Subtle Right Fade Mask */}
      <div
        className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0d0d0f] via-[#0d0d0f]/80 to-transparent z-10 transition-opacity duration-300 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Subtle Right Scroll Button (desktop/tablet hint) */}
      {canScrollRight && (
        <button
          onClick={() => scrollByAmount(140)}
          className="hidden md:flex absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 items-center justify-center rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 shadow-md cursor-pointer transition-all"
          title="Rolar abas para a direita"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
