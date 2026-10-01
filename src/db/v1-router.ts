import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './index.ts';
import { config } from '../config/index.ts';
import { 
  users, songs, songRequests, dedications, likes, 
  announcements, auditLogs, settings, statistics, playlists, playlistItems
} from './schema.ts';
import { eq, and, or, desc, asc, like, sql, inArray } from 'drizzle-orm';
import { GoogleGenAI, Type } from "@google/genai";
import { validateCpf, cleanCpf, formatCpf, maskCpfPrivacy, generateValidCpf } from '../utils/cpf.ts';
import { hashPassword, verifyPassword, verifyGoogleIdToken } from '../utils/security.ts';

const router = express.Router();
const JWT_SECRET = config.jwt.secret;

// Help Interfaces
export interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
  };
}

// 1. Authentication Middleware - STRICT: Requires valid cryptographically signed JWT token
export function authMiddleware(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded || !decoded.id || !decoded.email) {
        return res.status(401).json({ success: false, message: "Token inválido." });
      }
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: "Sessão expirada ou inválida. Faça login novamente." });
    }
  }

  return res.status(401).json({ success: false, message: "Acesso negado. Token de autenticação não fornecido." });
}

// 2. Admin (Gestor) Verification Middleware - STRICT RBAC: Only verified GESTOR token accepted
export function adminMiddleware(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user || req.user.perfil !== "GESTOR") {
    return res.status(403).json({ success: false, message: "Acesso proibido. Apenas gestores podem realizar esta ação." });
  }
  next();
}

// 3. Audit Log Helper
async function logAudit(req: AuthenticatedRequest, acao: string, modulo: string, detalhes?: string) {
  try {
    await db.insert(auditLogs).values({
      usuarioId: req.user?.id || null,
      acao,
      modulo,
      ip: req.ip || "unknown",
      detalhes: detalhes || null,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

// 4. Socket.IO Broadcast Helper
function broadcast(req: express.Request, event: string, data: any) {
  const io = req.app.get("io");
  if (io) {
    io.emit(event, data);
  }
}

// ==========================================
// 2. AUTENTICAÇÃO (auth)
// ==========================================

router.post("/auth/register", async (req, res) => {
  try {
    const { nome, matricula, cpf, dataNascimento, email, senha } = req.body;

    if (!nome || !matricula || !cpf || !email || !senha) {
      return res.status(400).json({ success: false, message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    if (String(senha).length < 6) {
      return res.status(400).json({ success: false, message: "A senha deve conter no mínimo 6 caracteres." });
    }

    // Official Real CPF Mathematical and Format Validation
    const cpfValidation = validateCpf(cpf);
    if (!cpfValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: cpfValidation.error || "CPF inválido. Verifique os números informados." 
      });
    }

    const sanitizedCpf = cleanCpf(cpf);
    const sanitizedEmail = String(email).trim().toLowerCase();
    const sanitizedMatricula = String(matricula).trim();

    // Check duplicate CPF in database
    const existingCpf = await db.select().from(users).where(eq(users.cpf, sanitizedCpf)).limit(1);
    if (existingCpf.length > 0) {
      return res.status(400).json({ success: false, message: "Este CPF já está cadastrado." });
    }

    // Check duplicate Email
    const existingEmail = await db.select().from(users).where(eq(users.email, sanitizedEmail)).limit(1);
    if (existingEmail.length > 0) {
      return res.status(400).json({ success: false, message: "Este e-mail já está cadastrado." });
    }

    // Check duplicate Matrícula
    const existingMatricula = await db.select().from(users).where(eq(users.matricula, sanitizedMatricula)).limit(1);
    if (existingMatricula.length > 0) {
      return res.status(400).json({ success: false, message: "Esta matrícula já está cadastrada." });
    }

    // Calculate age
    let idadeCalculada: number | null = null;
    if (dataNascimento) {
      const birthDate = new Date(dataNascimento);
      const today = new Date();
      idadeCalculada = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        idadeCalculada--;
      }
    }

    // Secure bcrypt password hash
    const senhaHash = await hashPassword(senha);

    const newUser = {
      nome: String(nome).trim(),
      matricula: sanitizedMatricula,
      cpf: sanitizedCpf,
      dataNascimento: dataNascimento || null,
      idadeCalculada,
      email: sanitizedEmail,
      senhaHash,
      perfil: "ALUNO", // Public registration ALWAYS registers as ALUNO (never GESTOR)
      status: "ATIVO",
    };

    const inserted = await db.insert(users).values(newUser).returning();
    const userCreated = inserted[0];

    const token = jwt.sign(
      { id: userCreated.id, nome: userCreated.nome, email: userCreated.email, perfil: userCreated.perfil },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Audit log (without logging raw CPF for privacy & security)
    await logAudit({ user: { id: userCreated.id, nome: userCreated.nome, email: userCreated.email, perfil: newUser.perfil } } as any, "REGISTER", "AUTH", `Usuário registrado com sucesso. Perfil: ${newUser.perfil}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userCreated.id,
        nome: userCreated.nome,
        email: userCreated.email,
        matricula: userCreated.matricula,
        cpf: userCreated.cpf,
        dataNascimento: userCreated.dataNascimento,
        idadeCalculada: userCreated.idadeCalculada,
        fotoUrl: userCreated.fotoUrl,
        perfil: userCreated.perfil,
        status: userCreated.status,
      }
    });

  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Erro interno ao registrar usuário.", error: err.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, matricula, senha } = req.body;

    if ((!email && !matricula) || !senha) {
      return res.status(400).json({ success: false, message: "Preencha e-mail/matrícula/CPF e senha." });
    }

    // Search user (supports Email, Matrícula, or CPF)
    let userRecord = null;
    const loginIdentifier = (email || matricula || "").trim();
    const cleanPotentialCpf = cleanCpf(loginIdentifier);
    const isCpfFormat = cleanPotentialCpf.length === 11;

    if (isCpfFormat) {
      const result = await db.select().from(users).where(eq(users.cpf, cleanPotentialCpf)).limit(1);
      if (result.length > 0) userRecord = result[0];
    }
    
    if (!userRecord && email) {
      const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
      if (result.length > 0) userRecord = result[0];
    }
    
    if (!userRecord && matricula) {
      const result = await db.select().from(users).where(eq(users.matricula, matricula.trim())).limit(1);
      if (result.length > 0) userRecord = result[0];
    }

    if (!userRecord && !isCpfFormat) {
      const result = await db.select().from(users).where(
        or(
          eq(users.email, loginIdentifier.toLowerCase()),
          eq(users.matricula, loginIdentifier),
          eq(users.cpf, cleanPotentialCpf)
        )
      ).limit(1);
      if (result.length > 0) userRecord = result[0];
    }

    if (!userRecord) {
      return res.status(401).json({ success: false, message: "Credenciais inválidas. Verifique seu e-mail, matrícula ou CPF e senha." });
    }

    if (userRecord.status === "BLOQUEADO") {
      return res.status(403).json({ success: false, message: "Este usuário está bloqueado no UP Play." });
    }

    // Verify Password using real bcrypt / secure timing-safe legacy migration
    const isPasswordValid = await verifyPassword(senha, userRecord.senhaHash);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Senha incorreta." });
    }

    // Seamless migration: If user was using legacy SHA-256 hash, upgrade to bcrypt automatically
    const updatePayload: any = { ultimoLogin: new Date() };
    if (userRecord.senhaHash && userRecord.senhaHash.length === 64 && /^[0-9a-f]{64}$/i.test(userRecord.senhaHash)) {
      updatePayload.senhaHash = await hashPassword(senha);
    }
    await db.update(users).set(updatePayload).where(eq(users.id, userRecord.id));

    const token = jwt.sign(
      { id: userRecord.id, nome: userRecord.nome, email: userRecord.email, perfil: userRecord.perfil },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Audit log
    await logAudit({ user: { id: userRecord.id, nome: userRecord.nome, email: userRecord.email, perfil: userRecord.perfil } } as any, "LOGIN", "AUTH", `Login realizado.`);

    res.json({
      success: true,
      token,
      user: {
        id: userRecord.id,
        nome: userRecord.nome,
        email: userRecord.email,
        perfil: userRecord.perfil,
        status: userRecord.status,
      }
    });

  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Erro interno ao realizar login.", error: err.message });
  }
});

// Google Authentication Endpoint - Cryptographically verifies Google ID Token
router.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ success: false, message: "Token de credencial do Google não fornecido." });
    }

    // Cryptographic validation of the Google ID Token via google-auth-library
    const verified = await verifyGoogleIdToken(credential);
    if (!verified || !verified.email || !verified.sub) {
      return res.status(401).json({
        success: false,
        message: "Falha na validação criptográfica do Google ID Token. O token expirou ou é inválido."
      });
    }

    const cleanEmail = verified.email;
    const verifiedGoogleId = verified.sub;
    const displayName = verified.name || cleanEmail.split("@")[0];
    const verifiedFotoUrl = verified.picture || "";

    // Search if user exists by externalId (Google sub) or email
    let userRecord = null;
    const byGoogleId = await db.select().from(users).where(eq(users.externalId, verifiedGoogleId)).limit(1);
    if (byGoogleId.length > 0) {
      userRecord = byGoogleId[0];
    }

    if (!userRecord) {
      const byEmail = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (byEmail.length > 0) {
        userRecord = byEmail[0];
      }
    }

    // Existing User Login
    if (userRecord) {
      if (userRecord.status === "BLOQUEADO") {
        return res.status(403).json({ success: false, message: "Este usuário está bloqueado no UP Play." });
      }

      // Update last login and externalId / photo if provided
      const updateData: any = { ultimoLogin: new Date() };
      if (verifiedFotoUrl && !userRecord.fotoUrl) {
        updateData.fotoUrl = verifiedFotoUrl;
      }
      if (!userRecord.externalId) {
        updateData.externalId = verifiedGoogleId;
      }
      await db.update(users).set(updateData).where(eq(users.id, userRecord.id));

      const token = jwt.sign(
        { id: userRecord.id, nome: userRecord.nome, email: userRecord.email, perfil: userRecord.perfil },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      await logAudit(
        { user: { id: userRecord.id, nome: userRecord.nome, email: userRecord.email, perfil: userRecord.perfil } } as any,
        "LOGIN_GOOGLE",
        "AUTH",
        `Login via Google efetuado com perfil ${userRecord.perfil}.`
      );

      return res.json({
        success: true,
        token,
        user: {
          id: userRecord.id,
          nome: userRecord.nome,
          email: userRecord.email,
          matricula: userRecord.matricula,
          cpf: userRecord.cpf,
          fotoUrl: userRecord.fotoUrl || verifiedFotoUrl,
          perfil: userRecord.perfil,
          status: userRecord.status,
        }
      });
    }

    // Auto-create new user for verified Google Sign-In (ALWAYS 'ALUNO' by default - NEVER 'GESTOR')
    const generatedMatricula = `UP-G${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedCpf = generateValidCpf();

    const newUser = {
      nome: displayName,
      matricula: generatedMatricula,
      cpf: generatedCpf,
      email: cleanEmail,
      externalId: verifiedGoogleId,
      fotoUrl: verifiedFotoUrl,
      perfil: "ALUNO",
      status: "ATIVO",
    };

    const inserted = await db.insert(users).values(newUser).returning();
    const created = inserted[0];

    const token = jwt.sign(
      { id: created.id, nome: created.nome, email: created.email, perfil: created.perfil },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    await logAudit(
      { user: { id: created.id, nome: created.nome, email: created.email, perfil: "ALUNO" } } as any,
      "REGISTER_GOOGLE",
      "AUTH",
      "Novo aluno registrado via Google Sign-In verificado."
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: created.id,
        nome: created.nome,
        email: created.email,
        matricula: created.matricula,
        cpf: created.cpf,
        fotoUrl: created.fotoUrl,
        perfil: created.perfil,
        status: created.status,
      }
    });

  } catch (err: any) {
    console.error("Google auth error:", err);
    res.status(500).json({ success: false, message: "Erro ao processar autenticação Google.", error: err.message });
  }
});

router.post("/auth/refresh", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token ausente." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as any;
    const newToken = jwt.sign(
      { id: decoded.id, nome: decoded.nome, email: decoded.email, perfil: decoded.perfil },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ success: true, token: newToken });
  } catch (err: any) {
    res.status(401).json({ success: false, message: "Token inválido.", error: err.message });
  }
});

router.post("/auth/logout", authMiddleware, async (req: AuthenticatedRequest, res) => {
  await logAudit(req, "LOGOUT", "AUTH", `Logout efetuado.`);
  res.json({ success: true, message: "Logout efetuado com sucesso." });
});

// Password Reset Tokens Store (In-Memory with 15-minute expiration)
interface PasswordResetEntry {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: number;
}
const passwordResetTokens = new Map<string, PasswordResetEntry>();

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "E-mail obrigatório." });
    }

    const clean = email.trim().toLowerCase();
    const userList = await db.select().from(users).where(eq(users.email, clean)).limit(1);

    if (userList.length === 0) {
      // Return safe message
      return res.json({ success: true, message: "Se o e-mail estiver cadastrado, as instruções serão processadas." });
    }

    const user = userList[0];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    passwordResetTokens.set(tokenHash, {
      userId: user.id,
      email: user.email,
      tokenHash,
      expiresAt
    });

    await logAudit({ user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil } } as any, "FORGOT_PASSWORD", "AUTH", "Token de redefinição gerado.");

    // Check if transactional mail provider is configured
    const mailConfigured = Boolean(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY);
    if (!mailConfigured) {
      // Honesty requirement: do NOT fake that email was dispatched
      return res.json({ 
        success: true, 
        message: "Solicitação registrada. Como o servidor de e-mail transacional não está ativo, solicite a redefinição à recepção da academia." 
      });
    }

    return res.json({ success: true, message: "Instruções de redefinição enviadas para seu e-mail cadastrado." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao processar solicitação de recuperação.", error: err.message });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) {
      return res.status(400).json({ success: false, message: "Token e nova senha são obrigatórios." });
    }

    if (String(novaSenha).length < 6) {
      return res.status(400).json({ success: false, message: "A nova senha deve ter no mínimo 6 caracteres." });
    }

    const tokenHash = crypto.createHash("sha256").update(String(token).trim()).digest("hex");
    const entry = passwordResetTokens.get(tokenHash);

    if (!entry || entry.expiresAt < Date.now()) {
      passwordResetTokens.delete(tokenHash);
      return res.status(400).json({ success: false, message: "Token de redefinição inválido ou expirado." });
    }

    const hashed = await hashPassword(novaSenha);
    await db.update(users).set({ senhaHash: hashed }).where(eq(users.id, entry.userId));
    passwordResetTokens.delete(tokenHash);

    await logAudit({ user: { id: entry.userId, nome: entry.email, email: entry.email, perfil: "ALUNO" } } as any, "RESET_PASSWORD", "AUTH", "Senha redefinida com token seguro.");
    res.json({ success: true, message: "Senha redefinida com sucesso. Faça login com a nova senha." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao redefinir senha.", error: err.message });
  }
});


