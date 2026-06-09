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

export function initTelegramWebApp() {
  if (typeof window === "undefined") return;
  const webApp = (window as any).Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
}

export function readTelegramIdentity(): TelegramIdentity | null {
  if (typeof window === "undefined") return null;
  const user = (window as any).Telegram?.WebApp?.initDataUnsafe?.user as TelegramWebAppUser | undefined;
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

export async function copyText(value: string) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
