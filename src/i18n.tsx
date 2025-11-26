import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "en" | "pt-BR" | "es";

const dict: Record<Lang, Record<string, string>> = {
  "en": {
    pipeline_metrics: "Pipeline Metrics",
    dashboard: "Dashboard",
    deals: "Deals",
    upload: "Upload",
    contacts: "Contacts",
    organizations: "Organizations",
    stages: "Stages",
    new: "New",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    seed: "Seed",
    id: "ID",
    name: "Name",
    sector: "Sector",
    order: "Order",
    actions: "Actions",
    title: "Title",
    status: "Status",
    stage: "Stage",
    estimated_value: "Estimated value",
    opened_at: "Opened at",
    organization: "Organization",
    client_type: "Client type",
    lead_source: "Lead source",
    conversion_rate: "Conversion rate (Won vs Lost)",
    won: "Won",
    lost: "Lost",
    language: "Language",
  },
  "pt-BR": {
    pipeline_metrics: "Métricas de Pipeline",
    dashboard: "Painel",
    deals: "Negócios",
    upload: "Envio",
    contacts: "Contatos",
    organizations: "Organizações",
    stages: "Fases",
    new: "Novo",
    edit: "Editar",
    delete: "Excluir",
    save: "Salvar",
    cancel: "Cancelar",
    seed: "Popular",
    id: "ID",
    name: "Nome",
    sector: "Setor",
    order: "Ordem",
    actions: "Ações",
    title: "Título",
    status: "Status",
    stage: "Fase",
    estimated_value: "Valor estimado",
    opened_at: "Aberto em",
    organization: "Organização",
    client_type: "Tipo de cliente",
    lead_source: "Fonte do lead",
    conversion_rate: "Taxa de conversão (Ganho vs Perdido)",
    won: "Ganho",
    lost: "Perdido",
    language: "Idioma",
  },
  "es": {
    pipeline_metrics: "Métricas de canal",
    dashboard: "Tablero",
    deals: "Negocios",
    upload: "Subir",
    contacts: "Contactos",
    organizations: "Organizaciones",
    stages: "Etapas",
    new: "Nuevo",
    edit: "Editar",
    delete: "Eliminar",
    save: "Guardar",
    cancel: "Cancelar",
    seed: "Predefinidos",
    id: "ID",
    name: "Nombre",
    sector: "Sector",
    order: "Orden",
    actions: "Acciones",
    title: "Título",
    status: "Estado",
    stage: "Etapa",
    estimated_value: "Valor estimado",
    opened_at: "Abierto en",
    organization: "Organización",
    client_type: "Tipo de cliente",
    lead_source: "Fuente del lead",
    conversion_rate: "Tasa de conversión (Ganado vs Perdido)",
    won: "Ganado",
    lost: "Perdido",
    language: "Idioma",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const I18nContext = createContext<Ctx>({ lang: "pt-BR", setLang: () => {}, t: (k) => k });

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

export function useI18n() {
  return useContext(I18nContext);
}
