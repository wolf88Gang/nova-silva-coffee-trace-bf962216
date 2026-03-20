import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    navigate(ROLE_REDIRECTS[user.role] ?? "/login");
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirigiendo…</p>
    </div>
  );
};

export default RoleBasedRedirect;
