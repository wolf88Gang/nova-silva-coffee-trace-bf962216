import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Users, Truck, TreePine, Wrench, ShieldCheck, Settings } from "lucide-react";

const ROLES: { role: AppRole; label: string; icon: React.ElementType; desc: string }[] = [
  { role: "cooperativa", label: "Cooperativa", icon: Users, desc: "Gestión de productores, acopio y finanzas" },
  { role: "exportador", label: "Exportador", icon: Truck, desc: "Gestión comercial y proveedores" },
  { role: "productor", label: "Productor", icon: TreePine, desc: "Producción, sanidad y sostenibilidad" },
  { role: "tecnico", label: "Técnico", icon: Wrench, desc: "Visitas y diagnósticos de campo" },
  { role: "certificadora", label: "Certificadora", icon: ShieldCheck, desc: "Panel de auditoría" },
  { role: "admin", label: "Administrador", icon: Settings, desc: "Administración de plataforma" },
];

const DemoLogin: React.FC = () => {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemo = (role: AppRole) => {
    loginAsDemo(role);
    navigate(role === "admin" ? "/admin" : `/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acceso Demo — Nova Silva</h1>
          <p className="text-muted-foreground">Selecciona un rol para explorar la plataforma</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES.map(({ role, label, icon: Icon, desc }) => (
            <Card key={role} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleDemo(role)}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate("/login")}>Ir al login real</Button>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;
