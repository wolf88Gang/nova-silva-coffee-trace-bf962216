import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationName?: string;
  organizationId?: string;
  productorId?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role: UserRole, organizationName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  loginAsDemo: (role: UserRole) => void;
}

const DEMO_USERS: Partial<Record<UserRole, { email: string; name: string; organizationName: string }>> = {
  cooperativa: { email: 'demo.cooperativa@novasilva.com', name: 'María García', organizationName: 'Cooperativa Café de la Selva' },
  exportador: { email: 'demo.exportador@novasilva.com', name: 'Carlos Mendoza', organizationName: 'Exportadora Sol de América' },
  certificadora: { email: 'demo.certificadora@novasilva.com', name: 'Ana Certificadora', organizationName: 'CertifiCafé Internacional' },
  productor: { email: 'demo.productor@novasilva.com', name: 'Juan Pérez', organizationName: 'Finca El Mirador' },
  tecnico: { email: 'demo.tecnico@novasilva.com', name: 'Pedro Técnico', organizationName: 'Cooperativa Café de la Selva' },
  admin: { email: 'demo.admin@novasilva.com', name: 'Admin Nova Silva', organizationName: 'Nova Silva Platform' },
};

export { DEMO_USERS };
export type { User as AppUser, UserRole as AppRole };

async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('name, organization_name, organization_id, productor_id').eq('user_id', userId).maybeSingle();
  if (error) { console.error('Error fetching profile:', error); return null; }
  return data ? { name: data.name, organizationName: data.organization_name, organizationId: data.organization_id, productorId: data.productor_id } : null;
}

async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
  if (error) { console.error('Error fetching role:', error); return null; }
  return data?.role as UserRole || null;
}

async function buildUserFromSession(session: Session): Promise<User | null> {
  const supabaseUser = session.user;
  const [profile, role] = await Promise.all([getUserProfile(supabaseUser.id), getUserRole(supabaseUser.id)]);

  if (!role) {
    const metadataRole = supabaseUser.user_metadata?.role as UserRole;
    if (!metadataRole) { console.error('No role found for user'); return null; }
    return {
      id: supabaseUser.id, email: supabaseUser.email || '',
      name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
      role: metadataRole,
      organizationName: profile?.organizationName || supabaseUser.user_metadata?.organization_name || undefined,
      organizationId: profile?.organizationId || undefined,
      productorId: profile?.productorId || undefined,
    };
  }

  return {
    id: supabaseUser.id, email: supabaseUser.email || '',
    name: profile?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
    role, organizationName: profile?.organizationName || undefined,
    organizationId: profile?.organizationId || undefined,
    productorId: profile?.productorId || undefined,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      setSession(sess);
      if (sess) { const u = await buildUserFromSession(sess); setUser(u); }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess ?? null);
      if (event === 'SIGNED_IN' && sess) {
        setTimeout(async () => {
          const u = await buildUserFromSession(sess);
          setUser(u); setIsLoading(false);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, role: UserRole, organizationName?: string) => {
    setIsLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, role, organization_name: organizationName || null }, emailRedirectTo: `${window.location.origin}/` }
      });
      if (signUpError) { setIsLoading(false); return { success: false, error: signUpError.message }; }
      if (!authData.user) { setIsLoading(false); return { success: false, error: 'No se pudo crear el usuario' }; }
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false); return { success: false, error: 'Error al crear cuenta' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setIsLoading(false); return { success: false, error: error.message }; }
    return { success: true };
  }, []);

  const logout = useCallback(async () => { await supabase.auth.signOut(); setUser(null); setSession(null); }, []);
  const hasRole = useCallback((role: UserRole): boolean => user?.role === role, [user]);

  const loginAsDemo = useCallback((role: UserRole) => {
    const demo = DEMO_USERS[role];
    if (!demo) return;
    setUser({
      id: `demo-${role}`,
      email: demo.email,
      name: demo.name,
      role,
      organizationName: demo.organizationName,
    });
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isAuthenticated: !!user, login, signUp, logout, isLoading, hasRole, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
