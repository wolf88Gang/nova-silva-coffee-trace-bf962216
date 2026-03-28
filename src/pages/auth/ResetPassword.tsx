import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgLogin from '@/assets/bg-login-aerial-tech.jpg';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase sets session from the URL hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    // Check if already in a session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
        <img src={bgLogin} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img src={logoNovasilva} alt="Nova Silva" className="h-16 w-16 object-contain mb-4" />
          <h1 className="text-xl font-bold text-white">Restablecer contraseña</h1>
          <p className="text-white/60 text-sm mt-1">Elige tu nueva contraseña</p>
        </div>

        {done ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto" />
            <p className="text-white font-medium">Contraseña actualizada</p>
            <p className="text-white/50 text-sm">Redirigiendo al login…</p>
          </div>
        ) : !sessionReady ? (
          <div className="text-center space-y-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-white/50 mx-auto" />
            <p className="text-white/60 text-sm">Verificando enlace…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 pl-10 pr-10 h-12 rounded-xl focus-visible:ring-[hsl(var(--accent-orange))]"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 pl-10 h-12 rounded-xl focus-visible:ring-[hsl(var(--accent-orange))]"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              Guardar contraseña
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
