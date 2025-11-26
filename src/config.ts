export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getHeaders() {
  const tenantId = Number(localStorage.getItem("tenantId") || 1);
  const actor = localStorage.getItem("actor") || "admin";
  return {
    "X-Tenant-ID": String(tenantId),
    "X-Actor": actor,
  };
}