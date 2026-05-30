import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PikaWordmark, fmtMXN } from '../pika/atoms';
import { Check, Zap, Clock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { publicApi } from '@/lib/api';
import { LoadingState } from '@/components/ui/loading-state';

type Receipt = {
  paymentId: string;
  amountCents: number;
  currency: string;
  concept: string;
  status: string;
  provider?: string;
  providerPaymentRef?: string;
  traceId?: string | null;
  paidAt?: string;
  requesterName?: string;
};

const CONFIRMED = new Set(['confirmed', 'paid', 'completed']);
const FAILED = new Set(['failed', 'reversed', 'cancelled']);

export default function ConfirmationPage() {
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Display fallbacks from the originating link (never used to assert "paid").
  const fallbackAmount = parseFloat(searchParams.get('amount') || '0');
  const fallbackConcept = searchParams.get('concept') || 'Pago Pika';
  const fallbackName = searchParams.get('name') || 'Pika merchant';

  const fetchReceipt = async (isRefresh = false) => {
    if (!paymentId) { setError('Pago no encontrado.'); setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    const result = await publicApi.receipt(paymentId);
    if (result.data) {
      setReceipt(result.data);
      setError('');
    } else {
      setError(result.error || 'No se pudo cargar el estado del pago.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchReceipt(); /* eslint-disable-next-line */ }, [paymentId]);

  // While awaiting the provider rail, poll a few times so a confirmation surfaces.
  useEffect(() => {
    if (!receipt) return;
    const status = (receipt.status || '').toLowerCase();
    if (CONFIRMED.has(status) || FAILED.has(status)) return;
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      if (count > 10) { clearInterval(id); return; }
      fetchReceipt(true);
    }, 5000);
    return () => clearInterval(id);
  }, [receipt?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = (receipt?.status || '').toLowerCase();
  const isConfirmed = CONFIRMED.has(status);
  const isFailed = FAILED.has(status);
  const amount = receipt ? receipt.amountCents / 100 : fallbackAmount;
  const concept = receipt?.concept || fallbackConcept;
  const requesterName = receipt?.requesterName || fallbackName;

  const timestamp = receipt?.paidAt
    ? new Date(receipt.paidAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full min-h-screen bg-muted/40 text-foreground flex flex-col justify-between pb-12">
      <header className="px-6 pt-12 pb-4 bg-card border-b border-border flex items-center justify-center">
        <PikaWordmark height={24} color="var(--primary)" />
      </header>

      <div className="flex-1 flex flex-col justify-between px-6 pt-8 max-w-sm mx-auto w-full">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <LoadingState message="Consultando el estado de tu pago..." />
          </div>
        ) : error && !receipt ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4"><AlertCircle className="w-7 h-7" /></div>
            <h2 className="text-xl font-black font-display text-foreground mb-2">No pudimos cargar el recibo</h2>
            <p className="text-sm text-muted-foreground font-semibold">{error}</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-[28px] p-6 shadow-md">
            <div className="text-center border-b border-border pb-4 mb-4">
              {isConfirmed ? (
                <span className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-200/40">
                  <Check className="w-6 h-6 stroke-[3]" />
                </span>
              ) : isFailed ? (
                <span className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2 border border-red-200/40">
                  <AlertCircle className="w-6 h-6" />
                </span>
              ) : (
                <span className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-200/40">
                  <Clock className="w-6 h-6" />
                </span>
              )}
              <h2 className="text-lg font-black text-foreground">
                {isConfirmed ? 'Pago confirmado' : isFailed ? 'Pago no completado' : 'Esperando confirmación'}
              </h2>
              <span className="text-[11px] text-muted-foreground font-semibold">{timestamp}</span>
            </div>

            {!isConfirmed && !isFailed && (
              <div className="bg-amber-50 border border-amber-200/50 text-amber-700 rounded-2xl p-3 text-xs font-semibold leading-relaxed mb-4 flex gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Completa la transferencia SPEI en tu banco. Pika confirmará el pago automáticamente cuando el riel bancario lo liquide.</span>
              </div>
            )}

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Monto</span>
                <span className="font-display font-black text-foreground">{fmtMXN(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Concepto</span>
                <span className="font-bold text-foreground/90">{concept}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Para</span>
                <span className="font-bold text-foreground/90">{requesterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Institución</span>
                <span className="font-bold text-foreground/90">Pika SPEI Rail</span>
              </div>
              {receipt?.providerPaymentRef && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Referencia</span>
                  <span className="font-mono text-muted-foreground font-bold text-xs">{receipt.providerPaymentRef}</span>
                </div>
              )}
              {receipt?.traceId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Clave de Rastreo</span>
                  <span className="font-mono text-muted-foreground font-bold text-xs">{receipt.traceId}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Estado</span>
                {isConfirmed ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/40">Liquidado</span>
                ) : isFailed ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold border border-red-200/40">No completado</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-200/40">Pendiente</span>
                )}
              </div>
            </div>

            {!isConfirmed && !isFailed && (
              <button
                onClick={() => fetchReceipt(true)}
                disabled={refreshing}
                className="w-full mt-5 py-3 bg-muted hover:bg-muted/70 text-foreground font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                aria-label="Actualizar estado del pago"
              >
                {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Actualizar estado
              </button>
            )}
          </div>
        )}

        {/* ── GROWTH LOOP PROMPT ── */}
        <div className="space-y-4 mt-6">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl p-5 shadow text-center flex flex-col items-center">
            <h3 className="font-display font-black text-lg mb-1 flex items-center gap-1.5 justify-center">Mándame un Pika <Zap className="w-5 h-5 fill-current shrink-0" /></h3>
            <p className="text-xs text-primary-foreground/80 leading-relaxed mb-4">
              ¿Te deben lana a ti también? Crea tus propios enlaces de cobro gratis en un tap.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-white hover:bg-neutral-100 text-primary font-black rounded-full text-xs shadow-md transition-all active:scale-95"
            >
              Crear mi Pika gratis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
