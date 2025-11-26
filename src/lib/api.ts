import { API_URL, getHeaders } from "../config";

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail;
    try { detail = JSON.parse(text); } catch { detail = text; }
    throw new Error(`HTTP ${res.status}: ${detail || res.statusText}`);
  }
  return res.json().catch(() => ({}));
}

export async function getDeals(params: { limit?: number; offset?: number; sort_by?: string; sort_dir?: "asc" | "desc"; } = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
  const res = await fetch(`${API_URL}/deals/?${qs.toString()}`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function getDealsMetrics() {
  const res = await fetch(`${API_URL}/deals/metrics`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function getDocumentTypes() {
  const res = await fetch(`${API_URL}/documents/document-types/`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function getDealUploads(dealId: number) {
  const res = await fetch(`${API_URL}/documents/deals/${dealId}/uploads/`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function uploadDocument(dealId: number, documentTypeId: number, file: File, notes?: string) {
  const form = new FormData();
  form.append("document_type_id", String(documentTypeId));
  if (notes) form.append("notes", notes);
  form.append("file", file);
  const res = await fetch(`${API_URL}/documents/deals/${dealId}/uploads/`, {
    method: "POST",
    headers: { ...getHeaders() }, // não setar Content-Type aqui; o browser define multipart boundary
    body: form,
  });
  return handleResponse(res);
}

export async function listContacts(params: { limit?: number; offset?: number; sort_by?: string; sort_dir?: "asc" | "desc"; organization_id?: number; client_type?: string; lead_source?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
  if (params.organization_id) qs.set("organization_id", String(params.organization_id));
  if (params.client_type) qs.set("client_type", params.client_type);
  if (params.lead_source) qs.set("lead_source", params.lead_source);
  const res = await fetch(`${API_URL}/contacts/?${qs.toString()}`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function getContact(id: number) {
  const res = await fetch(`${API_URL}/contacts/${id}`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function createContact(payload: any) {
  const res = await fetch(`${API_URL}/contacts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateContact(id: number, payload: any) {
  const res = await fetch(`${API_URL}/contacts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteContact(id: number) {
  const res = await fetch(`${API_URL}/contacts/${id}`, { method: "DELETE", headers: { ...getHeaders() } });
  if (!res.ok && res.status !== 204) return handleResponse(res);
  return true;
}

export async function listOrganizations(params: { limit?: number; offset?: number; sort_by?: string; sort_dir?: "asc" | "desc" } = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
  const res = await fetch(`${API_URL}/organizations/?${qs.toString()}`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function createOrganization(payload: any) {
  const res = await fetch(`${API_URL}/organizations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateOrganization(id: number, payload: any) {
  const res = await fetch(`${API_URL}/organizations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteOrganization(id: number) {
  const res = await fetch(`${API_URL}/organizations/${id}`, { method: "DELETE", headers: { ...getHeaders() } });
  if (!res.ok && res.status !== 204) return handleResponse(res);
  return true;
}

export async function createDeal(payload: any) {
  const res = await fetch(`${API_URL}/deals/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateDeal(id: number, payload: any) {
  const res = await fetch(`${API_URL}/deals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteDeal(id: number) {
  const res = await fetch(`${API_URL}/deals/${id}`, { method: "DELETE", headers: { ...getHeaders() } });
  if (!res.ok && res.status !== 204) return handleResponse(res);
  return true;
}

export async function listStages() {
  const res = await fetch(`${API_URL}/stages/`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function createStage(payload: any) {
  const res = await fetch(`${API_URL}/stages/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateStage(id: number, payload: any) {
  const res = await fetch(`${API_URL}/stages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteStage(id: number) {
  const res = await fetch(`${API_URL}/stages/${id}`, { method: "DELETE", headers: { ...getHeaders() } });
  if (!res.ok && res.status !== 204) return handleResponse(res);
  return true;
}

export async function seedStages() {
  const res = await fetch(`${API_URL}/stages/seed`, { method: "POST", headers: { ...getHeaders() } });
  return handleResponse(res);
}
