import { useEffect, useMemo, useState } from "react";
import { login as apiLogin, verifyMfa, getMe, getRolePermissions } from "./lib/api";
import { AuthContext } from "./auth-context";
import type { AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>((typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("token") || null) : null));

  useEffect(() => {
    if (token) {
      getMe().then((me) => {
        const r = (me?.role || role || "Guest") as string;
        setUser(me || null);
        setRole(r);
        localStorage.setItem("actor", r);
        const tenantId = Number(localStorage.getItem("tenantId") || 1);
        getRolePermissions(r).then((perms) => {
          try { localStorage.setItem(`tenant:${tenantId}:role:${r}:permissions`, JSON.stringify(perms)); } catch { void 0; }
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [token, role]);

  const login = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    applyAuth(res);
    return res;
  };

  const applyAuth = (res: Awaited<ReturnType<typeof apiLogin>>) => {
    const t = res?.token || res?.access_token || "";
    const u: NonNullable<AuthContextValue["user"]> = { id: res?.user?.id ?? 0, name: res?.user?.name, email: res?.user?.email, role: res?.user?.role || res?.role };
    const r = u.role || "Master";
    setToken(t);
    try { sessionStorage.setItem("token", t); } catch { void 0; }
    setUser(u);
    setRole(r);
    localStorage.setItem("actor", r);
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    getRolePermissions(r).then((perms) => {
      try { localStorage.setItem(`tenant:${tenantId}:role:${r}:permissions`, JSON.stringify(perms)); } catch { void 0; }
    }).catch(() => {});
  };

  const completeMfa = async (payload: { mfa_token: string; code: string }) => {
    const res = await verifyMfa(payload);
    applyAuth(res);
    return res;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    try { sessionStorage.removeItem("token"); } catch { void 0; }
    localStorage.removeItem("token");
    localStorage.removeItem("actor");
  };

  const defaultPerms: Record<string, string[]> = useMemo(() => ({
    dashboard: ["view"],
    deals: ["view"],
    upload: [],
    contacts: [],
    organizations: [],
    stages: [],
    business_types: [],
    profiles_admin: [],
  }), []);

  const canAccess = (feature: string, action: string = "view") => {
    const r = role || "Guest";
    if (r === "Master" || r === "Projetista") return true;
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    const cfgRaw = localStorage.getItem(`tenant:${tenantId}:role:${r}:permissions`);
    if (cfgRaw) {
      try {
        const cfg = JSON.parse(cfgRaw) as Record<string, string[]>;
        return (cfg[feature] || []).includes(action);
      } catch { return false; }
    }
    const base = defaultPerms[feature] || [];
    return base.includes(action);
  };

  const value: AuthContextValue = { user, role, token, login, completeMfa, logout, canAccess };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
