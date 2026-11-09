"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { getDictionary, isRtl, type Locale } from "@/i18n/dictionaries";

type LocaleContextValue = {
  locale: Locale;
  t: ReturnType<typeof getDictionary>;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: string; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>((initialLocale === "ar" ? "ar" : "en"));
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `moriva_locale=${l}; path=/; max-age=31536000; samesite=lax`;
    // reload so the server-rendered dir/lang + layout pick it up
    window.location.reload();
  }, []);
  const value: LocaleContextValue = {
    locale,
    t: getDictionary(locale),
    dir: isRtl(locale) ? "rtl" : "ltr",
    setLocale,
  };
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
