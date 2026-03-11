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

assertSupabaseHost();

import Login from "./pages/Login";
import Register from "./pages/Register";
import DemoLogin from "./pages/DemoLogin";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import NotFound from "./pages/NotFound";

// ── Domain index pages ──
import ProduccionIndex from "./pages/produccion/ProduccionIndex";
import ParcelDetailPage from "./pages/produccion/ParcelDetailPage";
import AgronomiaIndex from "./pages/agronomia/AgronomiaIndex";
import NutricionIndex from "./pages/agronomia/NutricionIndex";
import GuardIndex from "./pages/agronomia/GuardIndex";
import YieldIndex from "./pages/agronomia/YieldIndex";
import AlertasAgronomia from "./pages/agronomia/AlertasAgronomia";
import VitalIndex from "./pages/resiliencia/VitalIndex";
import CumplimientoIndex from "./pages/cumplimiento/CumplimientoIndex";
import FinanzasIndex from "./pages/finanzas/FinanzasIndex";

// ── Existing pages (reused in new routes) ──
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
import DashboardProductor from "./pages/productor/DashboardProductor";
import ProduccionHub from "./pages/productor/ProduccionHub";
import SanidadHub from "./pages/productor/SanidadHub";
import SostenibilidadHub from "./pages/productor/SostenibilidadHub";
import FinanzasProductor from "./pages/productor/FinanzasProductor";
import VitalProductor from "./pages/productor/VitalProductor";
import Avisos from "./pages/productor/Avisos";
import DashboardTecnico from "./pages/tecnico/DashboardTecnico";
import TecnicoProductores from "./pages/tecnico/TecnicoProductores";
import TecnicoVital from "./pages/tecnico/TecnicoVital";
import TecnicoParcelas from "./pages/tecnico/TecnicoParcelas";
import TecnicoAgenda from "./pages/tecnico/TecnicoAgenda";
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
import ExportadoresAsociados from "./pages/cooperativa/ExportadoresAsociados";
import OfertasRecibidas from "./pages/cooperativa/OfertasRecibidas";
import DashboardCertificadora from "./pages/certificadora/DashboardCertificadora";
import CertificadoraAuditorias from "./pages/certificadora/CertificadoraAuditorias";
import CertificadoraOrgs from "./pages/certificadora/CertificadoraOrgs";
import CertificadoraVerificar from "./pages/certificadora/CertificadoraVerificar";
import CertificadoraReportes from "./pages/certificadora/CertificadoraReportes";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminDirectorio from "./pages/admin/AdminDirectorio";
import AdminCatalogos from "./pages/admin/AdminCatalogos";
import MiPerfil from "./pages/perfil/MiPerfil";
import OnboardingOrganization from "./pages/onboarding/OnboardingOrganization";
import BillingReadOnly from "./pages/billing/BillingReadOnly";
import AlertasPage from "./pages/alertas/AlertasPage";
import ReportesHub from "./pages/reportes/ReportesHub";
import CreditCommitteeDashboard from "./components/creditos/CreditCommitteeDashboard";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <video
      src="/animacion_nova_silva.mp4"
      autoPlay loop muted playsInline preload="auto"
      className="w-32 h-32 object-contain"
      ref={(el) => { if (el) el.playbackRate = 8; }}
    />
  </div>
);

