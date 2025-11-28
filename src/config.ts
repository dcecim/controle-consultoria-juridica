export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const LOGIN_PATH = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_LOGIN_PATH as string || "/auth/login";
export const ME_PATH = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_ME_PATH as string || "/auth/me";
export const LOGIN_FIELD = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_LOGIN_FIELD as string || "email";
const TENANT_ID = Number((import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_TENANT_ID ?? (typeof localStorage !== "undefined" ? (localStorage.getItem("tenantId") || 1) : 1));

export function getHeaders() {
  const actor = localStorage.getItem("actor") || "admin";
  const token = localStorage.getItem("token") || "";
  return {
    "X-Actor": actor,
    "X-Tenant-ID": String(TENANT_ID),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
