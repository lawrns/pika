import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmtMXN } from '../pika/atoms';
import { requestsApi, type PaymentRequest } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Plus, MessageSquare, Link as LinkIcon, Coins, Check, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

type Filter = 'all' | 'pending' | 'paid';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  expired: 'Expirado',
  cancelled: 'Cancelado',
  failed: 'Fallido',
};

function statusClasses(status: string) {
  if (status === 'paid') return 'bg-emerald-50 text-emerald-600 border-emerald-200/40';
  if (status === 'pending') return 'bg-amber-50 text-amber-600 border-amber-200/40';
  if (status === 'failed') return 'bg-red-50 text-red-600 border-red-200/40';
  return 'bg-neutral-100 text-neutral-500 border-neutral-200';
}

export default function CobrosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = async () => {
    const result = await requestsApi.list();
    if (result.data) {
      setRequests([...result.data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else if (result.error) {
      toast({ title: result.error, variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    paid: requests.filter(r => r.status === 'paid').length,
  }), [requests]);

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const handleShare = async (req: PaymentRequest) => {
    requestsApi.share(req.requestId, 'whatsapp').catch(() => {});
    const text = `Te mandé un Pika por ${fmtMXN(req.amount)} para ${req.concept}.\nPágalo aquí: ${req.publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopy = async (req: PaymentRequest) => {
    await navigator.clipboard.writeText(req.publicUrl);
    requestsApi.share(req.requestId, 'copy_link').catch(() => {});
    toast({ title: '¡Enlace de cobro copiado!' });
  };

  const handleRemind = async (req: PaymentRequest) => {
    const result = await requestsApi.remind(req.requestId, 'whatsapp');
    if (result.error) toast({ title: result.error, variant: 'destructive' });
    else toast({ title: 'Recordatorio enviado' });
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'paid', label: 'Pagados' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-neutral-800 tracking-tight">Cobros</h1>
          <p className="text-neutral-500 font-semibold text-sm mt-1">
            Todos tus enlaces de cobro Pika y su estado de pago
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/requests/new')}
          className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-4 w-4 stroke-[3.5]" />
          Nuevo cobro
        </button>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="inline-flex items-center gap-1 bg-white border border-black/5 rounded-full p-1 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5',
              filter === tab.key ? 'bg-primary text-white shadow' : 'text-neutral-500 hover:bg-neutral-100'
            )}
          >
            {tab.label}
            <span className={cn('px-1.5 py-0.5 rounded-full text-[10px]', filter === tab.key ? 'bg-white/20' : 'bg-neutral-100')}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState message="Cargando tus cobros..." />
      ) : visible.length === 0 ? (
        <div className="bg-white border border-dashed border-black/10 rounded-[32px] p-12 text-center flex flex-col items-center">
          <Coins className="w-12 h-12 text-primary/25 mb-3" />
          <h4 className="text-sm font-extrabold text-neutral-700">
            {filter === 'paid' ? 'Aún no tienes cobros pagados' : filter === 'pending' ? 'No tienes cobros pendientes' : 'Aún no creas ningún cobro'}
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed font-semibold max-w-xs mt-1 mb-6">
            Crea un cobro y compártelo por WhatsApp para que te paguen por SPEI o DiMo.
          </p>
          <button
            onClick={() => navigate('/dashboard/requests/new')}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-black rounded-full text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[3.5]" />
            Crear un cobro
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(req => (
            <div key={req.requestId} className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                  req.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                )}>
                  {req.status === 'paid' ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Coins className="w-5 h-5" />}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-neutral-800 truncate">{req.concept}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full border font-bold text-[10px]', statusClasses(req.status))}>
                      {STATUS_LABEL[req.status] || req.status}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-semibold">
                      {new Date(req.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-base font-black font-display text-neutral-800">{fmtMXN(req.amount)}</span>
                {req.status === 'pending' && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => handleShare(req)} aria-label="Compartir por WhatsApp" className="w-9 h-9 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCopy(req)} aria-label="Copiar enlace" className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemind(req)} aria-label="Enviar recordatorio" className="w-9 h-9 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 flex items-center justify-center transition-colors">
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
