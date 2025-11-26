import { API_URL, getHeaders } from "../config";

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message: string;
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "string") {
        message = parsed;
      } else if (parsed && typeof parsed === "object") {
        const obj = parsed as { detail?: unknown };
        if (typeof obj.detail === "string") {
          message = obj.detail;
        } else {
          message = JSON.stringify(parsed);
        }
      } else {
        message = String(parsed);
      }
    } catch {
      message = text;
    }
    const finalMsg = message || res.statusText;
    throw new Error(`HTTP ${res.status}: ${finalMsg}`);
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
  try {
    const res = await fetch(`${API_URL}/deals/metrics`, { headers: { ...getHeaders() } });
    return await handleResponse(res);
  } catch {
    return { by_stage: [], by_status: [], conversion_rate: { won: 0, lost: 0, win_rate: 0 } };
  }
}

export type TenantRow = { id: number; name: string };
export async function listTenants(): Promise<TenantRow[]> {
  try {
    const res = await fetch(`${API_URL}/tenants`, { headers: { ...getHeaders() } });
    return await handleResponse(res);
  } catch {
    const raw = localStorage.getItem("tenants:list") || "[]";
    try {
      const parsed = JSON.parse(raw) as TenantRow[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { void 0; }
    return [{ id: 1, name: "Tenant 1" }, { id: 2, name: "Tenant 2" }];
  }
}

export async function getDocumentTypes() {
  const res = await fetch(`${API_URL}/documents/document-types/`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export type DocumentTypePayload = {
  name: string;
  code?: string;
  description?: string;
  allowed_mime_types?: string[];
};

export async function createDocumentType(payload: DocumentTypePayload) {
  const res = await fetch(`${API_URL}/documents/document-types/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateDocumentType(id: number, payload: Partial<DocumentTypePayload>) {
  const res = await fetch(`${API_URL}/documents/document-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getDealUploads(dealId: number) {
  const res = await fetch(`${API_URL}/documents/deals/${dealId}/uploads/`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function uploadDocument(dealId: number, documentTypeId: number, file: File, notes?: string, contactId?: number) {
  const form = new FormData();
  form.append("document_type_id", String(documentTypeId));
  if (notes) form.append("notes", notes);
  if (typeof contactId === "number") form.append("contact_id", String(contactId));
  form.append("file", file);
  const res = await fetch(`${API_URL}/documents/deals/${dealId}/uploads/`, {
    method: "POST",
    headers: { ...getHeaders() }, // não setar Content-Type aqui; o browser define multipart boundary
    body: form,
  });
  return handleResponse(res);
}

export async function getRequiredDocumentsForDeal(dealId: number) {
  const res = await fetch(`${API_URL}/documents/deals/${dealId}/required/`, { headers: { ...getHeaders() } });
  return handleResponse(res);
}

export async function setRequiredDocumentsForDeal(dealId: number, typeIds: number[]) {
  const res = await fetch(`${API_URL}/documents/deals/${dealId}/required/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify({ type_ids: typeIds }),
  });
  return handleResponse(res);
}

export async function getOrganizationRequiredDocuments(orgId: number) {
  const res = await fetch(`${API_URL}/documents/organizations/${orgId}/required/`, { headers: { ...getHeaders() } });
  if (res.status === 404) return [];
  return handleResponse(res);
}

export async function setOrganizationRequiredDocuments(orgId: number, typeIds: number[]) {
  const res = await fetch(`${API_URL}/documents/organizations/${orgId}/required/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify({ type_ids: typeIds }),
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

export type ContactPayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  organization_id?: number;
  client_type?: string;
  lead_source?: string;
};

export async function createContact(payload: ContactPayload) {
  const res = await fetch(`${API_URL}/contacts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateContact(id: number, payload: ContactPayload) {
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

export type OrganizationPayload = { name: string; sector?: string };

export async function createOrganization(payload: OrganizationPayload) {
  const res = await fetch(`${API_URL}/organizations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateOrganization(id: number, payload: OrganizationPayload) {
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

export type DealPayload = {
  title?: string;
  stage_id?: number;
  estimated_value?: number;
  value?: number;
  status?: string;
  email_open_rate?: number;
  interactions_total?: number;
  docs_shared?: boolean;
  organization_id?: number;
  business_type_id?: number;
  contact_id?: number;
};

export async function createDeal(payload: DealPayload) {
  const res = await fetch(`${API_URL}/deals/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateDeal(id: number, payload: DealPayload) {
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

export type StagePayload = { name: string; order: number };

export async function createStage(payload: StagePayload) {
  const res = await fetch(`${API_URL}/stages/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateStage(id: number, payload: StagePayload) {
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

export type LeadScoreRead = {
  id: number;
  tenant_id: number;
  contact_id?: number | null;
  deal_id?: number | null;
  score: number;
  model_version: string;
  factors?: Record<string, unknown> | null;
  created_at: string;
};

export async function listLeadScores(params: { contact_id?: number; deal_id?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.contact_id) qs.set("contact_id", String(params.contact_id));
  if (params.deal_id) qs.set("deal_id", String(params.deal_id));
  const res = await fetch(`${API_URL}/lead-scores/?${qs.toString()}`, { headers: { ...getHeaders() } });
  return handleResponse(res) as Promise<LeadScoreRead[]>;
}

export async function computeLeadScore(params: { contact_id?: number; deal_id?: number }) {
  const qs = new URLSearchParams();
  if (params.contact_id) qs.set("contact_id", String(params.contact_id));
  if (params.deal_id) qs.set("deal_id", String(params.deal_id));
  const res = await fetch(`${API_URL}/lead-scores/compute?${qs.toString()}`, { method: "POST", headers: { ...getHeaders() } });
  return handleResponse(res) as Promise<LeadScoreRead>;
}

export async function listBusinessTypes(params: { limit?: number; offset?: number; sort_by?: string; sort_dir?: "asc" | "desc" } = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
  const res = await fetch(`${API_URL}/business-types/?${qs.toString()}`, { headers: { ...getHeaders() } });
  if (res.status === 404) return [];
  return handleResponse(res);
}

export type BusinessTypePayload = { name: string; code?: string; description?: string };

export async function createBusinessType(payload: BusinessTypePayload) {
  const res = await fetch(`${API_URL}/business-types/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateBusinessType(id: number, payload: BusinessTypePayload) {
  const res = await fetch(`${API_URL}/business-types/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteBusinessType(id: number) {
  const res = await fetch(`${API_URL}/business-types/${id}`, { method: "DELETE", headers: { ...getHeaders() } });
  if (!res.ok && res.status !== 204) return handleResponse(res);
  return true;
}

export async function listContractTemplates(params: { business_type_id?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.business_type_id) qs.set("business_type_id", String(params.business_type_id));
  const res = await fetch(`${API_URL}/contracts/templates/?${qs.toString()}`, { headers: { ...getHeaders() } });
  if (res.status === 404) return [];
  return handleResponse(res);
}

export async function uploadContractTemplate(business_type_id: number, file: File, locale?: string, category?: "contract" | "poa") {
  const form = new FormData();
  form.append("business_type_id", String(business_type_id));
  if (locale) form.append("locale", locale);
  if (category) form.append("category", category);
  form.append("file", file);
  const res = await fetch(`${API_URL}/contracts/templates/`, { method: "POST", headers: { ...getHeaders() }, body: form });
  return handleResponse(res);
}

export async function generateLegalDoc(deal_id: number, kind: "contract" | "poa") {
  const qs = new URLSearchParams();
  qs.set("deal_id", String(deal_id));
  qs.set("kind", kind);
  const res = await fetch(`${API_URL}/contracts/generate?${qs.toString()}`, { method: "POST", headers: { ...getHeaders(), Accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } });
  if (!res.ok) return handleResponse(res);
  const blob = await res.blob();
  return blob;
}

export async function generateContractDocx(deal_id: number) { return generateLegalDoc(deal_id, "contract"); }
export async function generatePowerOfAttorneyDocx(deal_id: number) { return generateLegalDoc(deal_id, "poa"); }

export async function downloadUploadFile(upload_id: number) {
  const res = await fetch(`${API_URL}/documents/uploads/${upload_id}/file`, { headers: { ...getHeaders() } });
  if (!res.ok) return handleResponse(res);
  const blob = await res.blob();
  return blob;
}

export async function logDealFormExample(exampleType: string, context?: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/deals/example-usage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify({ example_type: exampleType, context }),
  });
  return handleResponse(res);
}

export async function logContactFormExample(exampleType: string, context?: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/contacts/example-usage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify({ example_type: exampleType, context }),
  });
  return handleResponse(res);
}

export async function logOrganizationFormExample(exampleType: string, context?: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/organizations/example-usage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify({ example_type: exampleType, context }),
  });
  return handleResponse(res);
}

export async function logStageFormExample(exampleType: string, context?: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/stages/example-usage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify({ example_type: exampleType, context }),
  });
  return handleResponse(res);
}

export async function logDocumentsExample(exampleType: string, context?: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/documents/example-usage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify({ example_type: exampleType, context }),
  });
  return handleResponse(res);
}

export type LoginResponse = { token: string; access_token?: string; user: { id: number; name?: string; email: string; role?: string }; role?: string; must_change_password?: boolean };
export async function login(payload: { email: string; password: string }): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getHeaders() },
      body: JSON.stringify(payload),
    });
    return await handleResponse(res);
  } catch {
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    const authRaw = localStorage.getItem(`tenant:${tenantId}:rbac:users-auth`) || "{}";
    let role = localStorage.getItem("actor") || "Master";
    try {
      const authMap = JSON.parse(authRaw) as Record<string, { password: string; must_change_password: boolean }>;
      const usersList = await listUsers();
      const found = usersList.find(u => u.email === payload.email);
      if (found && authMap[payload.email] && authMap[payload.email].password === payload.password) {
        role = found.role;
        const mustChange = authMap[payload.email].must_change_password;
        const res: LoginResponse = { token: "dev-token", access_token: "dev-token", user: { id: found.id, name: found.name, email: found.email, role: found.role }, role: found.role };
        if (mustChange) res.must_change_password = true;
        return res;
      }
    } catch (e) { void e; }
    return { token: "dev-token", access_token: "dev-token", user: { id: 1, name: "Dev User", email: payload.email, role }, role };
  }
}

export async function getMe() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { headers: { ...getHeaders() } });
    return await handleResponse(res);
  } catch {
    const role = localStorage.getItem("actor") || "Master";
    const email = localStorage.getItem("lastLoginEmail") || "dev@example.com";
    return { id: 1, name: "Dev User", email, role };
  }
}

