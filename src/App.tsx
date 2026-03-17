import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { assertSupabaseHost } from "@/lib/assertSupabaseHost";

assertSupabaseHost();

import Login from "./pages/Login";
import Register from "./pages/Register";
import DemoLogin from "./pages/DemoLogin";
import DemoSetupWizard from "./pages/demo/DemoSetupWizard";
import CrearCuenta from "./pages/demo/CrearCuenta";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

// Domain index pages
import ProduccionIndex from "./pages/produccion/ProduccionIndex";
import ParcelDetailPage from "./pages/produccion/ParcelDetailPage";
import CultivosIndex from "./pages/produccion/CultivosIndex";
import DocumentosIndex from "./pages/produccion/DocumentosIndex";
import AgronomiaIndex from "./pages/agronomia/AgronomiaIndex";
import NutricionIndex from "./pages/agronomia/NutricionIndex";
import NutricionDashboard from "./components/nutricion/NutricionDashboard";
import GuardIndex from "./pages/agronomia/GuardIndex";
import YieldIndex from "./pages/agronomia/YieldIndex";
import AlertasAgronomia from "./pages/agronomia/AlertasAgronomia";
import VitalIndex from "./pages/resiliencia/VitalIndex";

import CumplimientoIndex from "./pages/cumplimiento/CumplimientoIndex";
import CumplimientoLotesPage from "./pages/cumplimiento/CumplimientoLotesPage";
import TrazabilidadIndex from "./pages/cumplimiento/TrazabilidadIndex";
import FinanzasIndex from "./pages/finanzas/FinanzasIndex";
import AbastecimientoIndex from "./pages/abastecimiento/AbastecimientoIndex";
import RecepcionIndex from "./pages/abastecimiento/RecepcionIndex";
import ComprasLotesIndex from "./pages/abastecimiento/ComprasLotesIndex";
import EvidenciasIndex from "./pages/abastecimiento/EvidenciasIndex";
import RiesgoOrigenIndex from "./pages/abastecimiento/RiesgoOrigenIndex";
import CalidadIndex from "./pages/calidad/CalidadIndex";
import JornalesIndex from "./pages/jornales/JornalesIndex";
import OrigenesIndex from "./pages/origenes/OrigenesIndex";
import AnaliticaIndex from "./pages/analitica/AnaliticaIndex";
import ComercialIndex from "./pages/comercial/ComercialIndex";
import ComercialLotesPage from "./pages/comercial/ComercialLotesPage";
import InventarioIndex from "./pages/operaciones/InventarioIndex";
import ProveedoresInsumosIndex from "./pages/insumos/ProveedoresInsumosIndex";
import CatalogoInsumosIndex from "./pages/insumos/CatalogoInsumosIndex";

