// Autenticación simple del admin: cookie firmada con HMAC-SHA256 (Web Crypto,
// compatible con el runtime de edge middleware y con Node).
export const ADMIN_COOKIE = "dulces_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function secret(): string {
  return process.env.AUTH_SECRET || "dulces-secreto-local-cambia-esto";
}

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(): Promise<string> {
  const payload = `admin.${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, exp, sig] = parts;
  if (role !== "admin") return false;
  const expected = await hmac(`${role}.${exp}`);
  if (sig.length !== expected.length) return false;
  // comparación en tiempo ~constante
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return false;
  return Number(exp) > Date.now();
}

export function checkCredentials(user: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "credenciales-en-env";
  return user === expectedUser && password === expectedPass;
}
