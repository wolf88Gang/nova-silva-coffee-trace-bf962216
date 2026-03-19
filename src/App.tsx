import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { DemoSetupProvider } from "@/contexts/DemoSetupContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DomainLayout } from "@/components/layout/DomainLayout";
import { RequireAdmin } from "@/components/auth/RequireAdmin";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DemoLogin from "./pages/DemoLogin";
import DemoLoginLayered from "./pages/DemoLoginLayered";
import DemoSetupWizard from "./pages/demo/DemoSetupWizard";
import DemoCreateAccount from "./pages/demo/DemoCreateAccount";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

// Public pages
import HomePage from "./pages/public/HomePage";
import NosotrosPage from "./pages/public/NosotrosPage";
import SolucionesPage from "./pages/public/SolucionesPage";
import CumplimientoPage from "./pages/public/CumplimientoPage";
import ProtocoloVitalPage from "./pages/public/PlanClimaPage";
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
import ExportadorProveedores from "./pages/exportador/ExportadorProveedores";
import ExportadorLotes from "./pages/exportador/ExportadorLotes";
import ExportadorContratos from "./pages/exportador/ExportadorContratos";
import ExportadorEUDR from "./pages/exportador/ExportadorEUDR";
import ExportadorEmbarques from "./pages/exportador/ExportadorEmbarques";
import ExportadorClientes from "./pages/exportador/ExportadorClientes";
import ExportadorCalidad from "./pages/exportador/ExportadorCalidad";

// Certificadora pages
import DashboardCertificadora from "./pages/certificadora/DashboardCertificadora";
import CertificadoraAuditorias from "./pages/certificadora/CertificadoraAuditorias";
import CertificadoraOrgs from "./pages/certificadora/CertificadoraOrgs";
import CertificadoraVerificar from "./pages/certificadora/CertificadoraVerificar";
import CertificadoraReportes from "./pages/certificadora/CertificadoraReportes";

// Admin
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminOrganizationsPage from "./pages/admin/AdminOrganizationsPage";
import AdminOrganizationDetailPage from "./pages/admin/AdminOrganizationDetailPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminBillingPage from "./pages/admin/AdminBillingPage";
import AdminPlatformPage from "./pages/admin/AdminPlatformPage";
import AdminCompliancePage from "./pages/admin/AdminCompliancePage";
import AdminGrowthPage from "./pages/admin/AdminGrowthPage";
import AdminModuleExplorer from "./pages/admin/AdminModuleExplorer";
import AdminModuleDetail from "./pages/admin/AdminModuleDetail";
import AdminComponentPlayground from "./pages/admin/AdminComponentPlayground";

