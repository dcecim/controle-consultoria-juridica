import { useEffect, useMemo, useState } from "react";
import { login as apiLogin, getMe, getRolePermissions } from "./lib/api";
import { AuthContext } from "./auth-context";
import type { AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [role, setRole] = useState<string | null>(localStorage.getItem("actor") || null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) {
      getMe().then((me) => {
        const r = (me?.role || role || "Master") as string;
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
    const t = res?.token || res?.access_token || "";
    const u: NonNullable<AuthContextValue["user"]> = { id: res?.user?.id ?? 0, name: res?.user?.name, email: res?.user?.email, role: res?.user?.role || res?.role };
    const r = u.role || "Master";
    setToken(t);
    localStorage.setItem("token", t);
    try { localStorage.setItem("lastLoginEmail", email); } catch { void 0; }
    setUser(u);
    setRole(r);
    localStorage.setItem("actor", r);
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    getRolePermissions(r).then((perms) => {
      try { localStorage.setItem(`tenant:${tenantId}:role:${r}:permissions`, JSON.stringify(perms)); } catch { void 0; }
    }).catch(() => {});
    return res;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
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

  const value: AuthContextValue = { user, role, token, login, logout, canAccess };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
