import { useEffect, useMemo, useState } from "react";
import { login as apiLogin, getMe } from "./lib/api";
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
    setUser(u);
    setRole(r);
    localStorage.setItem("actor", r);
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
    deals: ["view", "edit", "delete"],
    upload: ["view", "edit"],
    contacts: ["view", "edit", "delete"],
    organizations: ["view", "edit", "delete"],
    stages: ["view", "edit", "delete"],
    business_types: ["view", "edit", "delete"],
    profiles_admin: ["view", "edit"],
  }), []);

  const canAccess = (feature: string, action: string = "view") => {
    const r = role || "Guest";
    if (r === "Master" || r === "Projetista") return true;
    const cfgRaw = localStorage.getItem(`role:${r}:permissions`);
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
