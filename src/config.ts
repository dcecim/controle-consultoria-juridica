export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getHeaders() {
  const tenantId = Number(localStorage.getItem("tenantId") || 1);
  const actor = localStorage.getItem("actor") || "admin";
  return {
    "X-Tenant-ID": String(tenantId),
    "X-Actor": actor,
  };
}

export function getLocale(): string {
  const lang = localStorage.getItem("lang") || "pt-BR";
  if (lang === "en") return "en-US";
  if (lang === "es") return "es-ES";
  return "pt-BR";
}

export function getCurrency(): string {
  return localStorage.getItem("currency") || "BRL";
}
