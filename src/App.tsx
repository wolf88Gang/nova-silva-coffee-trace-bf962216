import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { ModuleGuard } from "@/components/auth/ModuleGuard";
import { assertSupabaseHost } from "@/lib/assertSupabaseHost";

// Dev-only: verify Supabase points to external project
assertSupabaseHost();

import Login from "./pages/Login";
import Register from "./pages/Register";
import DemoLogin from "./pages/DemoLogin";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import NotFound from "./pages/NotFound";

// Public pages removed — platform only

// Cooperativa pages
import DashboardCooperativa from "./pages/cooperativa/DashboardCooperativa";
import ProductoresHub from "./pages/cooperativa/ProductoresHub";
import AcopioHub from "./pages/cooperativa/AcopioHub";
import OperacionesHub from "./pages/cooperativa/OperacionesHub";
import FinanzasHub from "./pages/cooperativa/FinanzasHub";
import ComunicacionHub from "./pages/cooperativa/ComunicacionHub";
import VitalCooperativa from "./pages/cooperativa/VitalCooperativa";
import UsuariosOrg from "./pages/cooperativa/UsuariosOrg";
import CalidadHub from "./pages/cooperativa/CalidadHub";
import InclusionEquidad from "./pages/cooperativa/InclusionEquidad";

// Productor pages
import DashboardProductor from "./pages/productor/DashboardProductor";
import MiFinca from "./pages/productor/MiFinca";
import ProduccionHub from "./pages/productor/ProduccionHub";
import SanidadHub from "./pages/productor/SanidadHub";
import SostenibilidadHub from "./pages/productor/SostenibilidadHub";
import FinanzasProductor from "./pages/productor/FinanzasProductor";
import VitalProductor from "./pages/productor/VitalProductor";
import Avisos from "./pages/productor/Avisos";

// Técnico pages
import DashboardTecnico from "./pages/tecnico/DashboardTecnico";
import TecnicoProductores from "./pages/tecnico/TecnicoProductores";
import TecnicoVital from "./pages/tecnico/TecnicoVital";
import TecnicoParcelas from "./pages/tecnico/TecnicoParcelas";
import TecnicoAgenda from "./pages/tecnico/TecnicoAgenda";

// Exportador pages
import DashboardExportador from "./pages/exportador/DashboardExportador";
import CarteraProveedores from "./pages/exportador/CarteraProveedores";
import CafeHub from "./pages/exportador/CafeHub";
import ExportadorContratos from "./pages/exportador/ExportadorContratos";
import ExportadorEUDR from "./pages/exportador/ExportadorEUDR";
import ExportadorEmbarques from "./pages/exportador/ExportadorEmbarques";
import ExportadorClientes from "./pages/exportador/ExportadorClientes";
import ExportadorCalidad from "./pages/exportador/ExportadorCalidad";
import ExportadorConfiguracion from "./pages/exportador/ExportadorConfiguracion";
import ExportadorMensajes from "./pages/exportador/ExportadorMensajes";

// Cooperativa extra pages
import ExportadoresAsociados from "./pages/cooperativa/ExportadoresAsociados";
import OfertasRecibidas from "./pages/cooperativa/OfertasRecibidas";

// Certificadora pages
import DashboardCertificadora from "./pages/certificadora/DashboardCertificadora";
import CertificadoraAuditorias from "./pages/certificadora/CertificadoraAuditorias";
import CertificadoraOrgs from "./pages/certificadora/CertificadoraOrgs";
import CertificadoraVerificar from "./pages/certificadora/CertificadoraVerificar";
import CertificadoraReportes from "./pages/certificadora/CertificadoraReportes";

