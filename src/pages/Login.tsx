import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role === "admin" ? "admin" : user.role}/dashboard`);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      toast({ title: "Error de autenticación", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Nova Silva</CardTitle>
          <CardDescription>Plataforma de Trazabilidad de Café</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </Button>
            <div className="flex gap-2 text-sm">
              <Link to="/demo" className="text-primary underline-offset-4 hover:underline">Acceso demo</Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/registro" className="text-primary underline-offset-4 hover:underline">Crear cuenta</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
