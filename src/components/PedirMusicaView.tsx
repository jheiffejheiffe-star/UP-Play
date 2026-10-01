import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, MessageSquare, Search, CheckCircle, AlertTriangle, 
  ArrowLeft, Music, Activity, Play, Eye, Sparkles, Database,
  Zap, Flame, Dumbbell, ShieldCheck, Clock, Heart, ThumbsUp,
  Tag, Filter, RefreshCw, Layers, TrendingUp, Radio, HelpCircle,
  Square, Send, ExternalLink, Volume2
} from "lucide-react";
import { GymZone, Song } from "../types";

interface PedirMusicaViewProps {
  activeZone: GymZone | null;
  trackPool: Song[];
  ytRequestInput: string;
  setYtRequestInput: (val: string) => void;
  ytRequestLoading: boolean;
  ytFeedback: { success: boolean; message: string; reason?: string } | null;
  handleYouTubeRequest: (e: React.FormEvent) => void;
  handleCatalogRequest?: (songId: string, target?: string, message?: string) => Promise<any>;
  handleLikeSong?: (songId: string) => Promise<any>;
  dedicationTarget: string;
  setDedicationTarget: (val: string) => void;
  dedicationMessageText: string;
  setDedicationMessageText: (val: string) => void;
  userRequestHistory: any[];
  setUserRequestHistory: React.Dispatch<React.SetStateAction<any[]>>;
  likedSongs: string[];
  handleVote: (id: string) => void;
  setActiveTab: (tab: any) => void;
}

// Local cache key
const CACHE_KEY = "up_play_catalog_cache";
const FAVORITES_KEY = "up_play_favorite_song_ids";

