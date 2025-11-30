import { createContext } from "react";

type User = { id: number; name?: string; email?: string; role?: string };
export type AuthContextValue = {
  user: User | null;
  role: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<import("./lib/api").LoginResponse>;
  completeMfa: (payload: { mfa_token: string; code: string }) => Promise<import("./lib/api").LoginResponse>;
  logout: () => void;
  canAccess: (feature: string, action?: string) => boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