// Existing pages (reused)
import ProductoresHub from "./pages/cooperativa/ProductoresHub";
import AcopioHub from "./pages/cooperativa/AcopioHub";
import FinanzasHub from "./pages/cooperativa/FinanzasHub";
import ComunicacionHub from "./pages/cooperativa/ComunicacionHub";
import CalidadHub from "./pages/cooperativa/CalidadHub";
import InclusionEquidad from "./pages/cooperativa/InclusionEquidad";
import UsuariosOrg from "./pages/cooperativa/UsuariosOrg";
import TecnicoParcelas from "./pages/tecnico/TecnicoParcelas";
import TecnicoAgenda from "./pages/tecnico/TecnicoAgenda";
import ExportadorContratos from "./pages/exportador/ExportadorContratos";
import ExportadorEUDR from "./pages/exportador/ExportadorEUDR";
import ExportadorEmbarques from "./pages/exportador/ExportadorEmbarques";
import ExportadorClientes from "./pages/exportador/ExportadorClientes";
import ExportadorCalidad from "./pages/exportador/ExportadorCalidad";
import ExportadorMensajes from "./pages/exportador/ExportadorMensajes";
import ExportadoresAsociados from "./pages/cooperativa/ExportadoresAsociados";
import OfertasRecibidas from "./pages/cooperativa/OfertasRecibidas";
import CertificadoraAuditorias from "./pages/certificadora/CertificadoraAuditorias";
import CertificadoraOrgs from "./pages/certificadora/CertificadoraOrgs";
import CertificadoraVerificar from "./pages/certificadora/CertificadoraVerificar";
import CertificadoraReportes from "./pages/certificadora/CertificadoraReportes";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminSystem from "./pages/admin/AdminSystem";
import AdminCompliance from "./pages/admin/AdminCompliance";
import AdminGrowth from "./pages/admin/AdminGrowth";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminDirectorio from "./pages/admin/AdminDirectorio";
import AdminCatalogos from "./pages/admin/AdminCatalogos";
import AdminModuleExplorer from "./pages/admin/AdminModuleExplorer";
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
    <video src="/animacion_nova_silva.mp4" autoPlay loop muted playsInline preload="auto" className="w-32 h-32 object-contain" ref={(el) => { if (el) el.playbackRate = 8; }} />
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
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/demo" element={<DemoLogin />} />
              <Route path="/demo/setup" element={<DemoSetupWizard />} />
              <Route path="/crear-cuenta" element={<CrearCuenta />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/app" element={<RoleBasedRedirect />} />
              <Route path="/onboarding/organization" element={<OnboardingOrganization />} />

              {/* ══ UNIFIED DOMAIN ROUTES ══ */}

              {/* DASHBOARD */}
              <Route path="/dashboard" element={<DL><RoleBasedRedirect /></DL>} />

              {/* PRODUCCIÓN */}
              <Route path="/produccion" element={<DL><ProduccionIndex /></DL>} />
              <Route path="/produccion/productores" element={<DL><ProductoresHub /></DL>} />
              <Route path="/produccion/parcelas" element={<DL><TecnicoParcelas /></DL>} />
              <Route path="/produccion/parcelas/:id" element={<DL><ParcelDetailPage /></DL>} />
              <Route path="/produccion/cultivos" element={<DL><CultivosIndex /></DL>} />
              <Route path="/produccion/entregas" element={<DL><AcopioHub /></DL>} />
              <Route path="/produccion/documentos" element={<DL><DocumentosIndex /></DL>} />

              {/* ABASTECIMIENTO */}
              <Route path="/abastecimiento" element={<DL><AbastecimientoIndex /></DL>} />
              <Route path="/abastecimiento/proveedores" element={<DL><AbastecimientoIndex /></DL>} />
              <Route path="/abastecimiento/recepcion" element={<DL><RecepcionIndex /></DL>} />
              <Route path="/abastecimiento/compras" element={<DL><ComprasLotesIndex /></DL>} />
              <Route path="/abastecimiento/evidencias" element={<DL><EvidenciasIndex /></DL>} />
              <Route path="/abastecimiento/riesgo" element={<DL><RiesgoOrigenIndex /></DL>} />
              <Route path="/abastecimiento/eudr" element={<DL><RiesgoOrigenIndex /></DL>} />

              {/* ORÍGENES (exportador) */}
              <Route path="/origenes" element={<DL><OrigenesIndex /></DL>} />
              <Route path="/origenes/proveedores" element={<DL><OrigenesIndex /></DL>} />
              <Route path="/origenes/regiones" element={<DL><OrigenesIndex /></DL>} />
              <Route path="/origenes/riesgo" element={<DL><RiesgoOrigenIndex /></DL>} />
              <Route path="/origenes/eudr" element={<Navigate to="/cumplimiento/eudr" replace />} />
              <Route path="/origenes/calidad" element={<Navigate to="/calidad" replace />} />
              <Route path="/origenes/potencial" element={<DL><OrigenesIndex /></DL>} />

              {/* AGRONOMÍA */}
              <Route path="/agronomia" element={<DL><AgronomiaIndex /></DL>} />
              <Route path="/agronomia/nutricion" element={<DL><NutricionDashboard /></DL>} />
              <Route path="/agronomia/guard" element={<DL><GuardIndex /></DL>} />
              <Route path="/agronomia/yield" element={<DL><YieldIndex /></DL>} />
              <Route path="/agronomia/yield/nueva" element={<DL><PlaceholderPage /></DL>} />
              <Route path="/agronomia/alertas" element={<DL><AlertasAgronomia /></DL>} />

              {/* ANALÍTICA AGRONÓMICA (exportador) */}
              <Route path="/analitica" element={<DL><AnaliticaIndex /></DL>} />
              <Route path="/analitica/riesgo" element={<DL><AnaliticaIndex /></DL>} />
              <Route path="/analitica/recomendaciones" element={<DL><AnaliticaIndex /></DL>} />
              <Route path="/analitica/fitosanitario" element={<DL><AnaliticaIndex /></DL>} />
              <Route path="/analitica/productivo" element={<DL><AnaliticaIndex /></DL>} />

              {/* INVENTARIO */}
              <Route path="/operaciones/inventario" element={<DL><InventarioIndex /></DL>} />
              <Route path="/inventario" element={<Navigate to="/operaciones/inventario" replace />} />

              {/* INSUMOS */}
              <Route path="/insumos/proveedores" element={<DL><ProveedoresInsumosIndex /></DL>} />
              <Route path="/insumos/catalogo" element={<DL><CatalogoInsumosIndex /></DL>} />

              {/* JORNALES */}
              <Route path="/jornales" element={<DL><JornalesIndex /></DL>} />

              {/* RESILIENCIA */}
              <Route path="/resiliencia/vital" element={<DL><VitalIndex /></DL>} />
              <Route path="/resiliencia/clima" element={<Navigate to="/resiliencia/vital" replace />} />

              {/* CUMPLIMIENTO */}
              <Route path="/cumplimiento" element={<DL><CumplimientoIndex /></DL>} />
              <Route path="/cumplimiento/trazabilidad" element={<DL><TrazabilidadIndex /></DL>} />
              <Route path="/cumplimiento/lotes" element={<DL><CumplimientoLotesPage /></DL>} />
              <Route path="/cumplimiento/eudr" element={<DL><ExportadorEUDR /></DL>} />
              <Route path="/cumplimiento/data-room" element={<DL><DocumentosIndex /></DL>} />
              <Route path="/cumplimiento/auditorias" element={<DL><CertificadoraAuditorias /></DL>} />

              {/* CALIDAD / NOVA CUP */}
              <Route path="/calidad" element={<DL><CalidadIndex /></DL>} />
              <Route path="/calidad/lotes" element={<DL><CalidadIndex /></DL>} />
              <Route path="/calidad/tendencias" element={<DL><CalidadIndex /></DL>} />

              {/* COMERCIAL */}
              <Route path="/comercial" element={<DL><ComercialIndex /></DL>} />
              <Route path="/comercial/lotes" element={<DL><ComercialLotesPage /></DL>} />
              <Route path="/comercial/contratos" element={<DL><ExportadorContratos /></DL>} />
              <Route path="/comercial/mezclas" element={<DL><ComercialIndex /></DL>} />
              <Route path="/comercial/trazabilidad" element={<Navigate to="/cumplimiento/trazabilidad" replace />} />

              {/* FINANZAS */}
              <Route path="/finanzas" element={<DL><FinanzasIndex /></DL>} />
              <Route path="/finanzas/panel" element={<DL><FinanzasHub /></DL>} />
              <Route path="/finanzas/creditos" element={<DL><CreditCommitteeDashboard /></DL>} />
              <Route path="/finanzas/score-nova" element={<DL><FinanzasIndex /></DL>} />
              <Route path="/finanzas/carbono" element={<DL><FinanzasIndex /></DL>} />
              <Route path="/finanzas/facturacion" element={<DL><BillingReadOnly /></DL>} />

              {/* ADMINISTRACIÓN */}
              <Route path="/admin/usuarios" element={<DL><UsuariosOrg /></DL>} />
              <Route path="/admin/organizacion" element={<DL><AdminDirectorio /></DL>} />
              <Route path="/admin/configuracion" element={<DL><AdminDirectorio /></DL>} />
              <Route path="/admin/billing" element={<DL><BillingReadOnly /></DL>} />
              <Route path="/admin/logs" element={<DL><AdminDirectorio /></DL>} />

              {/* AYUDA */}
              <Route path="/ayuda" element={<DL><DocumentosIndex /></DL>} />
              <Route path="/ayuda/glosario" element={<DL><DocumentosIndex /></DL>} />
              <Route path="/ayuda/soporte" element={<DL><DocumentosIndex /></DL>} />

              {/* Shared */}
              <Route path="/mi-perfil" element={<DL><MiPerfil /></DL>} />
              <Route path="/billing" element={<Navigate to="/finanzas/facturacion" replace />} />
              <Route path="/alerts" element={<DL><AlertasPage /></DL>} />
              <Route path="/alertas" element={<Navigate to="/agronomia/alertas" replace />} />
              <Route path="/reportes" element={<DL><ReportesHub /></DL>} />
              <Route path="/parcelas" element={<Navigate to="/produccion/parcelas" replace />} />
              <Route path="/entregas" element={<Navigate to="/produccion/entregas" replace />} />

              {/* ══ LEGACY REDIRECTS ══ */}
              <Route path="/cooperativa" element={<Navigate to="/produccion" replace />} />
              <Route path="/cooperativa/dashboard" element={<Navigate to="/produccion" replace />} />
              <Route path="/cooperativa/productores-hub" element={<Navigate to="/produccion/productores" replace />} />
              <Route path="/cooperativa/productores" element={<Navigate to="/produccion/productores" replace />} />
              <Route path="/cooperativa/acopio" element={<Navigate to="/produccion/entregas" replace />} />
              <Route path="/cooperativa/operaciones" element={<Navigate to="/produccion" replace />} />
              <Route path="/cooperativa/nutricion" element={<Navigate to="/agronomia/nutricion" replace />} />
              <Route path="/cooperativa/finanzas-hub" element={<Navigate to="/finanzas/panel" replace />} />
              <Route path="/cooperativa/comunicacion" element={<DL><ComunicacionHub /></DL>} />
              <Route path="/cooperativa/calidad" element={<Navigate to="/calidad" replace />} />
              <Route path="/cooperativa/vital" element={<Navigate to="/resiliencia/vital" replace />} />
              <Route path="/cooperativa/inclusion" element={<DL><InclusionEquidad /></DL>} />
              <Route path="/cooperativa/usuarios" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="/cooperativa/comite-credito" element={<Navigate to="/finanzas/creditos" replace />} />
              <Route path="/cooperativa/exportadores" element={<DL><ExportadoresAsociados /></DL>} />
              <Route path="/cooperativa/ofertas-recibidas" element={<DL><OfertasRecibidas /></DL>} />
              <Route path="/cooperativa/avisos" element={<Navigate to="/produccion" replace />} />
              <Route path="/cooperativa/lotes-acopio" element={<Navigate to="/produccion/entregas" replace />} />
              <Route path="/cooperativa/creditos" element={<Navigate to="/finanzas/creditos" replace />} />
              <Route path="/cooperativa/configuracion" element={<Navigate to="/admin/usuarios" replace />} />

              <Route path="/productor" element={<Navigate to="/produccion" replace />} />
              <Route path="/productor/dashboard" element={<Navigate to="/produccion" replace />} />
              <Route path="/productor/produccion" element={<Navigate to="/produccion" replace />} />
              <Route path="/productor/sanidad" element={<Navigate to="/agronomia/guard" replace />} />
              <Route path="/productor/finanzas" element={<Navigate to="/finanzas" replace />} />
              <Route path="/productor/sostenibilidad" element={<Navigate to="/resiliencia/vital" replace />} />
              <Route path="/productor/vital" element={<Navigate to="/resiliencia/vital" replace />} />
              <Route path="/productor/avisos" element={<Navigate to="/produccion" replace />} />
              <Route path="/productor/finca" element={<Navigate to="/produccion" replace />} />
              <Route path="/productor/entregas" element={<Navigate to="/produccion/entregas" replace />} />
              <Route path="/productor/creditos" element={<Navigate to="/finanzas/creditos" replace />} />
              <Route path="/productor/clima" element={<Navigate to="/agronomia" replace />} />

              <Route path="/tecnico" element={<Navigate to="/produccion" replace />} />
              <Route path="/tecnico/dashboard" element={<Navigate to="/produccion" replace />} />
              <Route path="/tecnico/agenda" element={<DL><TecnicoAgenda /></DL>} />
              <Route path="/tecnico/productores" element={<Navigate to="/produccion/productores" replace />} />
              <Route path="/tecnico/parcelas" element={<Navigate to="/produccion/parcelas" replace />} />
              <Route path="/tecnico/vital" element={<Navigate to="/resiliencia/vital" replace />} />
              <Route path="/tecnico/diagnosticos" element={<Navigate to="/resiliencia/vital" replace />} />

              <Route path="/exportador" element={<Navigate to="/origenes" replace />} />
              <Route path="/exportador/dashboard" element={<Navigate to="/origenes" replace />} />
              <Route path="/exportador/cafe" element={<Navigate to="/comercial" replace />} />
              <Route path="/exportador/lotes" element={<Navigate to="/cumplimiento/lotes" replace />} />
              <Route path="/exportador/proveedores" element={<Navigate to="/origenes/proveedores" replace />} />
              <Route path="/exportador/contratos" element={<Navigate to="/comercial/contratos" replace />} />
              <Route path="/exportador/eudr" element={<Navigate to="/cumplimiento/eudr" replace />} />
              <Route path="/exportador/embarques" element={<DL><ExportadorEmbarques /></DL>} />
              <Route path="/exportador/clientes" element={<DL><ExportadorClientes /></DL>} />
              <Route path="/exportador/calidad" element={<Navigate to="/calidad" replace />} />
              <Route path="/exportador/configuracion" element={<Navigate to="/admin/configuracion" replace />} />
              <Route path="/exportador/mensajes" element={<DL><ExportadorMensajes /></DL>} />

              <Route path="/certificadora" element={<Navigate to="/cumplimiento" replace />} />
              <Route path="/certificadora/dashboard" element={<Navigate to="/cumplimiento" replace />} />
              <Route path="/certificadora/auditorias" element={<Navigate to="/cumplimiento/auditorias" replace />} />
              <Route path="/certificadora/orgs" element={<DL><CertificadoraOrgs /></DL>} />
              <Route path="/certificadora/verificar" element={<DL><CertificadoraVerificar /></DL>} />
              <Route path="/certificadora/reportes" element={<DL><CertificadoraReportes /></DL>} />

              <Route path="/admin" element={<RequireAdmin><DL><AdminOverview /></DL></RequireAdmin>} />
              <Route path="/admin/organizaciones" element={<RequireAdmin><DL><AdminOrganizations /></DL></RequireAdmin>} />
              <Route path="/admin/usuarios" element={<RequireAdmin><DL><AdminUsers /></DL></RequireAdmin>} />
              <Route path="/admin/billing" element={<RequireAdmin><DL><AdminBilling /></DL></RequireAdmin>} />
              <Route path="/admin/sistema" element={<RequireAdmin><DL><AdminSystem /></DL></RequireAdmin>} />
              <Route path="/admin/cumplimiento" element={<RequireAdmin><DL><AdminCompliance /></DL></RequireAdmin>} />
              <Route path="/admin/growth" element={<RequireAdmin><DL><AdminGrowth /></DL></RequireAdmin>} />
              <Route path="/admin/catalogos" element={<RequireAdmin><DL><AdminCatalogos /></DL></RequireAdmin>} />
              <Route path="/admin/modulos" element={<RequireAdmin><DL><AdminModuleExplorer /></DL></RequireAdmin>} />
              <Route path="/admin/modules" element={<RequireAdmin><DL><AdminModuleExplorer /></DL></RequireAdmin>} />
              <Route path="/admin/organizacion" element={<Navigate to="/admin/organizaciones" replace />} />
              <Route path="/admin/directorio" element={<Navigate to="/admin/organizaciones" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