export type Profile = { id: number; name: string; code?: string };
export type RolePermissionMap = Record<string, string[]>;

export async function listProfiles(): Promise<Profile[]> {
  try {
    const res = await fetch(`${API_URL}/rbac/profiles`, { headers: { ...getHeaders() } });
    return await handleResponse(res);
  } catch {
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    const raw = localStorage.getItem(`tenant:${tenantId}:rbac:profiles`) || "[]";
    try { return JSON.parse(raw) as Profile[]; } catch { return [] as Profile[]; }
  }
}

export async function createProfile(payload: { name: string; code?: string }): Promise<Profile> {
  try {
    const res = await fetch(`${API_URL}/rbac/profiles`, { method: "POST", headers: { "Content-Type": "application/json", ...getHeaders() }, body: JSON.stringify(payload) });
    return await handleResponse(res);
  } catch {
    const list = await listProfiles();
    const id = Math.max(0, ...list.map((p: Profile) => p.id)) + 1;
    const created = { id, name: payload.name, code: payload.code } as Profile;
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    localStorage.setItem(`tenant:${tenantId}:rbac:profiles`, JSON.stringify([created, ...list]));
    return created;
  }
}

export async function updateProfile(id: number, payload: { name?: string; code?: string }): Promise<Profile | undefined> {
  try {
    const res = await fetch(`${API_URL}/rbac/profiles/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...getHeaders() }, body: JSON.stringify(payload) });
    return await handleResponse(res);
  } catch {
    const list = await listProfiles();
    const next = list.map((p: Profile) => p.id === id ? { ...p, ...payload } as Profile : p);
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    localStorage.setItem(`tenant:${tenantId}:rbac:profiles`, JSON.stringify(next));
    return next.find((p: Profile) => p.id === id);
  }
}

export async function deleteProfile(id: number): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${API_URL}/rbac/profiles/${id}`, { method: "DELETE", headers: { ...getHeaders() } });
    return await handleResponse(res);
  } catch {
    const list = await listProfiles();
    const next = list.filter((p: Profile) => p.id !== id);
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    localStorage.setItem(`tenant:${tenantId}:rbac:profiles`, JSON.stringify(next));
    return { ok: true };
  }
}

