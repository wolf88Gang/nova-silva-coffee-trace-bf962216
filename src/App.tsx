import { Suspense } from "react";
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

// Cooperativa pages
import DashboardCooperativa from "./pages/cooperativa/DashboardCooperativa";
import ProductoresHub from "./pages/cooperativa/ProductoresHub";
import AcopioHub from "./pages/cooperativa/AcopioHub";
import OperacionesHub from "./pages/cooperativa/OperacionesHub";
import FinanzasHub from "./pages/cooperativa/FinanzasHub";
import ComunicacionHub from "./pages/cooperativa/ComunicacionHub";
import VitalCooperativa from "./pages/cooperativa/VitalCooperativa";
import UsuariosOrg from "./pages/cooperativa/UsuariosOrg";

// Other role dashboards
import DashboardProductor from "./pages/productor/DashboardProductor";
import DashboardTecnico from "./pages/tecnico/DashboardTecnico";
import DashboardExportador from "./pages/exportador/DashboardExportador";
import DashboardCertificadora from "./pages/certificadora/DashboardCertificadora";
import AdminPanel from "./pages/admin/AdminPanel";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-muted-foreground">Cargando…</p>
  </div>
);

// Shorthand for dashboard-wrapped placeholder pages
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

              {/* Shared auth pages */}
              <Route path="/mi-perfil" element={<DashboardLayout><PlaceholderPage title="Mi Perfil" /></DashboardLayout>} />
              <Route path="/mi-plan" element={<DashboardLayout><PlaceholderPage title="Mi Plan" /></DashboardLayout>} />
              <Route path="/directorio/cooperativas" element={<DashboardLayout><PlaceholderPage title="Directorio de Cooperativas" /></DashboardLayout>} />

              {/* ── COOPERATIVA ── */}
              <Route path="/cooperativa" element={<Navigate to="/cooperativa/dashboard" replace />} />
              <Route path="/cooperativa/dashboard" element={<DashboardLayout requiredRole="cooperativa"><DashboardCooperativa /></DashboardLayout>} />
              <Route path="/cooperativa/productores-hub" element={<DashboardLayout requiredRole="cooperativa"><ProductoresHub /></DashboardLayout>} />
              <Route path="/cooperativa/productores-hub/nuevo" element={<RP role="cooperativa" title="Nuevo Productor" />} />
              <Route path="/cooperativa/productores-hub/:id" element={<RP role="cooperativa" title="Detalle Productor" />} />
              <Route path="/cooperativa/acopio" element={<DashboardLayout requiredRole="cooperativa"><AcopioHub /></DashboardLayout>} />
              <Route path="/cooperativa/operaciones" element={<DashboardLayout requiredRole="cooperativa"><OperacionesHub /></DashboardLayout>} />
              <Route path="/cooperativa/finanzas-hub" element={<DashboardLayout requiredRole="cooperativa"><FinanzasHub /></DashboardLayout>} />
              <Route path="/cooperativa/comunicacion" element={<DashboardLayout requiredRole="cooperativa"><ComunicacionHub /></DashboardLayout>} />
              <Route path="/cooperativa/vital" element={<DashboardLayout requiredRole="cooperativa"><VitalCooperativa /></DashboardLayout>} />
              <Route path="/cooperativa/usuarios" element={<DashboardLayout requiredRole="cooperativa"><UsuariosOrg /></DashboardLayout>} />
              <Route path="/cooperativa/calidad" element={<RP role="cooperativa" title="Nova Cup — Calidad" />} />
              <Route path="/cooperativa/inclusion" element={<RP role="cooperativa" title="Inclusión y Equidad" />} />

              {/* ── EXPORTADOR ── */}
              <Route path="/exportador" element={<Navigate to="/exportador/dashboard" replace />} />
              <Route path="/exportador/dashboard" element={<DashboardLayout requiredRole="exportador"><DashboardExportador /></DashboardLayout>} />
              <Route path="/exportador/cafe" element={<RP role="exportador" title="Gestión de Café" />} />
              <Route path="/exportador/socios" element={<RP role="exportador" title="Red de Proveedores" />} />
              <Route path="/exportador/comercial" element={<RP role="exportador" title="Gestión Comercial" />} />
              <Route path="/exportador/calidad" element={<RP role="exportador" title="Nova Cup" />} />
              <Route path="/exportador/admin" element={<RP role="exportador" title="Administración" />} />
              <Route path="/exportador/mensajes" element={<RP role="exportador" title="Mensajes" />} />

              {/* ── PRODUCTOR ── */}
              <Route path="/productor" element={<Navigate to="/productor/dashboard" replace />} />
              <Route path="/productor/dashboard" element={<DashboardLayout requiredRole="productor"><DashboardProductor /></DashboardLayout>} />
              <Route path="/productor/produccion" element={<RP role="productor" title="Producción" />} />
              <Route path="/productor/sanidad" element={<RP role="productor" title="Sanidad Vegetal" />} />
              <Route path="/productor/finanzas-hub" element={<RP role="productor" title="Finanzas" />} />
              <Route path="/productor/sostenibilidad" element={<RP role="productor" title="Sostenibilidad" />} />
              <Route path="/productor/comunidad" element={<RP role="productor" title="Comunidad" />} />

              {/* ── TÉCNICO ── */}
              <Route path="/tecnico" element={<Navigate to="/tecnico/dashboard" replace />} />
              <Route path="/tecnico/dashboard" element={<DashboardLayout requiredRole="tecnico"><DashboardTecnico /></DashboardLayout>} />
              <Route path="/tecnico/visitas" element={<RP role="tecnico" title="Plan de Visitas" />} />
              <Route path="/tecnico/diagnosticos" element={<RP role="tecnico" title="Diagnósticos" />} />
              <Route path="/tecnico/productores" element={<RP role="tecnico" title="Productores Asignados" />} />
              <Route path="/tecnico/vital" element={<RP role="tecnico" title="Protocolo VITAL" />} />

              {/* ── CERTIFICADORA ── */}
              <Route path="/certificadora" element={<Navigate to="/certificadora/dashboard" replace />} />
              <Route path="/certificadora/dashboard" element={<DashboardLayout requiredRole="certificadora"><DashboardCertificadora /></DashboardLayout>} />

              {/* ── ADMIN ── */}
              <Route path="/admin" element={<RequireAdmin><DashboardLayout requiredRole="admin"><AdminPanel /></DashboardLayout></RequireAdmin>} />
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
