export const locales = ["mm", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "mm";
}

export function localeLabel(locale: Locale) {
  return locale === "mm" ? "မြန်မာ" : "EN";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "mm" ? "en" : "mm";
}

export type Localized = { mm: string; en: string };
export function t(locale: Locale, value: Localized) { return value[locale] || value.mm; }
