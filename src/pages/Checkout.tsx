import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, CreditCard, Loader2, Lock, MapPin, User } from "lucide-react";
import FloatingOrb from "@/components/landing/FloatingOrb";
import { getPlan, planFromCheckoutSlug, PLANS as PLAN_CONFIGS } from "@/config/plans";

// Plan configs (derived from central source of truth)
const PLANS: Record<string, { name: string; price: number; priceLabel: string; features: string[] }> = Object.fromEntries(
  Object.values(PLAN_CONFIGS)
    .filter((p) => p.price > 0)
    .map((p) => [
      p.checkoutSlug,
      { name: p.name, price: p.price, priceLabel: p.priceLabel, features: p.features },
    ]),
);

// Masks
const maskCPF = (v: string) => v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskCEP = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
const maskCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
const maskExpiry = (v: string) => v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");

// Validations
function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export default function Checkout() {
  const { plan } = useParams<{ plan: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const selectedPlan = plan ? PLANS[plan] : null;

  // Form state
  const [cpf, setCpf] = useState("");
  const [billingName, setBillingName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  // Redirect if invalid plan
  useEffect(() => {
    if (plan && !PLANS[plan]) navigate("/");
  }, [plan, navigate]);

  // CEP auto-fill
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then(r => r.json())
        .then(data => {
          if (!data.erro) {
            setEndereco(data.logradouro || "");
            setBairro(data.bairro || "");
            setCidade(data.localidade || "");
            setEstado(data.uf || "");
          }
        })
        .catch(() => {});
    }
  }, [cep]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!billingName.trim()) e.billingName = "Nome obrigatório";
    if (!validateCPF(cpf)) e.cpf = "CPF inválido";
    if (cep.replace(/\D/g, "").length !== 8) e.cep = "CEP inválido";
    if (!endereco.trim()) e.endereco = "Endereço obrigatório";
    if (!numero.trim()) e.numero = "Número obrigatório";
    if (!bairro.trim()) e.bairro = "Bairro obrigatório";
    if (!cidade.trim()) e.cidade = "Cidade obrigatória";
    if (!estado.trim()) e.estado = "Estado obrigatório";
    if (!cardHolderName.trim()) e.cardHolderName = "Nome no cartão obrigatório";
    if (!luhnCheck(cardNumber)) e.cardNumber = "Número do cartão inválido";
    const expiryParts = expiry.split("/");
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) e.expiry = "Validade inválida";
    if (cvv.length < 3 || cvv.length > 4) e.cvv = "CVV inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user || !plan) return;

    setLoading(true);
    try {
      const expiryParts = expiry.split("/");
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          userId: user.id,
          plan,
          cpf,
          billingName,
          whatsapp,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cardHolderName,
          cardNumber: cardNumber.replace(/\s/g, ""),
          expiryMonth: expiryParts[0],
          expiryYear: "20" + expiryParts[1],
          cvv,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Poll payment status
      setPolling(true);
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const { data: statusData } = await supabase.functions.invoke("check-payment-status");
          if (statusData?.status === "ACTIVE") {
            clearInterval(pollInterval);
            setPolling(false);
            toast({ title: "Assinatura ativada! 🎉", description: `Seu plano ${selectedPlan?.name} está ativo.` });
            navigate("/dashboard");
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPolling(false);
            toast({ title: "Pagamento em processamento", description: "Seu pagamento está sendo processado. Você será notificado quando for confirmado." });
            navigate("/dashboard");
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPolling(false);
            navigate("/dashboard");
          }
        }
      }, 2000);

    } catch (err: any) {
      toast({ title: "Erro no pagamento", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (!selectedPlan) return null;

  const isProcessing = loading || polling;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-8 text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-display font-light leading-[1.05]">
              Finalizar assinatura
            </h1>

            {/* Personal Data */}
            <Card className="glass-card border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-primary" /> Dados pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="billingName">Nome completo</Label>
                  <Input id="billingName" value={billingName} onChange={e => setBillingName(e.target.value)} placeholder="Seu nome completo" className="mt-1.5 bg-background/50" />
                  {errors.billingName && <p className="text-xs text-destructive mt-1">{errors.billingName}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" value={cpf} onChange={e => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" className="mt-1.5 bg-background/50" />
                    {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                    <Input id="whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+55 11 99999-9999" className="mt-1.5 bg-background/50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="glass-card border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-primary" /> Endereço de cobrança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" value={cep} onChange={e => setCep(maskCEP(e.target.value))} placeholder="00000-000" className="mt-1.5 bg-background/50" />
                    {errors.cep && <p className="text-xs text-destructive mt-1">{errors.cep}</p>}
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input id="estado" value={estado} onChange={e => setEstado(e.target.value)} placeholder="SP" maxLength={2} className="mt-1.5 bg-background/50" />
                    {errors.estado && <p className="text-xs text-destructive mt-1">{errors.estado}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="endereco">Logradouro</Label>
                  <Input id="endereco" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, Avenida..." className="mt-1.5 bg-background/50" />
                  {errors.endereco && <p className="text-xs text-destructive mt-1">{errors.endereco}</p>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" className="mt-1.5 bg-background/50" />
                    {errors.numero && <p className="text-xs text-destructive mt-1">{errors.numero}</p>}
                  </div>
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input id="complemento" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Sala 101" className="mt-1.5 bg-background/50" />
                  </div>
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Centro" className="mt-1.5 bg-background/50" />
                    {errors.bairro && <p className="text-xs text-destructive mt-1">{errors.bairro}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo" className="mt-1.5 bg-background/50" />
                  {errors.cidade && <p className="text-xs text-destructive mt-1">{errors.cidade}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Card Data */}
            <Card className="glass-card border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 font-medium">
                  <CreditCard className="h-4 w-4 text-primary" /> Dados do cartão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cardHolderName">Nome no cartão</Label>
                  <Input id="cardHolderName" value={cardHolderName} onChange={e => setCardHolderName(e.target.value.toUpperCase())} placeholder="NOME COMO ESTÁ NO CARTÃO" className="mt-1.5 bg-background/50" />
                  {errors.cardHolderName && <p className="text-xs text-destructive mt-1">{errors.cardHolderName}</p>}
                </div>
                <div>
                  <Label htmlFor="cardNumber">Número do cartão</Label>
                  <Input id="cardNumber" value={cardNumber} onChange={e => setCardNumber(maskCard(e.target.value))} placeholder="0000 0000 0000 0000" className="mt-1.5 bg-background/50" />
                  {errors.cardNumber && <p className="text-xs text-destructive mt-1">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Validade</Label>
                    <Input id="expiry" value={expiry} onChange={e => setExpiry(maskExpiry(e.target.value))} placeholder="MM/AA" className="mt-1.5 bg-background/50" />
                    {errors.expiry && <p className="text-xs text-destructive mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" type="password" className="mt-1.5 bg-background/50" />
                    {errors.cvv && <p className="text-xs text-destructive mt-1">{errors.cvv}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={isProcessing} className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90">
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {polling ? "Confirmando pagamento..." : "Processando..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Assinar {selectedPlan.name} — {selectedPlan.priceLabel}
                </span>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Pagamento seguro processado via Asaas. Seus dados estão protegidos.
            </p>
          </form>

          {/* Plan Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg font-display font-light">{selectedPlan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">R${selectedPlan.price}</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Assinatura mensal recorrente</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {selectedPlan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-border/40">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total mensal</span>
                    <span className="font-semibold">R${selectedPlan.price},00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
