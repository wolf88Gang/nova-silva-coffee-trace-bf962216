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

    // No org → onboarding
    if (!user.organizationId && !user.id.startsWith('demo-')) {
      navigate("/onboarding/organization");
      return;
    }

    // Org exists but setup not completed → force wizard
    if (user.organizationId && !user.id.startsWith('demo-') && setupState && !setupState.is_completed) {
      navigate("/onboarding/organization");
      return;
    }

    // Setup state doesn't exist yet (null) for non-demo → also onboarding
    if (user.organizationId && !user.id.startsWith('demo-') && setupState === null) {
      navigate("/onboarding/organization");
      return;
    }

    navigate(ROLE_REDIRECTS[user.role] ?? "/login");
  }, [isLoading, setupLoading, isAuthenticated, user, setupState, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirigiendo…</p>
    </div>
  );
};

export default RoleBasedRedirect;
