import { useState } from 'react';
import { useAppStore } from '@/store';
import { fmtMXN } from '../pika/atoms';
import { useToast } from '@/components/ui/use-toast';
import { walletApi } from '@/lib/api';
import { 
  ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, 
  Banknote, Clock, AlertCircle, Plus, Minus, Loader2, Landmark, X, Zap, Shield
} from 'lucide-react';

export default function WalletPage() {
  const { wallet, updateBalance, addTransaction } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount] = useState('**** 8943');

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Por favor ingresa un monto válido', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const result = await walletApi.addFunds(amount, paymentMethod);
    
    if (result.data) {
      updateBalance(amount);
      addTransaction(result.data.transaction);
      toast({ 
        title: '¡Fondos agregados!',
        description: `Se han añadido ${fmtMXN(amount)} a tu cuenta Pika.`
      });
      setIsAddFundsOpen(false);
      setAddAmount('');
    } else {
      toast({ title: result.error || 'No se pudieron añadir los fondos', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Por favor ingresa un monto válido', variant: 'destructive' });
      return;
    }

    if (amount > wallet.balance) {
      toast({ title: 'Fondos insuficientes en tu balance', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const result = await walletApi.withdraw(amount, bankAccount);
    
    if (result.data) {
      updateBalance(-amount);
      addTransaction(result.data.transaction);
      toast({ 
        title: 'Retiro en proceso',
        description: `Se transferirán ${fmtMXN(amount)} a tu cuenta de banco vinculada.`
      });
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
    } else {
      toast({ title: result.error || 'No se pudo procesar el retiro', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-[#17102A] tracking-tight">Mi Billetera</h1>
        <p className="text-neutral-400 font-semibold text-sm mt-1">
          Gestiona tus fondos y métodos de recepción SPEI / CoDi
        </p>
      </div>

      {/* ── CARD HERO ── */}
      <div className="bg-gradient-to-br from-[#120B24] via-[#0E071A] to-[#080210] text-white rounded-[28px] p-8 relative overflow-hidden shadow-xl border border-white/5">
        {/* Radial spotlight effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.08),transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Wallet className="h-40 w-40 text-zinc-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" /> BALANCE PIKA MXN
            </span>
            <h2 className="text-5xl md:text-6xl font-black font-display tracking-tight leading-none mt-2 font-mono-number">
              {fmtMXN(wallet.balance)}
            </h2>
            <p className="text-white/60 text-xs font-semibold mt-2">
              CLABE SPEI Vinculada • {bankAccount}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setIsAddFundsOpen(true)}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/15 shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs backdrop-blur"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Añadir fondos
            </button>
            <button 
              onClick={() => setIsWithdrawOpen(true)}
              className="px-6 py-3.5 bg-white hover:bg-zinc-100 text-zinc-950 font-black rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs"
            >
              <Minus className="h-4 w-4 stroke-[3]" />
              Retirar SPEI
            </button>
          </div>
        </div>
      </div>

      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6 shadow-sm">
          <span className="text-xs font-semibold text-neutral-400 block mb-2">Cobrado este mes</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#17102A] font-mono-number">+{fmtMXN(3890)}</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
              <ArrowDownLeft className="h-3.5 w-3.5 stroke-[2.5]" /> 12.4%
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">vs. mes anterior</p>
        </div>
        
        <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6 shadow-sm">
          <span className="text-xs font-semibold text-neutral-400 block mb-2">Retirado a Banco</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#17102A] font-mono-number">-{fmtMXN(1450)}</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-neutral-400">
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" /> 4.2%
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">vs. mes anterior</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6 shadow-sm">
          <span className="text-xs font-semibold text-neutral-400 block mb-2">Cobros pendientes</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#17102A] font-mono-number">{fmtMXN(420)}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/40 ml-2">
              2 activos
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">Liquidándose por SPEI</p>
        </div>
      </div>

      {/* ── ACCOUNTS SECTION ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold font-display text-[#17102A] flex items-center gap-2">
          <Landmark className="h-5 w-5 text-neutral-400" /> Métodos de cobro vinculados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-5 border border-[#E5E7EB] rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-neutral-100 border border-[#E5E7EB] text-[#4B5563] font-bold flex items-center justify-center text-[10px] tracking-tight group-hover:bg-white transition-colors font-sans">
                BBVA
              </span>
              <div>
                <p className="font-extrabold text-sm text-[#17102A]">BBVA Bancomer</p>
                <p className="text-xs text-neutral-400 font-semibold">Cuenta CLABE vinculada • **** 8943</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-5 border border-[#E5E7EB] rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-neutral-100 border border-[#E5E7EB] text-[#4B5563] font-bold flex items-center justify-center text-[10px] tracking-tight group-hover:bg-white transition-colors font-sans">
                SAN
              </span>
              <div>
                <p className="font-extrabold text-sm text-[#17102A]">Banco Santander</p>
                <p className="text-xs text-neutral-400 font-semibold">Cuenta de respaldo vinculada • **** 1205</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD FUNDS MODAL ── */}
      {isAddFundsOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-card rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-border">
            <button
              onClick={() => setIsAddFundsOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6 flex flex-col items-center">
              <Landmark className="w-10 h-10 text-primary mb-2" />
              <h3 className="text-lg font-black text-foreground mt-2">Añadir Fondos</h3>
              <p className="text-xs text-muted-foreground mt-1 font-semibold">
                Deposita a tu balance Pika a través de una transferencia rápida SPEI.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-2xl p-4">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Monto a fonear (MXN)</label>
                <div className="relative flex items-center">
                  <span className="text-lg font-bold text-muted-foreground mr-1">$</span>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base font-bold outline-none border-none bg-transparent text-foreground"
                  />
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl text-[11px] text-muted-foreground font-semibold leading-relaxed flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p>La transferencia SPEI se acreditará de forma inmediata y automática en tu cuenta.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddFundsOpen(false)}
                  className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-full text-xs transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddFunds}
                  disabled={!addAmount || isLoading}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black rounded-full text-xs shadow transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span className="flex items-center gap-1">
                    Fondear <Zap className="h-3.5 w-3.5 shrink-0 text-primary-foreground" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAW MODAL ── */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-card rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-border">
            <button
              onClick={() => setIsWithdrawOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6 flex flex-col items-center">
              <Landmark className="w-10 h-10 text-primary mb-2" />
              <h3 className="text-lg font-black text-foreground mt-2">Retirar Fondos SPEI</h3>
              <p className="text-xs text-muted-foreground mt-1 font-semibold">
                Retira directo a tu cuenta bancaria vinculada de forma instantánea.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-2xl p-4">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Monto a retirar (MXN)</label>
                <div className="relative flex items-center">
                  <span className="text-lg font-bold text-muted-foreground mr-1">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base font-bold outline-none border-none bg-transparent text-foreground"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-bold mt-1.5">
                  Saldo disponible: {fmtMXN(wallet.balance)}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl text-[11px] text-muted-foreground font-semibold leading-relaxed flex gap-2 items-start">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p>Las transferencias de salida fluyen en tiempo real por el sistema de SPEI Banxico.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsWithdrawOpen(false)}
                  className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-full text-xs transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || isLoading}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black rounded-full text-xs shadow transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span className="flex items-center gap-1">
                    Retirar <Zap className="h-3.5 w-3.5 shrink-0 text-primary-foreground" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
