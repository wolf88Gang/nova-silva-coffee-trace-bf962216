import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────
export type AppRole = "cooperativa" | "exportador" | "productor" | "tecnico" | "certificadora" | "admin";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  organizationName: string;
  organizationId?: string;
  productorId?: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  loginAsDemo: (role: AppRole) => void;
}

// ── Demo users (testing only) ──────────────────────────
const DEMO_USERS: Record<AppRole, AppUser> = {
  cooperativa: {
    id: "demo-cooperativa",
    email: "demo.cooperativa@novasilva.com",
    name: "María García",
    role: "cooperativa",
    organizationName: "Cooperativa Café de la Selva",
  },
  exportador: {
    id: "demo-exportador",
    email: "demo.exportador@novasilva.com",
    name: "Carlos Mendoza",
    role: "exportador",
    organizationName: "Exportadora Sol de América",
  },
  productor: {
    id: "demo-productor",
    email: "demo.productor@novasilva.com",
    name: "Juan Pérez",
    role: "productor",
    organizationName: "Finca El Mirador",
  },
  tecnico: {
    id: "demo-tecnico",
    email: "demo.tecnico@novasilva.com",
    name: "Pedro Técnico",
    role: "tecnico",
    organizationName: "Cooperativa Café de la Selva",
  },
  certificadora: {
    id: "demo-certificadora",
    email: "demo.certificadora@novasilva.com",
    name: "Ana Certificadora",
    role: "certificadora",
    organizationName: "CertifiCafé Internacional",
  },
  admin: {
    id: "demo-admin",
    email: "demo.admin@novasilva.com",
    name: "Admin Nova Silva",
    role: "admin",
    organizationName: "Nova Silva Platform",
  },
};

// ── Context ────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Build AppUser from Supabase session
  const buildAppUser = useCallback(async (sess: Session): Promise<AppUser | null> => {
    const uid = sess.user.id;
    const email = sess.user.email ?? "";

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, organization_name, organization_id, productor_id")
      .eq("user_id", uid)
      .single();

    // Fetch role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .single();

    if (!roleRow) return null;

    return {
      id: uid,
      email,
      name: profile?.name ?? email,
      role: roleRow.role as AppRole,
      organizationName: profile?.organization_name ?? "",
      organizationId: profile?.organization_id ?? undefined,
      productorId: profile?.productor_id ?? undefined,
    };
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, sess) => {
        setSession(sess);
        if (sess) {
          const appUser = await buildAppUser(sess);
          setUser(appUser);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Initial session
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      setSession(sess);
      if (sess) {
        const appUser = await buildAppUser(sess);
        setUser(appUser);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [buildAppUser]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const hasRole = (role: AppRole) => user?.role === role;

  const loginAsDemo = (role: AppRole) => {
    setUser(DEMO_USERS[role]);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        signUp,
        logout,
        hasRole,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