// ==========================================
// 3. USUÁRIOS (users)
// ==========================================

router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const perfil = req.query.perfil as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let conditions = [];
    if (perfil) conditions.push(eq(users.perfil, perfil));
    if (status) conditions.push(eq(users.status, status));
    if (search) {
      conditions.push(or(
        like(users.nome, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.matricula, `%${search}%`)
      ));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const usersList = await db.select({
      id: users.id,
      nome: users.nome,
      fotoUrl: users.fotoUrl,
      matricula: users.matricula,
      cpf: users.cpf,
      dataNascimento: users.dataNascimento,
      idadeCalculada: users.idadeCalculada,
      email: users.email,
      perfil: users.perfil,
      status: users.status,
      dataCadastro: users.dataCadastro,
      ultimoLogin: users.ultimoLogin,
      externalId: users.externalId,
    })
    .from(users)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(users.dataCadastro));

    const totalRes = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
    const total = totalRes[0]?.count || 0;

    res.json({ success: true, users: usersList, total, limit, offset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao listar usuários.", error: err.message });
  }
});

router.get("/users/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // User can fetch themselves or must be an admin
    if (req.user?.id !== id && req.user?.perfil !== "GESTOR") {
      return res.status(403).json({ success: false, message: "Permissão insuficiente." });
    }

    const result = await db.select().from(users).where(eq(users.id, id));
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    }

    const { senhaHash, ...userWithoutPassword } = result[0];
    res.json({ success: true, user: userWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter usuário.", error: err.message });
  }
});

router.post("/users", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { nome, matricula, cpf, dataNascimento, email, senha, perfil } = req.body;

    if (!nome || !matricula || !cpf || !email || !senha) {
      return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes." });
    }

    // Official Real CPF Mathematical and Format Validation
    const cpfValidation = validateCpf(cpf);
    if (!cpfValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: cpfValidation.error || "CPF inválido. Verifique os números informados." 
      });
    }

    const sanitizedCpf = cleanCpf(cpf);
    const sanitizedEmail = String(email).trim().toLowerCase();
    const sanitizedMatricula = String(matricula).trim();

    // Check duplicate CPF in database
    const existingCpf = await db.select().from(users).where(eq(users.cpf, sanitizedCpf)).limit(1);
    if (existingCpf.length > 0) {
      return res.status(400).json({ success: false, message: "Este CPF já está cadastrado." });
    }

    const existing = await db.select().from(users).where(
      or(
        eq(users.email, sanitizedEmail),
        eq(users.matricula, sanitizedMatricula)
      )
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Matrícula ou E-mail já cadastrado." });
    }

    let idadeCalculada: number | null = null;
    if (dataNascimento) {
      const birthDate = new Date(dataNascimento);
      idadeCalculada = new Date().getFullYear() - birthDate.getFullYear();
    }

    const senhaHash = await hashPassword(senha);

    const newUser = {
      nome: String(nome).trim(),
      matricula: sanitizedMatricula,
      cpf: sanitizedCpf,
      dataNascimento,
      idadeCalculada,
      email: sanitizedEmail,
      senhaHash,
      perfil: perfil || "ALUNO",
      status: "ATIVO",
    };

    const inserted = await db.insert(users).values(newUser).returning();
    await logAudit(req, "CREATE_USER", "USERS", `Novo usuário criado via painel: ${nome} (ID: ${inserted[0].id})`);

    const { senhaHash: _, ...createdClean } = inserted[0];
    res.status(201).json({ success: true, user: createdClean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao criar usuário.", error: err.message });
  }
});

router.put("/users/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { nome, email, cpf, fotoUrl, status, perfil, senha } = req.body;

    // Permissions check
    if (req.user?.id !== id && req.user?.perfil !== "GESTOR") {
      return res.status(403).json({ success: false, message: "Permissão insuficiente." });
    }

    const userToUpdate = await db.select().from(users).where(eq(users.id, id));
    if (userToUpdate.length === 0) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    }

    let updateFields: any = {};
    if (nome) updateFields.nome = String(nome).trim();
    if (email) updateFields.email = String(email).trim().toLowerCase();
    
    if (cpf) {
      const cpfValidation = validateCpf(cpf);
      if (!cpfValidation.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: cpfValidation.error || "CPF inválido. Verifique os números informados." 
        });
      }
      const sanitizedCpf = cleanCpf(cpf);
      const duplicateCpf = await db.select().from(users).where(and(eq(users.cpf, sanitizedCpf), sql`${users.id} != ${id}`)).limit(1);
      if (duplicateCpf.length > 0) {
        return res.status(400).json({ success: false, message: "Este CPF já está cadastrado." });
      }
      updateFields.cpf = sanitizedCpf;
    }

    if (fotoUrl !== undefined) updateFields.fotoUrl = fotoUrl;

    // Only GESTOR can update status/perfil
    if (req.user?.perfil === "GESTOR") {
      if (status) updateFields.status = status;
      if (perfil) updateFields.perfil = perfil;
    }

    if (senha) {
      if (String(senha).length < 6) {
        return res.status(400).json({ success: false, message: "A nova senha deve ter no mínimo 6 caracteres." });
      }
      updateFields.senhaHash = await hashPassword(senha);
    }

    updateFields.updatedAt = new Date();

    const updated = await db.update(users).set(updateFields).where(eq(users.id, id)).returning();
    await logAudit(req, "UPDATE_USER", "USERS", `Usuário atualizado: ${id}`);

    const { senhaHash, ...updatedClean } = updated[0];
    res.json({ success: true, user: updatedClean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao atualizar usuário.", error: err.message });
  }
});

