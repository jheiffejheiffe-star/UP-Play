export interface CatalogSong {
  youtubeId: string;
  url: string;
  titulo: string;
  artista: string;
  album: string;
  duracao: number; // in seconds
  capaUrl: string;
  genero: string;
  bpm: number;
  coverGradient: string;
  tags?: string[];
  year?: number;
  language?: string;
}

export const OFFICIAL_GYM_SONGS: CatalogSong[] = [
  {
    youtubeId: "ytQ5CYE1VZw",
    url: "https://www.youtube.com/watch?v=ytQ5CYE1VZw",
    titulo: "Till I Collapse",
    artista: "Eminem ft. Nate Dogg",
    album: "The Eminem Show",
    duracao: 297,
    bpm: 171,
    coverGradient: "from-red-600 to-black",
    capaUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=350",
    genero: "Hip Hop / Rap",
    tags: ["Hipertrofia", "Treino Pesado", "Supino"],
    year: 2002,
    language: "Inglês"
  },
  {
    youtubeId: "v2AC41dglnM",
    url: "https://www.youtube.com/watch?v=v2AC41dglnM",
    titulo: "Thunderstruck",
    artista: "AC/DC",
    album: "The Razors Edge",
    duracao: 292,
    bpm: 133,
    coverGradient: "from-orange-600 to-red-900",
    capaUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=350",
    genero: "Classic Rock / Metal",
    tags: ["Carga Máxima", "Rock Clássico", "Supino"],
    year: 1990,
    language: "Inglês"
  },
  {
    youtubeId: "btPJPFnesV4",
    url: "https://www.youtube.com/watch?v=btPJPFnesV4",
    titulo: "Eye of the Tiger",
    artista: "Survivor",
    album: "Eye of the Tiger",
    duracao: 245,
    bpm: 109,
    coverGradient: "from-amber-600 to-red-800",
    capaUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=350",
    genero: "Rock",
    tags: ["Maromba", "Motivação", "Clássico"],
    year: 1982,
    language: "Inglês"
  },
  {
    youtubeId: "_Yhyp-_hX2s",
    url: "https://www.youtube.com/watch?v=_Yhyp-_hX2s",
    titulo: "Lose Yourself",
    artista: "Eminem",
    album: "8 Mile Soundtrack",
    duracao: 326,
    bpm: 171,
    coverGradient: "from-zinc-700 to-black",
    capaUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=350",
    genero: "Hip Hop / Rap",
    tags: ["Foco", "Alta Energia", "Motivação"],
    year: 2002,
    language: "Inglês"
  },
  {
    youtubeId: "eVTXPUF4Oz4",
    url: "https://www.youtube.com/watch?v=eVTXPUF4Oz4",
    titulo: "In The End",
    artista: "Linkin Park",
    album: "Hybrid Theory",
    duracao: 216,
    bpm: 105,
    coverGradient: "from-blue-700 to-zinc-950",
    capaUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=350",
    genero: "Nu Metal / Rock",
    tags: ["Nostalgia", "Treino Pesado"],
    year: 2000,
    language: "Inglês"
  },
  {
    youtubeId: "CD-E-LDc384",
    url: "https://www.youtube.com/watch?v=CD-E-LDc384",
    titulo: "Enter Sandman",
    artista: "Metallica",
    album: "Metallica",
    duracao: 331,
    bpm: 123,
    coverGradient: "from-purple-900 to-black",
    capaUrl: "https://images.unsplash.com/photo-1535970793482-07de93762741?q=80&w=350",
    genero: "Heavy Metal",
    tags: ["Carga Máxima", "Metal"],
    year: 1991,
    language: "Inglês"
  },
  {
    youtubeId: "d1KGgU1pQk0",
    url: "https://www.youtube.com/watch?v=d1KGgU1pQk0",
    titulo: "Can't Be Touched",
    artista: "Roy Jones Jr.",
    album: "Round One",
    duracao: 214,
    bpm: 160,
    coverGradient: "from-amber-600 to-zinc-900",
    capaUrl: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=350",
    genero: "Hip Hop / Workout",
    tags: ["Boxe", "Hipertrofia", "Foco"],
    year: 2004,
    language: "Inglês"
  },
  {
    youtubeId: "PsO6Zn4VBUA",
    url: "https://www.youtube.com/watch?v=PsO6Zn4VBUA",
    titulo: "Stronger",
    artista: "Kanye West",
    album: "Graduation",
    duracao: 312,
    bpm: 104,
    coverGradient: "from-pink-600 to-purple-900",
    capaUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=350",
    genero: "Hip Hop / Electronic",
    tags: ["Cardio & Força", "Cadência"],
    year: 2007,
    language: "Inglês"
  },
  {
    youtubeId: "gAjR4_CB4iI",
    url: "https://www.youtube.com/watch?v=gAjR4_CB4iI",
    titulo: "Harder, Better, Faster, Stronger",
    artista: "Daft Punk",
    album: "Discovery",
    duracao: 224,
    bpm: 123,
    coverGradient: "from-yellow-500 to-amber-700",
    capaUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=350",
    genero: "Electronic / Dance",
    tags: ["Cadência Alta", "Ritmo"],
    year: 2001,
    language: "Inglês"
  },
  {
    youtubeId: "YVkUvmDQ3HY",
    url: "https://www.youtube.com/watch?v=YVkUvmDQ3HY",
    titulo: "Without Me",
    artista: "Eminem",
    album: "The Eminem Show",
    duracao: 290,
    bpm: 112,
    coverGradient: "from-red-600 to-zinc-900",
    capaUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=350",
    genero: "Hip Hop / Rap",
    tags: ["Motivação", "Energia"],
    year: 2002,
    language: "Inglês"
  },
  {
    youtubeId: "1w7OgIMMRc4",
    url: "https://www.youtube.com/watch?v=1w7OgIMMRc4",
    titulo: "Sweet Child O' Mine",
    artista: "Guns N' Roses",
    album: "Appetite for Destruction",
    duracao: 356,
    bpm: 128,
    coverGradient: "from-orange-500 to-red-800",
    capaUrl: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?q=80&w=350",
    genero: "Classic Rock",
    tags: ["Rock Clássico", "Supino"],
    year: 1987,
    language: "Inglês"
  },
  {
    youtubeId: "0J2QdDbelmY",
    url: "https://www.youtube.com/watch?v=0J2QdDbelmY",
    titulo: "Seven Nation Army",
    artista: "The White Stripes",
    album: "Elephant",
    duracao: 232,
    bpm: 124,
    coverGradient: "from-red-600 to-black",
    capaUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=350",
    genero: "Alternative Rock",
    tags: ["Hino de Treino", "Supino"],
    year: 2003,
    language: "Inglês"
  },
  {
    youtubeId: "kXYiU_JCYtU",
    url: "https://www.youtube.com/watch?v=kXYiU_JCYtU",
    titulo: "Numb",
    artista: "Linkin Park",
    album: "Meteora",
    duracao: 187,
    bpm: 110,
    coverGradient: "from-blue-600 to-indigo-950",
    capaUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=350",
    genero: "Nu Metal / Rock",
    tags: ["Foco", "Força"],
    year: 2003,
    language: "Inglês"
  },
  {
    youtubeId: "fKopy74weus",
    url: "https://www.youtube.com/watch?v=fKopy74weus",
    titulo: "Thunder",
    artista: "Imagine Dragons",
    album: "Evolve",
    duracao: 187,
    bpm: 168,
    coverGradient: "from-emerald-600 to-cyan-950",
    capaUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=350",
    genero: "Pop Rock / Electronic",
    tags: ["Cadência", "Ritmo"],
    year: 2017,
    language: "Inglês"
  },
  {
    youtubeId: "7wtfhZwyrcc",
    url: "https://www.youtube.com/watch?v=7wtfhZwyrcc",
    titulo: "Believer",
    artista: "Imagine Dragons",
    album: "Evolve",
    duracao: 204,
    bpm: 125,
    coverGradient: "from-cyan-600 to-blue-900",
    capaUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=350",
    genero: "Pop Rock / Electronic",
    tags: ["Intensidade", "Força"],
    year: 2017,
    language: "Inglês"
  },
  {
    youtubeId: "JGwWNGJdvx8",
    url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    titulo: "Shape of You",
    artista: "Ed Sheeran",
    album: "÷ (Divide)",
    duracao: 233,
    bpm: 96,
    coverGradient: "from-teal-600 to-cyan-900",
    capaUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=350",
    genero: "Pop",
    tags: ["Aquecimento", "Ritmo"],
    year: 2017,
    language: "Inglês"
  }
];
