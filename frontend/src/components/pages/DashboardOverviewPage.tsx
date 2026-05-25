import { useState, useEffect } from 'react';
import { Avatar, fmtMXN } from '../pika/atoms';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap, Rocket, MessageSquare, Check, Coins, Clock, X, Landmark, Lock } from 'lucide-react';
import { useAppStore } from '@/store';

export default function DashboardOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();

  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [paidRequests, setPaidRequests] = useState<any[]>([]);
  const [clabeRegistered, setClabeRegistered] = useState(false);
  const [isClabeModalOpen, setIsClabeModalOpen] = useState(false);
  const [clabeInput, setClabeInput] = useState('');
  const [registeringClabe, setRegisteringClabe] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || 'Mariana Báez');
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('pika-auth-token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch User profile
      const userRes = await fetch('https://isw6kd7ljtiew2p41enfegtz.45.132.242.102.sslip.io/api/v1/me', { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setProfileName(userData.displayName || userData.fullName || userData.name || user?.name || 'Mariana Báez');
      }

      // Fetch Receiving Accounts to check CLABE registration
      const accountsRes = await fetch('https://isw6kd7ljtiew2p41enfegtz.45.132.242.102.sslip.io/api/v1/receiving-accounts', { headers });
      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        const hasClabe = accounts.some((acc: any) => acc.accountType === 'clabe' || acc.accountType === 'dimo_phone');
        setClabeRegistered(hasClabe);
      }

      // Fetch Requests
      const reqsRes = await fetch('https://isw6kd7ljtiew2p41enfegtz.45.132.242.102.sslip.io/api/v1/requests', { headers });
      if (reqsRes.ok) {
        const reqs = await reqsRes.json();
        // Filter requests
        const pending = reqs.filter((r: any) => r.status === 'pending');
        const paid = reqs.filter((r: any) => r.status === 'paid');
        
        setActiveRequests(pending.map((r: any) => ({
          id: r.requestId,
          concept: r.concept,
          amount: r.amountCents / 100,
          requester: 'Mariana Báez',
          expires: 'En 7 días',
          code: r.publicSlug
        })));

        setPaidRequests(paid.map((r: any) => ({
          id: r.requestId,
          concept: r.concept,
          amount: r.amountCents / 100,
          payer: 'Payer verificado',
          date: new Date(r.updatedAt || r.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
          receipt: r.qrAssetId
        })));
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateRequest = () => {
    navigate('/app/requests/new');
  };

  const handleShareWhatsApp = (req: any) => {
    const text = encodeURIComponent(`Te mandé un Pika por ${fmtMXN(req.amount)} para ${req.concept}.\nPágalo aquí: ${window.location.origin}/p/${req.code}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRegisterClabe = async () => {
    const digitsOnly = clabeInput.replace(/\D/g, '');
    if (digitsOnly.length !== 18) {
      alert('La CLABE debe tener exactamente 18 dígitos numéricos');
      return;
    }
    setRegisteringClabe(true);
    try {
      const token = localStorage.getItem('pika-auth-token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('https://isw6kd7ljtiew2p41enfegtz.45.132.242.102.sslip.io/api/v1/receiving-accounts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountType: 'clabe',
          identifier: digitsOnly
        })
      });
      if (response.ok) {
        setClabeRegistered(true);
        setIsClabeModalOpen(false);
        setClabeInput('');
        alert('¡CLABE vinculada con éxito para tus cobros Pika!');
        loadDashboardData();
      } else {
        const errorData = await response.json();
        alert('Hubo un error al registrar la CLABE: ' + (errorData.error || 'Intenta de nuevo'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al registrar la CLABE. Asegúrate de tener conexión.');
    } finally {
      setRegisteringClabe(false);
    }
  };

  return (
    <div className="w-full text-foreground pb-24 relative bg-transparent">
      {/* ── HEADER ── */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3">
          <Avatar name={profileName} size={40} />
          <div>
            <span className="text-xs text-muted-foreground block font-semibold">Hola,</span>
            <span className="text-base font-bold text-foreground">{profileName}</span>
          </div>
        </div>
        <button
          onClick={handleCreateRequest}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow transition-transform active:scale-95"
          title="Nuevo cobro"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center text-center p-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">Cargando tu dashboard Pika...</p>
        </div>
      ) : (
        <div className="px-6 space-y-6 max-w-lg mx-auto">
          {/* ── CALL TO ACTION HERO ── */}
          <div className="bg-gradient-to-br from-primary to-primary-glow text-white rounded-[28px] p-6 relative overflow-hidden shadow-lg border border-primary/20">
            <div className="relative z-10 flex flex-col items-start">
              <span className="text-xs font-mono uppercase tracking-wider text-white/80 mb-2">Pika MX</span>
              <h2 className="text-2xl font-bold font-display leading-[1.1] tracking-tight mb-2">¿Te deben una lana?</h2>
              <p className="text-sm text-white/85 leading-relaxed max-w-xs mb-5 font-medium">
                Crea un cobro rápido y compártelo por WhatsApp. Tus amigos pagan de volada por SPEI o DiMo.
              </p>
              <button
                onClick={handleCreateRequest}
                className="px-6 py-3 bg-[#FFC52E] hover:bg-[#FFD65C] text-[#17102A] font-extrabold rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                Nuevo Pika <Zap className="w-4 h-4 fill-current text-[#17102A] shrink-0" />
              </button>
            </div>
          </div>

          {/* ── ACTIVATION CHECKLIST ── */}
          <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-[#17102A] mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-neutral-400" /> Tu activación
            </h3>
            <div className="space-y-3.5">
              {(() => {
                const tasks = [
                  { label: 'Crea tu perfil en Pika', done: true, onClick: null },
                  { label: 'Vincula tu número de celular', done: true, onClick: null },
                  { label: 'Registra tu CLABE para recibir', done: clabeRegistered, onClick: () => { if (!clabeRegistered) setIsClabeModalOpen(true); } },
                  { label: 'Recibe tu primer cobro Pika', done: paidRequests.length > 0, onClick: null },
                ];
                
                const firstActiveIdx = tasks.findIndex(t => !t.done);
                
                return tasks.map((task, idx) => {
                  let circleClass = '';
                  let textClass = '';
                  let wrapperClass = 'flex items-center gap-3 text-sm font-semibold transition-all';
                  
                  if (task.done) {
                    circleClass = 'bg-emerald-500/10 text-emerald-600';
                    textClass = 'text-neutral-400 line-through opacity-60';
                  } else if (idx === firstActiveIdx) {
                    circleClass = 'bg-primary/10 text-primary border border-primary/20';
                    textClass = 'text-primary font-bold underline decoration-dotted decoration-primary/45';
                    if (task.onClick) {
                      wrapperClass += ' cursor-pointer hover:bg-neutral-50 p-2 -m-2 rounded-xl border border-dashed border-transparent hover:border-primary/20';
                    }
                  } else {
                    circleClass = 'bg-neutral-100 text-neutral-400 border border-neutral-200';
                    textClass = 'text-neutral-400 font-normal';
                  }
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={task.onClick || undefined}
                      className={wrapperClass}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${circleClass}`}>
                        {task.done ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                      </span>
                      <span className={textClass}>
                        {task.label}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* ── ACTIVE COBROS (PENDING REQUESTS) ── */}
          <div>
            <h3 className="text-base font-extrabold text-[#17102A] mb-3 px-1 flex items-center justify-between">
              <span>Cobros activos</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-bold">{activeRequests.length}</span>
            </h3>

            {activeRequests.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E5E7EB] rounded-[28px] p-8 text-center text-neutral-400 flex flex-col items-center">
                <Coins className="w-10 h-10 text-neutral-300 mb-2" />
                <p className="text-xs font-semibold">No tienes cobros activos.</p>
                <button
                  onClick={handleCreateRequest}
                  className="mt-2 text-xs text-primary font-bold underline"
                >
                  Crear uno nuevo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeRequests.map((req) => (
                  <div key={req.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#17102A]">{req.concept}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-semibold">
                        <span>Para: {req.requester}</span>
                        <span>•</span>
                        <span>{req.expires}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <span className="block text-base font-black font-display text-[#17102A] font-mono-number">{fmtMXN(req.amount)}</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-200/40 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pendiente
                        </span>
                      </div>
                      <button
                        onClick={() => handleShareWhatsApp(req)}
                        className="w-9 h-9 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-sm transition-colors"
                        title="Compartir por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PAID HISTORY ── */}
          <div>
            <h3 className="text-base font-extrabold text-[#17102A] mb-3 px-1">
              Historial de cobros
            </h3>

            {paidRequests.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6 text-center text-neutral-400 flex flex-col items-center shadow-sm">
                <Clock className="w-8 h-8 text-neutral-300 mb-2" />
                <p className="text-xs font-semibold">Aún no se ha completado ningún cobro.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-3 shadow-sm divide-y divide-neutral-100">
                {paidRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between py-3 px-3">
                     <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </span>
                      <div>
                        <h4 className="text-sm font-extrabold text-[#17102A]">{req.concept}</h4>
                        <span className="text-[11px] text-neutral-400 font-semibold">{req.payer} • {req.date}</span>
                      </div>
                    </div>
                    <span className="text-sm font-black font-display text-emerald-600 font-mono-number">{fmtMXN(req.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CLABE REGISTRATION MODAL ── */}
      {isClabeModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-card rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-border">
            <button
              onClick={() => setIsClabeModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-6 flex flex-col items-center">
              <Landmark className="w-10 h-10 text-primary mb-2" />
              <h3 className="text-lg font-black text-foreground mt-2">Registrar CLABE de Recibo</h3>
              <p className="text-xs text-muted-foreground mt-1 font-semibold">
                Ingresa tu CLABE interbancaria de 18 dígitos para poder recibir transferencias de inmediato.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-2xl p-4">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">CLABE Interbancaria (18 dígitos)</label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="000000000000000000"
                  value={clabeInput}
                  onChange={e => setClabeInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-base font-mono font-bold tracking-widest outline-none border-none bg-transparent text-foreground"
                />
              </div>

              <div className="text-[10px] text-muted-foreground font-semibold leading-relaxed p-3 bg-muted/50 rounded-xl flex items-center gap-2 border border-border/40">
                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Tus datos están protegidos. Pika solo orquesta las transferencias directas a tu banco.</span>
              </div>

              <button
                onClick={handleRegisterClabe}
                disabled={clabeInput.length !== 18 || registeringClabe}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black rounded-full text-sm shadow transition-all flex items-center justify-center gap-2"
              >
                {registeringClabe ? 'Guardando...' : (
                  <span className="flex items-center gap-1.5 justify-center">
                    Vincular cuenta <Zap className="w-4 h-4 text-primary-foreground shrink-0" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
