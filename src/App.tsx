import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequireAdmin } from "@/components/auth/RequireAdmin";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DemoLogin from "./pages/DemoLogin";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

// Public pages
import HomePage from "./pages/public/HomePage";
import NosotrosPage from "./pages/public/NosotrosPage";
import SolucionesPage from "./pages/public/SolucionesPage";
import CumplimientoPage from "./pages/public/CumplimientoPage";
import PlanClimaPage from "./pages/public/PlanClimaPage";
import ImpactoPage from "./pages/public/ImpactoPage";
import ContactoPage from "./pages/public/ContactoPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-muted-foreground">Cargando…</p>
  </div>
);

const RP = ({ role, title }: { role?: any; title?: string }) => (
  <DashboardLayout requiredRole={role}>
    <PlaceholderPage title={title} />
  </DashboardLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public website */}
              <Route path="/" element={<HomePage />} />
              <Route path="/nosotros" element={<NosotrosPage />} />
              <Route path="/soluciones" element={<SolucionesPage />} />
              <Route path="/cumplimiento-y-certificaciones" element={<CumplimientoPage />} />
              <Route path="/plan-clima" element={<PlanClimaPage />} />
              <Route path="/impacto" element={<ImpactoPage />} />
              <Route path="/contacto" element={<ContactoPage />} />

              {/* Redirects from old routes */}
              <Route path="/plataforma" element={<Navigate to="/soluciones" replace />} />
              <Route path="/planes" element={<Navigate to="/soluciones#planes-resumen" replace />} />
              <Route path="/eudr" element={<Navigate to="/cumplimiento-y-certificaciones#eudr" replace />} />
              <Route path="/clima" element={<Navigate to="/plan-clima" replace />} />
              <Route path="/acerca" element={<Navigate to="/nosotros" replace />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/demo" element={<DemoLogin />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/app" element={<RoleBasedRedirect />} />
              <Route path="/directorio/cooperativas" element={<PlaceholderPage title="Directorio de Cooperativas" />} />

              {/* Shared auth pages */}
              <Route path="/mi-perfil" element={<DashboardLayout><PlaceholderPage title="Mi Perfil" /></DashboardLayout>} />
              <Route path="/mi-plan" element={<DashboardLayout><PlaceholderPage title="Mi Plan" /></DashboardLayout>} />

              {/* Cooperativa */}
              <Route path="/cooperativa/dashboard" element={<RP role="cooperativa" title="Panel Principal — Cooperativa" />} />
              <Route path="/cooperativa/productores-hub" element={<RP role="cooperativa" title="Productoras/es" />} />
              <Route path="/cooperativa/productores-hub/nuevo" element={<RP role="cooperativa" title="Nuevo Productor" />} />
              <Route path="/cooperativa/productores-hub/:id" element={<RP role="cooperativa" title="Detalle Productor" />} />
              <Route path="/cooperativa/acopio" element={<RP role="cooperativa" title="Acopio y Comercial" />} />
              <Route path="/cooperativa/operaciones" element={<RP role="cooperativa" title="Operaciones" />} />
              <Route path="/cooperativa/finanzas-hub" element={<RP role="cooperativa" title="Finanzas" />} />
              <Route path="/cooperativa/comunicacion" element={<RP role="cooperativa" title="Comunicación" />} />
              <Route path="/cooperativa/calidad" element={<RP role="cooperativa" title="Nova Cup" />} />
              <Route path="/cooperativa/vital" element={<RP role="cooperativa" title="Protocolo VITAL" />} />
              <Route path="/cooperativa/inclusion" element={<RP role="cooperativa" title="Inclusión y Equidad" />} />
              <Route path="/cooperativa/usuarios" element={<RP role="cooperativa" title="Usuarios y Permisos" />} />

              {/* Exportador */}
              <Route path="/exportador/dashboard" element={<RP role="exportador" title="Panel Principal — Exportador" />} />
              <Route path="/exportador/cafe" element={<RP role="exportador" title="Gestión de Café" />} />
              <Route path="/exportador/socios" element={<RP role="exportador" title="Red de Proveedores" />} />
              <Route path="/exportador/comercial" element={<RP role="exportador" title="Gestión Comercial" />} />
              <Route path="/exportador/calidad" element={<RP role="exportador" title="Nova Cup" />} />
              <Route path="/exportador/admin" element={<RP role="exportador" title="Administración" />} />
              <Route path="/exportador/mensajes" element={<RP role="exportador" title="Mensajes" />} />

              {/* Productor */}
              <Route path="/productor/dashboard" element={<RP role="productor" title="Panel Principal — Productor" />} />
              <Route path="/productor/produccion" element={<RP role="productor" title="Producción" />} />
              <Route path="/productor/sanidad" element={<RP role="productor" title="Sanidad Vegetal" />} />
              <Route path="/productor/finanzas-hub" element={<RP role="productor" title="Finanzas" />} />
              <Route path="/productor/sostenibilidad" element={<RP role="productor" title="Sostenibilidad" />} />
              <Route path="/productor/comunidad" element={<RP role="productor" title="Comunidad" />} />

              {/* Técnico */}
              <Route path="/tecnico/dashboard" element={<RP role="tecnico" title="Panel Principal — Técnico" />} />
              <Route path="/tecnico/visitas" element={<RP role="tecnico" title="Plan de Visitas" />} />
              <Route path="/tecnico/diagnosticos" element={<RP role="tecnico" title="Diagnósticos" />} />
              <Route path="/tecnico/productores" element={<RP role="tecnico" title="Áreas Productivas" />} />
              <Route path="/tecnico/vital" element={<RP role="tecnico" title="Protocolo VITAL" />} />

              {/* Certificadora */}
              <Route path="/certificadora/dashboard" element={<RP role="certificadora" title="Panel de Auditoría" />} />

              {/* Admin */}
              <Route path="/admin" element={<RequireAdmin><DashboardLayout requiredRole="admin"><PlaceholderPage title="Panel de Administración" /></DashboardLayout></RequireAdmin>} />
              <Route path="/admin/directorio" element={<RequireAdmin><DashboardLayout requiredRole="admin"><PlaceholderPage title="Directorio de Clientes" /></DashboardLayout></RequireAdmin>} />
              <Route path="/admin/platform" element={<RequireAdmin><DashboardLayout requiredRole="admin"><PlaceholderPage title="Platform Admin" /></DashboardLayout></RequireAdmin>} />
              <Route path="/admin/architect" element={<RequireAdmin><DashboardLayout requiredRole="admin"><PlaceholderPage title="Architect View" /></DashboardLayout></RequireAdmin>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;