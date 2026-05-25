import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { Contact } from '@/store/types';
import { useToast } from '@/components/ui/use-toast';
import { walletApi } from '@/lib/api';
import { fmtMXN } from '../pika/atoms';
import { 
  Search, UserPlus, Users, ArrowRight, CheckCircle2,
  Star, Loader2, QrCode, Wallet, X, MessageSquare, Landmark, Check
} from 'lucide-react';

const quickAmounts = [50, 100, 200, 500, 1000, 2000];

export default function SendPage() {
  const { contacts, wallet, addTransaction, updateBalance } = useAppStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  useEffect(() => {
    const contactId = searchParams.get('to');
    if (contactId) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setSelectedContact(contact);
      }
    }
  }, [searchParams, contacts]);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  const favoriteContacts = filteredContacts.filter(c => c.isFavorite);
  const regularContacts = filteredContacts.filter(c => !c.isFavorite);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);
    if (!selectedContact) {
      toast({ title: 'Por favor selecciona un destinatario', variant: 'destructive' });
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Por favor ingresa un monto válido', variant: 'destructive' });
      return;
    }
    if (numAmount > wallet.balance) {
      toast({ title: 'Fondos insuficientes en tu billetera', variant: 'destructive' });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSend = async () => {
    setIsLoading(true);
    const numAmount = parseFloat(amount);
    
    const result = await walletApi.transfer(
      selectedContact?.accountNumber || selectedContact?.email || '',
      numAmount,
      description || `Transferencia a ${selectedContact?.name}`
    );

    if (result.data) {
      updateBalance(-numAmount);
      addTransaction(result.data.transaction);
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
      toast({ 
        title: '¡Pago enviado con éxito!',
        description: `Se enviaron ${fmtMXN(numAmount)} a ${selectedContact?.name}`
      });
    } else {
      toast({ title: result.error || 'No se pudo enviar el pago', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    setSelectedContact(null);
    setAmount('');
    setDescription('');
    navigate('/dashboard/transactions');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-black font-display text-neutral-800 tracking-tight">Enviar Lana</h1>
        <p className="text-neutral-500 font-semibold text-sm mt-1">
          Transfiere al instante de tu balance Pika a tus contactos por SPEI
        </p>
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
        {/* Recipient Selection */}
        <div className="bg-white border border-black/5 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-neutral-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#7B2FF2]" />
            Selecciona el Destinatario
          </h3>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              placeholder="Buscar por nombre, correo o celular..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-full text-xs font-semibold outline-none transition-all placeholder:text-neutral-400"
            />
          </div>

          {selectedContact ? (
            <div className="p-4 border border-[#7B2FF2]/10 rounded-2xl bg-[#EFE4FF]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-[#7B2FF2] text-white font-extrabold flex items-center justify-center text-sm">
                  {selectedContact.name.charAt(0)}
                </span>
                <div>
                  <p className="font-extrabold text-sm text-neutral-800">{selectedContact.name}</p>
                  <p className="text-xs text-neutral-400 font-semibold mt-0.5">
                    {selectedContact.accountNumber || selectedContact.email}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedContact(null)}
                className="text-xs font-bold text-[#7B2FF2] hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              {favoriteContacts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Favoritos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {favoriteContacts.slice(0, 4).map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => handleContactSelect(contact)}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-all text-left w-full"
                      >
                        <span className="w-8 h-8 rounded-lg bg-[#EFE4FF] text-[#7B2FF2] font-black flex items-center justify-center text-xs shrink-0">
                          {contact.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-neutral-800 truncate">{contact.name}</p>
                          <p className="text-[10px] text-neutral-400 font-semibold truncate">{contact.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Mis Contactos</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {regularContacts.slice(0, 6).map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      className="flex items-center justify-between p-3 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-all text-left w-full"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-600 font-extrabold flex items-center justify-center text-xs">
                          {contact.name.charAt(0)}
                        </span>
                        <div>
                          <p className="font-extrabold text-xs text-neutral-800">{contact.name}</p>
                          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">{contact.accountNumber || contact.phone}</p>
                        </div>
                      </div>
                      {contact.isFavorite && <Star className="h-3 w-3 fill-[#FFC52E] text-[#FFC52E]" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payment Details */}
        <div className="bg-white border border-black/5 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-neutral-800 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#7B2FF2]" />
            Detalles de Envío
          </h3>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Monto a Enviar (MXN)</label>
            <div className="relative bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex items-center">
              <span className="text-2xl font-black text-neutral-400 mr-1">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-2xl font-black outline-none border-none bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleAmountSelect(value)}
                className={`py-2 text-xs font-bold rounded-full border transition-all ${
                  amount === value.toString()
                    ? 'bg-[#7B2FF2] text-white border-transparent'
                    : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}
              >
                ${value}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Concepto (Opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Para qué es el envío?"
              className="w-full px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-full text-xs font-semibold outline-none transition-all placeholder:text-neutral-400"
            />
          </div>

          {selectedContact && amount && (
            <div className="p-4 bg-[#f7f5fa] rounded-2xl space-y-2.5 text-xs font-semibold text-neutral-600">
              <div className="flex justify-between">
                <span className="text-neutral-400">Para</span>
                <span className="font-extrabold text-neutral-800">{selectedContact.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Monto</span>
                <span className="font-extrabold text-neutral-800">{fmtMXN(parseFloat(amount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Comisión</span>
                <span className="font-extrabold text-[#22A952]">¡Gratis!</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm">
                <span className="font-black text-neutral-700">Total a transferir</span>
                <span className="font-black font-display text-neutral-800">{fmtMXN(parseFloat(amount) || 0)}</span>
              </div>
            </div>
          )}

          <button 
            onClick={handleContinue}
            disabled={!selectedContact || !amount || parseFloat(amount) <= 0}
            className="w-full py-4 bg-[#FFC52E] hover:bg-[#FFD65C] disabled:bg-neutral-100 disabled:text-neutral-400 text-[#17102A] font-black rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            Continuar
            <ArrowRight className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* QR scanner redirect banner */}
      <div className="bg-white border border-dashed border-neutral-300 rounded-[32px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <span className="w-12 h-12 rounded-2xl bg-[#EFE4FF] text-[#7B2FF2] flex items-center justify-center shrink-0">
            <QrCode className="h-6 w-6 stroke-[2]" />
          </span>
          <div>
            <h4 className="font-extrabold text-sm text-neutral-800">¿Tienes un código QR de cobro?</h4>
            <p className="text-xs text-neutral-400 font-semibold mt-0.5">
              Escanea el código QR Pika de tu amigo para pagar de inmediato.
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard/qr')}
          className="px-6 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold rounded-full text-xs transition-all active:scale-95 shadow-sm shrink-0"
        >
          Escanear QR
        </button>
      </div>

      {/* ── CONFIRM PAYMENT DIALOG ── */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-neutral-100">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6 flex flex-col items-center">
              <Landmark className="w-10 h-10 text-[#7B2FF2] mb-2" />
              <h3 className="text-lg font-black text-neutral-800 mt-2">Confirmar Transferencia</h3>
              <p className="text-xs text-neutral-400 mt-1 font-semibold">
                Por seguridad, valida los datos antes de realizar el envío SPEI.
              </p>
            </div>
            <div className="py-2 space-y-3.5 text-xs font-semibold text-neutral-600">
              <div className="text-center bg-[#f7f5fa] rounded-2xl py-4 mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Monto a Enviar</span>
                <span className="text-3xl font-black font-display text-neutral-800">{fmtMXN(parseFloat(amount) || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-400">Destinatario</span>
                <span className="font-extrabold text-neutral-800">{selectedContact?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-400">Origen</span>
                <span className="font-extrabold text-neutral-800">Mi Balance Pika</span>
              </div>
              {description && (
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-400">Concepto</span>
                  <span className="font-extrabold text-neutral-800">{description}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-full text-xs transition-all"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="flex-1 py-3 bg-[#FFC52E] hover:bg-[#FFD65C] text-[#17102A] font-black rounded-full text-xs shadow transition-all flex items-center justify-center gap-1.5"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enviar Pago ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS DIALOG ── */}
      {isSuccessOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-neutral-100 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#DDF8E7] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Check className="h-8 w-8 text-[#22A952] stroke-[3]" />
            </div>
            <h3 className="text-xl font-black font-display text-neutral-800 mb-1">¡Transferencia Exitosa!</h3>
            <p className="text-xs text-neutral-400 font-semibold mb-4 leading-relaxed max-w-xs">
              Has transferido {fmtMXN(parseFloat(amount) || 0)} a <strong>{selectedContact?.name}</strong> al instante por rieles SPEI.
            </p>
            <div className="w-full space-y-2 mt-4">
              <button 
                onClick={handleSuccessClose} 
                className="w-full py-3.5 bg-[#FFC52E] hover:bg-[#FFD65C] text-[#17102A] font-black rounded-full text-xs shadow transition-all active:scale-95"
              >
                Ver Transacción
              </button>
              <button 
                onClick={() => {
                  setIsSuccessOpen(false);
                  setSelectedContact(null);
                  setAmount('');
                  setDescription('');
                }}
                className="w-full py-3 bg-transparent hover:bg-neutral-100 text-neutral-400 font-bold rounded-full text-xs transition-all"
              >
                Hacer otro envío
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