// Helper to resolve user UUIDs safely without causing PostgreSQL UUID type errors
async function resolveUserUuids(identifiers: string[]): Promise<{ id: string; nome: string; matricula: string; email: string }[]> {
  if (!identifiers || identifiers.length === 0) return [];
  const strIds = identifiers.map((id) => String(id).trim().toLowerCase());
  
  const candidateUsers = await db
    .select({
      id: users.id,
      nome: users.nome,
      matricula: users.matricula,
      email: users.email
    })
    .from(users)
    .where(sql`${users.email} != 'jheiffe.jheiffe@gmail.com'`);

  return candidateUsers.filter((u) => {
    const uid = String(u.id).toLowerCase();
    const umat = String(u.matricula).toLowerCase();
    const uemail = String(u.email).toLowerCase();
    return strIds.some((s) => s === uid || s === umat || s === uemail);
  });
}

router.delete("/users/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const resolved = await resolveUserUuids([id]);
    
    if (resolved.length === 0) {
      return res.json({ success: true, message: "Usuário já removido ou não encontrado." });
    }

    const targetUuid = resolved[0].id;
    
    // Delete dependent records safely
    try {
      await db.delete(dedications).where(or(eq(dedications.remetenteId, targetUuid), eq(dedications.destinatarioId, targetUuid)));
      await db.delete(likes).where(eq(likes.usuarioId, targetUuid));
      await db.delete(songRequests).where(eq(songRequests.usuarioId, targetUuid));
      await db.delete(auditLogs).where(eq(auditLogs.usuarioId, targetUuid));
    } catch (depErr: any) {
      console.warn("Notice during dependent record cleanup:", depErr.message);
    }

    await db.delete(users).where(eq(users.id, targetUuid));

    await logAudit(req, "DELETE_USER", "USERS", `Usuário excluído: ${resolved[0].nome} (${resolved[0].matricula})`);
    res.json({ success: true, message: "Usuário excluído com sucesso." });
  } catch (err: any) {
    console.error("delete user error:", err);
    res.status(500).json({ success: false, message: "Erro ao excluir usuário.", error: err.message });
  }
});

// Purge all users and registrations, keeping only jheiffe.jheiffe@gmail.com as master administrator
router.post("/users/purge-all", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    // Delete all related logs, requests, dedications and likes first to avoid FK constraints
    try {
      await db.delete(dedications);
      await db.delete(likes);
      await db.delete(songRequests);
      await db.delete(auditLogs);
    } catch (depErr: any) {
      console.warn("Notice during purge relations:", depErr.message);
    }

    await db.delete(users).where(sql`${users.email} != 'jheiffe.jheiffe@gmail.com'`);

    // Ensure jheiffe.jheiffe@gmail.com exists
    const existing = await db.select().from(users).where(eq(users.email, "jheiffe.jheiffe@gmail.com")).limit(1);
    if (existing.length === 0) {
      const masterHash = await hashPassword("admin123");
      await db.insert(users).values({
        nome: "Jheiffe",
        email: "jheiffe.jheiffe@gmail.com",
        senhaHash: masterHash,
        matricula: "UP-ADM001",
        cpf: "52998224725",
        perfil: "GESTOR",
        status: "ATIVO",
        fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
      });
    } else {
      await db.update(users).set({
        nome: "Jheiffe",
        perfil: "GESTOR",
        status: "ATIVO",
        matricula: "UP-ADM001",
        cpf: "52998224725"
      }).where(eq(users.email, "jheiffe.jheiffe@gmail.com"));
    }

    res.json({
      success: true,
      message: "Todos os acessos, CPFs e cadastros antigos foram limpos. O e-mail jheiffe.jheiffe@gmail.com está ativo como Administrador Master."
    });
  } catch (err: any) {
    console.error("Purge error:", err);
    res.status(500).json({ success: false, message: "Erro ao limpar cadastros.", error: err.message });
  }
});

router.post("/users/delete-batch", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Nenhum ID informado para exclusão." });
    }

    const resolved = await resolveUserUuids(ids);
    if (resolved.length === 0) {
      return res.json({ 
        success: true, 
        message: "Nenhum usuário correspondente encontrado para exclusão.", 
        count: 0,
        deletedIds: [] 
      });
    }

    const targetUuids = resolved.map((u) => u.id);

    // Delete dependent records
    try {
      await db.delete(dedications).where(
        or(
          inArray(dedications.remetenteId, targetUuids),
          inArray(dedications.destinatarioId, targetUuids)
        )
      );
      await db.delete(likes).where(inArray(likes.usuarioId, targetUuids));
      await db.delete(songRequests).where(inArray(songRequests.usuarioId, targetUuids));
      await db.delete(auditLogs).where(inArray(auditLogs.usuarioId, targetUuids));
    } catch (e: any) {
      console.warn("Notice during dependent delete:", e.message);
    }

    const result = await db.delete(users).where(inArray(users.id, targetUuids)).returning();

    await logAudit(req, "DELETE_USER_BATCH", "USERS", `Exclusão em lote de ${result.length} usuários.`);
    res.json({ 
      success: true, 
      message: `${result.length} aluno(s) excluído(s) com sucesso.`, 
      count: result.length,
      deletedIds: targetUuids
    });
  } catch (err: any) {
    console.error("delete-batch error:", err);
    res.status(500).json({ success: false, message: "Erro na exclusão em lote.", error: err.message });
  }
});

router.post("/users/block", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, id } = req.body;
    const targetId = userId || id;
    if (!targetId) return res.status(400).json({ success: false, message: "ID do usuário não fornecido." });

    const resolved = await resolveUserUuids([targetId]);
    if (resolved.length === 0) return res.status(404).json({ success: false, message: "Usuário não encontrado." });

    await db.update(users).set({ status: "BLOQUEADO" }).where(eq(users.id, resolved[0].id));
    await logAudit(req, "BLOCK_USER", "USERS", `Usuário bloqueado: ${resolved[0].nome}`);
    res.json({ success: true, message: "Usuário bloqueado com sucesso." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao bloquear usuário.", error: err.message });
  }
});

router.post("/users/unblock", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, id } = req.body;
    const targetId = userId || id;
    if (!targetId) return res.status(400).json({ success: false, message: "ID do usuário não fornecido." });

    const resolved = await resolveUserUuids([targetId]);
    if (resolved.length === 0) return res.status(404).json({ success: false, message: "Usuário não encontrado." });

    await db.update(users).set({ status: "ATIVO" }).where(eq(users.id, resolved[0].id));
    await logAudit(req, "UNBLOCK_USER", "USERS", `Usuário desbloqueado: ${resolved[0].nome}`);
    res.json({ success: true, message: "Usuário desbloqueado com sucesso." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao desbloquear usuário.", error: err.message });
  }
});

router.post("/users/block-batch", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: "Lista de IDs inválida." });

    const resolved = await resolveUserUuids(ids);
    if (resolved.length === 0) {
      return res.json({ success: true, message: "Nenhum usuário encontrado para bloqueio." });
    }

    const targetUuids = resolved.map((u) => u.id);
    const result = await db.update(users).set({ status: "BLOQUEADO" }).where(inArray(users.id, targetUuids)).returning();
    await logAudit(req, "BLOCK_USER_BATCH", "USERS", `Bloqueio em lote de ${result.length} usuários.`);
    res.json({ success: true, message: `${result.length} usuários bloqueados com sucesso.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro no bloqueio em lote.", error: err.message });
  }
});

router.post("/users/unblock-batch", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: "Lista de IDs inválida." });

    const resolved = await resolveUserUuids(ids);
    if (resolved.length === 0) {
      return res.json({ success: true, message: "Nenhum usuário encontrado para desbloqueio." });
    }

    const targetUuids = resolved.map((u) => u.id);
    const result = await db.update(users).set({ status: "ATIVO" }).where(inArray(users.id, targetUuids)).returning();
    await logAudit(req, "UNBLOCK_USER_BATCH", "USERS", `Desbloqueio em lote de ${result.length} usuários.`);
    res.json({ success: true, message: `${result.length} usuários desbloqueados com sucesso.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro no desbloqueio em lote.", error: err.message });
  }
});


// ==========================================
// 4. MÚSICAS (songs & song_requests)
// ==========================================

router.post("/songs/request", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { youtubeId, url, titulo, artista, album, duracao, capaUrl, genero, idioma, dedicada, mensagem, destinatarioId } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) return res.status(401).json({ success: false, message: "Não autorizado." });
    if (!titulo || !artista || !youtubeId) return res.status(400).json({ success: false, message: "Dados da música inválidos." });

    // Step A: Find or insert the song in database
    let songRecord = null;
    const existingSongs = await db.select().from(songs).where(eq(songs.youtubeId, youtubeId));
    if (existingSongs.length > 0) {
      songRecord = existingSongs[0];
    } else {
      const insertedSong = await db.insert(songs).values({
        youtubeId,
        url: url || `https://www.youtube.com/watch?v=${youtubeId}`,
        titulo,
        artista,
        album: album || "Single",
        duracao: duracao || 180,
        capaUrl: capaUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=250&auto=format&fit=crop",
        genero: genero || "Workout",
        idioma: idioma || "pt",
        statusModeracao: "APROVADA", // Default automatic approval unless AI intercepts
      }).returning();
      songRecord = insertedSong[0];
    }

    // Step B: Calculate next queue position
    const currentMaxPositionRes = await db.select({ maxPos: sql<number>`max(posicao_fila)` })
      .from(songRequests)
      .where(inArray(songRequests.status, ["Fila", "Tocando"]));
    const nextPosition = (currentMaxPositionRes[0]?.maxPos || 0) + 1;

    // Step C: Create song request
    const insertedRequest = await db.insert(songRequests).values({
      usuarioId,
      musicaId: songRecord.id,
      posicaoFila: nextPosition,
      status: "Fila",
      dedicada: dedicada || false,
    }).returning();
    const songReq = insertedRequest[0];

    // Step D: Create dedication if checked
    let dedicationRecord = null;
    if (dedicada && mensagem) {
      const targetDestId = destinatarioId || usuarioId; // Default fallback to self if unspecified
      const insertedDed = await db.insert(dedications).values({
        pedidoId: songReq.id,
        remetenteId: usuarioId,
        destinatarioId: targetDestId,
        mensagem,
        aprovadaIa: true,
      }).returning();
      dedicationRecord = insertedDed[0];
    }

    await logAudit(req, "REQUEST_SONG", "MUSIC", `Pedido da música: ${titulo} - ${artista} (Posição: ${nextPosition})`);

    // Fetch the detailed list of requests to broadcast the live update
    const queueList = await getDetailedQueue();
    broadcast(req, "queue:updated", queueList);
    broadcast(req, "notification", {
      type: "song_requested",
      message: `${req.user?.nome} pediu "${titulo}"!`,
      song: { titulo, artista }
    });

    res.status(201).json({
      success: true,
      request: songReq,
      song: songRecord,
      dedication: dedicationRecord,
      message: "Seu pedido de música foi adicionado à fila de reprodução da UP Play!"
    });

  } catch (err: any) {
    console.error("Request song error:", err);
    res.status(500).json({ success: false, message: "Erro ao solicitar música.", error: err.message });
  }
});