export async function getRolePermissions(role: string): Promise<RolePermissionMap> {
  try {
    const res = await fetch(`${API_URL}/rbac/roles/${encodeURIComponent(role)}/permissions`, { headers: { ...getHeaders() } });
    return await handleResponse(res);
  } catch {
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    const raw = localStorage.getItem(`tenant:${tenantId}:role:${role}:permissions`) || "{}";
    try { return JSON.parse(raw) as RolePermissionMap; } catch { return {} as RolePermissionMap; }
  }
}

export async function setRolePermissions(role: string, perms: RolePermissionMap): Promise<unknown> {
  try {
    const res = await fetch(`${API_URL}/rbac/roles/${encodeURIComponent(role)}/permissions`, { method: "PUT", headers: { "Content-Type": "application/json", ...getHeaders() }, body: JSON.stringify(perms) });
    return await handleResponse(res);
  } catch {
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    localStorage.setItem(`tenant:${tenantId}:role:${role}:permissions`, JSON.stringify(perms));
    return { ok: true };
  }
}

export type UserRow = { id: number; name?: string; email: string; role: string };

export async function listUsers(): Promise<UserRow[]> {
  try {
    const res = await fetch(`${API_URL}/rbac/users`, { headers: { ...getHeaders() } });
    return await handleResponse(res);
  } catch {
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    const raw = localStorage.getItem(`tenant:${tenantId}:rbac:users`) || "[]";
    try { return JSON.parse(raw) as UserRow[]; } catch { return [] as UserRow[]; }
  }
}

