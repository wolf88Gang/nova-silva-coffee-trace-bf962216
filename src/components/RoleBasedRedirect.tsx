import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSetupState } from "@/hooks/useOnboardingPersistence";
import { UserRole } from "@/types";

const ROLE_REDIRECTS: Record<UserRole, string> = {
  cooperativa: "/cooperativa/dashboard",
  exportador: "/exportador/dashboard",
  productor: "/productor/dashboard",
  tecnico: "/tecnico/dashboard",
  certificadora: "/certificadora/dashboard",
  admin: "/admin",
};

const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const orgId = user?.organizationId ?? null;
  const { data: setupState, isLoading: setupLoading } = useSetupState(orgId);

  React.useEffect(() => {
    if (isLoading || setupLoading) return;
    if (!isAuthenticated || !user) {
      navigate("/demo");
      return;
    }

    const isDemo = user.id.startsWith('demo-');

    // No org and not demo -> onboarding
    if (!user.organizationId && !isDemo) {
      navigate("/onboarding/organization");
      return;
    }

    // Org exists but setup not completed -> force wizard (non-demo only)
    if (user.organizationId && !isDemo) {
      if (setupState === null || setupState?.is_completed === false) {
        navigate("/onboarding/organization");
        return;
      }
    }

    navigate(ROLE_REDIRECTS[user.role] ?? "/login");
  }, [isLoading, setupLoading, isAuthenticated, user, setupState, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirigiendo...</p>
    </div>
  );
};

export default RoleBasedRedirect;