export const PedirMusicaView: React.FC<PedirMusicaViewProps> = ({
  activeZone,
  trackPool,
  ytRequestInput,
  setYtRequestInput,
  ytRequestLoading,
  ytFeedback,
  handleYouTubeRequest,
  handleCatalogRequest,
  handleLikeSong,
  dedicationTarget,
  setDedicationTarget,
  dedicationMessageText,
  setDedicationMessageText,
  userRequestHistory,
  likedSongs,
  handleVote,
  setActiveTab
}) => {
  // Mode selection: "catalog" (instant 1-click) or "youtube" (new link extraction)
  const [requestMode, setRequestMode] = useState<"catalog" | "youtube">("catalog");

  // FEATURE 5: CACHE LOCAL (Filtering out any stale mock/fake songs)
  const [cachedPool, setCachedPool] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((s: any) => 
            !['UP Beats', 'Synth Grid', 'Vocal Force', 'Beat Crushers', 'Alpha Elite', 'X-Treme Sound', 'DJ Electro', 'Velo Beats', 'Code Red', 'Miami Glow', 'Rhythm Shock', 'Beat Battalion', 'Nirvana Chill', 'Cloud Gym', 'Siddhartha', 'Zenith Piano'].includes(s.artist) &&
            !['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10','t11','t12','t13','t14','t15','t16','t17','t18'].includes(s.id)
          );
          if (clean.length > 0) return clean;
        }
      }
    } catch (err) {
      console.error(err);
    }
    return trackPool;
  });

  // Sync cache with new trackPool props
  useEffect(() => {
    if (trackPool && trackPool.length > 0) {
      const clean = trackPool.filter((s: any) => 
        !['UP Beats', 'Synth Grid', 'Vocal Force', 'Beat Crushers', 'Alpha Elite', 'X-Treme Sound', 'DJ Electro', 'Velo Beats', 'Code Red', 'Miami Glow', 'Rhythm Shock', 'Beat Battalion', 'Nirvana Chill', 'Cloud Gym', 'Siddhartha', 'Zenith Piano'].includes(s.artist) &&
        !['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10','t11','t12','t13','t14','t15','t16','t17','t18'].includes(s.id)
      );
      setCachedPool(clean);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(clean));
      } catch (err) {
        console.error(err);
      }
    }
  }, [trackPool]);

  // FEATURE 3: FAVORITOS
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(songId);
      const updated = exists ? prev.filter(id => id !== songId) : [...prev, songId];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  // Local state for catalog search, filters and sort
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [selectedLanguage, setSelectedLanguage] = useState("Todos");
  const [selectedTag, setSelectedTag] = useState("Todas");
  const [activeSort, setActiveSort] = useState<"smartScore" | "popularity" | "favorites" | "recent">("smartScore");

  // Autocomplete state (FEATURE 8)
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Selected song for details & recommendations (FEATURE 7)
  const [selectedSongDetails, setSelectedSongDetails] = useState<Song | null>(null);

  // Requesting status
  const [requestingSongId, setRequestingSongId] = useState<string | null>(null);
  const [catalogFeedback, setCatalogFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Local state for live YT preview
  const [livePreview, setLivePreview] = useState<any | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Helper to extract YouTube video ID from various formats
  const extractId = (urlOrQuery: string): string | null => {
    if (!urlOrQuery) return null;
    const str = urlOrQuery.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const match = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  // Live YT Preview calculation with real YouTube oEmbed & Backend detection
  useEffect(() => {
    setIsPlayingPreview(false);
    if (!ytRequestInput.trim() || ytRequestInput.trim().length < 3) {
      setLivePreview(null);
      setIsPreviewLoading(false);
      return;
    }

    const cleanInput = ytRequestInput.trim();
    const vidId = extractId(cleanInput);
    let isCancelled = false;

    setIsPreviewLoading(true);

    const loadRealYouTubePreview = async () => {
      try {
        const res = await fetch(`/api/music/youtube-preview?url=${encodeURIComponent(cleanInput)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && !isCancelled) {
            setLivePreview({
              videoId: data.videoId || vidId || null,
              title: data.title,
              artist: data.artist,
              bpm: data.bpm,
              energy: data.energy || 8,
              genre: data.genre || "Treino & Performance",
              coverGradient: data.coverGradient || "from-emerald-600 to-teal-900",
              duration: data.duration || 210,
              thumbnail: data.thumbnail || (vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : undefined)
            });
            setIsPreviewLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Backend preview fetch error, falling back to client oEmbed", err);
      }

      // Fallback: try public YouTube oEmbed directly on client
      try {
        const targetUrl = vidId ? `https://www.youtube.com/watch?v=${vidId}` : cleanInput;
        const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(targetUrl);
        if (isUrl) {
          const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
          const res = await fetch(oembedUrl);
          if (res.ok) {
            const data = await res.json();
            if (data && data.title && !isCancelled) {
              let fullTitle = data.title;
              let author = data.author_name || "YouTube";
              let displayTitle = fullTitle;
              let displayArtist = author;

              if (fullTitle.includes(" - ")) {
                const parts = fullTitle.split(" - ");
                displayArtist = parts[0].trim();
                displayTitle = parts.slice(1).join(" - ").trim();
              } else if (fullTitle.includes(" – ")) {
                const parts = fullTitle.split(" – ");
                displayArtist = parts[0].trim();
                displayTitle = parts.slice(1).join(" – ").trim();
              }

              displayTitle = displayTitle
                .replace(/\(Official.*?\)/gi, "")
                .replace(/\[.*?\]/g, "")
                .trim();

              setLivePreview({
                videoId: vidId || null,
                title: displayTitle || fullTitle,
                artist: displayArtist || author,
                bpm: 125,
                energy: 8,
                genre: "Sinal YouTube Detectado",
                coverGradient: "from-blue-600 to-teal-900",
                duration: 210,
                thumbnail: data.thumbnail_url || (vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : undefined)
              });
              setIsPreviewLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Client oEmbed fetch error", e);
      }

      if (!isCancelled) {
        setLivePreview({
          videoId: vidId || null,
          title: cleanInput,
          artist: "Busca no YouTube",
          bpm: 128,
          energy: 8,
          genre: "Sinal de Áudio",
          coverGradient: "from-purple-600 to-zinc-900",
          duration: 210,
          thumbnail: vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : undefined
        });
        setIsPreviewLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadRealYouTubePreview();
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [ytRequestInput]);

  // Submit YouTube request
  const onSubmitYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytRequestInput.trim() || ytRequestLoading) return;
    handleYouTubeRequest(e);
  };

  // Submit direct catalog request
  const onSelectCatalogSong = async (song: Song) => {
    setRequestingSongId(song.id);
    setCatalogFeedback(null);
    setSelectedSongDetails(song);
    if (handleCatalogRequest) {
      const res = await handleCatalogRequest(song.id, dedicationTarget, dedicationMessageText);
      if (res && res.message) {
        setCatalogFeedback({
          success: res.success !== false,
          message: res.message
        });
        if (res.success !== false) {
          setDedicationMessageText("");
        }
      }
    }
    setRequestingSongId(null);
  };

  // FEATURE 1 & 2: Calculate Score & Popularity Metrics
  const computeSongScore = (song: Song): number => {
    if (song.smartScore) return song.smartScore;
    const requests = song.requestCount || song.votes || 0;
    const likes = song.likes || 0;
    const now = Date.now();
    const lastPlayed = song.lastPlayedAt || (now - 120 * 60 * 1000);
    const minutesUnplayed = Math.max(0, Math.floor((now - lastPlayed) / (60 * 1000)));
    const unplayedBonus = Math.floor(minutesUnplayed / 10);
    return Math.max(1, requests * 3 + likes * 2 + unplayedBonus);
  };

  // Unique genres, languages, and tags
  const genresList = ["Todos", "Hip Hop / Rap", "Electronic / Dance", "Metal / Rock", "Techno / House", "Hardstyle", "Ambient / Meditation"];
  const languagesList = ["Todos", "Inglês", "Português", "Instrumental"];
  const allTags = ["Todas", "Hipertrofia", "Treino Pesado", "Supino", "Agachamento", "Força Bruta", "Drop Set", "Hardstyle", "Pump Muscular"];

  // FEATURE 8: AUTOCOMPLETE SUGGESTIONS
  const autocompleteSuggestions = useMemo(() => {
    const query = catalogSearch.toLowerCase().trim();
    if (!query || query.length < 1) return [];
    return cachedPool.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      (song.tags && song.tags.some(t => t.toLowerCase().includes(query)))
    ).slice(0, 5);
  }, [catalogSearch, cachedPool]);

  // FEATURE 7: RECOMMENDATIONS ("Você também pode gostar")
  const recommendedSongs = useMemo(() => {
    if (!selectedSongDetails) return cachedPool.slice(0, 3);
    return cachedPool.filter(s => {
      if (s.id === selectedSongDetails.id) return false;
      const bpmDiff = Math.abs(s.bpm - selectedSongDetails.bpm);
      const isSameGenre = s.genre.toLowerCase() === selectedSongDetails.genre.toLowerCase();
      const hasSharedTag = s.tags && selectedSongDetails.tags && s.tags.some(t => selectedSongDetails.tags?.includes(t));
      return bpmDiff <= 25 || isSameGenre || hasSharedTag;
    }).slice(0, 3);
  }, [selectedSongDetails, cachedPool]);

  // Filter and sort catalog
  const filteredCatalog = useMemo(() => {
    let list = cachedPool.filter(song => {
      const query = catalogSearch.toLowerCase().trim();
      const matchesQuery = !query || 
        song.title.toLowerCase().includes(query) || 
        song.artist.toLowerCase().includes(query) ||
        song.genre.toLowerCase().includes(query) ||
        (song.tags && song.tags.some(t => t.toLowerCase().includes(query)));

      const matchesGenre = selectedGenre === "Todos" || song.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      const matchesLanguage = selectedLanguage === "Todos" || (song.language && song.language.toLowerCase() === selectedLanguage.toLowerCase());
      const matchesTag = selectedTag === "Todas" || (song.tags && song.tags.includes(selectedTag));

      return matchesQuery && matchesGenre && matchesLanguage && matchesTag;
    });

    if (activeSort === "smartScore") {
      list.sort((a, b) => computeSongScore(b) - computeSongScore(a));
    } else if (activeSort === "popularity") {
      list.sort((a, b) => ((b.requestCount || 0) + (b.likes || 0)) - ((a.requestCount || 0) + (a.likes || 0)));
    } else if (activeSort === "favorites") {
      list = list.filter(song => favorites.includes(song.id));
    } else if (activeSort === "recent") {
      list.sort((a, b) => (b.lastVotedAt || 0) - (a.lastVotedAt || 0));
    }

    return list;
  }, [cachedPool, catalogSearch, selectedGenre, selectedLanguage, selectedTag, activeSort, favorites]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3 h-3" /> Catálogo Inteligente ({cachedPool.length} Músicas Cache)
            </span>
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
              • Moderação por IA Integrada & Auto-Playlist Ativa
            </span>
          </div>
          <h2 className="font-display font-bold text-xl text-white mt-2 flex items-center gap-2">
            Pedir Música para o Treino
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Escolha uma música pré-aprovada do catálogo para envio <span className="text-[#00ff66] font-semibold">instantâneo com 1 clique</span> ou importe um novo link do YouTube.
          </p>
        </div>
        
        <button
          onClick={() => setActiveTab("home")}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 self-start md:self-center cursor-pointer relative z-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Início</span>
        </button>
      </div>

      {/* FEATURE 4: AUTOMATIC PLAYLIST NOTICE BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/20 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>Playlist Automática Inteligente (Zero Silêncio)</span>
              <span className="text-[9px] bg-emerald-500/20 text-[#00ff66] px-1.5 py-0.5 rounded font-mono">ATIVO</span>
            </p>
            <p className="text-[11px] text-zinc-400">
              Se a fila de pedidos esvaziar, o sistema executa automaticamente as faixas Top Academia por energia & estilo!
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveSort("smartScore")}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-mono font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 border border-zinc-700"
        >
          ⚡ Ordenar por Score IA
        </button>
      </div>

      {/* MODE SELECTOR TABS */}
      <div className="flex flex-row gap-2 sm:gap-3 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setRequestMode("catalog")}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 border cursor-pointer min-h-[44px] ${
            requestMode === "catalog"
              ? "bg-[#00ff66] text-black border-[#00ff66] shadow-lg shadow-[#00ff66]/10"
              : "bg-[#121214] text-zinc-400 border-[#27272a] hover:border-zinc-700 hover:text-white"
          }`}
        >
          <Database className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">Catálogo ({cachedPool.length})</span>
          <span className="hidden sm:inline">1. Catálogo Oficial (Instantâneo)</span>
          <span className="bg-black/20 text-[#00ff66] text-[10px] px-1.5 py-0.5 rounded font-mono ml-auto hidden md:inline">
            {cachedPool.length} músicas
          </span>
        </button>

        <button
          onClick={() => setRequestMode("youtube")}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 border cursor-pointer min-h-[44px] ${
            requestMode === "youtube"
              ? "bg-[#ff0000] text-white border-[#ff0000] shadow-lg shadow-[#ff0000]/10"
              : "bg-[#121214] text-zinc-400 border-[#27272a] hover:border-zinc-700 hover:text-white"
          }`}
        >
          <Play className="w-4 h-4 fill-current shrink-0" />
          <span className="sm:hidden">Link YouTube</span>
          <span className="hidden sm:inline">2. Importar Link YouTube</span>
          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-mono ml-auto hidden md:inline">
            Moderação IA
          </span>
        </button>
      </div>

      {/* DEDICATION BAR */}
      <div className="bg-[#121214] border border-[#27272a] p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Dedicar para Aluno / Musculação
            </h4>
            <p className="text-[10px] text-zinc-400">Opcional: Envie uma mensagem na tela da sala</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
          <select
            value={dedicationTarget}
            onChange={(e) => setDedicationTarget(e.target.value)}
            className="bg-[#18181b] border border-zinc-800 text-xs px-3 py-2 rounded-xl text-zinc-200 focus:border-emerald-500 outline-none transition-all"
          >
            <option value="">Ninguém (Música para todos na Musculação)</option>
            <option value="Geral">Galera da Sala de Musculação</option>
            <option value="Treinadores">Equipe de Treinadores</option>
            <option value="Amigo_de_Treino">Amigo de Treino / Parceiro de Supino</option>
          </select>

          <input
            type="text"
            value={dedicationMessageText}
            onChange={(e) => setDedicationMessageText(e.target.value)}
            placeholder="Mensagem de garra (Ex: 'Bora bater recorde no supino!')"
            className="bg-[#18181b] border border-zinc-800 text-xs px-3 py-2 rounded-xl text-zinc-200 focus:border-emerald-500 outline-none transition-all"
            maxLength={100}
          />
        </div>
      </div>

      {/* MODE 1: CATALOG FAST SEARCH (1-CLICK & ENRICHED) */}
      {requestMode === "catalog" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* SEARCH + AUTOCOMPLETE (FEATURE 8) */}
            <div className="bg-[#121214] border border-[#27272a] p-4 rounded-2xl flex flex-col gap-3 relative">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onFocus={() => setShowAutocomplete(true)}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value);
                    setShowAutocomplete(true);
                  }}
                  placeholder="Pesquisar por título, artista, gênero ou tag (Ex: Eye, Eminem, Supino, Hardstyle)..."
                  className="w-full bg-[#18181b] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                />

                {/* FEATURE 8: FLOATING AUTOCOMPLETE DROPDOWN */}
                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#18181b] border border-emerald-500/40 rounded-xl shadow-2xl z-50 p-2 divide-y divide-zinc-800/60 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[10px] font-mono text-zinc-400 uppercase flex items-center justify-between">
                      <span>Sugestões Instantâneas ({autocompleteSuggestions.length})</span>
                      <span className="text-[#00ff66]">1-Clique para pedir</span>
                    </div>

                    {autocompleteSuggestions.map(song => (
                      <div
                        key={song.id}
                        onClick={() => {
                          onSelectCatalogSong(song);
                          setShowAutocomplete(false);
                        }}
                        className="p-2.5 hover:bg-zinc-800/80 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${song.coverGradient || "from-emerald-600 to-black"} flex items-center justify-center shrink-0`}>
                            <Music className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                              {song.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {song.artist} • {song.bpm} BPM
                            </p>
                          </div>
                        </div>

                        <button className="px-2.5 py-1 bg-[#00ff66] text-black text-[10px] font-bold rounded-lg group-hover:bg-emerald-400 transition-all shrink-0">
                          Pedir Agora →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SORT & FILTER TABS (FEATURE 1, 2, 3, 6) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setActiveSort("smartScore")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    activeSort === "smartScore" ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>⚡ Score IA</span>
                </button>

                <button
                  onClick={() => setActiveSort("popularity")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    activeSort === "popularity" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>🔥 Mais Tocadas</span>
                </button>

                <button
                  onClick={() => setActiveSort("favorites")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    activeSort === "favorites" ? "bg-rose-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Heart className="w-3 h-3 fill-current" />
                  <span>❤️ Minhas Favoritas ({favorites.length})</span>
                </button>

                <button
                  onClick={() => setActiveSort("recent")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    activeSort === "recent" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Recentes</span>
                </button>
              </div>

              {/* ENRICHED FILTERS: Genre, Language, Tag (FEATURE 6) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-[#18181b] border border-zinc-800 text-[11px] px-2.5 py-1.5 rounded-lg text-zinc-300 outline-none"
                >
                  <option value="Todos">Gênero: Todos</option>
                  {genresList.slice(1).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-[#18181b] border border-zinc-800 text-[11px] px-2.5 py-1.5 rounded-lg text-zinc-300 outline-none"
                >
                  <option value="Todos">Idioma: Todos</option>
                  {languagesList.slice(1).map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>

                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="bg-[#18181b] border border-zinc-800 text-[11px] px-2.5 py-1.5 rounded-lg text-zinc-300 outline-none"
                >
                  <option value="Todas">Tags: Todas</option>
                  {allTags.slice(1).map(t => (
                    <option key={t} value={t}>#{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Catalog Feedback Notice */}
            {catalogFeedback && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-fadeIn ${
                catalogFeedback.success
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/30 border-rose-500/40 text-rose-300"
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-[#00ff66]" />
                  <span>{catalogFeedback.message}</span>
                </div>
                <button 
                  onClick={() => setActiveTab("fila")}
                  className="px-2.5 py-1 bg-[#00ff66] text-black font-bold text-[10px] rounded-lg hover:bg-emerald-400 transition-all cursor-pointer shrink-0"
                >
                  Ver Fila Completa →
                </button>
              </div>
            )}

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredCatalog.length > 0 ? (
                filteredCatalog.map(song => {
                  const isRequesting = requestingSongId === song.id;
                  const isFav = favorites.includes(song.id);
                  const score = computeSongScore(song);

                  return (
                    <div
                      key={song.id}
                      onClick={() => setSelectedSongDetails(song)}
                      className="bg-[#121214] border border-[#27272a] hover:border-zinc-700 p-3.5 rounded-2xl flex flex-col justify-between gap-3 transition-all group relative cursor-pointer"
                    >
                      {/* Top bar: Score badge & Favorite heart */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-[#00ff66] border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          <span>Score IA: {score} pts</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-zinc-400">
                            🔥 {song.requestCount || 0} pedidos • 👍 {song.likes || 0}
                          </span>

                          <button
                            onClick={(e) => toggleFavorite(song.id, e)}
                            className={`p-1 rounded-lg transition-all cursor-pointer ${
                              isFav ? "text-rose-500 bg-rose-500/10" : "text-zinc-600 hover:text-rose-400"
                            }`}
                            title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${song.coverGradient || "from-emerald-600 to-zinc-900"} flex items-center justify-center shrink-0 border border-white/10 shadow-md relative overflow-hidden`}>
                          <Music className="w-5 h-5 text-white/90" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                            {song.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {song.artist}
                          </p>

                          {/* Enriched badges */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            <span className="text-[9px] font-mono font-bold bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded border border-zinc-700">
                              ⚡ {song.bpm} BPM
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 truncate">
                              {song.genre}
                            </span>
                            {song.language && (
                              <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                🌐 {song.language}
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {song.tags && song.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {song.tags.map(t => (
                                <span key={t} className="text-[8px] font-mono text-zinc-400 bg-zinc-900/80 px-1.5 py-0.5 rounded">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons: Like + Request */}
                      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (handleLikeSong) await handleLikeSong(song.id);
                          }}
                          className="px-2.5 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          title="Dar curtida"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{song.likes || 0}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCatalogSong(song);
                          }}
                          disabled={isRequesting}
                          className="flex-1 py-2 bg-zinc-800 hover:bg-[#00ff66] hover:text-black text-zinc-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isRequesting ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              <span>Injetando na Fila...</span>
                            </span>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Injetar na Fila (1 Clique)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-zinc-500 text-xs bg-[#121214] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center gap-2">
                  <Music className="w-8 h-8 text-zinc-700" />
                  <p>Nenhuma música encontrada para os filtros atuais.</p>
                  <button
                    onClick={() => {
                      setCatalogSearch("");
                      setSelectedGenre("Todos");
                      setSelectedLanguage("Todos");
                      setSelectedTag("Todas");
                      setActiveSort("smartScore");
                    }}
                    className="text-emerald-400 underline font-semibold text-xs mt-1 cursor-pointer"
                  >
                    Limpar todos os filtros →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL: RECOMMENDATIONS (FEATURE 7) & RECENT HISTORY */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* FEATURE 7: RECOMMENDATIONS BOX ("Você também pode gostar") */}
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00ff66]" />
                  <span>Você também pode gostar</span>
                </span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">IA Match</span>
              </div>

              {selectedSongDetails && (
                <p className="text-[10px] text-zinc-400">
                  Baseado em: <strong className="text-white">{selectedSongDetails.title}</strong> ({selectedSongDetails.bpm} BPM)
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                {recommendedSongs.map(rec => (
                  <div key={rec.id} className="bg-[#18181b] border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between gap-2 hover:border-zinc-700 transition-all">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{rec.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{rec.artist} • {rec.bpm} BPM</p>
                    </div>
                    <button
                      onClick={() => onSelectCatalogSong(rec)}
                      className="px-2.5 py-1 bg-emerald-500/20 text-[#00ff66] hover:bg-[#00ff66] hover:text-black border border-emerald-500/30 text-[10px] font-bold rounded-lg transition-all shrink-0 cursor-pointer"
                    >
                      + Pedir Esta
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SCORE IA FORMULA EXPLANATION CARD (FEATURE 2) */}
            <div className="bg-[#121214] border border-[#27272a] p-4 rounded-2xl flex flex-col gap-2 text-xs">
              <h4 className="font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[11px]">
                <Zap className="w-3.5 h-3.5" /> Fórmula de Score da Fila IA
              </h4>
              <p className="text-[11px] text-zinc-300 font-mono leading-relaxed bg-black/40 p-2 rounded-lg border border-zinc-800/80">
                Score = Pedidos + Curtidas + (Tempo sem Tocar / 10) - Repetição Recente
              </p>
              <p className="text-[10px] text-zinc-400">
                Garante que as músicas mais queridas toquem no topo sem que uma mesma faixa repita demais!
              </p>
            </div>

            {/* User Request History */}
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-3">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Suas Solicitações Recentes</span>
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
              </h4>

              {userRequestHistory.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {userRequestHistory.slice(0, 5).map((req, idx) => (
                    <div key={req.id || idx} className="bg-[#18181b] border border-zinc-800 p-2.5 rounded-xl text-xs flex justify-between items-center">
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">{req.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{req.artist || "UP Play"} • {req.date}</p>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        {req.bpm || 120} BPM
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic py-4 text-center">Você ainda não solicitou músicas nesta sessão.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODE 2: YOUTUBE LINK EXTRACTION */}
      {requestMode === "youtube" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: YOUTUBE REQUEST FORM */}
          <form onSubmit={onSubmitYouTube} className="lg:col-span-7 bg-[#121214] border border-[#27272a] p-6 rounded-2xl flex flex-col gap-5">
            <div>
              <span className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                🎬 Importar Novo Vídeo
              </span>
              <h3 className="font-display font-semibold text-sm text-white mt-2">
                Insira o link ou nome do vídeo do YouTube
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                A IA analisará o ritmo e a letra. Se for aprovada, a música tocará no setor e será <strong className="text-white">salva no Catálogo</strong> para os próximos alunos!
              </p>
            </div>

            {/* YouTube Link / Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-400 block uppercase">Link do YouTube</label>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ytRequestInput}
                  onChange={(e) => setYtRequestInput(e.target.value)}
                  placeholder="Cole um link do YouTube (Ex: https://www.youtube.com/watch?v=...)"
                  disabled={ytRequestLoading}
                  className="w-full bg-[#18181b] border border-zinc-800 hover:border-zinc-700 focus:border-rose-500 rounded-xl pl-9 pr-4 py-3 text-xs text-white placeholder-zinc-500 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ ou https://youtu.be/...</p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={ytRequestLoading || !ytRequestInput.trim()}
              className="w-full py-3 min-h-[46px] bg-[#ff0000] hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 touch-manipulation"
            >
              {ytRequestLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>A Inteligência Artificial está analisando o ritmo...</span>
                </span>
              ) : (
                <span>ANALISAR, APROVAR E GRAVAR NO CATÁLOGO</span>
              )}
            </button>

            {/* MODERATOR FEEDBACK BANNER */}
            {ytFeedback && (
              <div className={`border rounded-xl p-4 flex gap-3 animate-fadeIn ${
                ytFeedback.success 
                  ? "bg-emerald-950/20 border-emerald-500/30 text-zinc-300" 
                  : "bg-rose-950/20 border-rose-500/30 text-zinc-300"
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ytFeedback.success ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}>
                  {ytFeedback.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white uppercase tracking-wide">
                    {ytFeedback.success ? "Música Aprovada e Gravada no Catálogo!" : "Pedido Retido pelo Moderador"}
                  </p>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {ytFeedback.message}
                  </p>
                  {ytFeedback.reason && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/60 text-left">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">Avaliação da IA:</span>
                      <span className="text-xs text-zinc-400 italic">"{ytFeedback.reason}"</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* RIGHT COLUMN: LIVE YT PREVIEW CARD */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Pré-visualização Automática</span>
                {isPreviewLoading ? (
                  <span className="text-amber-400 text-[10px] font-mono flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Identificando...
                  </span>
                ) : isPlayingPreview ? (
                  <span className="text-rose-400 text-[10px] font-mono flex items-center gap-1">
                    <Volume2 className="w-3 h-3 animate-pulse" /> Tocando Prévia
                  </span>
                ) : livePreview ? (
                  <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
                    <Eye className="w-3 h-3" /> Detectado
                  </span>
                ) : null}
              </h3>

              {livePreview ? (
                <div className="space-y-4 animate-scaleUp">
                  {isPlayingPreview ? (
                    <div className="relative h-48 rounded-xl overflow-hidden shadow-2xl border border-rose-500/40 bg-black flex flex-col">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${livePreview.videoId || 'dQw4w9WgXcQ'}?autoplay=1&rel=0&modestbranding=1`}
                        title={livePreview.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full object-cover border-0"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPlayingPreview(false)}
                        className="absolute top-2 right-2 z-20 px-2.5 py-1 bg-black/85 hover:bg-zinc-900 text-white rounded-lg text-[10px] font-mono border border-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                      >
                        <Square className="w-2.5 h-2.5 text-rose-400 fill-rose-400" /> Parar Prévia
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        if (livePreview.videoId) {
                          setIsPlayingPreview(true);
                        }
                      }}
                      className={`relative h-44 rounded-xl ${livePreview.thumbnail ? 'bg-zinc-950' : `bg-gradient-to-tr ${livePreview.coverGradient}`} p-4 flex flex-col justify-between overflow-hidden shadow-lg border border-white/10 group cursor-pointer transition-all hover:border-zinc-500`}
                      title="Clique para testar e ouvir a música"
                    >
                      {livePreview.thumbnail && (
                        <img
                          src={livePreview.thumbnail}
                          alt={livePreview.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      
                      <div className="relative z-10 flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold bg-[#ff0000] text-white px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow">
                          <Play className="w-2.5 h-2.5 fill-white" /> Live Preview
                        </span>
                        <span className="text-[10px] text-white/90 font-mono bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                          {Math.floor(livePreview.duration / 60)}:{String(livePreview.duration % 60).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="relative z-10 flex items-center justify-center h-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPlayingPreview(true);
                          }}
                          className="w-12 h-12 rounded-full bg-[#ff0000] hover:bg-red-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-white border border-white/25 shadow-2xl cursor-pointer"
                          title="Reproduzir prévia de áudio/vídeo"
                        >
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </button>
                      </div>

                      <div className="relative z-10">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> SINAL YOUTUBE DETECTADO
                        </p>
                        <h4 className="text-sm font-black text-white truncate leading-tight mt-0.5">
                          {livePreview.title}
                        </h4>
                        <p className="text-xs text-emerald-300 font-semibold truncate mt-0.5">
                          {livePreview.artist}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Estimação das Frequências</p>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Análise Rítmica IA
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                        <span className="text-[9px] text-zinc-500 block uppercase font-mono">BPM Estimado</span>
                        <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{livePreview.bpm} BPM</span>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                        <span className="text-[9px] text-zinc-500 block uppercase font-mono">Gênero Alvo</span>
                        <span className="text-[11px] font-bold text-white truncate block mt-0.5">{livePreview.genre}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions in Preview */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                      className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isPlayingPreview ? (
                        <>
                          <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Parar Prévia
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-[#00ff66] fill-[#00ff66]" /> Ouvir Prévia
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => onSubmitYouTube(e)}
                      disabled={ytRequestLoading}
                      className="py-2.5 px-3 bg-[#00ff66] hover:bg-[#00e65c] text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {ytRequestLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Pedir Música
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2">
                  <Music className="w-8 h-8 text-zinc-700 animate-[bounce_2s_infinite]" />
                  <p className="max-w-[200px] leading-normal">
                    Cole o link do YouTube ao lado para ver os detalhes detectados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
