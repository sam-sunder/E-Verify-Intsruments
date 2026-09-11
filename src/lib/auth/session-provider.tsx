"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, type UserProfile } from "@/lib/api-client";

type SessionContextValue = { user: UserProfile | null; loading: boolean; error: string | null; refresh: () => Promise<void>; logout: () => Promise<void> };
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => { setLoading(true); setError(null); try { const result = await api.session(); setUser(result.user); } catch (cause) { setUser(null); setError(cause instanceof Error ? cause.message : "Session could not be loaded"); } finally { setLoading(false); } };
  const logout = async () => { await api.logout(); setUser(null); };
  useEffect(() => {
    let active = true;
    void api.session().then((result) => { if (active) setUser(result.user); }).catch((cause) => { if (active) { setUser(null); setError(cause instanceof Error ? cause.message : "Session could not be loaded"); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <SessionContext.Provider value={{ user, loading, error, refresh, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() { const context = useContext(SessionContext); if (!context) throw new Error("useSession must be used inside SessionProvider"); return context; }