import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSetupState } from "@/hooks/useOnboardingPersistence";
import { UserRole } from "@/types";

/**
 * Unified redirect: all roles go to /dashboard (contextual).
 * Legacy role-specific dashboards are handled via the unified layout.
 */
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  cooperativa: "/produccion",
  exportador: "/produccion",
  productor: "/produccion",
  tecnico: "/produccion",
  certificadora: "/cumplimiento",
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

    if (!user.organizationId && !isDemo) {
      navigate("/onboarding/organization");
      return;
    }

    if (user.organizationId && !isDemo) {
      if (setupState === null || setupState?.is_completed === false) {
        navigate("/onboarding/organization");
        return;
      }
    }

    navigate(ROLE_DASHBOARDS[user.role] ?? "/produccion");
  }, [isLoading, setupLoading, isAuthenticated, user, setupState, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirigiendo...</p>
    </div>
  );
};

export default RoleBasedRedirect;
