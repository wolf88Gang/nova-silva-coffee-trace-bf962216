import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Login from "@/pages/Login";
import DemoLogin from "@/pages/DemoLogin";
import RoleBasedRedirect from "@/components/RoleBasedRedirect";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Helper to wrap a placeholder in DashboardLayout with role
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
          <Routes>
            {/* Public */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/demo" element={<DemoLogin />} />
            <Route path="/registro" element={<PlaceholderPage title="Registro" />} />
            <Route path="/directorio/cooperativas" element={<PlaceholderPage title="Directorio de Cooperativas" />} />
            <Route path="/acerca" element={<PlaceholderPage title="Acerca de Nova Silva" />} />

            {/* Shared auth pages */}
            <Route path="/mi-perfil" element={<DashboardLayout><PlaceholderPage title="Mi Perfil" /></DashboardLayout>} />
            <Route path="/mi-plan" element={<DashboardLayout><PlaceholderPage title="Mi Plan" /></DashboardLayout>} />

            {/* Cooperativa */}
            <Route path="/cooperativa/dashboard" element={<RP role="cooperativa" title="Panel Principal — Cooperativa" />} />
            <Route path="/cooperativa/productores-hub" element={<RP role="cooperativa" title="Productoras/es" />} />
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
            <Route path="/admin" element={<RP role="admin" title="Panel de Administración" />} />
            <Route path="/admin/directorio" element={<RP role="admin" title="Directorio de Clientes" />} />
            <Route path="/admin/platform" element={<RP role="admin" title="Platform Admin" />} />
            <Route path="/admin/architect" element={<RP role="admin" title="Architect View" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