// Admin
import AdminPanel from "./pages/admin/AdminPanel";
import AdminDirectorio from "./pages/admin/AdminDirectorio";
import AdminCatalogos from "./pages/admin/AdminCatalogos";
import MiPerfil from "./pages/perfil/MiPerfil";
import OnboardingOrganization from "./pages/onboarding/OnboardingOrganization";
import BillingReadOnly from "./pages/billing/BillingReadOnly";
import AlertasPage from "./pages/alertas/AlertasPage";
import ReportesHub from "./pages/reportes/ReportesHub";
import CreditCommitteeDashboard from "./components/creditos/CreditCommitteeDashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-muted-foreground">Cargando…</p>
  </div>
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
              {/* Root → Login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/demo" element={<DemoLogin />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/app" element={<RoleBasedRedirect />} />

              {/* Onboarding */}
              <Route path="/onboarding/organization" element={<OnboardingOrganization />} />

              {/* Shared */}
              <Route path="/mi-perfil" element={<DashboardLayout><MiPerfil /></DashboardLayout>} />
              <Route path="/mi-plan" element={<Navigate to="/billing" replace />} />
              <Route path="/billing" element={<DashboardLayout><BillingReadOnly /></DashboardLayout>} />
              <Route path="/alerts" element={<DashboardLayout><AlertasPage /></DashboardLayout>} />
              <Route path="/alertas" element={<Navigate to="/alerts" replace />} />
              <Route path="/reportes" element={<DashboardLayout><ReportesHub /></DashboardLayout>} />

              {/* ── COOPERATIVA ── */}
              <Route path="/cooperativa" element={<Navigate to="/cooperativa/dashboard" replace />} />
              <Route path="/cooperativa/dashboard" element={<DashboardLayout requiredRole="cooperativa"><DashboardCooperativa /></DashboardLayout>} />
              <Route path="/cooperativa/productores-hub" element={<DashboardLayout requiredRole="cooperativa"><ProductoresHub /></DashboardLayout>} />
              <Route path="/cooperativa/acopio" element={<DashboardLayout requiredRole="cooperativa"><AcopioHub /></DashboardLayout>} />
              <Route path="/cooperativa/operaciones" element={<DashboardLayout requiredRole="cooperativa"><OperacionesHub /></DashboardLayout>} />
              <Route path="/cooperativa/nutricion" element={<Navigate to="/cooperativa/operaciones" replace />} />
              <Route path="/cooperativa/finanzas-hub" element={<DashboardLayout requiredRole="cooperativa"><FinanzasHub /></DashboardLayout>} />
              <Route path="/cooperativa/comunicacion" element={<DashboardLayout requiredRole="cooperativa"><ComunicacionHub /></DashboardLayout>} />
              <Route path="/cooperativa/calidad" element={<DashboardLayout requiredRole="cooperativa"><CalidadHub /></DashboardLayout>} />
              <Route path="/cooperativa/vital" element={<DashboardLayout requiredRole="cooperativa"><ModuleGuard module="vital"><VitalCooperativa /></ModuleGuard></DashboardLayout>} />
              <Route path="/cooperativa/inclusion" element={<DashboardLayout requiredRole="cooperativa"><ModuleGuard module="inclusion"><InclusionEquidad /></ModuleGuard></DashboardLayout>} />
              <Route path="/cooperativa/usuarios" element={<DashboardLayout requiredRole="cooperativa"><UsuariosOrg /></DashboardLayout>} />
              <Route path="/cooperativa/comite-credito" element={<DashboardLayout requiredRole="cooperativa"><CreditCommitteeDashboard /></DashboardLayout>} />
              {/* Legacy cooperativa redirects */}
              <Route path="/cooperativa/productores" element={<Navigate to="/cooperativa/productores-hub" replace />} />
              <Route path="/cooperativa/lotes-acopio" element={<Navigate to="/cooperativa/acopio" replace />} />
              <Route path="/cooperativa/creditos" element={<Navigate to="/cooperativa/finanzas-hub" replace />} />
              <Route path="/cooperativa/configuracion" element={<Navigate to="/cooperativa/usuarios" replace />} />
              <Route path="/cooperativa/exportadores" element={<DashboardLayout requiredRole="cooperativa"><ExportadoresAsociados /></DashboardLayout>} />
              <Route path="/cooperativa/ofertas-recibidas" element={<DashboardLayout requiredRole="cooperativa"><OfertasRecibidas /></DashboardLayout>} />
              <Route path="/cooperativa/avisos" element={<Navigate to="/cooperativa/comunicacion" replace />} />

              {/* ── PRODUCTOR ── */}
              <Route path="/productor" element={<Navigate to="/productor/dashboard" replace />} />
              <Route path="/productor/dashboard" element={<DashboardLayout requiredRole="productor"><DashboardProductor /></DashboardLayout>} />
              <Route path="/productor/produccion" element={<DashboardLayout requiredRole="productor"><ProduccionHub /></DashboardLayout>} />
              <Route path="/productor/sanidad" element={<DashboardLayout requiredRole="productor"><SanidadHub /></DashboardLayout>} />
              <Route path="/productor/finanzas" element={<DashboardLayout requiredRole="productor"><FinanzasProductor /></DashboardLayout>} />
              <Route path="/productor/sostenibilidad" element={<DashboardLayout requiredRole="productor"><SostenibilidadHub /></DashboardLayout>} />
              <Route path="/productor/vital" element={<DashboardLayout requiredRole="productor"><ModuleGuard module="vital"><VitalProductor /></ModuleGuard></DashboardLayout>} />
              <Route path="/productor/avisos" element={<DashboardLayout requiredRole="productor"><Avisos /></DashboardLayout>} />
              {/* Legacy productor redirects */}
              <Route path="/productor/finca" element={<Navigate to="/productor/produccion" replace />} />
              <Route path="/productor/entregas" element={<Navigate to="/productor/produccion" replace />} />
              <Route path="/productor/creditos" element={<Navigate to="/productor/finanzas" replace />} />
              <Route path="/productor/clima" element={<Navigate to="/productor/sostenibilidad" replace />} />

              {/* ── TÉCNICO ── */}
              <Route path="/tecnico" element={<Navigate to="/tecnico/dashboard" replace />} />
              <Route path="/tecnico/dashboard" element={<DashboardLayout requiredRole="tecnico"><DashboardTecnico /></DashboardLayout>} />
              <Route path="/tecnico/agenda" element={<DashboardLayout requiredRole="tecnico"><TecnicoAgenda /></DashboardLayout>} />
              <Route path="/tecnico/productores" element={<DashboardLayout requiredRole="tecnico"><TecnicoProductores /></DashboardLayout>} />
              <Route path="/tecnico/parcelas" element={<DashboardLayout requiredRole="tecnico"><TecnicoParcelas /></DashboardLayout>} />
              <Route path="/tecnico/vital" element={<DashboardLayout requiredRole="tecnico"><ModuleGuard module="vital"><TecnicoVital /></ModuleGuard></DashboardLayout>} />
              {/* Legacy tecnico redirects */}
              <Route path="/tecnico/diagnosticos" element={<Navigate to="/tecnico/vital" replace />} />

              {/* ── EXPORTADOR ── */}
              <Route path="/exportador" element={<Navigate to="/exportador/dashboard" replace />} />
              <Route path="/exportador/dashboard" element={<DashboardLayout requiredRole="exportador"><DashboardExportador /></DashboardLayout>} />
              <Route path="/exportador/cafe" element={<DashboardLayout requiredRole="exportador"><CafeHub /></DashboardLayout>} />
              <Route path="/exportador/lotes" element={<Navigate to="/exportador/cafe?tab=inventario" replace />} />
              <Route path="/exportador/proveedores" element={<DashboardLayout requiredRole="exportador"><CarteraProveedores /></DashboardLayout>} />
              <Route path="/exportador/contratos" element={<DashboardLayout requiredRole="exportador"><ExportadorContratos /></DashboardLayout>} />
              <Route path="/exportador/eudr" element={<DashboardLayout requiredRole="exportador"><ModuleGuard module="eudr"><ExportadorEUDR /></ModuleGuard></DashboardLayout>} />
              <Route path="/exportador/embarques" element={<DashboardLayout requiredRole="exportador"><ExportadorEmbarques /></DashboardLayout>} />
              <Route path="/exportador/clientes" element={<DashboardLayout requiredRole="exportador"><ExportadorClientes /></DashboardLayout>} />
              <Route path="/exportador/calidad" element={<DashboardLayout requiredRole="exportador"><ExportadorCalidad /></DashboardLayout>} />
              <Route path="/exportador/configuracion" element={<DashboardLayout requiredRole="exportador"><ExportadorConfiguracion /></DashboardLayout>} />
              <Route path="/exportador/mensajes" element={<DashboardLayout requiredRole="exportador"><ExportadorMensajes /></DashboardLayout>} />

              {/* ── CERTIFICADORA ── */}
              <Route path="/certificadora" element={<Navigate to="/certificadora/dashboard" replace />} />
              <Route path="/certificadora/dashboard" element={<DashboardLayout requiredRole="certificadora"><DashboardCertificadora /></DashboardLayout>} />
              <Route path="/certificadora/auditorias" element={<DashboardLayout requiredRole="certificadora"><CertificadoraAuditorias /></DashboardLayout>} />
              <Route path="/certificadora/orgs" element={<DashboardLayout requiredRole="certificadora"><CertificadoraOrgs /></DashboardLayout>} />
              <Route path="/certificadora/verificar" element={<DashboardLayout requiredRole="certificadora"><CertificadoraVerificar /></DashboardLayout>} />
              <Route path="/certificadora/reportes" element={<DashboardLayout requiredRole="certificadora"><CertificadoraReportes /></DashboardLayout>} />

              {/* ── ADMIN ── */}
              <Route path="/admin" element={<RequireAdmin><DashboardLayout requiredRole="admin"><AdminPanel /></DashboardLayout></RequireAdmin>} />
              <Route path="/admin/directorio" element={<RequireAdmin><DashboardLayout requiredRole="admin"><AdminDirectorio /></DashboardLayout></RequireAdmin>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
