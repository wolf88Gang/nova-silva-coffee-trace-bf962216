import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgLogin from '@/assets/bg-login-aerial-tech.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/app', { replace: true });
    } else {
      toast({ title: 'Error al iniciar sesión', description: result.error, variant: 'destructive' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Correo enviado', description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.' });
      setShowReset(false);
      setResetEmail('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={bgLogin} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Glassmorphism card */}
      <div className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logoNovasilva}
            alt="Nova Silva"
            className="h-20 w-20 object-contain mb-4 cursor-pointer"
            onClick={() => navigate('/demo')}
          />
          <h1 className="text-2xl font-bold text-white">Nova Silva</h1>
          <p className="text-white/60 text-sm mt-1">Inicia sesión en tu cuenta</p>
        </div>

        {!showReset ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 text-sm">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 pl-10 h-12 rounded-xl focus-visible:ring-[hsl(var(--accent-orange))] focus-visible:border-[hsl(var(--accent-orange))]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 text-sm">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 pl-10 pr-10 h-12 rounded-xl focus-visible:ring-[hsl(var(--accent-orange))] focus-visible:border-[hsl(var(--accent-orange))]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs text-white/50 hover:text-[hsl(var(--accent-orange))] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white shadow-lg hover:shadow-[0_0_30px_hsl(var(--accent-orange)/0.4)] transition-all"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Iniciar sesión
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-white/50 text-sm">
                ¿No tienes cuenta?{' '}
                <Link to="/registro" className="text-[hsl(var(--accent-orange))] hover:underline font-medium">
                  Crear cuenta
                </Link>
              </p>
              {/* Demo accesible via Ctrl+Shift+D */}
            </div>
          </>
        ) : (
          /* Inline password reset */
          <form onSubmit={handleResetPassword} className="space-y-5">
            <p className="text-white/70 text-sm text-center">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 pl-10 h-12 rounded-xl focus-visible:ring-[hsl(var(--accent-orange))]"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white"
              disabled={resetLoading}
            >
              {resetLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Enviar enlace
            </Button>
            <button
              type="button"
              onClick={() => setShowReset(false)}
              className="w-full text-center text-white/50 text-sm hover:text-white/70 transition-colors"
            >
              ← Volver al login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
