import { createContext, useContext } from "react";
import type { Lang } from "./i18n-dict";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

export const I18nContext = createContext<Ctx>({ lang: "pt-BR", setLang: () => {}, t: (k) => k });

export function useI18n() {
  return useContext(I18nContext);
}
