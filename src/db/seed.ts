import { db, isDbConfigured, setDbConnected } from "./index.ts";
import { users, songs, announcements, settings } from "./schema.ts";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const DEFAULT_TRACK_POOL = [
  // Musculação / Power Arena (Heavy Weights, Rock, Rap, Metal)
  { 
    youtubeId: "ytQ5CYE1VZw",
    url: "https://www.youtube.com/watch?v=ytQ5CYE1VZw",
    titulo: "Till I Collapse",
    artista: "Eminem ft. Nate Dogg",
    album: "The Eminem Show",
    duracao: 297,
    capaUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=350",
    genero: "Hip Hop / Rap"
  },
  { 
    youtubeId: "v2AC41dglnM",
    url: "https://www.youtube.com/watch?v=v2AC41dglnM",
    titulo: "Thunderstruck",
    artista: "AC/DC",
    album: "The Razors Edge",
    duracao: 292,
    capaUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=350",
    genero: "Classic Rock / Metal"
  },
  { 
    youtubeId: "btPJPFnesV4",
    url: "https://www.youtube.com/watch?v=btPJPFnesV4",
    titulo: "Eye of the Tiger",
    artista: "Survivor",
    album: "Eye of the Tiger",
    duracao: 245,
    capaUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=350",
    genero: "Rock"
  },
  { 
    youtubeId: "_Yhyp-_hX2s",
    url: "https://www.youtube.com/watch?v=_Yhyp-_hX2s",
    titulo: "Lose Yourself",
    artista: "Eminem",
    album: "8 Mile Soundtrack",
    duracao: 326,
    capaUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=350",
    genero: "Hip Hop / Rap"
  },
  { 
    youtubeId: "eVTXPUF4Oz4",
    url: "https://www.youtube.com/watch?v=eVTXPUF4Oz4",
    titulo: "In The End",
    artista: "Linkin Park",
    album: "Hybrid Theory",
    duracao: 216,
    capaUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=350",
    genero: "Nu Metal / Rock"
  },
  { 
    youtubeId: "CD-E-LDc384",
    url: "https://www.youtube.com/watch?v=CD-E-LDc384",
    titulo: "Enter Sandman",
    artista: "Metallica",
    album: "Metallica",
    duracao: 331,
    capaUrl: "https://images.unsplash.com/photo-1535970793482-07de93762741?q=80&w=350",
    genero: "Heavy Metal"
  },
  { 
    youtubeId: "d1KGgU1pQk0",
    url: "https://www.youtube.com/watch?v=d1KGgU1pQk0",
    titulo: "Can't Be Touched",
    artista: "Roy Jones Jr.",
    album: "Round One",
    duracao: 214,
    capaUrl: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=350",
    genero: "Hip Hop / Workout"
  },
  { 
    youtubeId: "PsO6Zn4VBUA",
    url: "https://www.youtube.com/watch?v=PsO6Zn4VBUA",
    titulo: "Stronger",
    artista: "Kanye West",
    album: "Graduation",
    duracao: 312,
    capaUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=350",
    genero: "Hip Hop / Electronic"
  },

  // Cardio / Speed Zone (EDM, Pop Dance, House, Synthwave)
  { 
    youtubeId: "gAjR4_CB4iI",
    url: "https://www.youtube.com/watch?v=gAjR4_CB4iI",
    titulo: "Harder, Better, Faster, Stronger",
    artista: "Daft Punk",
    album: "Discovery",
    duracao: 224,
    capaUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=350",
    genero: "Electronic / Dance"
  },
  { 
    youtubeId: "4NRXx6U8ABQ",
    url: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
    titulo: "Blinding Lights",
    artista: "The Weeknd",
    album: "After Hours",
    duracao: 200,
    capaUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=350",
    genero: "Synthwave / Pop"
  },
  { 
    youtubeId: "TUVcZfQe-Kw",
    url: "https://www.youtube.com/watch?v=TUVcZfQe-Kw",
    titulo: "Levitating",
    artista: "Dua Lipa",
    album: "Future Nostalgia",
    duracao: 203,
    capaUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=350",
    genero: "Nu-Disco / Pop"
  },
  { 
    youtubeId: "nCg3upGOZ_A",
    url: "https://www.youtube.com/watch?v=nCg3upGOZ_A",
    titulo: "The Business",
    artista: "Tiësto",
    album: "The Business",
    duracao: 164,
    capaUrl: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=350",
    genero: "Deep House / EDM"
  },
  { 
    youtubeId: "JVpTp8CXQK4",
    url: "https://www.youtube.com/watch?v=JVpTp8CXQK4",
    titulo: "Hear Me Now",
    artista: "Alok, Bruno Martini ft. Zeeba",
    album: "Hear Me Now",
    duracao: 192,
    capaUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=350",
    genero: "Deep House / Dance"
  },
  { 
    youtubeId: "90RLzVU5x60",
    url: "https://www.youtube.com/watch?v=90RLzVU5x60",
    titulo: "I'm Good (Blue)",
    artista: "David Guetta & Bebe Rexha",
    album: "I'm Good (Blue)",
    duracao: 175,
    capaUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=350",
    genero: "Dance Pop / EDM"
  },
  { 
    youtubeId: "_ovdm2yX4MA",
    url: "https://www.youtube.com/watch?v=_ovdm2yX4MA",
    titulo: "Levels",
    artista: "Avicii",
    album: "Levels",
    duracao: 198,
    capaUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=350",
    genero: "Progressive House"
  },
  { 
    youtubeId: "1y6smkh6c-0",
    url: "https://www.youtube.com/watch?v=1y6smkh6c-0",
    titulo: "Don't You Worry Child",
    artista: "Swedish House Mafia",
    album: "Until Now",
    duracao: 212,
    capaUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=350",
    genero: "EDM / Festival"
  },

  // Box Crossfit / Redline Arena (Hardstyle, Industrial Rock, Bass House, Trap)
  { 
    youtubeId: "7wtfhZwyrcc",
    url: "https://www.youtube.com/watch?v=7wtfhZwyrcc",
    titulo: "Believer",
    artista: "Imagine Dragons",
    album: "Evolve",
    duracao: 204,
    capaUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=350",
    genero: "Alternative Rock / Trap"
  },
  { 
    youtubeId: "YJVmu6yttiw",
    url: "https://www.youtube.com/watch?v=YJVmu6yttiw",
    titulo: "Bangarang",
    artista: "Skrillex ft. Sirah",
    album: "Bangarang EP",
    duracao: 215,
    capaUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=350",
    genero: "Dubstep / Bass"
  },
  { 
    youtubeId: "fmI_Ndrxy14",
    url: "https://www.youtube.com/watch?v=fmI_Ndrxy14",
    titulo: "Warriors",
    artista: "Imagine Dragons",
    album: "Smoke + Mirrors",
    duracao: 171,
    capaUrl: "https://images.unsplash.com/photo-1535970793482-07de93762741?q=80&w=350",
    genero: "Epic Rock"
  },
  { 
    youtubeId: "HMUDVMiITOU",
    url: "https://www.youtube.com/watch?v=HMUDVMiITOU",
    titulo: "Turn Down for What",
    artista: "DJ Snake & Lil Jon",
    album: "Turn Down for What",
    duracao: 213,
    capaUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=350",
    genero: "Trap / Bass"
  },
  { 
    youtubeId: "09LTT0sfnnE",
    url: "https://www.youtube.com/watch?v=09LTT0sfnnE",
    titulo: "Down With The Sickness",
    artista: "Disturbed",
    album: "The Sickness",
    duracao: 278,
    capaUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=350",
    genero: "Nu Metal / Industrial"
  },

  // Espaço Zen / Mind & Body (Lofi, Ambient, Chillout, Neo-Classical)
  { 
    youtubeId: "jfKfPfyJRdk",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    titulo: "Lofi Hip Hop Chill Beats",
    artista: "Lofi Girl",
    album: "Study & Relax Sessions",
    duracao: 240,
    capaUrl: "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?q=80&w=350",
    genero: "Lofi Hip Hop"
  },
  { 
    youtubeId: "UfcAVejslrU",
    url: "https://www.youtube.com/watch?v=UfcAVejslrU",
    titulo: "Weightless",
    artista: "Marconi Union",
    album: "Weightless",
    duracao: 485,
    capaUrl: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=350",
    genero: "Ambient / Meditation"
  },
  { 
    youtubeId: "kcihcYEOeic",
    url: "https://www.youtube.com/watch?v=kcihcYEOeic",
    titulo: "Nuvole Bianche",
    artista: "Ludovico Einaudi",
    album: "Una Mattina",
    duracao: 348,
    capaUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=350",
    genero: "Neo-Classical Piano"
  },
  { 
    youtubeId: "13EifbKEIBMT",
    url: "https://www.youtube.com/watch?v=13EifbKEIBMT",
    titulo: "Porcelain",
    artista: "Moby",
    album: "Play",
    duracao: 241,
    capaUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=350",
    genero: "Chillout / Electronica"
  },
  { 
    youtubeId: "7maJOI3QMu0",
    url: "https://www.youtube.com/watch?v=7maJOI3QMu0",
    titulo: "River Flows In You",
    artista: "Yiruma",
    album: "First Love",
    duracao: 215,
    capaUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=350",
    genero: "Contemporary Classical"
  }
];