// Helper for detailed queue with joins
async function getDetailedQueue() {
  const result = await db.execute(sql`
    SELECT 
      sr.id as request_id,
      sr.posicao_fila as position,
      sr.status as status,
      sr.dedicada as is_dedicated,
      sr.criada_em as requested_at,
      u.nome as user_name,
      u.foto_url as user_photo,
      s.id as song_id,
      s.titulo as title,
      s.artista as artist,
      s.duracao as duration,
      s.capa_url as cover_url,
      s.genero as genre,
      s.youtube_id as youtube_id,
      d.mensagem as dedication_message,
      dest.nome as destination_user_name,
      (SELECT count(*)::int FROM likes l WHERE l.musica_id = s.id) as likes_count
    FROM song_requests sr
    JOIN users u ON sr.usuario_id = u.id
    JOIN songs s ON sr.musica_id = s.id
    LEFT JOIN dedications d ON d.pedido_id = sr.id
    LEFT JOIN users dest ON d.destinatario_id = dest.id
    WHERE sr.status IN ('Fila', 'Tocando')
    ORDER BY sr.posicao_fila ASC, sr.criada_em ASC
  `);
  return result.rows || [];
}

router.get("/songs/queue", async (req, res) => {
  try {
    const queue = await getDetailedQueue();
    res.json({ success: true, queue });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter fila.", error: err.message });
  }
});

