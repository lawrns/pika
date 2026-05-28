import { useState } from 'react';
import { fmtMXN } from '../pika/atoms';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Zap, MessageCircle, Link, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'create' | 'share'>('create');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [note, setNote] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [requestId, setRequestId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleKeyPress = (key: string) => {
    if (key === 'del') return setAmount(prev => prev.slice(0, -1));
    if (key === '.') {
      if (amount.includes('.')) return;
      return setAmount(prev => (prev === '' ? '0.' : prev + '.'));
    }
    if (amount === '0') return setAmount(key);
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return;
    if (!amount.includes('.') && amount.length >= 6) return;
    setAmount(prev => prev + key);
  };

  const handleCreate = async () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0 || !concept || submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('pika-auth-token');
      if (!token) throw new Error('Inicia sesión para crear enlaces de cobro reales.');

      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amountCents: Math.round(numAmount * 100), concept, note })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      if (!data.publicSlug) throw new Error('La API no regresó un enlace público.');

      setPublicSlug(data.publicSlug);
      setRequestId(data.requestId);
      const publicUrl = `${window.location.origin}/p/${data.publicSlug}`;
      const qrData = await QRCode.toDataURL(publicUrl, { width: 300, margin: 2 });
      setQrCodeUrl(qrData);
      setStep('share');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el cobro. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppShare = async () => {
    const publicUrl = `${window.location.origin}/p/${publicSlug}`;
    const token = localStorage.getItem('pika-auth-token');
    if (token && requestId) {
      try {
        // best-effort analytics: link remains shareable even if event logging fails
        await fetch(`${API_BASE_URL}/requests/${encodeURIComponent(requestId)}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ channel: 'whatsapp' })
        });
      } catch {}
    }
    const casualText = `Te mandé un Pika por ${fmtMXN(parseFloat(amount))} para ${concept}.\nPágalo aquí: ${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(casualText)}`, '_blank');
  };

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/p/${publicSlug}`;
    navigator.clipboard.writeText(publicUrl);
    alert('¡Enlace de pago copiado al portapapeles!');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  return (
    <div className="w-full min-h-screen text-[#17102A] flex flex-col justify-between pb-12 bg-[#f7f5fa]">
      <header className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-neutral-200 bg-white">
        <button onClick={() => step === 'share' ? setStep('create') : navigate('/dashboard')} className="w-10 h-10 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center text-sm font-bold text-neutral-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-extrabold text-neutral-800">{step === 'create' ? 'Crear cobro Pika MX' : 'Cobro creado'}</span>
        <div className="w-10" />
      </header>

      {step === 'create' ? (
        <div className="flex-1 flex flex-col justify-between px-6 pt-6">
          <div className="text-center">
            <span className="text-xs font-bold text-neutral-400 block mb-1">Monto a cobrar</span>
            <div className="font-display font-black text-6xl md:text-7xl text-[#17102A] tracking-tight"><span className="opacity-25">$</span>{amount === '' ? '0' : amount}</div>
            <span className="text-xs text-neutral-400 font-bold block mt-1">MXN · Rieles SPEI</span>
          </div>

          <div className="space-y-4 my-8 max-w-sm mx-auto w-full">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 text-xs font-bold flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Concepto</label>
              <input type="text" placeholder="¿Para qué es? (ej. Cena, Renta, etc.)" value={concept} onChange={e => setConcept(e.target.value)} className="w-full text-sm font-semibold outline-none border-none bg-transparent" />
            </div>
            <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Nota adicional (opcional)</label>
              <input type="text" placeholder="Escribe un recado breve" value={note} onChange={e => setNote(e.target.value)} className="w-full text-sm font-semibold outline-none border-none bg-transparent" />
            </div>
          </div>

          <div className="max-w-sm mx-auto w-full">
            <div className="grid grid-cols-3 gap-y-2 gap-x-6 text-center mb-6">
              {keys.map((k) => <button key={k} onClick={() => handleKeyPress(k)} className="h-14 font-display font-black text-2xl text-[#17102A] hover:bg-neutral-200/50 active:scale-90 rounded-full flex items-center justify-center transition-all">{k === 'del' ? '⌫' : k}</button>)}
            </div>
            <button onClick={handleCreate} disabled={submitting || parseFloat(amount) <= 0 || !concept} className="w-full py-4 bg-[#FFC52E] hover:bg-[#FFD65C] disabled:bg-neutral-200 disabled:text-neutral-400 text-[#17102A] font-black rounded-full text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
              {submitting ? 'Creando...' : 'Crear Enlace de Pago'} <Zap className="w-5 h-5 fill-current shrink-0" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-12 max-w-sm mx-auto w-full">
          <div className="relative p-6 bg-white border border-black/5 rounded-[32px] shadow-lg mb-8 w-full flex flex-col items-center">
            {qrCodeUrl ? <img src={qrCodeUrl} className="w-56 h-56 object-contain" alt="QR Code Pika" /> : <div className="w-56 h-56 bg-neutral-100 rounded-2xl flex items-center justify-center">Generando QR...</div>}
            <div className="mt-4"><span className="text-xl font-black font-display block text-neutral-800">{fmtMXN(parseFloat(amount))}</span><span className="text-xs text-neutral-400 font-semibold">{concept}</span></div>
          </div>
          <h2 className="text-2xl font-black font-display text-[#17102A] mb-2">¡Listo para compartir!</h2>
          <p className="text-xs text-neutral-500 mb-8 max-w-xs">Comparte tu Pika por WhatsApp para que te paguen al instante, o deja que escaneen el código QR.</p>
          <div className="space-y-3 w-full">
            <button onClick={handleWhatsAppShare} className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold rounded-full text-sm shadow flex items-center justify-center gap-2 transform active:scale-95 transition-all"><MessageCircle className="w-4 h-4 fill-current shrink-0" /> Compartir por WhatsApp</button>
            <button onClick={handleCopyLink} className="w-full py-3.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold rounded-full text-sm shadow flex items-center justify-center gap-2 transform active:scale-95 transition-all"><Link className="w-4 h-4 text-neutral-500 shrink-0" /> Copiar enlace de cobro</button>
            <button onClick={() => navigate('/dashboard')} className="w-full py-3.5 bg-transparent hover:bg-neutral-200/50 text-neutral-400 hover:text-[#17102A] font-bold rounded-full text-sm transition-all">Volver al inicio</button>
          </div>
        </div>
      )}
    </div>
  );
}
