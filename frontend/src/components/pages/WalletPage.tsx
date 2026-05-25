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
        <h1 className="text-3xl font-black font-display text-neutral-800 tracking-tight">Mi Billetera</h1>
        <p className="text-neutral-500 font-semibold text-sm mt-1">
          Gestiona tus fondos y métodos de recepción SPEI / CoDi
        </p>
      </div>

      {/* ── CARD HERO ── */}
      <div className="bg-gradient-to-br from-primary to-primary-glow text-white rounded-[32px] p-8 relative overflow-hidden shadow-xl border border-primary/20">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet className="h-40 w-40" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/95 text-xs font-bold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 text-white shrink-0" /> Balance Pika MXN
            </span>
            <h2 className="text-5xl md:text-6xl font-black font-display tracking-tight leading-none mt-2">
              {fmtMXN(wallet.balance)}
            </h2>
            <p className="text-white/80 text-sm font-semibold mt-2">
              CLABE SPEI Vinculada • {bankAccount}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setIsAddFundsOpen(true)}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20 shadow-md backdrop-blur transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Añadir fondos
            </button>
            <button 
              onClick={() => setIsWithdrawOpen(true)}
              className="px-6 py-3.5 bg-white hover:bg-neutral-100 text-zinc-950 font-black rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Minus className="h-4 w-4 stroke-[3]" />
              Retirar SPEI
            </button>
          </div>
        </div>
      </div>

      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-black/5 rounded-[28px] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 block mb-1">Cobrado este mes</span>
            <span className="text-2xl font-black font-display text-emerald-600">+{fmtMXN(3890)}</span>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="h-6 w-6 stroke-[2.5]" />
          </span>
        </div>
        
        <div className="bg-white border border-black/5 rounded-[28px] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 block mb-1">Retirado a Banco</span>
            <span className="text-2xl font-black font-display text-neutral-600">-{fmtMXN(1450)}</span>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
          </span>
        </div>

        <div className="bg-white border border-black/5 rounded-[28px] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 block mb-1">Cobros pendientes</span>
            <span className="text-2xl font-black font-display text-amber-600">{fmtMXN(420)}</span>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-6 w-6 stroke-[2.5]" />
          </span>
        </div>
      </div>

      {/* ── ACCOUNTS SECTION ── */}
      <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-black font-display text-neutral-800 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" /> Métodos de cobro vinculados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-5 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-all">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-[#002F6C] text-white font-bold flex items-center justify-center text-xs">
                BBVA
              </span>
              <div>
                <p className="font-extrabold text-sm text-neutral-800">BBVA Bancomer</p>
                <p className="text-xs text-neutral-400 font-semibold">Cuenta CLABE vinculada • **** 8943</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-5 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-all">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-[#E60000] text-white font-bold flex items-center justify-center text-xs">
                SAN
              </span>
              <div>
                <p className="font-extrabold text-sm text-neutral-800">Banco Santander</p>
                <p className="text-xs text-neutral-400 font-semibold">Cuenta de respaldo vinculada • **** 1205</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD FUNDS MODAL ── */}
      {isAddFundsOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-neutral-100">
            <button
              onClick={() => setIsAddFundsOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6 flex flex-col items-center">
              <Landmark className="w-10 h-10 text-primary mb-2" />
              <h3 className="text-lg font-black text-neutral-800 mt-2">Añadir Fondos</h3>
              <p className="text-xs text-neutral-400 mt-1 font-semibold">
                Deposita a tu balance Pika a través de una transferencia rápida SPEI.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Monto a fonear (MXN)</label>
                <div className="relative flex items-center">
                  <span className="text-lg font-bold text-neutral-400 mr-1">$</span>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base font-bold outline-none border-none bg-transparent"
                  />
                </div>
              </div>
              <div className="bg-muted p-3 rounded-xl text-[11px] text-neutral-500 font-semibold leading-relaxed flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <p>La transferencia SPEI se acreditará de forma inmediata y automática en tu cuenta.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddFundsOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-full text-xs transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddFunds}
                  disabled={!addAmount || isLoading}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-black rounded-full text-xs shadow transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span className="flex items-center gap-1">
                    Fondear <Zap className="h-3.5 w-3.5 shrink-0 fill-current text-white" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAW MODAL ── */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-neutral-100">
            <button
              onClick={() => setIsWithdrawOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6 flex flex-col items-center">
              <Landmark className="w-10 h-10 text-primary mb-2" />
              <h3 className="text-lg font-black text-neutral-800 mt-2">Retirar Fondos SPEI</h3>
              <p className="text-xs text-neutral-400 mt-1 font-semibold">
                Retira directo a tu cuenta bancaria vinculada de forma instantánea.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Monto a retirar (MXN)</label>
                <div className="relative flex items-center">
                  <span className="text-lg font-bold text-neutral-400 mr-1">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base font-bold outline-none border-none bg-transparent"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 font-bold mt-1.5">
                  Saldo disponible: {fmtMXN(wallet.balance)}
                </p>
              </div>
              <div className="bg-muted p-3 rounded-xl text-[11px] text-neutral-500 font-semibold leading-relaxed flex gap-2 items-start">
                <Clock className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <p>Las transferencias de salida fluyen en tiempo real por el sistema de SPEI Banxico.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsWithdrawOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-full text-xs transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || isLoading}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-black rounded-full text-xs shadow transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span className="flex items-center gap-1">
                    Retirar <Zap className="h-3.5 w-3.5 shrink-0 fill-current text-white" />
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