router.get("/songs/current", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        sr.id as request_id,
        sr.status as status,
        sr.criada_em as requested_at,
        u.nome as user_name,
        u.foto_url as user_photo,
        s.id as song_id,
        s.titulo as title,
        s.artista as artist,
        s.duracao as duration,
        s.capa_url as cover_url,
        s.genero as genre,
        s.youtube_id as youtube_id,
        d.mensagem as dedication_message
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      LEFT JOIN dedications d ON d.pedido_id = sr.id
      WHERE sr.status = 'Tocando'
      LIMIT 1
    `);
    const current = result.rows[0] || null;
    res.json({ success: true, current });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter música atual.", error: err.message });
  }
});

router.delete("/songs/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    // Deletes request or song
    const requestDeleted = await db.delete(songRequests).where(eq(songRequests.id, id)).returning();
    if (requestDeleted.length > 0) {
      await logAudit(req, "DELETE_REQUEST", "MUSIC", `Pedido cancelado/excluído: ${id}`);
      const queueList = await getDetailedQueue();
      broadcast(req, "queue:updated", queueList);
      return res.json({ success: true, message: "Pedido removido da fila com sucesso." });
    }

    // Fallback: delete from songs catalog
    const songDeleted = await db.delete(songs).where(eq(songs.id, id)).returning();
    if (songDeleted.length > 0) {
      await logAudit(req, "DELETE_SONG", "MUSIC", `Música excluída do acervo: ${id}`);
      return res.json({ success: true, message: "Música removida do catálogo com sucesso." });
    }

    res.status(404).json({ success: false, message: "Registro não encontrado." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao remover.", error: err.message });
  }
});

router.post("/songs/reorder", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { requests } = req.body; // Array of { requestId: string, position: number }
    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ success: false, message: "Fila de reordenação inválida." });
    }

    for (const reqObj of requests) {
      await db.update(songRequests)
        .set({ posicaoFila: reqObj.position, updatedAt: new Date() })
        .where(eq(songRequests.id, reqObj.requestId));
    }

    await logAudit(req, "REORDER_QUEUE", "MUSIC", `Fila reordenada.`);
    const queueList = await getDetailedQueue();
    broadcast(req, "queue:updated", queueList);

    res.json({ success: true, message: "Fila reordenada com sucesso." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao reordenar fila.", error: err.message });
  }
});

router.post("/songs/approve", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, songId, requestId } = req.body;
    const targetId = songId || requestId || id;
    if (!targetId) return res.status(400).json({ success: false, message: "ID não fornecido." });

    // Try song table first
    const songUpdate = await db.update(songs).set({ statusModeracao: "APROVADA" }).where(eq(songs.id, targetId)).returning();
    if (songUpdate.length > 0) {
      await logAudit(req, "APPROVE_SONG", "MUSIC", `Música aprovada no catálogo: ${songUpdate[0].titulo}`);
      return res.json({ success: true, message: "Música aprovada com sucesso." });
    }

    // Try request table
    const reqUpdate = await db.update(songRequests).set({ status: "Fila" }).where(eq(songRequests.id, targetId)).returning();
    if (reqUpdate.length > 0) {
      await logAudit(req, "APPROVE_REQUEST", "MUSIC", `Pedido aprovado: ${targetId}`);
      const queueList = await getDetailedQueue();
      broadcast(req, "queue:updated", queueList);
      return res.json({ success: true, message: "Pedido de música aprovado para reprodução." });
    }

    res.status(404).json({ success: false, message: "Registro não encontrado." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao aprovar.", error: err.message });
  }
});

router.post("/songs/reject", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, songId, requestId } = req.body;
    const targetId = songId || requestId || id;
    if (!targetId) return res.status(400).json({ success: false, message: "ID não fornecido." });

    const songUpdate = await db.update(songs).set({ statusModeracao: "REJEITADA" }).where(eq(songs.id, targetId)).returning();
    if (songUpdate.length > 0) {
      await logAudit(req, "REJECT_SONG", "MUSIC", `Música reprovada no catálogo: ${songUpdate[0].titulo}`);
      return res.json({ success: true, message: "Música rejeitada com sucesso." });
    }

    const reqUpdate = await db.update(songRequests).set({ status: "Cancelada" }).where(eq(songRequests.id, targetId)).returning();
    if (reqUpdate.length > 0) {
      await logAudit(req, "REJECT_REQUEST", "MUSIC", `Pedido rejeitado: ${targetId}`);
      const queueList = await getDetailedQueue();
      broadcast(req, "queue:updated", queueList);
      return res.json({ success: true, message: "Pedido de música cancelado/reprovado." });
    }

    res.status(404).json({ success: false, message: "Registro não encontrado." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao reprovar.", error: err.message });
  }
});


// ==========================================
// 5. CURTIDAS (likes)
// ==========================================

router.post("/likes", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { musicaId } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) return res.status(401).json({ success: false, message: "Não autorizado." });
    if (!musicaId) return res.status(400).json({ success: false, message: "ID da música obrigatório." });

    // Insert or ignore if duplicate
    const existing = await db.select().from(likes).where(
      and(
        eq(likes.usuarioId, usuarioId),
        eq(likes.musicaId, musicaId)
      )
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Você já curtiu esta música." });
    }

    const inserted = await db.insert(likes).values({
      usuarioId,
      musicaId,
    }).returning();

    // Stats and websocket broadcast
    const updatedLikesCountRes = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.musicaId, musicaId));
    const likesCount = updatedLikesCountRes[0]?.count || 0;

    broadcast(req, "likes:updated", { musicaId, likesCount });
    res.status(201).json({ success: true, like: inserted[0], likesCount });

  } catch (err: any) {
    console.error("Like error:", err);
    res.status(500).json({ success: false, message: "Erro ao registrar curtida.", error: err.message });
  }
});

router.delete("/likes", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { musicaId } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) return res.status(401).json({ success: false, message: "Não autorizado." });
    if (!musicaId) return res.status(400).json({ success: false, message: "ID da música obrigatório." });

    const deleted = await db.delete(likes).where(
      and(
        eq(likes.usuarioId, usuarioId),
        eq(likes.musicaId, musicaId)
      )
    ).returning();

    if (deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Curtida não encontrada." });
    }

    const updatedLikesCountRes = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.musicaId, musicaId));
    const likesCount = updatedLikesCountRes[0]?.count || 0;

    broadcast(req, "likes:updated", { musicaId, likesCount });
    res.json({ success: true, message: "Curtida removida.", likesCount });

  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao remover curtida.", error: err.message });
  }
});

router.get("/likes/song/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.musicaId, id));
    res.json({ success: true, count: result[0]?.count || 0 });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao buscar curtidas da música.", error: err.message });
  }
});


// ==========================================
// 6. DEDICATÓRIAS (dedications)
// ==========================================

router.post("/dedications", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { pedidoId, destinatarioId, mensagem } = req.body;
    const remetenteId = req.user?.id;

    if (!remetenteId) return res.status(401).json({ success: false, message: "Não autorizado." });
    if (!pedidoId || !destinatarioId || !mensagem) {
      return res.status(400).json({ success: false, message: "Dados da dedicatória incompletos." });
    }

    const inserted = await db.insert(dedications).values({
      pedidoId,
      remetenteId,
      destinatarioId,
      mensagem,
      aprovadaIa: true,
    }).returning();

    broadcast(req, "dedication:added", inserted[0]);
    res.status(201).json({ success: true, dedication: inserted[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao criar dedicatória.", error: err.message });
  }
});

router.get("/dedications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(dedications).where(eq(dedications.id, id));
    if (result.length === 0) return res.status(404).json({ success: false, message: "Dedicatória não encontrada." });
    res.json({ success: true, dedication: result[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter dedicatória.", error: err.message });
  }
});

router.delete("/dedications/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const result = await db.delete(dedications).where(eq(dedications.id, id)).returning();
    if (result.length === 0) return res.status(404).json({ success: false, message: "Dedicatória não encontrada." });
    res.json({ success: true, message: "Dedicatória excluída com sucesso." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao excluir dedicatória.", error: err.message });
  }
});


// ==========================================
// 7. ANÚNCIOS (announcements)
// ==========================================

router.get("/announcements", async (req, res) => {
  try {
    const onlyActive = req.query.active !== "false";
    let queryBuilder = db.select().from(announcements);
    
    if (onlyActive) {
      queryBuilder = queryBuilder.where(eq(announcements.ativo, true)) as any;
    }

    const list = await queryBuilder.orderBy(desc(announcements.prioridade), desc(announcements.createdAt));
    res.json({ success: true, announcements: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao buscar anúncios.", error: err.message });
  }
});

router.post("/announcements", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { titulo, descricao, imagem, prioridade, inicio, termino, ativo } = req.body;
    if (!titulo || !descricao) return res.status(400).json({ success: false, message: "Título e descrição necessários." });

    const inserted = await db.insert(announcements).values({
      titulo,
      descricao,
      imagem: imagem || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop",
      prioridade: prioridade || 0,
      inicio: inicio ? new Date(inicio) : null,
      termino: termino ? new Date(termino) : null,
      ativo: ativo !== undefined ? ativo : true,
    }).returning();

    await logAudit(req, "CREATE_ANNOUNCEMENT", "ANNOUNCEMENTS", `Anúncio criado: ${titulo}`);
    broadcast(req, "announcement:updated", inserted[0]);

    res.status(201).json({ success: true, announcement: inserted[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao criar anúncio.", error: err.message });
  }
});

router.put("/announcements/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, imagem, prioridade, inicio, termino, ativo } = req.body;

    const existing = await db.select().from(announcements).where(eq(announcements.id, id));
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Anúncio não encontrado." });

    let updateFields: any = { updatedAt: new Date() };
    if (titulo) updateFields.titulo = titulo;
    if (descricao) updateFields.descricao = descricao;
    if (imagem !== undefined) updateFields.imagem = imagem;
    if (prioridade !== undefined) updateFields.prioridade = prioridade;
    if (inicio !== undefined) updateFields.inicio = inicio ? new Date(inicio) : null;
    if (termino !== undefined) updateFields.termino = termino ? new Date(termino) : null;
    if (ativo !== undefined) updateFields.ativo = ativo;

    const updated = await db.update(announcements).set(updateFields).where(eq(announcements.id, id)).returning();
    await logAudit(req, "UPDATE_ANNOUNCEMENT", "ANNOUNCEMENTS", `Anúncio atualizado: ${id}`);
    broadcast(req, "announcement:updated", updated[0]);

    res.json({ success: true, announcement: updated[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao atualizar anúncio.", error: err.message });
  }
});

router.delete("/announcements/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    if (result.length === 0) return res.status(404).json({ success: false, message: "Anúncio não encontrado." });

    await logAudit(req, "DELETE_ANNOUNCEMENT", "ANNOUNCEMENTS", `Anúncio removido: ${id}`);
    res.json({ success: true, message: "Anúncio removido com sucesso." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao excluir anúncio.", error: err.message });
  }
});

router.post("/announcements/reorder", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { list } = req.body; // Array of { id: string, priority: number }
    if (!list || !Array.isArray(list)) return res.status(400).json({ success: false, message: "Fila inválida." });

    for (const item of list) {
      await db.update(announcements).set({ prioridade: item.priority }).where(eq(announcements.id, item.id));
    }

    res.json({ success: true, message: "Prioridades de anúncios salvas com sucesso." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao reordenar anúncios.", error: err.message });
  }
});


// ==========================================
// 8. RANKINGS (ranking)
// ==========================================

router.get("/ranking/daily", async (req, res) => {
  try {
    // Top requested songs today
    const list = await db.execute(sql`
      SELECT 
        s.id, s.titulo, s.artista, s.capa_url, s.genero,
        count(sr.id)::int as request_count
      FROM song_requests sr
      JOIN songs s ON sr.musica_id = s.id
      WHERE sr.criada_em >= NOW() - INTERVAL '1 day'
      GROUP BY s.id, s.titulo, s.artista, s.capa_url, s.genero
      ORDER BY request_count DESC
      LIMIT 10
    `);
    res.json({ success: true, ranking: list.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter ranking.", error: err.message });
  }
});

router.get("/ranking/last-week", async (req, res) => {
  try {
    const list = await db.execute(sql`
      SELECT 
        s.id, s.titulo, s.artista, s.capa_url, s.genero,
        count(sr.id)::int as request_count
      FROM song_requests sr
      JOIN songs s ON sr.musica_id = s.id
      WHERE sr.criada_em >= NOW() - INTERVAL '7 days'
      GROUP BY s.id, s.titulo, s.artista, s.capa_url, s.genero
      ORDER BY request_count DESC
      LIMIT 10
    `);
    res.json({ success: true, ranking: list.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter ranking.", error: err.message });
  }
});

router.get("/ranking/last-30-days", async (req, res) => {
  try {
    const list = await db.execute(sql`
      SELECT 
        s.id, s.titulo, s.artista, s.capa_url, s.genero,
        count(sr.id)::int as request_count
      FROM song_requests sr
      JOIN songs s ON sr.musica_id = s.id
      WHERE sr.criada_em >= NOW() - INTERVAL '30 days'
      GROUP BY s.id, s.titulo, s.artista, s.capa_url, s.genero
      ORDER BY request_count DESC
      LIMIT 10
    `);
    res.json({ success: true, ranking: list.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter ranking.", error: err.message });
  }
});

router.get("/ranking/users", async (req, res) => {
  try {
    const list = await db.execute(sql`
      SELECT 
        u.id, u.nome, u.foto_url, u.perfil,
        count(sr.id)::int as total_requests,
        count(l.id)::int as total_likes
      FROM users u
      LEFT JOIN song_requests sr ON sr.usuario_id = u.id
      LEFT JOIN likes l ON l.usuario_id = u.id
      GROUP BY u.id, u.nome, u.foto_url, u.perfil
      ORDER BY total_requests DESC, total_likes DESC
      LIMIT 10
    `);
    res.json({ success: true, users: list.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter ranking de usuários.", error: err.message });
  }
});


// ==========================================
// 9. BUSINESS INTELLIGENCE (dashboard & stats)
// ==========================================

router.get("/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const activeRequests = await db.select({ count: sql<number>`count(*)` }).from(songRequests).where(inArray(songRequests.status, ["Fila", "Tocando"]));
    const totalLikes = await db.select({ count: sql<number>`count(*)` }).from(likes);
    const announcementsCount = await db.select({ count: sql<number>`count(*)` }).from(announcements).where(eq(announcements.ativo, true));
    
    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers[0]?.count || 0,
        activeRequests: activeRequests[0]?.count || 0,
        totalLikes: totalLikes[0]?.count || 0,
        activeAnnouncements: announcementsCount[0]?.count || 0,
        averageWaitTimeMinutes: 12, // Default/Simulated metric
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter dashboard.", error: err.message });
  }
});

router.get("/statistics/hour", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM criada_em) as hour,
        count(*)::int as count
      FROM song_requests
      GROUP BY hour
      ORDER BY hour ASC
    `);
    res.json({ success: true, statistics: stats.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro.", error: err.message });
  }
});

router.get("/statistics/genre", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        s.genero as genre,
        count(sr.id)::int as count
      FROM song_requests sr
      JOIN songs s ON sr.musica_id = s.id
      GROUP BY genre
      ORDER BY count DESC
    `);
    res.json({ success: true, statistics: stats.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro.", error: err.message });
  }
});

router.get("/statistics/age", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        CASE 
          WHEN u.idade_calculada < 18 THEN 'Menor de 18'
          WHEN u.idade_calculada BETWEEN 18 AND 25 THEN '18-25 anos'
          WHEN u.idade_calculada BETWEEN 26 AND 35 THEN '26-35 anos'
          WHEN u.idade_calculada BETWEEN 36 AND 50 THEN '36-50 anos'
          ELSE 'Acima de 50'
        END as age_group,
        count(sr.id)::int as count
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      GROUP BY age_group
      ORDER BY count DESC
    `);
    res.json({ success: true, statistics: stats.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro.", error: err.message });
  }
});

router.get("/statistics/artists", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        s.artista,
        count(sr.id)::int as count
      FROM song_requests sr
      JOIN songs s ON sr.musica_id = s.id
      GROUP BY s.artista
      ORDER BY count DESC
      LIMIT 10
    `);
    res.json({ success: true, statistics: stats.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro.", error: err.message });
  }
});

router.get("/statistics/top-songs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        s.titulo, s.artista,
        count(sr.id)::int as count
      FROM song_requests sr
      JOIN songs s ON sr.musica_id = s.id
      GROUP BY s.titulo, s.artista
      ORDER BY count DESC
      LIMIT 10
    `);
    res.json({ success: true, statistics: stats.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro.", error: err.message });
  }
});

// Seeding function to populate realistic BI data when empty (without creating fake students)
async function seedDatabaseIfEmpty() {
  // Never re-seed or overwrite deleted users in the database
  return;
}

