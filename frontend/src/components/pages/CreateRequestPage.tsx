import { useState } from 'react';
import { fmtMXN } from '../pika/atoms';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Zap, MessageCircle, Link } from 'lucide-react';

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'create' | 'share'>('create');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [note, setNote] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Keypad press handler
  const handleKeyPress = (key: string) => {
    if (key === 'del') {
      setAmount(prev => prev.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (amount.includes('.')) return;
      setAmount(prev => (prev === '' ? '0.' : prev + '.'));
      return;
    }
    if (amount === '0') {
      setAmount(key);
      return;
    }
    // Limit decimal places
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return;
    // Limit integer length
    if (!amount.includes('.') && amount.length >= 6) return;

    setAmount(prev => prev + key);
  };

  const handleCreate = async () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0 || !concept) return;

    try {
      const response = await fetch('https://isw6kd7ljtiew2p41enfegtz.45.132.242.102.sslip.io/api/v1/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: Math.round(numAmount * 100),
          concept,
          note
        })
      });
      const data = await response.json();
      const slug = data.publicSlug || 'pika_' + Math.random().toString(36).substring(2, 8);
      setPublicSlug(slug);

      const publicUrl = `${window.location.origin}/p/${slug}`;
      const qrData = await QRCode.toDataURL(publicUrl, { width: 300, margin: 2 });
      setQrCodeUrl(qrData);
      setStep('share');
    } catch (err) {
      console.error('Error creating request from API', err);
      const slug = 'pika_' + Math.random().toString(36).substring(2, 8);
      setPublicSlug(slug);

      const publicUrl = `${window.location.origin}/p/${slug}`;
      const qrData = await QRCode.toDataURL(publicUrl, { width: 300, margin: 2 });
      setQrCodeUrl(qrData);
      setStep('share');
    }
  };

  const handleWhatsAppShare = () => {
    const casualText = `Te mandé un Pika por ${fmtMXN(parseFloat(amount))} para ${concept}.\nPágalo aquí: ${window.location.origin}/p/${publicSlug}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(casualText)}`, '_blank');
  };

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/p/${publicSlug}`;
    navigator.clipboard.writeText(publicUrl);
    alert('¡Enlace de pago copiado al portapapeles!');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  return (
    <div className="w-full min-h-screen bg-[#f7f5fa] text-neutral-900 flex flex-col justify-between pb-12">
      {/* ── HEADER ── */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-neutral-200 bg-white">
        <button
          onClick={() => {
            if (step === 'share') {
              setStep('create');
            } else {
              navigate('/app');
            }
          }}
          className="w-10 h-10 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center text-sm font-bold text-neutral-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-extrabold text-neutral-800">
          {step === 'create' ? 'Crear cobro Pika MX' : 'Cobro creado'}
        </span>
        <div className="w-10" />
      </header>

      {step === 'create' ? (
        <div className="flex-1 flex flex-col justify-between px-6 pt-6">
          {/* Amount Display */}
          <div className="text-center">
            <span className="text-xs font-bold text-neutral-400 block mb-1">Monto a cobrar</span>
            <div className="font-display font-black text-6xl md:text-7xl text-[#17102A] tracking-tight">
              <span className="opacity-25">$</span>
              {amount === '' ? '0' : amount}
            </div>
            <span className="text-xs text-neutral-400 font-bold block mt-1">MXN · Rieles SPEI</span>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 my-8 max-w-sm mx-auto w-full">
            <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Concepto</label>
              <input
                type="text"
                placeholder="¿Para qué es? (ej. Cena, Renta, etc.)"
                value={concept}
                onChange={e => setConcept(e.target.value)}
                className="w-full text-sm font-semibold outline-none border-none bg-transparent"
              />
            </div>

            <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Nota adicional (opcional)</label>
              <input
                type="text"
                placeholder="Escribe un recado breve"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full text-sm font-semibold outline-none border-none bg-transparent"
              />
            </div>
          </div>

          {/* Numeric Pad */}
          <div className="max-w-sm mx-auto w-full">
            <div className="grid grid-cols-3 gap-y-2 gap-x-6 text-center mb-6">
              {keys.map((k) => (
                <button
                  key={k}
                  onClick={() => handleKeyPress(k)}
                  className="h-14 font-display font-black text-2xl text-[#17102A] hover:bg-neutral-200/50 active:scale-90 rounded-full flex items-center justify-center transition-all"
                >
                  {k === 'del' ? '⌫' : k}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={parseFloat(amount) <= 0 || !concept}
              className="w-full py-4 bg-[#FFC52E] hover:bg-[#FFD65C] disabled:bg-neutral-200 disabled:text-neutral-400 text-[#17102A] font-black rounded-full text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Crear Enlace de Pago <Zap className="w-5 h-5 fill-current shrink-0" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-12 max-w-sm mx-auto w-full">
          {/* Confetti container */}
          <div className="relative p-6 bg-white border border-black/5 rounded-[32px] shadow-lg mb-8 w-full flex flex-col items-center">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} className="w-56 h-56 object-contain" alt="QR Code Pika" />
            ) : (
              <div className="w-56 h-56 bg-neutral-100 rounded-2xl flex items-center justify-center">Generando QR...</div>
            )}
            <div className="mt-4">
              <span className="text-xl font-black font-display block text-neutral-800">{fmtMXN(parseFloat(amount))}</span>
              <span className="text-xs text-neutral-400 font-semibold">{concept}</span>
            </div>
          </div>

          <h2 className="text-2xl font-black font-display text-[#17102A] mb-2">¡Listo para compartir!</h2>
          <p className="text-xs text-neutral-500 mb-8 max-w-xs">
            Comparte tu Pika por WhatsApp para que te paguen al instante, o deja que escaneen el código QR.
          </p>

          <div className="space-y-3 w-full">
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold rounded-full text-sm shadow flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" /> Compartir por WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full py-3.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold rounded-full text-sm shadow flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <Link className="w-4 h-4 text-neutral-500 shrink-0" /> Copiar enlace de cobro
            </button>

            <button
              onClick={() => navigate('/app')}
              className="w-full py-3.5 bg-transparent hover:bg-neutral-100 text-neutral-400 font-bold rounded-full text-sm transition-all"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
