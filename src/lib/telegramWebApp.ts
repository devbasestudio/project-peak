"use client";

export type TelegramIdentity = {
  id: string;
  username: string;
  displayName: string;
};

type TelegramWebAppUser = {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

const STORAGE_KEY = "project_peak_telegram_identity";

export function initTelegramWebApp() {
  if (typeof window === "undefined") return;
  const webApp = (window as any).Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
}

function identityFromUser(user?: TelegramWebAppUser): TelegramIdentity | null {
  if (!user?.id) return null;

  const firstName = String(user.first_name || "").trim();
  const lastName = String(user.last_name || "").trim();
  const username = String(user.username || "").trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || username || "Telegram user";

  return {
    id: String(user.id),
    username,
    displayName,
  };
}

function identityFromUrl(): TelegramIdentity | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("tg_id") || params.get("telegram_id");
  if (!id) return null;

  const username = params.get("tg_username") || "";
  const displayName = params.get("tg_name") || username || "Telegram user";
  return { id, username, displayName };
}

function identityFromInitData(): TelegramIdentity | null {
  const initData = readTelegramInitData();
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get("user") || "{}") as TelegramWebAppUser;
    return identityFromUser(user);
  } catch {
    return null;
  }
}

function identityFromStorage(): TelegramIdentity | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TelegramIdentity;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

function rememberIdentity(identity: TelegramIdentity | null) {
  if (!identity?.id) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Storage can be disabled in some embedded browsers. The current page can
    // still use the in-memory value, so this is not fatal.
  }
}

export function readTelegramIdentity(): TelegramIdentity | null {
  if (typeof window === "undefined") return null;
  const user = (window as any).Telegram?.WebApp?.initDataUnsafe?.user as TelegramWebAppUser | undefined;
  const verifiedIdentity = identityFromUser(user) || identityFromInitData() || identityFromUrl();
  const identity = verifiedIdentity || (process.env.NODE_ENV === "production" ? null : identityFromStorage());
  rememberIdentity(identity);
  return identity;
}

export function readTelegramInitData() {
  if (typeof window === "undefined") return "";
  return String((window as any).Telegram?.WebApp?.initData || "");
}

export function readTelegramLaunchSignature() {
  if (typeof window === "undefined") return { launchSig: "", launchTs: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    launchSig: params.get("tg_sig") || "",
    launchTs: params.get("tg_ts") || "",
  };
}

export function watchTelegramIdentity(onChange: (identity: TelegramIdentity | null) => void) {
  if (typeof window === "undefined") return () => {};

  let disposed = false;
  let attempts = 0;

  const tick = () => {
    if (disposed) return;
    initTelegramWebApp();
    const identity = readTelegramIdentity();
    onChange(identity);

    if (!identity && attempts < 30) {
      attempts += 1;
      window.setTimeout(tick, 200);
    }
  };

  tick();
  return () => {
    disposed = true;
  };
}

export function appendTelegramParams(href: string, identity?: TelegramIdentity | null) {
  if (typeof window === "undefined") return href;
  const resolvedIdentity = identity === undefined ? readTelegramIdentity() : identity;
  if (!resolvedIdentity?.id) return href;

  const url = new URL(href, window.location.origin);
  url.searchParams.set("tg_id", resolvedIdentity.id);
  if (resolvedIdentity.username) url.searchParams.set("tg_username", resolvedIdentity.username);
  if (resolvedIdentity.displayName) url.searchParams.set("tg_name", resolvedIdentity.displayName);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function copyText(value: string) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
