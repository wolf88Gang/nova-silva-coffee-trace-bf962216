import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-64 p-4 md:p-6 lg:p-8 pt-14 lg:pt-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
