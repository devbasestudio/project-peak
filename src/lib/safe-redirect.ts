/** Only allow internal destinations, including after URL normalization. */
export function safeRedirectPath(value: string | null, origin: string, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\\\x00-\x20]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, origin);
    return parsed.origin === new URL(origin).origin ? parsed.pathname + parsed.search + parsed.hash : fallback;
  } catch { return fallback; }
}
