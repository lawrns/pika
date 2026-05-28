import { useState } from 'react';
import { fmtMXN } from '../pika/atoms';
import { useToast } from '@/components/ui/use-toast';
import { requestsApi, type PaymentRequest } from '@/lib/api';
import {
  QrCode, Download, MessageCircle, Link as LinkIcon, AlertCircle, Loader2, Zap, RotateCcw
} from 'lucide-react';
import QRCodeLib from 'qrcode';

export default function QRPage() {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !concept) {
      setError('Ingresa un monto y un concepto para generar el QR.');
      return;
    }
    setError('');
    setIsGenerating(true);
    const result = await requestsApi.create(Math.round(numAmount * 100), concept);
    if (result.data) {
      try {
        const dataUrl = await QRCodeLib.toDataURL(result.data.publicUrl, { width: 320, margin: 2 });
        setQrDataUrl(dataUrl);
        setRequest(result.data);
      } catch {
        setError('No se pudo dibujar el código QR.');
      }
    } else {
      setError(result.error || 'No se pudo crear el cobro.');
    }
    setIsGenerating(false);
  };

  const handleReset = () => {
    setQrDataUrl(null);
    setRequest(null);
    setAmount('');
    setConcept('');
    setError('');
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `pika-cobro-${request?.publicSlug || 'qr'}.png`;
    a.click();
  };

  const handleWhatsApp = () => {
    if (!request) return;
    requestsApi.share(request.requestId, 'whatsapp').catch(() => {});
    const text = `Te mandé un Pika por ${fmtMXN(request.amount)} para ${request.concept}.\nPágalo aquí: ${request.publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopy = async () => {
    if (!request) return;
    await navigator.clipboard.writeText(request.publicUrl);
    requestsApi.share(request.requestId, 'copy_link').catch(() => {});
    toast({ title: '¡Enlace de cobro copiado!' });
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in pb-12">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black font-display text-neutral-800 tracking-tight">QR de cobro</h1>
        <p className="text-neutral-500 font-semibold text-sm mt-1">
          Genera un código QR para que te paguen en persona. Pika orquesta el pago por SPEI; no guarda tu dinero.
        </p>
      </div>

      {!qrDataUrl || !request ? (
        <div className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 text-xs font-bold flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Monto (MXN)</label>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-neutral-300">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-2xl font-black font-display text-neutral-800 outline-none border-none bg-transparent"
              />
            </div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Concepto</label>
            <input
              type="text"
              placeholder="¿Para qué es? (ej. Café, Producto)"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full text-sm font-semibold outline-none border-none bg-transparent text-neutral-800"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !amount || !concept}
            className="w-full py-3.5 bg-[#FFC52E] hover:bg-[#FFD65C] disabled:bg-neutral-200 disabled:text-neutral-400 text-[#17102A] font-black rounded-full text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            {isGenerating ? 'Generando...' : 'Generar QR de cobro'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm flex flex-col items-center">
            <img src={qrDataUrl} alt="QR de cobro Pika" className="w-60 h-60 object-contain" />
            <div className="mt-4 text-center">
              <span className="text-xl font-black font-display block text-neutral-800">{fmtMXN(request.amount)}</span>
              <span className="text-xs text-neutral-400 font-semibold">{request.concept}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={handleWhatsApp} className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold rounded-full text-sm shadow flex items-center justify-center gap-2 active:scale-95 transition-all">
              <MessageCircle className="w-4 h-4 fill-current" /> Compartir por WhatsApp
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCopy} className="py-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold rounded-full text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                <LinkIcon className="w-4 h-4 text-neutral-500" /> Copiar enlace
              </button>
              <button onClick={handleDownload} className="py-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold rounded-full text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                <Download className="w-4 h-4 text-neutral-500" /> Descargar QR
              </button>
            </div>
            <button onClick={handleReset} className="w-full py-3 bg-transparent hover:bg-neutral-200/50 text-neutral-400 hover:text-neutral-800 font-bold rounded-full text-xs transition-all flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Generar otro cobro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
