import { createHmac, timingSafeEqual } from "node:crypto";

type MiniAppSessionLinkOptions = {
  email: string;
  telegramId: string;
  next: "/admin/dashboard" | "/user/dashboard";
};

const SESSION_LINK_TTL_SECONDS = 120;

function sessionSecret() {
  return process.env.TELEGRAM_BOT_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function sessionPayload(email: string, telegramId: string, next: string, expiresAt: string) {
  return [email.toLowerCase(), telegramId, next, expiresAt].join("\n");
}

function signSessionPayload(email: string, telegramId: string, next: string, expiresAt: string) {
  const secret = sessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret)
    .update(sessionPayload(email, telegramId, next, expiresAt))
    .digest("hex");
}

function safeEqualHex(left: string, right: string) {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

export function createMiniAppSessionLink(
  origin: string,
  { email, telegramId, next }: MiniAppSessionLinkOptions,
) {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_LINK_TTL_SECONDS);
  const params = new URLSearchParams({
    email,
    tg_id: telegramId,
    next,
    exp: expiresAt,
    sig: signSessionPayload(email, telegramId, next, expiresAt),
  });
  return `${origin}/api/auth/miniapp-session?${params.toString()}`;
}

export function verifyMiniAppSessionParams(params: URLSearchParams) {
  const email = String(params.get("email") || "").trim().toLowerCase();
  const telegramId = String(params.get("tg_id") || "").trim().replace(/^@/, "");
  const next = String(params.get("next") || "");
  const expiresAt = String(params.get("exp") || "");
  const signature = String(params.get("sig") || "");
  const exp = Number(expiresAt);
  const safeNext = next === "/admin/dashboard" || next === "/user/dashboard" ? next : "";

  if (!email || !telegramId || !safeNext || !exp || !signature || !sessionSecret()) {
    return null;
  }
  if (Math.floor(Date.now() / 1000) > exp) {
    return null;
  }

  const expected = signSessionPayload(email, telegramId, safeNext, expiresAt);
  if (!safeEqualHex(signature, expected)) return null;

  return { email, telegramId, next: safeNext };
}
