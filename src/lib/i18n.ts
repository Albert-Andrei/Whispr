import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { setConfig } from "./db";

import enCommon from "../locales/en/common.json";
import enApp from "../locales/en/app.json";
import enBackend from "../locales/en/backend.json";
import ruCommon from "../locales/ru/common.json";
import ruApp from "../locales/ru/app.json";
import ruBackend from "../locales/ru/backend.json";
import roCommon from "../locales/ro/common.json";
import roApp from "../locales/ro/app.json";
import roBackend from "../locales/ro/backend.json";
import esCommon from "../locales/es/common.json";
import esApp from "../locales/es/app.json";
import esBackend from "../locales/es/backend.json";
import frCommon from "../locales/fr/common.json";
import frApp from "../locales/fr/app.json";
import frBackend from "../locales/fr/backend.json";

export const LOCALE_STORAGE_KEY = "whispr.locale";

export const SUPPORTED_LOCALES = ["en", "ru", "ro", "es", "fr"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

const resources = {
  en: { common: enCommon, app: enApp, backend: enBackend },
  ru: { common: ruCommon, app: ruApp, backend: ruBackend },
  ro: { common: roCommon, app: roApp, backend: roBackend },
  es: { common: esCommon, app: esApp, backend: esBackend },
  fr: { common: frCommon, app: frApp, backend: frBackend },
} as const;

function detectLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as AppLocale)) {
      return stored as AppLocale;
    }
  } catch {
    /* ignore */
  }
  const prefix = navigator.language.split("-")[0];
  if (SUPPORTED_LOCALES.includes(prefix as AppLocale)) {
    return prefix as AppLocale;
  }
  return "en";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: "en",
  supportedLngs: [...SUPPORTED_LOCALES],
  defaultNS: "app",
  ns: ["common", "app", "backend"],
  interpolation: { escapeValue: false },
});

export default i18n;

export async function setAppLocale(lng: AppLocale): Promise<void> {
  await i18n.changeLanguage(lng);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  void setConfig("locale", lng).catch(() => {
    /* browser-only dev or DB unavailable */
  });
}

export function getAppLocale(): AppLocale {
  const lng = i18n.language.split("-")[0];
  if (SUPPORTED_LOCALES.includes(lng as AppLocale)) return lng as AppLocale;
  return "en";
}