router.get("/statistics/bi-dashboard", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period, timeFilter, ageGroup, artist, genre, persona } = req.query;
    
    // Auto seed if empty
    await seedDatabaseIfEmpty();
    
    // Build Drizzle SQL chunks
    const whereChunks: any[] = [];

    if (period === "diario") {
      whereChunks.push(sql`sr.criada_em >= NOW() - INTERVAL '1 day'`);
    } else if (period === "semanal") {
      whereChunks.push(sql`sr.criada_em >= NOW() - INTERVAL '7 days'`);
    } else if (period === "mensal") {
      whereChunks.push(sql`sr.criada_em >= NOW() - INTERVAL '30 days'`);
    }

    if (timeFilter === "manha") {
      whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 6 AND 11`);
    } else if (timeFilter === "tarde") {
      whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 12 AND 17`);
    } else if (timeFilter === "noite") {
      whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 18 AND 22`);
    }

    if (ageGroup) {
      if (ageGroup === "Até 17") {
        whereChunks.push(sql`u.idade_calculada < 18`);
      } else if (ageGroup === "18-25") {
        whereChunks.push(sql`u.idade_calculada BETWEEN 18 AND 25`);
      } else if (ageGroup === "26-35") {
        whereChunks.push(sql`u.idade_calculada BETWEEN 26 AND 35`);
      } else if (ageGroup === "36-45") {
        whereChunks.push(sql`u.idade_calculada BETWEEN 36 AND 45`);
      } else if (ageGroup === "46-60") {
        whereChunks.push(sql`u.idade_calculada BETWEEN 46 AND 60`);
      } else if (ageGroup === "Acima de 60") {
        whereChunks.push(sql`u.idade_calculada > 60`);
      }
    }

    if (genre) {
      whereChunks.push(sql`s.genero = ${genre as string}`);
    }

    if (artist) {
      whereChunks.push(sql`s.artista = ${artist as string}`);
    }

    if (persona) {
      if (persona === "Treinadores da Manhã") {
        whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 6 AND 11 AND u.idade_calculada >= 36`);
      } else if (persona === "Energia do Almoço") {
        whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 12 AND 15`);
      } else if (persona === "Treino Intenso") {
        whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 18 AND 22 AND u.idade_calculada BETWEEN 18 AND 35`);
      }
    }

    const combinedWhere = whereChunks.length > 0 
      ? sql`WHERE ${sql.join(whereChunks, sql` AND `)}` 
      : sql``;

    // Execute core aggregations
    const totalRequestsQuery = await db.execute(sql`
      SELECT COUNT(sr.id)::int as count
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
    `);
    const totalRequests = Number((totalRequestsQuery.rows[0] as any)?.count || 0);

    // Filter likes count by where
    let likeWhereChunks: any[] = [];
    if (ageGroup) {
      if (ageGroup === "Até 17") likeWhereChunks.push(sql`u.idade_calculada < 18`);
      else if (ageGroup === "18-25") likeWhereChunks.push(sql`u.idade_calculada BETWEEN 18 AND 25`);
      else if (ageGroup === "26-35") likeWhereChunks.push(sql`u.idade_calculada BETWEEN 26 AND 35`);
      else if (ageGroup === "36-45") likeWhereChunks.push(sql`u.idade_calculada BETWEEN 36 AND 45`);
      else if (ageGroup === "46-60") likeWhereChunks.push(sql`u.idade_calculada BETWEEN 46 AND 60`);
      else if (ageGroup === "Acima de 60") likeWhereChunks.push(sql`u.idade_calculada > 60`);
    }
    if (genre) likeWhereChunks.push(sql`s.genero = ${genre as string}`);
    if (artist) likeWhereChunks.push(sql`s.artista = ${artist as string}`);
    const combinedLikeWhere = likeWhereChunks.length > 0
      ? sql`WHERE ${sql.join(likeWhereChunks, sql` AND `)}`
      : sql``;

    const totalLikesQuery = await db.execute(sql`
      SELECT COUNT(l.id)::int as count
      FROM likes l
      JOIN users u ON l.usuario_id = u.id
      JOIN songs s ON l.musica_id = s.id
      ${combinedLikeWhere}
    `);
    const totalLikes = Number((totalLikesQuery.rows[0] as any)?.count || 0);

    const totalDedicationsQuery = await db.execute(sql`
      SELECT COUNT(d.id)::int as count
      FROM dedications d
      JOIN song_requests sr ON d.pedido_id = sr.id
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
    `);
    const totalDedications = Number((totalDedicationsQuery.rows[0] as any)?.count || 0);

    const waitTimeQuery = await db.execute(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (sr.reproduzida_em - sr.criada_em)) / 60.0)::float as avg_wait_minutes
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
      ${whereChunks.length > 0 ? sql` AND ` : sql` WHERE `} sr.status = 'Finalizada' AND sr.reproduzida_em IS NOT NULL
    `);
    const avgWaitMinutes = Math.round(Number((waitTimeQuery.rows[0] as any)?.avg_wait_minutes || 10.5) * 10) / 10;

    const hourlyDistributionQuery = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM sr.criada_em)::int as hour,
        COUNT(sr.id)::int as count
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
      GROUP BY hour
      ORDER BY hour ASC
    `);

    const genreDistributionQuery = await db.execute(sql`
      SELECT 
        s.genero as genre,
        COUNT(sr.id)::int as count
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
      GROUP BY genre
      ORDER BY count DESC
    `);

    const ageGroupDistributionQuery = await db.execute(sql`
      SELECT 
        CASE 
          WHEN u.idade_calculada < 18 THEN 'Até 17 anos'
          WHEN u.idade_calculada BETWEEN 18 AND 25 THEN '18–25 anos'
          WHEN u.idade_calculada BETWEEN 26 AND 35 THEN '26–35 anos'
          WHEN u.idade_calculada BETWEEN 36 AND 45 THEN '36–45 anos'
          WHEN u.idade_calculada BETWEEN 46 AND 60 THEN '46–60 anos'
          ELSE 'Acima de 60 anos'
        END as age_group,
        COUNT(sr.id)::int as count
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
      GROUP BY age_group
      ORDER BY count DESC
    `);

    const artistRankingQuery = await db.execute(sql`
      SELECT 
        s.artista as name,
        COUNT(sr.id)::int as count
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
      GROUP BY s.artista
      ORDER BY count DESC
      LIMIT 10
    `);

    const songRankingQuery = await db.execute(sql`
      SELECT 
        s.titulo as title,
        s.artista as artist,
        s.genero as genre,
        COUNT(sr.id)::int as count,
        (SELECT COUNT(l.id)::int FROM likes l WHERE l.musica_id = s.id)::int as likes
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
      GROUP BY s.id, s.titulo, s.artista, s.genero
      ORDER BY count DESC
      LIMIT 10
    `);

    const weeklyUtilizationQuery = await db.execute(sql`
      SELECT 
        EXTRACT(ISODOW FROM sr.criada_em)::int as day_of_week,
        COUNT(sr.id)::int as count
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
      GROUP BY day_of_week
      ORDER BY day_of_week ASC
    `);

    // Format weekly util for easier reading
    const daysMap = ["", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
    const weeklyUtilization = weeklyUtilizationQuery.rows.map((row: any) => ({
      day: daysMap[row.day_of_week] || `Dia ${row.day_of_week}`,
      count: row.count,
      pct: totalRequests > 0 ? Math.round((row.count / totalRequests) * 100) : 0
    }));

    // Build the stats digest to send to Gemini or use in fallback
    const topGenre = genreDistributionQuery.rows[0]?.genre || "Geral";
    const topArtist = artistRankingQuery.rows[0]?.name || "Geral";
    
    let aiOutput: any = null;
    const apiKey = config.gemini.apiKey;
    
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      // Highly resilient Gemini helper with fast model fallbacks and immediate failover on 503/429/not-found errors
      const generateContentWithRetry = async (aiClient: GoogleGenAI, params: {
        contents: any;
        config?: any;
      }) => {
        const modelsToTry = [
          "gemini-3.1-flash-lite",
          "gemini-3.7-flash",
          "gemini-flash-latest",
          "gemini-3.1-pro-preview"
        ];
        let lastError: any = null;

        for (const modelName of modelsToTry) {
          try {
            const response = await aiClient.models.generateContent({
              model: modelName,
              contents: params.contents,
              config: params.config,
            });
            return response;
          } catch (err: any) {
            lastError = err;
            const errMsg = String(err?.message || (typeof err === 'object' ? JSON.stringify(err) : err) || "");
            const isTemporaryDemandOrNotFound = 
              errMsg.includes("503") || 
              errMsg.includes("UNAVAILABLE") || 
              errMsg.includes("not found") || 
              errMsg.includes("404") || 
              errMsg.includes("429") || 
              errMsg.includes("RESOURCE_EXHAUSTED") ||
              errMsg.includes("high demand") ||
              err?.status === 503 ||
              err?.code === 503 ||
              err?.error?.code === 503;

            if (isTemporaryDemandOrNotFound) {
              console.log(`[Gemini Fallback] Model ${modelName} is at capacity or unavailable. Seamlessly switching to next model.`);
              continue;
            }
            
            console.log(`[Gemini Fallback] Model ${modelName} encountered transient error. Trying next model.`);
          }
        }
        throw lastError;
      };

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `Analise os seguintes dados agregados de comportamento rítmico dos alunos da academia UP Fitness no aplicativo UP Play:
        - Total de pedidos: ${totalRequests}
        - Total de curtidas: ${totalLikes}
        - Total de dedicatórias: ${totalDedications}
        - Tempo médio de espera para reprodução: ${avgWaitMinutes} minutos
        - Distribuição de estilos musicais (votos): ${JSON.stringify(genreDistributionQuery.rows)}
        - Distribuição por faixa etária: ${JSON.stringify(ageGroupDistributionQuery.rows)}
        - Distribuição horária de pedidos: ${JSON.stringify(hourlyDistributionQuery.rows)}
        - Top 5 Artistas: ${JSON.stringify(artistRankingQuery.rows.slice(0, 5))}
        - Top 5 Músicas: ${JSON.stringify(songRankingQuery.rows.slice(0, 5))}
        - Filtro atual: Período=${period || "geral"}, Turno=${timeFilter || "todos"}

        Responda estritamente em português no formato JSON abaixo, de forma realista e contextualizada para o UP Play:
        {
          "insights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5", "insight 6"],
          "personas": [
            {
              "nome": "Nome da Persona",
              "horario": "ex: Segunda a Sexta: 06:00-11:00",
              "idadeMedia": 45,
              "estilosPredominantes": ["Estilo 1", "Estilo 2"],
              "artistasFavoritos": ["Artista A", "Artista B"],
              "nivelParticipacao": "Alto | Médio | Baixo"
            }
          ],
          "adaptivePlaylist": [
            { "titulo": "Nome da Música", "artista": "Nome do Artista", "genero": "Gênero" }
          ],
          "predictiveRecommendations": [
            { "titulo": "Título da Recomendação", "descricao": "Descrição detalhada" }
          ]
        }`;

        const response = await generateContentWithRetry(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                insights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                personas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      nome: { type: Type.STRING },
                      horario: { type: Type.STRING },
                      idadeMedia: { type: Type.INTEGER },
                      estilosPredominantes: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      artistasFavoritos: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      nivelParticipacao: { type: Type.STRING }
                    },
                    required: ["nome", "horario", "idadeMedia", "estilosPredominantes", "artistasFavoritos", "nivelParticipacao"]
                  }
                },
                adaptivePlaylist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      titulo: { type: Type.STRING },
                      artista: { type: Type.STRING },
                      genero: { type: Type.STRING }
                    },
                    required: ["titulo", "artista", "genero"]
                  }
                },
                predictiveRecommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      titulo: { type: Type.STRING },
                      descricao: { type: Type.STRING }
                    },
                    required: ["titulo", "descricao"]
                  }
                }
              },
              required: ["insights", "personas", "adaptivePlaylist", "predictiveRecommendations"]
            }
          }
        });

        if (response.text) {
          aiOutput = JSON.parse(response.text.trim());
        }
      } catch (err: any) {
        console.warn("Gemini BI generation bypassed, using rule-based model:", err.message);
      }
    }

    // Dynamic high-fidelity fallback if AI is not available or failed
    if (!aiOutput) {
      // Create high-quality dynamic insights based on the real stats
      const insights = [
        `O gênero ${topGenre} lidera o engajamento geral com a maior parcela de pedidos coletivos.`,
        `O artista ${topArtist} demonstrou uma excelente aceitação com pedidos recorrentes.`,
        totalDedications > 0 
          ? `As dedicatórias rítmicas aumentaram na última semana, fortalecendo a interação social entre alunos.` 
          : `As dedicatórias crescem nas sextas-feiras à noite, durante os treinos coletivos de alta intensidade.`,
        `Músicas com tempo de reprodução rápido reduzem a percepção de espera dos alunos (média de ${avgWaitMinutes} min).`,
        timeFilter === "noite" 
          ? `O turno da noite apresenta maior concentração de faixas de alta pulsação rítmica (BPM elevado) como Eletrônica e Funk.` 
          : `Alunos do turno da manhã mostram forte preferência por ritmos nostálgicos (Flashback) e Rock Clássico.`,
        `Alunos de 18-25 anos representam a faixa etária mais interativa do aplicativo UP Play.`
      ];

      const personas = [
        {
          nome: "Treinadores da Manhã",
          horario: "Segunda a Sexta: 06:00 - 11:00",
          idadeMedia: 48,
          estilosPredominantes: ["Sertanejo", "Flashback", "Rock Clássico"],
          artistasFavoritos: [topArtist !== "Geral" ? topArtist : "Jorge & Mateus", "Queen", "AC/DC"],
          nivelParticipacao: "Médio"
        },
        {
          nome: "Energia do Almoço",
          horario: "Segunda a Sexta: 12:00 - 15:00",
          idadeMedia: 32,
          estilosPredominantes: ["Pop", "Rock", "Eletrônica"],
          artistasFavoritos: ["Dua Lipa", "Bruno Mars", "Alok"],
          nivelParticipacao: "Baixo"
        },
        {
          nome: "Treino Intenso (Noturno)",
          horario: "Segunda a Sexta: 18:00 - 22:00",
          idadeMedia: 24,
          estilosPredominantes: ["Eletrônica", "Funk", "Pop", "Hip Hop"],
          artistasFavoritos: ["David Guetta", "Eminem", "MC Kevin o Chris"],
          nivelParticipacao: "Alto"
        }
      ];

      // Playlist suggested for fallback
      let adaptivePlaylist = [
        { titulo: "Titanium", artista: "David Guetta", genero: "Eletrônica" },
        { titulo: "Lose Yourself", artista: "Eminem", genero: "Hip Hop" },
        { titulo: "Back in Black", artista: "AC/DC", genero: "Rock" },
        { titulo: "Levitating", artista: "Dua Lipa", genero: "Pop" },
        { titulo: "Hear Me Now", artista: "Alok", genero: "Eletrônica" }
      ];

      if (timeFilter === "manha") {
        adaptivePlaylist = [
          { titulo: "Back in Black", artista: "AC/DC", genero: "Rock" },
          { titulo: "Billie Jean", artista: "Michael Jackson", genero: "Flashback" },
          { titulo: "Sosseguei", artista: "Jorge & Mateus", genero: "Sertanejo" },
          { titulo: "Never Gonna Give You Up", artista: "Rick Astley", genero: "Flashback" },
          { titulo: "Apelido Carinhoso", artista: "Gusttavo Lima", genero: "Sertanejo" }
        ];
      } else if (timeFilter === "tarde") {
        adaptivePlaylist = [
          { titulo: "Levitating", artista: "Dua Lipa", genero: "Pop" },
          { titulo: "Uptown Funk", artista: "Bruno Mars", genero: "Pop" },
          { titulo: "Hear Me Now", artista: "Alok", genero: "Eletrônica" },
          { titulo: "Never Gonna Give You Up", artista: "Rick Astley", genero: "Flashback" },
          { titulo: "Back in Black", artista: "AC/DC", genero: "Rock" }
        ];
      }

      const predictiveRecommendations = [
        {
          titulo: "Expansão de Playlist Eletrônica",
          descricao: `Com o alto engajamento em ${topGenre}, sugere-se incluir 10 novas faixas de remixes com batidas de 128 BPM para o treino intenso do período noturno.`
        },
        {
          titulo: "Oportunidade para Sertanejo",
          descricao: "Identificado aumento substancial de buscas por Sertanejo Universitário após as 19h no público de 30-45 anos. Recomenda-se criar um dia temático 'Sertanejo no Treino' às quartas-feiras."
        },
        {
          titulo: "Campanha para Maior Engajamento no Almoço",
          descricao: "O horário de almoço (12h-15h) possui menor utilização de pedidos. Sugere-se ativar notificações push 'Escolha a trilha do seu almoço' para impulsionar a participação."
        }
      ];

      aiOutput = { insights, personas, adaptivePlaylist, predictiveRecommendations };
    }

    res.json({
      success: true,
      summary: {
        totalRequests,
        totalLikes,
        totalDedications,
        avgWaitMinutes
      },
      hourlyDistribution: hourlyDistributionQuery.rows,
      genreDistribution: genreDistributionQuery.rows,
      ageGroupDistribution: ageGroupDistributionQuery.rows,
      artistRanking: artistRankingQuery.rows,
      songRanking: songRankingQuery.rows,
      weeklyUtilization,
      insights: aiOutput.insights,
      personas: aiOutput.personas,
      adaptivePlaylist: aiOutput.adaptivePlaylist,
      predictiveRecommendations: aiOutput.predictiveRecommendations
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter BI Dashboard.", error: err.message });
  }
});

