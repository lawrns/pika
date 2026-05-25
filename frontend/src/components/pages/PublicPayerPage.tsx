import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, fmtMXN } from '../pika/atoms';
import { Check, Lock, Zap, FileText, AlertCircle, QrCode } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://isw6kd7ljtiew2p41enfegtz.45.132.242.102.sslip.io/api/v1').replace(/\/$/, '');

type RequestInfo = {
  requesterName: string;
  requesterVerified: boolean;
  amount: number;
  concept: string;
  expiresAt: string;
};

type PaymentIntent = {
  paymentId: string;
  status: string;
  instructions?: { method?: string; clabe?: string; reference?: string; beneficiary?: string; expiresAt?: string };
  qrPayload?: string;
  receiptUrl?: string;
  providerPaymentRef?: string;
};

export default function PublicPayerPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'paying' | 'instructions' | 'error'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/requests/${encodeURIComponent(slug || '')}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'No se encontró este cobro Pika.');
        setRequestInfo({
          requesterName: data.requesterName,
          requesterVerified: data.requesterVerified ?? true,
          amount: Number(data.amountCents) / 100,
          concept: data.concept,
          expiresAt: data.expiresAt
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el cobro.');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug]);

  const handlePay = async () => {
    setStatus('paying');
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/public/requests/${encodeURIComponent(slug || '')}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar el pago.');
      setPaymentIntent(data);
      setStatus('instructions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el pago.');
      setStatus('error');
    }
  };

  const handleReceipt = () => {
    if (paymentIntent?.paymentId) navigate(`/paid/${paymentIntent.paymentId}`);
  };

  return (
    <div className="w-full min-h-screen bg-muted/40 text-foreground flex flex-col justify-between pb-12">
      <header className="px-6 pt-12 pb-4 bg-card border-b border-border flex items-center justify-center">
        <span className="text-sm font-extrabold text-foreground">Capa de Pago Segura Pika</span>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">Cargando cobro Pika...</p>
        </div>
      ) : status === 'error' || !requestInfo ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4"><AlertCircle className="w-7 h-7" /></div>
          <h2 className="text-xl font-black font-display text-foreground mb-2">No pudimos continuar</h2>
          <p className="text-sm text-muted-foreground font-semibold leading-relaxed">{error || 'Este enlace no está disponible.'}</p>
        </div>
      ) : (
        <>
          {status === 'pending' && (
            <div className="flex-1 flex flex-col justify-between px-6 pt-8 max-w-sm mx-auto w-full">
              <div className="bg-card border border-border rounded-[28px] p-6 shadow-md text-center flex flex-col items-center">
                <Avatar name={requestInfo.requesterName} size={64} ring />
                <div className="flex items-center gap-1.5 mt-3 justify-center">
                  <span className="text-sm font-black text-foreground">{requestInfo.requesterName}</span>
                  {requestInfo.requesterVerified && <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-0.5 rounded-full flex items-center justify-center border border-emerald-200/40 dark:border-emerald-500/25" title="Verificado"><Check className="w-3 h-3 stroke-[3]" /></span>}
                </div>
                <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider block mt-1">te está cobrando</span>
                <div className="font-display font-black text-5xl text-foreground tracking-tight my-5">{fmtMXN(requestInfo.amount)}</div>
                <div className="bg-muted rounded-2xl py-3 px-4 w-full text-center"><span className="text-xs text-muted-foreground block font-semibold">Concepto</span><span className="text-sm font-bold text-foreground/90">{requestInfo.concept}</span></div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-start gap-3"><Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" /><div className="text-xs text-primary leading-relaxed font-semibold"><strong>Pagas directo desde tu banco</strong>. Pika genera instrucciones SPEI y espera confirmación del riel bancario.</div></div>
                <button onClick={handlePay} className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-full text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">Pagar ahora <Zap className="w-5 h-5 fill-current shrink-0 text-primary-foreground" /></button>
                <span className="text-[10px] text-muted-foreground font-bold block text-center uppercase tracking-wider">Sin éxito visual hasta confirmación real</span>
              </div>
            </div>
          )}

          {status === 'paying' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
              <h2 className="text-xl font-black font-display text-foreground mb-2">Generando instrucciones SPEI...</h2>
              <p className="text-sm text-muted-foreground max-w-xs font-semibold leading-relaxed">Pika está creando una intención de pago verificable.</p>
            </div>
          )}

          {status === 'instructions' && paymentIntent && (
            <div className="flex-1 flex flex-col justify-between px-6 pt-10 max-w-sm mx-auto w-full">
              <div className="bg-card border border-border rounded-[28px] p-6 shadow-md text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4"><QrCode className="w-8 h-8" /></div>
                <h2 className="text-2xl font-black font-display text-foreground mb-2">Instrucciones SPEI listas</h2>
                <p className="text-sm text-muted-foreground font-semibold mb-5">Completa la transferencia en tu banco. El recibo se activa cuando el proveedor confirme el pago.</p>
                <div className="space-y-3 text-left text-sm bg-muted rounded-2xl p-4">
                  <div><span className="text-muted-foreground font-bold block">CLABE</span><span className="font-mono font-black">{paymentIntent.instructions?.clabe || 'Pendiente'}</span></div>
                  <div><span className="text-muted-foreground font-bold block">Referencia</span><span className="font-mono font-black">{paymentIntent.instructions?.reference || paymentIntent.providerPaymentRef}</span></div>
                  <div><span className="text-muted-foreground font-bold block">Monto</span><span className="font-black">{fmtMXN(requestInfo.amount)}</span></div>
                </div>
              </div>
              <div className="relative z-10 space-y-3">
                <button onClick={handleReceipt} className="w-full py-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black rounded-full text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-border">Ver estado / recibo <FileText className="w-5 h-5 fill-current shrink-0 text-secondary-foreground" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