export async function createUser(payload: { name?: string; email: string; role: string; password?: string, must_change_password?: boolean }): Promise<UserRow & { temporary_password?: string }> {
  try {
    const res = await fetch(`${API_URL}/rbac/users`, { method: "POST", headers: { "Content-Type": "application/json", ...getHeaders() }, body: JSON.stringify(payload) });
    return await handleResponse(res);
  } catch {
    const list = await listUsers();
    const id = Math.max(0, ...list.map((u: UserRow) => u.id)) + 1;
    const created = { id, name: payload.name, email: payload.email, role: payload.role } as UserRow;
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    const tempPass = payload.password || `Consul${String(Math.random()).slice(2,8)}!`;
    const authRaw = localStorage.getItem(`tenant:${tenantId}:rbac:users-auth`) || "{}";
    const authMap = (() => { try { return JSON.parse(authRaw) as Record<string, { password: string; must_change_password: boolean }>; } catch { return {}; } })();
    authMap[created.email] = { password: tempPass, must_change_password: payload.must_change_password ?? true };
    localStorage.setItem(`tenant:${tenantId}:rbac:users-auth`, JSON.stringify(authMap));
    localStorage.setItem(`tenant:${tenantId}:rbac:users`, JSON.stringify([created, ...list]));
    return { ...created, temporary_password: tempPass };
  }
}