// Domain-based (new architecture)
import DashboardIndex from "./pages/domain/DashboardIndex";
import ParcelDetailPage from "./pages/domain/ParcelDetailPage";
import ProduccionIndex from "./pages/domain/ProduccionIndex";
import AgronomiaIndex from "./pages/domain/AgronomiaIndex";
import ResilienciaIndex from "./pages/domain/ResilienciaIndex";
import CumplimientoIndex from "./pages/domain/CumplimientoIndex";
import CalidadIndex from "./pages/domain/CalidadIndex";
import FinanzasIndex from "./pages/domain/FinanzasIndex";
import AbastecimientoIndex from "./pages/domain/AbastecimientoIndex";
import ParcelasListPage from "./pages/domain/ParcelasListPage";
import NutritionOverviewPage from "./pages/domain/NutritionOverviewPage";
import GuardOverviewPage from "./pages/domain/GuardOverviewPage";
import YieldOverviewPage from "./pages/domain/YieldOverviewPage";
import VitalOverviewPage from "./pages/domain/VitalOverviewPage";
import NovaCupOverviewPage from "./pages/domain/NovaCupOverviewPage";
import ComplianceHubPage from "./pages/domain/ComplianceHubPage";
import FinanceOverviewPage from "./pages/domain/FinanceOverviewPage";
import PayPalSandboxPage from "./pages/paypal/PayPalSandboxPage";
import PayPalSandboxReturnPage from "./pages/paypal/PayPalSandboxReturnPage";
import PayPalInvoicePaymentPage from "./pages/paypal/PayPalInvoicePaymentPage";

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
      <DemoProvider>
      <DemoSetupProvider>
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
              <Route path="/protocolo-vital" element={<ProtocoloVitalPage />} />
              <Route path="/plan-clima" element={<Navigate to="/protocolo-vital" replace />} />
              <Route path="/impacto" element={<ImpactoPage />} />
              <Route path="/contacto" element={<ContactoPage />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/demo" element={<DemoLogin />} />
              <Route path="/demo/setup" element={<DemoSetupWizard />} />
              <Route path="/demo/create-account" element={<DemoCreateAccount />} />
              <Route path="/demo-v2" element={<DemoLoginLayered />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/app" element={<RoleBasedRedirect />} />

              {/* ── DOMINIOS (nueva arquitectura) ── */}
              <Route path="/dashboard" element={<DomainLayout><DashboardIndex /></DomainLayout>} />
              <Route path="/produccion" element={<DomainLayout><ProduccionIndex /></DomainLayout>} />
              <Route path="/produccion/parcelas" element={<DomainLayout><ParcelasListPage /></DomainLayout>} />
              <Route path="/produccion/parcelas/:id" element={<DomainLayout><ParcelDetailPage /></DomainLayout>} />
              <Route path="/abastecimiento" element={<DomainLayout><AbastecimientoIndex /></DomainLayout>} />
              <Route path="/agronomia" element={<DomainLayout><AgronomiaIndex /></DomainLayout>} />
              <Route path="/agronomia/nutricion" element={<DomainLayout><NutritionOverviewPage /></DomainLayout>} />
              <Route path="/agronomia/guard" element={<DomainLayout><GuardOverviewPage /></DomainLayout>} />
              <Route path="/agronomia/yield" element={<DomainLayout><YieldOverviewPage /></DomainLayout>} />
              <Route path="/resiliencia" element={<DomainLayout><ResilienciaIndex /></DomainLayout>} />
              <Route path="/resiliencia/vital" element={<DomainLayout><VitalOverviewPage /></DomainLayout>} />
              <Route path="/cumplimiento" element={<DomainLayout><ComplianceHubPage /></DomainLayout>} />
              <Route path="/calidad" element={<DomainLayout><CalidadIndex /></DomainLayout>} />
              <Route path="/calidad/nova-cup" element={<DomainLayout><NovaCupOverviewPage /></DomainLayout>} />
              <Route path="/finanzas" element={<DomainLayout><FinanceOverviewPage /></DomainLayout>} />
              <Route path="/produccion/jornales" element={<DomainLayout><PlaceholderPage title="Jornales" /></DomainLayout>} />
              <Route path="/administracion" element={<DomainLayout><PlaceholderPage title="Administración" /></DomainLayout>} />
              <Route path="/ayuda" element={<DomainLayout><PlaceholderPage title="Ayuda" /></DomainLayout>} />
              <Route path="/paypal-sandbox" element={<DomainLayout><PayPalSandboxPage /></DomainLayout>} />
              <Route path="/paypal-sandbox/return" element={<DomainLayout><PayPalSandboxReturnPage /></DomainLayout>} />
              <Route path="/paypal-invoice" element={<DomainLayout><PayPalInvoicePaymentPage /></DomainLayout>} />

              {/* Shared */}
              <Route path="/mi-perfil" element={<DashboardLayout><PlaceholderPage title="Mi Perfil" /></DashboardLayout>} />
              <Route path="/mi-plan" element={<DashboardLayout><PlaceholderPage title="Mi Plan" /></DashboardLayout>} />

              {/* ── COOPERATIVA ── */}
              <Route path="/cooperativa" element={<Navigate to="/cooperativa/dashboard" replace />} />
              <Route path="/cooperativa/dashboard" element={<DashboardLayout requiredRole="cooperativa"><DashboardCooperativa /></DashboardLayout>} />
              <Route path="/cooperativa/productores-hub" element={<DashboardLayout requiredRole="cooperativa"><ProductoresHub /></DashboardLayout>} />
              <Route path="/cooperativa/acopio" element={<DashboardLayout requiredRole="cooperativa"><AcopioHub /></DashboardLayout>} />
              <Route path="/cooperativa/operaciones" element={<DashboardLayout requiredRole="cooperativa"><OperacionesHub /></DashboardLayout>} />
              <Route path="/cooperativa/finanzas-hub" element={<DashboardLayout requiredRole="cooperativa"><FinanzasHub /></DashboardLayout>} />
              <Route path="/cooperativa/comunicacion" element={<DashboardLayout requiredRole="cooperativa"><ComunicacionHub /></DashboardLayout>} />
              <Route path="/cooperativa/calidad" element={<DashboardLayout requiredRole="cooperativa"><CalidadHub /></DashboardLayout>} />
              <Route path="/cooperativa/vital" element={<DashboardLayout requiredRole="cooperativa"><VitalCooperativa /></DashboardLayout>} />
              <Route path="/cooperativa/inclusion" element={<DashboardLayout requiredRole="cooperativa"><InclusionEquidad /></DashboardLayout>} />
              <Route path="/cooperativa/usuarios" element={<DashboardLayout requiredRole="cooperativa"><UsuariosOrg /></DashboardLayout>} />
              {/* Legacy cooperativa redirects */}
              <Route path="/cooperativa/productores" element={<Navigate to="/cooperativa/productores-hub" replace />} />
              <Route path="/cooperativa/lotes-acopio" element={<Navigate to="/cooperativa/acopio" replace />} />
              <Route path="/cooperativa/creditos" element={<Navigate to="/cooperativa/finanzas-hub" replace />} />
              <Route path="/cooperativa/configuracion" element={<Navigate to="/cooperativa/usuarios" replace />} />
              <Route path="/cooperativa/exportadores" element={<Navigate to="/cooperativa/acopio" replace />} />
              <Route path="/cooperativa/avisos" element={<Navigate to="/cooperativa/comunicacion" replace />} />

              {/* ── PRODUCTOR ── */}
              <Route path="/productor" element={<Navigate to="/productor/dashboard" replace />} />
              <Route path="/productor/dashboard" element={<DashboardLayout requiredRole="productor"><DashboardProductor /></DashboardLayout>} />
              <Route path="/productor/produccion" element={<DashboardLayout requiredRole="productor"><ProduccionHub /></DashboardLayout>} />
              <Route path="/productor/sanidad" element={<DashboardLayout requiredRole="productor"><SanidadHub /></DashboardLayout>} />
              <Route path="/productor/finanzas" element={<DashboardLayout requiredRole="productor"><FinanzasProductor /></DashboardLayout>} />
              <Route path="/productor/sostenibilidad" element={<DashboardLayout requiredRole="productor"><SostenibilidadHub /></DashboardLayout>} />
              <Route path="/productor/vital" element={<DashboardLayout requiredRole="productor"><VitalProductor /></DashboardLayout>} />
              <Route path="/productor/avisos" element={<DashboardLayout requiredRole="productor"><Avisos /></DashboardLayout>} />
              {/* Legacy productor redirects */}
              <Route path="/productor/finca" element={<Navigate to="/productor/produccion" replace />} />
              <Route path="/productor/entregas" element={<Navigate to="/productor/produccion" replace />} />
              <Route path="/productor/creditos" element={<Navigate to="/productor/finanzas" replace />} />

              {/* ── TÉCNICO ── */}
              <Route path="/tecnico" element={<Navigate to="/tecnico/dashboard" replace />} />
              <Route path="/tecnico/dashboard" element={<DashboardLayout requiredRole="tecnico"><DashboardTecnico /></DashboardLayout>} />
              <Route path="/tecnico/agenda" element={<DashboardLayout requiredRole="tecnico"><TecnicoAgenda /></DashboardLayout>} />
              <Route path="/tecnico/productores" element={<DashboardLayout requiredRole="tecnico"><TecnicoProductores /></DashboardLayout>} />
              <Route path="/tecnico/parcelas" element={<DashboardLayout requiredRole="tecnico"><TecnicoParcelas /></DashboardLayout>} />
              <Route path="/tecnico/vital" element={<DashboardLayout requiredRole="tecnico"><TecnicoVital /></DashboardLayout>} />
              {/* Legacy tecnico redirects */}
              <Route path="/tecnico/diagnosticos" element={<Navigate to="/tecnico/vital" replace />} />

              {/* ── EXPORTADOR ── */}
              <Route path="/exportador" element={<Navigate to="/exportador/dashboard" replace />} />
              <Route path="/exportador/dashboard" element={<DashboardLayout requiredRole="exportador"><DashboardExportador /></DashboardLayout>} />
              <Route path="/exportador/lotes" element={<DashboardLayout requiredRole="exportador"><ExportadorLotes /></DashboardLayout>} />
              <Route path="/exportador/proveedores" element={<DashboardLayout requiredRole="exportador"><ExportadorProveedores /></DashboardLayout>} />
              <Route path="/exportador/contratos" element={<DashboardLayout requiredRole="exportador"><ExportadorContratos /></DashboardLayout>} />
              <Route path="/exportador/eudr" element={<DashboardLayout requiredRole="exportador"><ExportadorEUDR /></DashboardLayout>} />
              <Route path="/exportador/embarques" element={<DashboardLayout requiredRole="exportador"><ExportadorEmbarques /></DashboardLayout>} />
              <Route path="/exportador/clientes" element={<DashboardLayout requiredRole="exportador"><ExportadorClientes /></DashboardLayout>} />
              <Route path="/exportador/calidad" element={<DashboardLayout requiredRole="exportador"><ExportadorCalidad /></DashboardLayout>} />
              <Route path="/exportador/configuracion" element={<RP role="exportador" title="Administración" />} />
              <Route path="/exportador/mensajes" element={<RP role="exportador" title="Mensajes" />} />

              {/* ── CERTIFICADORA ── */}
              <Route path="/certificadora" element={<Navigate to="/certificadora/dashboard" replace />} />
              <Route path="/certificadora/dashboard" element={<DashboardLayout requiredRole="certificadora"><DashboardCertificadora /></DashboardLayout>} />
              <Route path="/certificadora/auditorias" element={<DashboardLayout requiredRole="certificadora"><CertificadoraAuditorias /></DashboardLayout>} />
              <Route path="/certificadora/orgs" element={<DashboardLayout requiredRole="certificadora"><CertificadoraOrgs /></DashboardLayout>} />
              <Route path="/certificadora/verificar" element={<DashboardLayout requiredRole="certificadora"><CertificadoraVerificar /></DashboardLayout>} />
              <Route path="/certificadora/reportes" element={<DashboardLayout requiredRole="certificadora"><CertificadoraReportes /></DashboardLayout>} />

              {/* ── ADMIN ── */}
              <Route path="/admin" element={<RequireAdmin><AdminLayout><Navigate to="/admin/overview" replace /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/overview" element={<RequireAdmin><AdminLayout><AdminOverviewPage /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/organizations" element={<RequireAdmin><AdminLayout><AdminOrganizationsPage /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/organizations/:id" element={<RequireAdmin><AdminLayout><AdminOrganizationDetailPage /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/users" element={<RequireAdmin><AdminLayout><AdminUsersPage /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/billing" element={<RequireAdmin><AdminLayout><AdminBillingPage /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/platform" element={<RequireAdmin><AdminLayout><AdminPlatformPage /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/compliance" element={<RequireAdmin><AdminLayout><AdminCompliancePage /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/growth" element={<RequireAdmin><AdminLayout><AdminGrowthPage /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/modules" element={<RequireAdmin><AdminLayout><AdminModuleExplorer /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/modules/:moduleId" element={<RequireAdmin><AdminLayout><AdminModuleDetail /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/components" element={<RequireAdmin><AdminLayout><AdminComponentPlayground /></AdminLayout></RequireAdmin>} />
              <Route path="/admin/directorio" element={<RequireAdmin><AdminLayout><PlaceholderPage title="Directorio de Clientes" /></AdminLayout></RequireAdmin>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </DemoSetupProvider>
      </DemoProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
