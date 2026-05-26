import { useSearchParams, useNavigate } from 'react-router-dom';
import { PikaWordmark, fmtMXN } from '../pika/atoms';
import { Check, Zap } from 'lucide-react';

export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const amount = parseFloat(searchParams.get('amount') || '0');
  const concept = searchParams.get('concept') || 'Pago de servicio';
  const name = searchParams.get('name') || 'Pika User';
  const timestamp = new Date().toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const speiTrace = '102605' + Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="w-full min-h-screen bg-muted/40 text-foreground flex flex-col justify-between pb-12">
      {/* ── HEADER ── */}
      <header className="px-6 pt-12 pb-4 bg-card border-b border-border flex items-center justify-center">
        <PikaWordmark height={24} color="var(--primary)" />
      </header>

      {/* ── RECEIPT CONTENT ── */}
      <div className="flex-1 flex flex-col justify-between px-6 pt-8 max-w-sm mx-auto w-full">
        <div className="bg-card border border-border rounded-[28px] p-6 shadow-md">
          <div className="text-center border-b border-border pb-4 mb-4">
            <span className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-200/40 dark:border-emerald-500/25">
              <Check className="w-6 h-6 stroke-[3]" />
            </span>
            <h2 className="text-lg font-black text-foreground">Recibo de Transferencia</h2>
            <span className="text-[11px] text-muted-foreground font-semibold">{timestamp}</span>
          </div>

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
              <span className="text-muted-foreground font-semibold">Destinatario</span>
              <span className="font-bold text-foreground/90">{name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Institución</span>
              <span className="font-bold text-foreground/90">Pika SPEI Rail</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Clave de Rastreo</span>
              <span className="font-mono text-muted-foreground font-bold text-xs">{speiTrace}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Estado CEP</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/40 dark:border-emerald-500/25">Liquidado</span>
            </div>
          </div>
        </div>

        {/* ── GROWTH LOOP PROMPT ── */}
        <div className="space-y-4">
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

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-background border border-border hover:bg-muted text-foreground font-bold rounded-full text-sm shadow transition-all active:scale-95"
          >
            Volver a la App
          </button>
        </div>
      </div>
    </div>
  );
}