export async function updateUser(id: number, payload: { name?: string; email?: string; role?: string; password?: string, must_change_password?: boolean }): Promise<UserRow | undefined> {
  try {
    const res = await fetch(`${API_URL}/rbac/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...getHeaders() }, body: JSON.stringify(payload) });
    return await handleResponse(res);
  } catch {
    const list = await listUsers();
    const next = list.map((u: UserRow) => u.id === id ? { ...u, ...payload } as UserRow : u);
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    localStorage.setItem(`tenant:${tenantId}:rbac:users`, JSON.stringify(next));
    const updated = next.find((u: UserRow) => u.id === id);
    if (updated && (payload.password || typeof payload.must_change_password !== "undefined")) {
      const authRaw = localStorage.getItem(`tenant:${tenantId}:rbac:users-auth`) || "{}";
      const authMap = (() => { try { return JSON.parse(authRaw) as Record<string, { password: string; must_change_password: boolean }>; } catch { return {}; } })();
      const emailKey = updated.email;
      const cur = authMap[emailKey] || { password: "", must_change_password: true };
      authMap[emailKey] = { password: payload.password || cur.password, must_change_password: typeof payload.must_change_password !== "undefined" ? !!payload.must_change_password : cur.must_change_password };
      localStorage.setItem(`tenant:${tenantId}:rbac:users-auth`, JSON.stringify(authMap));
    }
    return updated;
  }
}

export async function deleteUser(id: number): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${API_URL}/rbac/users/${id}`, { method: "DELETE", headers: { ...getHeaders() } });
    return await handleResponse(res);
  } catch {
    const list = await listUsers();
    const next = list.filter((u: UserRow) => u.id !== id);
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    localStorage.setItem(`tenant:${tenantId}:rbac:users`, JSON.stringify(next));
    return { ok: true };
  }
}

export async function syncRBACFromLocalToServer(): Promise<{ profiles: number; roles: number; users: number }> {
  const tenantId = Number(localStorage.getItem("tenantId") || 1);
  let profilesCount = 0;
  let rolesCount = 0;
  let usersCount = 0;
  try {
    const profilesRaw = localStorage.getItem(`tenant:${tenantId}:rbac:profiles`) || "[]";
    const profiles: Profile[] = (() => { try { return JSON.parse(profilesRaw) as Profile[]; } catch { return []; } })();
    for (const p of profiles) {
      await createProfile({ name: p.name, code: p.code });
      profilesCount++;
    }
  } catch (e) { void e; }
  try {
    const baseRoles = ["Master", "Projetista", "Financeiro", "Comercial", "Guest"];
    const profilesRaw = localStorage.getItem(`tenant:${tenantId}:rbac:profiles`) || "[]";
    const profiles: Profile[] = (() => { try { return JSON.parse(profilesRaw) as Profile[]; } catch { return []; } })();
    const roles = Array.from(new Set([...baseRoles, ...profiles.map(p => p.name)]));
    for (const r of roles) {
      const permsRaw = localStorage.getItem(`tenant:${tenantId}:role:${r}:permissions`) || "{}";
      const perms: RolePermissionMap = (() => { try { return JSON.parse(permsRaw) as RolePermissionMap; } catch { return {}; } })();
      if (Object.keys(perms).length > 0) {
        await setRolePermissions(r, perms);
        rolesCount++;
      }
    }
  } catch (e) { void e; }
  try {
    const usersRaw = localStorage.getItem(`tenant:${tenantId}:rbac:users`) || "[]";
    const authRaw = localStorage.getItem(`tenant:${tenantId}:rbac:users-auth`) || "{}";
    const users: UserRow[] = (() => { try { return JSON.parse(usersRaw) as UserRow[]; } catch { return []; } })();
    const authMap: Record<string, { password: string; must_change_password: boolean }> = (() => { try { return JSON.parse(authRaw) as Record<string, { password: string; must_change_password: boolean }>; } catch { return {}; } })();
    const existing = await listUsers().catch(() => [] as UserRow[]);
    for (const u of users) {
      const auth = authMap[u.email];
      const found = existing.find(e => e.email === u.email);
      if (found) {
        await updateUser(found.id, { name: u.name, role: u.role, password: auth?.password, must_change_password: auth ? auth.must_change_password : undefined });
      } else {
        await createUser({ name: u.name, email: u.email, role: u.role, password: auth?.password, must_change_password: auth ? auth.must_change_password : true });
      }
      usersCount++;
    }
  } catch (e) { void e; }
  return { profiles: profilesCount, roles: rolesCount, users: usersCount };
}
