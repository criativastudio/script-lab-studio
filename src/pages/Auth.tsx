import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Scale } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">FlowTech</h1>
          </div>
          <p className="text-muted-foreground flex items-center justify-center gap-1">
            <MessageSquare className="h-4 w-4" />
            IA para Advogados via WhatsApp
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Entrar" : "Criar conta"}</CardTitle>
            <CardDescription>
              {isLogin ? "Acesse seu dashboard" : "Comece a usar o FlowTech"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. João Silva" required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" className="text-sm text-primary hover:underline" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
