import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const BCRYPT_ROUNDS = 10;
const googleClient = new OAuth2Client();

/**
 * Hashes a user password using bcrypt with standard salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string.");
  }
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Securely verifies a password against stored hash.
 * Supports transparent migration from legacy SHA-256 hashes.
 */
export async function verifyPassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!password || !storedHash) return false;

  // Check legacy SHA-256 hash (64 hex characters)
  if (storedHash.length === 64 && /^[0-9a-f]{64}$/i.test(storedHash)) {
    const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(legacyHash), Buffer.from(storedHash));
    } catch {
      return false;
    }
  }

  // Standard bcrypt comparison
  try {
    return await bcrypt.compare(password, storedHash);
  } catch (err) {
    console.error("[Security] Bcrypt comparison error:", err);
    return false;
  }
}

export interface VerifiedGoogleUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

/**
 * Cryptographically verifies a Google ID Token using official Google public certificates.
 * Validates signature, issuer, audience, expiration, and email verification.
 * NUNCA aceita claims não verificados fornecidos diretamente pelo cliente.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser | null> {
  if (!idToken || typeof idToken !== "string") return null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      console.warn("[Google Auth] Missing required claims (email or sub) in ID Token payload.");
      return null;
    }

    if (payload.email_verified === false) {
      console.warn("[Google Auth] Rejected Google account: email is not verified.");
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.given_name || payload.email.split("@")[0],
      picture: payload.picture || "",
      email_verified: true,
    };
  } catch (err: any) {
    console.warn("[Google Auth] Cryptographic verification failed for ID Token:", err?.message || err);
    return null;
  }
}