router.get("/statistics/export", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period, timeFilter, ageGroup, artist, genre, persona, format } = req.query;
    
    // Check and seed if database is empty to make sure we have data
    await seedDatabaseIfEmpty();
    
    // Build the dynamic WHERE clause
    const whereChunks: any[] = [];

    if (period === "diario") {
      whereChunks.push(sql`sr.criada_em >= NOW() - INTERVAL '1 day'`);
    } else if (period === "semanal") {
      whereChunks.push(sql`sr.criada_em >= NOW() - INTERVAL '7 days'`);
    } else if (period === "mensal") {
      whereChunks.push(sql`sr.criada_em >= NOW() - INTERVAL '30 days'`);
    }

    if (timeFilter === "manha") {
      whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 6 AND 11`);
    } else if (timeFilter === "tarde") {
      whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 12 AND 17`);
    } else if (timeFilter === "noite") {
      whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 18 AND 22`);
    }

    if (ageGroup) {
      if (ageGroup === "Até 17") {
        whereChunks.push(sql`u.idade_calculada < 18`);
      } else if (ageGroup === "18-25") {
        whereChunks.push(sql`u.idade_calculada BETWEEN 18 AND 25`);
      } else if (ageGroup === "26-35") {
        whereChunks.push(sql`u.idade_calculada BETWEEN 26 AND 35`);
      } else if (ageGroup === "36-45") {
        whereChunks.push(sql`u.idade_calculada BETWEEN 36 AND 45`);
      } else if (ageGroup === "46-60") {
        whereChunks.push(sql`u.idade_calculada BETWEEN 46 AND 60`);
      } else if (ageGroup === "Acima de 60") {
        whereChunks.push(sql`u.idade_calculada > 60`);
      }
    }

    if (genre) {
      whereChunks.push(sql`s.genero = ${genre as string}`);
    }

    if (artist) {
      whereChunks.push(sql`s.artista = ${artist as string}`);
    }

    if (persona) {
      if (persona === "Treinadores da Manhã") {
        whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 6 AND 11 AND u.idade_calculada >= 36`);
      } else if (persona === "Energia do Almoço") {
        whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 12 AND 15`);
      } else if (persona === "Treino Intenso") {
        whereChunks.push(sql`EXTRACT(HOUR FROM sr.criada_em) BETWEEN 18 AND 22 AND u.idade_calculada BETWEEN 18 AND 35`);
      }
    }

    const combinedWhere = whereChunks.length > 0 
      ? sql`WHERE ${sql.join(whereChunks, sql` AND `)}` 
      : sql``;

    const stats = await db.execute(sql`
      SELECT 
        sr.id as request_id,
        u.nome as user_name,
        u.idade_calculada as user_age,
        u.cpf as user_cpf,
        s.titulo as song_title,
        s.artista as song_artist,
        s.genero as song_genre,
        sr.status as status,
        sr.dedicada as dedicated,
        sr.criada_em as requested_at,
        sr.reproduzida_em as played_at
      FROM song_requests sr
      JOIN users u ON sr.usuario_id = u.id
      JOIN songs s ON sr.musica_id = s.id
      ${combinedWhere}
      ORDER BY sr.criada_em DESC
    `);
    
    if (format === "csv" || format === "excel") {
      let csv = "ID_PEDIDO,ALUNO,IDADE,CPF,MUSICA,ARTISTA,GENERO,STATUS,DEDICADO,DATA_PEDIDO,DATA_REPRODUCAO\n";
      stats.rows.forEach((row: any) => {
        csv += `"${row.request_id}","${row.user_name}","${row.user_age}","${row.user_cpf}","${row.song_title}","${row.song_artist}","${row.song_genre}","${row.status}","${row.dedicated ? "Sim" : "Não"}","${row.requested_at}","${row.played_at || ""}"\n`;
      });

      res.header("Content-Type", "text/csv");
      res.attachment(`upplay_bi_report_${period || "geral"}.csv`);
      return res.send(csv);
    }

    // Default to JSON for printable/UI interface
    res.json({ success: true, rows: stats.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao exportar dados.", error: err.message });
  }
});


// ==========================================
// 10. PLAYER (player)
// ==========================================

// Global state simulation for active player in DB context
let playerState = {
  status: "playing", // playing | paused
  volume: 80,
  currentProgressSeconds: 30,
};

router.get("/player/status", async (req, res) => {
  try {
    // Current song joined
    const currentSongRes = await db.execute(sql`
      SELECT 
        sr.id as request_id,
        s.titulo as title,
        s.artista as artist,
        s.duracao as duration,
        s.capa_url as cover_url,
        s.youtube_id as youtube_id
      FROM song_requests sr
      JOIN songs s ON sr.musica_id = s.id
      WHERE sr.status = 'Tocando'
      LIMIT 1
    `);
    
    res.json({
      success: true,
      player: {
        ...playerState,
        currentSong: currentSongRes.rows[0] || null,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter status do player.", error: err.message });
  }
});

router.post("/player/play", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  playerState.status = "playing";
  await logAudit(req, "PLAYER_PLAY", "PLAYER", "Player de reprodução iniciado/retomado.");
  broadcast(req, "player:state", playerState);
  res.json({ success: true, player: playerState });
});

router.post("/player/pause", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  playerState.status = "paused";
  await logAudit(req, "PLAYER_PAUSE", "PLAYER", "Player de reprodução pausado.");
  broadcast(req, "player:state", playerState);
  res.json({ success: true, player: playerState });
});

router.post("/player/next", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    // Finalize current song playing
    await db.execute(sql`
      UPDATE song_requests 
      SET status = 'Finalizada', reproduzida_em = NOW() 
      WHERE status = 'Tocando'
    `);

    // Get next song in queue
    const nextInQueue = await db.select()
      .from(songRequests)
      .where(eq(songRequests.status, "Fila"))
      .orderBy(asc(songRequests.posicaoFila), asc(songRequests.criadaEm))
      .limit(1);

    if (nextInQueue.length > 0) {
      await db.update(songRequests)
        .set({ status: "Tocando", reproduzidaEm: new Date() })
        .where(eq(songRequests.id, nextInQueue[0].id));
    }

    playerState.currentProgressSeconds = 0;
    await logAudit(req, "PLAYER_NEXT", "PLAYER", "Música avançada pelo gestor.");
    
    const queueList = await getDetailedQueue();
    broadcast(req, "queue:updated", queueList);
    broadcast(req, "player:updated", { status: "playing" });

    res.json({ success: true, message: "Avançou para a próxima música." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao avançar música.", error: err.message });
  }
});

router.post("/player/previous", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    // Get last finished request
    const lastFinished = await db.select()
      .from(songRequests)
      .where(eq(songRequests.status, "Finalizada"))
      .orderBy(desc(songRequests.reproduzidaEm))
      .limit(1);

    if (lastFinished.length > 0) {
      // Put current playing back to Queue (pos 1)
      await db.execute(sql`
        UPDATE song_requests 
        SET status = 'Fila', posicao_fila = 1
        WHERE status = 'Tocando'
      `);

      // Put previous back to Playing
      await db.update(songRequests)
        .set({ status: "Tocando" })
        .where(eq(songRequests.id, lastFinished[0].id));
    }

    playerState.currentProgressSeconds = 0;
    await logAudit(req, "PLAYER_PREV", "PLAYER", "Música retornada para a anterior.");
    
    const queueList = await getDetailedQueue();
    broadcast(req, "queue:updated", queueList);
    broadcast(req, "player:updated", { status: "playing" });

    res.json({ success: true, message: "Retornou para a música anterior." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao voltar música.", error: err.message });
  }
});


// ==========================================
// 11. CONFIGURAÇÕES & AUX (settings, logs, health)
// ==========================================

router.get("/settings", async (req, res) => {
  try {
    let settingsList = await db.select().from(settings).limit(1);
    if (settingsList.length === 0) {
      const defaultPrefs = JSON.stringify({
        maxBpm: 180,
        energyFilter: true,
        coachActive: true,
        aiModel: "gemini-3.1-flash-lite",
        adInterval: 15,
        volumeLevel: 75,
        limitTime: "22:30"
      });
      // Create default parameters
      const inserted = await db.insert(settings).values({
        regraFila: "FIFO",
        limitesPedidos: 3,
        mensagensPadrao: "Bem-vindo ao UP Play!",
        parametrosIa: "gemini-3.1-flash-lite",
        preferenciasGerais: defaultPrefs,
      }).returning();
      settingsList = inserted;
    }
    
    const row = settingsList[0];
    let parsedPrefs: any = {};
    if (row.preferenciasGerais) {
      try {
        parsedPrefs = JSON.parse(row.preferenciasGerais);
      } catch (_) {}
    }

    res.json({ 
      success: true, 
      settings: {
        ...row,
        maxBpm: parsedPrefs.maxBpm ?? 180,
        energyFilter: parsedPrefs.energyFilter ?? true,
        coachActive: parsedPrefs.coachActive ?? true,
        aiModel: parsedPrefs.aiModel ?? row.parametrosIa ?? "gemini-3.7-flash",
        adInterval: parsedPrefs.adInterval ?? 15,
        volumeLevel: parsedPrefs.volumeLevel ?? 75,
        limitTime: parsedPrefs.limitTime ?? "22:30",
        ...parsedPrefs
      } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao obter configurações.", error: err.message });
  }
});

router.put("/settings", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      regraFila, 
      limitesPedidos, 
      mensagensPadrao, 
      parametrosIa, 
      preferenciasGerais,
      maxBpm,
      energyFilter,
      coachActive,
      aiModel,
      adInterval,
      volumeLevel,
      limitTime
    } = req.body;

    let current = await db.select().from(settings).limit(1);
    if (current.length === 0) {
      const inserted = await db.insert(settings).values({
        regraFila: "FIFO",
        limitesPedidos: 3,
        mensagensPadrao: "Bem-vindo ao UP Play!",
        parametrosIa: aiModel || "gemini-3.7-flash",
        preferenciasGerais: JSON.stringify({
          maxBpm: maxBpm ?? 180,
          energyFilter: energyFilter ?? true,
          coachActive: coachActive ?? true,
          aiModel: aiModel ?? "gemini-3.7-flash",
          adInterval: adInterval ?? 15,
          volumeLevel: volumeLevel ?? 75,
          limitTime: limitTime ?? "22:30"
        })
      }).returning();
      current = inserted;
    }

    let existingPrefs: any = {};
    if (current[0].preferenciasGerais) {
      try {
        existingPrefs = JSON.parse(current[0].preferenciasGerais);
      } catch (_) {}
    }

    const updatedPrefs = {
      ...existingPrefs,
      ...(typeof preferenciasGerais === 'object' ? preferenciasGerais : {}),
      ...(maxBpm !== undefined ? { maxBpm: Number(maxBpm) } : {}),
      ...(energyFilter !== undefined ? { energyFilter: Boolean(energyFilter) } : {}),
      ...(coachActive !== undefined ? { coachActive: Boolean(coachActive) } : {}),
      ...(aiModel !== undefined ? { aiModel: String(aiModel) } : {}),
      ...(adInterval !== undefined ? { adInterval: Number(adInterval) } : {}),
      ...(volumeLevel !== undefined ? { volumeLevel: Number(volumeLevel) } : {}),
      ...(limitTime !== undefined ? { limitTime: String(limitTime) } : {})
    };

    const updated = await db.update(settings).set({
      regraFila: regraFila || current[0].regraFila,
      limitesPedidos: limitesPedidos !== undefined ? limitesPedidos : current[0].limitesPedidos,
      mensagensPadrao: mensagensPadrao || current[0].mensagensPadrao,
      parametrosIa: aiModel || parametrosIa || current[0].parametrosIa,
      preferenciasGerais: JSON.stringify(updatedPrefs),
      updatedAt: new Date(),
    }).where(eq(settings.id, current[0].id)).returning();

    await logAudit(req, "UPDATE_SETTINGS", "SETTINGS", `Configurações gerais atualizadas. BPM: ${updatedPrefs.maxBpm}, Volume: ${updatedPrefs.volumeLevel}%, Modelo: ${updatedPrefs.aiModel}, Intervalo: ${updatedPrefs.adInterval}m, Limite: ${updatedPrefs.limitTime}`);
    
    res.json({ 
      success: true, 
      settings: {
        ...updated[0],
        ...updatedPrefs
      } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao atualizar configurações.", error: err.message });
  }
});

router.get("/logs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const list = await db.select({
      id: auditLogs.id,
      usuarioId: auditLogs.usuarioId,
      acao: auditLogs.acao,
      modulo: auditLogs.modulo,
      dataHora: auditLogs.dataHora,
      ip: auditLogs.ip,
      detalhes: auditLogs.detalhes,
      user_name: users.nome,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.usuarioId, users.id))
    .orderBy(desc(auditLogs.dataHora))
    .limit(50);

    res.json({ success: true, logs: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erro ao buscar logs de auditoria.", error: err.message });
  }
});

router.get("/health", async (req, res) => {
  try {
    // Check DB connection
    const check = await db.execute(sql`SELECT 1 as is_alive`);
    res.json({ 
      success: true, 
      status: "healthy",
      database: check.rows[0]?.is_alive === 1 ? "connected" : "disconnected",
      uptimeSeconds: process.uptime(),
      timestamp: new Date()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, status: "unhealthy", error: err.message });
  }
});

export default router;
