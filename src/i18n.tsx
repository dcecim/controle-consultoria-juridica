import React, { useEffect, useMemo, useState } from "react";
import { dict } from "./i18n-dict";
import type { Lang } from "./i18n-dict";
import { I18nContext } from "./useI18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>((localStorage.getItem("lang") as Lang) || "pt-BR");
  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);
  const setLang = (l: Lang) => setLangState(l);
  const t = useMemo(() => (key: string) => {
    const d = dict[lang];
    return d[key] ?? key;
  }, [lang]);
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export {};