const DL = ({ children }: { children: React.ReactNode }) => <DashboardLayout>{children}</DashboardLayout>;

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

              {/* ══════════════════════════════════════════
                  UNIFIED DOMAIN ROUTES
                  ══════════════════════════════════════════ */}

              {/* INICIO */}
              <Route path="/dashboard" element={<DL><RoleBasedRedirect /></DL>} />

              {/* PRODUCCIÓN */}
              <Route path="/produccion" element={<DL><ProduccionIndex /></DL>} />
              <Route path="/produccion/productores" element={<DL><ProductoresHub /></DL>} />
              <Route path="/produccion/parcelas" element={<DL><TecnicoParcelas /></DL>} />
              <Route path="/produccion/parcelas/:id" element={<DL><ParcelDetailPage /></DL>} />
              <Route path="/produccion/cultivos" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/produccion/entregas" element={<DL><AcopioHub /></DL>} />
              <Route path="/produccion/documentos" element={<DL><PlaceholderPage /></DL>} />

              {/* AGRONOMÍA */}
              <Route path="/agronomia" element={<DL><AgronomiaIndex /></DL>} />
              <Route path="/agronomia/nutricion" element={<DL><NutricionIndex /></DL>} />
              <Route path="/agronomia/guard" element={<DL><GuardIndex /></DL>} />
              <Route path="/agronomia/yield" element={<DL><YieldIndex /></DL>} />
              <Route path="/agronomia/yield/nueva" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/agronomia/alertas" element={<DL><AlertasAgronomia /></DL>} />

              {/* RESILIENCIA */}
              <Route path="/resiliencia/vital" element={<DL><VitalIndex /></DL>} />

              {/* CUMPLIMIENTO */}
              <Route path="/cumplimiento" element={<DL><CumplimientoIndex /></DL>} />
              <Route path="/cumplimiento/trazabilidad" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/cumplimiento/lotes" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/cumplimiento/eudr" element={<DL><ExportadorEUDR /></DL>} />
              <Route path="/cumplimiento/data-room" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/cumplimiento/auditorias" element={<DL><CertificadoraAuditorias /></DL>} />

              {/* FINANZAS */}
              <Route path="/finanzas" element={<DL><FinanzasIndex /></DL>} />
              <Route path="/finanzas/panel" element={<DL><FinanzasHub /></DL>} />
              <Route path="/finanzas/creditos" element={<DL><CreditCommitteeDashboard /></DL>} />
              <Route path="/finanzas/score-nova" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/finanzas/carbono" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/finanzas/facturacion" element={<DL><BillingReadOnly /></DL>} />

              {/* ADMINISTRACIÓN */}
              <Route path="/admin/usuarios" element={<DL><UsuariosOrg /></DL>} />
              <Route path="/admin/organizacion" element={<DL><AdminDirectorio /></DL>} />
              <Route path="/admin/configuracion" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/admin/billing" element={<DL><BillingReadOnly /></DL>} />
              <Route path="/admin/logs" element={<DL><PlaceholderPage /></DL>} />

              {/* AYUDA */}
              <Route path="/ayuda" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/ayuda/glosario" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/ayuda/soporte" element={<DL><PlaceholderPage /></DL>} />

              {/* Shared */}
              <Route path="/mi-perfil" element={<DL><MiPerfil /></DL>} />
              <Route path="/billing" element={<Navigate to="/finanzas/facturacion" replace />} />
              <Route path="/alerts" element={<DL><AlertasPage /></DL>} />
              <Route path="/alertas" element={<Navigate to="/agronomia/alertas" replace />} />
              <Route path="/reportes" element={<DL><ReportesHub /></DL>} />
              <Route path="/parcelas" element={<Navigate to="/produccion/parcelas" replace />} />
              <Route path="/entregas" element={<Navigate to="/produccion/entregas" replace />} />

              {/* ══════════════════════════════════════════
                  LEGACY REDIRECTS (old role-based routes)
                  ══════════════════════════════════════════ */}

              {/* Cooperativa legacy */}
              <Route path="/cooperativa" element={<Navigate to="/dashboard" replace />} />
              <Route path="/cooperativa/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/cooperativa/productores-hub" element={<Navigate to="/produccion/productores" replace />} />
              <Route path="/cooperativa/productores" element={<Navigate to="/produccion/productores" replace />} />
              <Route path="/cooperativa/acopio" element={<Navigate to="/produccion/entregas" replace />} />
              <Route path="/cooperativa/operaciones" element={<Navigate to="/produccion" replace />} />
              <Route path="/cooperativa/nutricion" element={<Navigate to="/agronomia/nutricion" replace />} />
              <Route path="/cooperativa/finanzas-hub" element={<Navigate to="/finanzas/panel" replace />} />
              <Route path="/cooperativa/comunicacion" element={<DL><ComunicacionHub /></DL>} />
              <Route path="/cooperativa/calidad" element={<DL><CalidadHub /></DL>} />
              <Route path="/cooperativa/vital" element={<Navigate to="/resiliencia/vital" replace />} />
              <Route path="/cooperativa/inclusion" element={<DL><InclusionEquidad /></DL>} />
              <Route path="/cooperativa/usuarios" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="/cooperativa/comite-credito" element={<Navigate to="/finanzas/creditos" replace />} />
              <Route path="/cooperativa/lotes-acopio" element={<Navigate to="/produccion/entregas" replace />} />
              <Route path="/cooperativa/creditos" element={<Navigate to="/finanzas/creditos" replace />} />
              <Route path="/cooperativa/configuracion" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="/cooperativa/exportadores" element={<DL><ExportadoresAsociados /></DL>} />
              <Route path="/cooperativa/ofertas-recibidas" element={<DL><OfertasRecibidas /></DL>} />
              <Route path="/cooperativa/avisos" element={<Navigate to="/dashboard" replace />} />

              {/* Productor legacy */}
              <Route path="/productor" element={<Navigate to="/dashboard" replace />} />
              <Route path="/productor/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/productor/produccion" element={<Navigate to="/produccion" replace />} />
              <Route path="/productor/sanidad" element={<Navigate to="/agronomia/guard" replace />} />
              <Route path="/productor/finanzas" element={<Navigate to="/finanzas" replace />} />
              <Route path="/productor/sostenibilidad" element={<Navigate to="/resiliencia/vital" replace />} />
              <Route path="/productor/vital" element={<Navigate to="/resiliencia/vital" replace />} />
              <Route path="/productor/avisos" element={<Navigate to="/dashboard" replace />} />
              <Route path="/productor/finca" element={<Navigate to="/produccion" replace />} />
              <Route path="/productor/entregas" element={<Navigate to="/produccion/entregas" replace />} />
              <Route path="/productor/creditos" element={<Navigate to="/finanzas/creditos" replace />} />
              <Route path="/productor/clima" element={<Navigate to="/agronomia" replace />} />

              {/* Técnico legacy */}
              <Route path="/tecnico" element={<Navigate to="/dashboard" replace />} />
              <Route path="/tecnico/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/tecnico/agenda" element={<DL><TecnicoAgenda /></DL>} />
              <Route path="/tecnico/productores" element={<Navigate to="/produccion/productores" replace />} />
              <Route path="/tecnico/parcelas" element={<Navigate to="/produccion/parcelas" replace />} />
              <Route path="/tecnico/vital" element={<Navigate to="/resiliencia/vital" replace />} />
              <Route path="/tecnico/diagnosticos" element={<Navigate to="/resiliencia/vital" replace />} />

              {/* Exportador legacy */}
              <Route path="/exportador" element={<Navigate to="/dashboard" replace />} />
              <Route path="/exportador/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/exportador/cafe" element={<Navigate to="/produccion" replace />} />
              <Route path="/exportador/lotes" element={<Navigate to="/cumplimiento/lotes" replace />} />
              <Route path="/exportador/proveedores" element={<Navigate to="/produccion/productores" replace />} />
              <Route path="/exportador/contratos" element={<DL><ExportadorContratos /></DL>} />
              <Route path="/exportador/eudr" element={<Navigate to="/cumplimiento/eudr" replace />} />
              <Route path="/exportador/embarques" element={<DL><ExportadorEmbarques /></DL>} />
              <Route path="/exportador/clientes" element={<DL><ExportadorClientes /></DL>} />
              <Route path="/exportador/calidad" element={<DL><ExportadorCalidad /></DL>} />
              <Route path="/exportador/configuracion" element={<Navigate to="/admin/configuracion" replace />} />
              <Route path="/exportador/mensajes" element={<DL><ExportadorMensajes /></DL>} />

              {/* Certificadora legacy */}
              <Route path="/certificadora" element={<Navigate to="/dashboard" replace />} />
              <Route path="/certificadora/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/certificadora/auditorias" element={<Navigate to="/cumplimiento/auditorias" replace />} />
              <Route path="/certificadora/orgs" element={<DL><CertificadoraOrgs /></DL>} />
              <Route path="/certificadora/verificar" element={<DL><CertificadoraVerificar /></DL>} />
              <Route path="/certificadora/reportes" element={<DL><CertificadoraReportes /></DL>} />

              {/* Admin legacy */}
              <Route path="/admin" element={<RequireAdmin><DL><AdminPanel /></DL></RequireAdmin>} />
              <Route path="/admin/directorio" element={<Navigate to="/admin/organizacion" replace />} />
              <Route path="/admin/catalogos" element={<DL><AdminCatalogos /></DL>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
