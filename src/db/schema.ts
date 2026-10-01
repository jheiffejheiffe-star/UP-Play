import { pgTable, uuid, text, integer, boolean, timestamp, uniqueIndex, index, pgView } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Usuários (users)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: text('nome').notNull(),
  fotoUrl: text('foto_url'),
  matricula: text('matricula').notNull(),
  cpf: text('cpf').notNull(),
  dataNascimento: text('data_nascimento'),
  idadeCalculada: integer('idade_calculada'),
  email: text('email').notNull(),
  senhaHash: text('senha_hash'),
  perfil: text('perfil').notNull(), // GESTOR | ALUNO
  status: text('status').notNull(), // ATIVO | BLOQUEADO
  dataCadastro: timestamp('data_cadastro').defaultNow(),
  ultimoLogin: timestamp('ultimo_login'),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    cpfIdx: uniqueIndex('users_cpf_idx').on(table.cpf),
    matriculaIdx: uniqueIndex('users_matricula_idx').on(table.matricula),
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    dataCadastroIdx: index('users_data_cadastro_idx').on(table.dataCadastro),
  };
});

// 2. Músicas (songs)
export const songs = pgTable('songs', {
  id: uuid('id').defaultRandom().primaryKey(),
  youtubeId: text('youtube_id').notNull(),
  url: text('url').notNull(),
  titulo: text('titulo').notNull(),
  artista: text('artista').notNull(),
  album: text('album'),
  duracao: integer('duracao').notNull(),
  capaUrl: text('capa_url'),
  genero: text('genero'),
  idioma: text('idioma'),
  statusModeracao: text('status_moderacao').notNull(),
  criadoEm: timestamp('criado_em').defaultNow(),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    youtubeIdIdx: index('songs_youtube_id_idx').on(table.youtubeId),
    criadoEmIdx: index('songs_criado_em_idx').on(table.criadoEm),
  };
});

// 3. Pedidos de Música (song_requests)
export const songRequests = pgTable('song_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull().references(() => users.id),
  musicaId: uuid('musica_id').notNull().references(() => songs.id),
  posicaoFila: integer('posicao_fila'),
  status: text('status').notNull(), // Fila, Tocando, Finalizada, Cancelada
  dedicada: boolean('dedicada').default(false),
  criadaEm: timestamp('criada_em').defaultNow(),
  reproduzidaEm: timestamp('reproduzida_em'),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    criadaEmIdx: index('song_requests_criada_em_idx').on(table.criadaEm),
  };
});

// 4. Dedicatórias (dedications)
export const dedications = pgTable('dedications', {
  id: uuid('id').defaultRandom().primaryKey(),
  pedidoId: uuid('pedido_id').notNull().references(() => songRequests.id),
  remetenteId: uuid('remetente_id').notNull().references(() => users.id),
  destinatarioId: uuid('destinatario_id').notNull().references(() => users.id),
  mensagem: text('mensagem').notNull(),
  aprovadaIa: boolean('aprovada_ia').default(true),
  criadaEm: timestamp('criada_em').defaultNow(),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. Curtidas (likes)
export const likes = pgTable('likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull().references(() => users.id),
  musicaId: uuid('musica_id').notNull().references(() => songs.id),
  criadaEm: timestamp('criada_em').defaultNow(),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    userSongUnique: uniqueIndex('likes_user_song_unique').on(table.usuarioId, table.musicaId),
  };
});

// 6. Anúncios (announcements)
export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao').notNull(),
  imagem: text('imagem'),
  prioridade: integer('prioridade').default(0),
  inicio: timestamp('inicio'),
  termino: timestamp('termino'),
  ativo: boolean('ativo').default(true),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 7. Playlists Automáticas (playlists)
export const playlists = pgTable('playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: text('nome').notNull(),
  tipo: text('tipo'),
  ativa: boolean('ativa').default(true),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Itens da Playlist (playlist_items)
export const playlistItems = pgTable('playlist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  playlistId: uuid('playlist_id').notNull().references(() => playlists.id),
  musicaId: uuid('musica_id').notNull().references(() => songs.id),
  ordem: integer('ordem'),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 9. Logs (audit_logs)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').references(() => users.id),
  acao: text('acao').notNull(),
  modulo: text('modulo').notNull(),
  dataHora: timestamp('data_hora').defaultNow(),
  ip: text('ip'),
  detalhes: text('detalhes'),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    dataHoraIdx: index('audit_logs_data_hora_idx').on(table.dataHora),
  };
});

// 10. Estatísticas (statistics)
export const statistics = pgTable('statistics', {
  id: uuid('id').defaultRandom().primaryKey(),
  horarioPedido: text('horario_pedido'),
  faixaEtaria: text('faixa_etaria'),
  generoMusical: text('genero_musical'),
  artista: text('artista'),
  quantidadePedidos: integer('quantidade_pedidos').default(0),
  quantidadeCurtidas: integer('quantidade_curtidas').default(0),
  tempoMedioEspera: integer('tempo_medio_espera').default(0),
  dataReferencia: timestamp('data_referencia').defaultNow(),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    dataReferenciaIdx: index('statistics_data_referencia_idx').on(table.dataReferencia),
  };
});

// 11. Configurações (settings)
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  regraFila: text('regra_fila'),
  limitesPedidos: integer('limites_pedidos'),
  mensagensPadrao: text('mensagens_padrao'),
  parametrosIa: text('parametros_ia'),
  preferenciasGerais: text('preferencias_gerais'),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 12. BI Views
export const biRequestsReport = pgView('bi_requests_report', {
  requestId: uuid('request_id'),
  userName: text('user_name'),
  userCpf: text('user_cpf'),
  userAge: integer('user_age'),
  songTitle: text('song_title'),
  songArtist: text('song_artist'),
  songGenre: text('song_genre'),
  requestStatus: text('request_status'),
  requestCreatedAt: timestamp('request_created_at'),
}).as(sql`
  SELECT 
    sr.id AS request_id,
    u.nome AS user_name,
    u.cpf AS user_cpf,
    u.idade_calculada AS user_age,
    s.titulo AS song_title,
    s.artista AS song_artist,
    s.genero AS song_genre,
    sr.status AS request_status,
    sr.criada_em AS request_created_at
  FROM song_requests sr
  JOIN users u ON sr.usuario_id = u.id
  JOIN songs s ON sr.musica_id = s.id
`);