const DEFAULT_ANNOUNCEMENTS = [
  { titulo: "🛒 Copo Térmico UP Fitness", descricao: "Mantenha sua água ou shake gelados durante o treino todo. 15% de desconto para quem pontuar no Top 5 do Ranking de Energia!", imagem: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?q=80&w=500", prioridade: 1, ativo: true },
  { titulo: "🏋️‍♂️ Desafio de Supino UP", descricao: "Vem mostrar a força do peitoral! Premiação exclusiva em suplementos e brindes UP Play. Inscrições gratuitas com seu treinador.", imagem: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=500", prioridade: 2, ativo: true },
  { titulo: "🥤 Combo Whey Isolate pós-treino", descricao: "O combustível ideal para sua reconstrução muscular. Adquira logo após sua série na recepção do UP Café.", imagem: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=500", prioridade: 3, ativo: true }
];

export async function seedDatabase() {
  if (!isDbConfigured) {
    console.log("No PostgreSQL database configured (SQL_HOST/DATABASE_URL empty). Running in memory-simulated fallback mode.");
    return;
  }

  console.log("Starting database check and seeding...");
  try {
    // 1. Verify connection is active by selecting current time
    const checkRes = await db.execute(sql`SELECT NOW()`);
    console.log("PostgreSQL Connection Verified: ", checkRes.rows[0]);
    setDbConnected(true);

    // Ensure all tables exist before querying/seeding
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        foto_url TEXT,
        matricula TEXT NOT NULL,
        cpf TEXT NOT NULL,
        data_nascimento TEXT,
        idade_calculada INTEGER,
        email TEXT NOT NULL,
        senha_hash TEXT,
        perfil TEXT NOT NULL,
        status TEXT NOT NULL,
        data_cadastro TIMESTAMP DEFAULT NOW(),
        ultimo_login TIMESTAMP,
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        youtube_id TEXT NOT NULL,
        url TEXT NOT NULL,
        titulo TEXT NOT NULL,
        artista TEXT NOT NULL,
        album TEXT,
        duracao INTEGER NOT NULL,
        capa_url TEXT,
        genero TEXT,
        idioma TEXT,
        status_moderacao TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT NOW(),
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS song_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID NOT NULL REFERENCES users(id),
        musica_id UUID NOT NULL REFERENCES songs(id),
        posicao_fila INTEGER,
        status TEXT NOT NULL,
        dedicada BOOLEAN DEFAULT FALSE,
        criada_em TIMESTAMP DEFAULT NOW(),
        reproduzida_em TIMESTAMP,
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS dedications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pedido_id UUID NOT NULL REFERENCES song_requests(id),
        remetente_id UUID NOT NULL REFERENCES users(id),
        destinatario_id UUID NOT NULL REFERENCES users(id),
        mensagem TEXT NOT NULL,
        aprovada_ia BOOLEAN DEFAULT TRUE,
        criada_em TIMESTAMP DEFAULT NOW(),
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID NOT NULL REFERENCES users(id),
        musica_id UUID NOT NULL REFERENCES songs(id),
        criada_em TIMESTAMP DEFAULT NOW(),
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        imagem TEXT,
        prioridade INTEGER DEFAULT 0,
        inicio TIMESTAMP,
        termino TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE,
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        tipo TEXT,
        ativa BOOLEAN DEFAULT TRUE,
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS playlist_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        playlist_id UUID NOT NULL REFERENCES playlists(id),
        musica_id UUID NOT NULL REFERENCES songs(id),
        ordem INTEGER,
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID REFERENCES users(id),
        acao TEXT NOT NULL,
        modulo TEXT NOT NULL,
        data_hora TIMESTAMP DEFAULT NOW(),
        ip TEXT,
        detalhes TEXT,
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        horario_pedido TEXT,
        faixa_etaria TEXT,
        genero_musical TEXT,
        artista TEXT,
        quantidade_pedidos INTEGER DEFAULT 0,
        quantidade_curtidas INTEGER DEFAULT 0,
        tempo_medio_espera INTEGER DEFAULT 0,
        data_referencia TIMESTAMP DEFAULT NOW(),
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        regra_fila TEXT,
        limites_pedidos INTEGER,
        mensagens_padrao TEXT,
        parametros_ia TEXT,
        preferencias_gerais TEXT,
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Safe & Idempotent Admin User Verification (Never purges real users, logs, or requests)
    try {
      const existingAdmin = await db.select().from(users).where(eq(users.email, "jheiffe.jheiffe@gmail.com")).limit(1);
      if (existingAdmin.length === 0) {
        console.log("Creating initial primary admin user: jheiffe.jheiffe@gmail.com...");
        // Use environment variable or generate secure cryptographically random initial password
        const initialPass = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex");
        await db.insert(users).values({
          nome: "Jheiffe",
          email: "jheiffe.jheiffe@gmail.com",
          senhaHash: hashPassword(initialPass),
          matricula: "UP-ADM001",
          cpf: "52998224725",
          perfil: "GESTOR",
          status: "ATIVO",
          fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
        });
        console.log("Primary Admin user jheiffe.jheiffe@gmail.com initialized safely.");
      }
    } catch (e: any) {
      console.warn("Notice during admin user initialization:", e.message);
    }

    // 3. Safe & Idempotent Catalog Seeding (Only seeds if songs table is completely empty)
    const existingSongs = await db.select().from(songs).limit(1);
    if (existingSongs.length === 0) {
      console.log("Seeding real authentic tracks into empty songs table...");
      for (const track of DEFAULT_TRACK_POOL) {
        await db.insert(songs).values({
          youtubeId: track.youtubeId,
          url: track.url,
          titulo: track.titulo,
          artista: track.artista || "UP Play Artist",
          album: track.album,
          duracao: track.duracao,
          capaUrl: track.capaUrl,
          genero: track.genero,
          statusModeracao: "APROVADA"
        });
      }
      console.log(`Seeded ${DEFAULT_TRACK_POOL.length} real gym songs successfully!`);
    } else {
      // Ensure all tracks from DEFAULT_TRACK_POOL exist
      for (const track of DEFAULT_TRACK_POOL) {
        const found = await db.select().from(songs).where(eq(songs.youtubeId, track.youtubeId)).limit(1);
        if (found.length === 0) {
          await db.insert(songs).values({
            youtubeId: track.youtubeId,
            url: track.url,
            titulo: track.titulo,
            artista: track.artista,
            album: track.album,
            duracao: track.duracao,
            capaUrl: track.capaUrl,
            genero: track.genero,
            statusModeracao: "APROVADA"
          });
        }
      }
      console.log("Verified and synchronized real gym songs catalog.");
    }

    // 4. Check and Seed Announcements
    const existingAnnouncements = await db.select().from(announcements).limit(1);
    if (existingAnnouncements.length === 0) {
      console.log("Seeding announcements...");
      for (const ad of DEFAULT_ANNOUNCEMENTS) {
        await db.insert(announcements).values({
          titulo: ad.titulo,
          descricao: ad.descricao,
          imagem: ad.imagem,
          prioridade: ad.prioridade,
          ativo: ad.ativo
        });
      }
      console.log("Announcements seeded successfully!");
    } else {
      console.log("Announcements table is already populated.");
    }

    // 5. Check and Seed Settings
    const existingSettings = await db.select().from(settings).limit(1);
    if (existingSettings.length === 0) {
      console.log("Seeding settings...");
      await db.insert(settings).values({
        regraFila: "4+1",
        limitesPedidos: 3,
        mensagensPadrao: "Bora treinar!",
        parametrosIa: "Filtro Profano Ativo, Estética Fitness",
        preferenciasGerais: "BPM Adaptativo Ativo"
      });
      console.log("Settings seeded successfully!");
    } else {
      console.log("Settings table is already populated.");
    }

    console.log("Seeding check completed successfully!");
  } catch (err: any) {
    setDbConnected(false);
    console.warn("Notice: External PostgreSQL database is currently unreachable, using in-memory active catalog fallback mode.");
  }
}
