import { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { fmtMXN } from '../pika/atoms';
import { useToast } from '@/components/ui/use-toast';
import { qrApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Scan, Download, Share2, Clock, Check,
  Camera, X, Wallet, History, AlertCircle, Loader2
} from 'lucide-react';
import QRCodeLib from 'qrcode';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-MX', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function QRPage() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scan');
  
  const [qrAmount, setQrAmount] = useState('');
  const [qrDescription, setQrDescription] = useState('');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    type: string;
    amount?: number;
    description?: string;
    recipient?: string;
    action: string;
  } | null>(null);
  
  const [qrHistory, setQrHistory] = useState<Array<{
    id: string;
    amount: number;
    description?: string;
    createdAt: string;
    expiresAt: string;
  }>>([]);

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    const amount = parseFloat(qrAmount);
    
    const result = await qrApi.generatePaymentQR(
      isNaN(amount) ? 0 : amount,
      qrDescription
    );
    
    if (result.data) {
      const qrResult = result.data;
      setQrExpiry(qrResult.expiresAt);
      
      if (canvasRef.current) {
        const qrPayload = qrResult.qrData;
        await QRCodeLib.toCanvas(canvasRef.current, qrPayload, {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setGeneratedQR(canvasRef.current.toDataURL());
      }
      
      setQrHistory(prev => [{
        id: Date.now().toString(),
        amount: amount || 0,
        description: qrDescription,
        createdAt: new Date().toISOString(),
        expiresAt: qrResult.expiresAt
      }, ...prev]);
      
      toast({ title: '¡Código QR de cobro creado! ⚡' });
    }
    setIsGenerating(false);
  };

  const handleDownloadQR = () => {
    if (!generatedQR) return;
    
    const link = document.createElement('a');
    link.href = generatedQR;
    link.download = `pika-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: '¡Código QR guardado en descargas!' });
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cobro Pika MX',
          text: `Mándame tu parte por Pika: ${qrAmount ? fmtMXN(parseFloat(qrAmount)) : 'Cualquier monto'} interbancario.`
        });
      } catch {
        // Cancelled
      }
    } else {
      navigator.clipboard.writeText(`https://pika-mx.netlify.app/pay/usr_${user?.email || 'mariana'}`);
      toast({ title: '¡Enlace de cobro copiado al portapapeles! 🔗' });
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScannedData(null);
    setScanResult(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const simulateScan = async () => {
    const mockQR = JSON.stringify({
      type: 'pika_payment',
      id: 'pay-demo-' + Date.now(),
      amount: 150,
      description: 'Cena Contramar 🐟',
      recipient: 'mariana@pika.mx'
    });
    
    handleScan(mockQR);
  };

  const handleScan = async (data: string) => {
    setScannedData(data);
    setIsScanning(false);
    
    const result = await qrApi.scanAndProcess(data);
    if (result.data) {
      setScanResult(result.data);
      
      if (result.data.action === 'payment') {
        toast({ 
          title: '¡Código QR de pago detectado! ⚡',
          description: `Monto detectado: ${fmtMXN(result.data.amount || 0)}`
        });
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-black font-display text-neutral-800 tracking-tight">Cobros QR</h1>
        <p className="text-neutral-500 font-semibold text-sm mt-1">
          Escanea códigos QR de amigos para pagarles o crea el tuyo para recibir SPEI rápido
        </p>
      </div>

      {/* ── TABS LAYOUT ── */}
      <div className="space-y-6">
        <div className="bg-neutral-200/50 p-1.5 rounded-full flex max-w-sm mx-auto border border-neutral-300">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-3.5 rounded-full text-xs font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'scan' ? 'bg-[#7B2FF2] text-white shadow' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Scan className="h-4 w-4" />
            Escanear y Pagar
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-3.5 rounded-full text-xs font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'generate' ? 'bg-[#7B2FF2] text-white shadow' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <QrCode className="h-4 w-4" />
            Crear QR de Cobro
          </button>
        </div>

        {activeTab === 'scan' ? (
          <div className="space-y-6 max-w-md mx-auto">
            {isScanning ? (
              <div className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm">
                <div className="relative aspect-square max-w-xs mx-auto overflow-hidden rounded-2xl bg-neutral-950 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/20 rounded-2xl relative">
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#7B2FF2]" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#7B2FF2]" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#7B2FF2]" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#7B2FF2]" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#7B2FF2] animate-pulse" />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-[10px] font-bold uppercase tracking-wider">
                    Apunta la cámara al código QR
                  </div>
                  <button
                    onClick={stopScanning}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={simulateScan}
                    className="flex-1 py-3 bg-[#EFE4FF] text-[#7B2FF2] hover:bg-[#7B2FF2]/10 font-bold rounded-full text-xs transition-all active:scale-95"
                  >
                    Simular escaneo ⚡
                  </button>
                  <button 
                    onClick={stopScanning}
                    className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-full text-xs transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : scannedData && scanResult ? (
              <div className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm space-y-6">
                <div className="text-center p-6 bg-neutral-50 border border-neutral-100 rounded-2xl flex flex-col items-center">
                  <span className="w-10 h-10 rounded-full bg-[#DDF8E7] text-[#22A952] flex items-center justify-center mb-3">
                    <Check className="h-5 w-5 stroke-[3]" />
                  </span>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Solicitud QR de pago</h4>
                  <p className="text-4xl font-black font-display text-neutral-800 my-2">
                    {fmtMXN(scanResult.amount || 0)}
                  </p>
                  {scanResult.description && (
                    <p className="text-sm font-bold text-neutral-700">{scanResult.description}</p>
                  )}
                  {scanResult.recipient && (
                    <p className="text-xs text-neutral-400 font-semibold mt-1">
                      Destinatario: {scanResult.recipient}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  {scanResult.action === 'payment' && (
                    <button 
                      onClick={() => navigate(`/dashboard/send?to=contact-demo&amount=${scanResult.amount}&concept=${encodeURIComponent(scanResult.description || '')}`)}
                      className="flex-1 py-4 bg-[#FFC52E] hover:bg-[#FFD65C] text-[#17102A] font-black rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Wallet className="h-4 w-4 shrink-0" />
                      Pagar ahora ⚡
                    </button>
                  )}
                  <button 
                    onClick={() => setScannedData(null)}
                    className="flex-1 py-4 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold rounded-full text-sm shadow transition-all active:scale-95"
                  >
                    Escanear otro
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm text-center flex flex-col items-center max-w-sm mx-auto">
                <span className="w-20 h-20 bg-neutral-100 text-neutral-500 rounded-full flex items-center justify-center mb-4">
                  <Scan className="h-10 w-10 stroke-[1.5]" />
                </span>
                <h3 className="text-lg font-black text-neutral-800">Escanear un Código Pika</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-semibold mt-1 mb-6 max-w-xs">
                  Escanea el código QR de cobro de un amigo para transferirle al instante de forma segura sin CLABE.
                </p>
                <button 
                  onClick={startScanning}
                  className="w-full py-4 bg-[#7B2FF2] hover:bg-[#6419D6] text-white font-bold rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Camera className="h-4 w-4 stroke-[3.5]" />
                  Iniciar cámara scanner
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
            {/* Generate form */}
            <div className="bg-white border border-black/5 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-800">Generar código QR de Cobro</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Establece un monto y concepto opcional para que te paguen interbancario.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Monto a Cobrar (Opcional)</label>
                  <div className="relative bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex items-center">
                    <span className="text-lg font-bold text-neutral-400 mr-1">$</span>
                    <input
                      type="number"
                      value={qrAmount}
                      onChange={(e) => setQrAmount(e.target.value)}
                      placeholder="Cualquier monto"
                      className="w-full text-base font-bold outline-none border-none bg-transparent"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Concepto (Opcional)</label>
                  <input
                    value={qrDescription}
                    onChange={(e) => setQrDescription(e.target.value)}
                    placeholder="¿Para qué es el cobro?"
                    className="w-full px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-full text-xs font-semibold outline-none transition-all placeholder:text-neutral-400"
                  />
                </div>
                <button 
                  onClick={handleGenerateQR}
                  disabled={isGenerating}
                  className="w-full py-4 bg-[#FFC52E] hover:bg-[#FFD65C] disabled:bg-neutral-100 disabled:text-neutral-400 text-[#17102A] font-black rounded-full text-sm shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Generar mi código QR
                </button>
              </div>
            </div>

            {/* Showcase Generated QR */}
            <div className="bg-white border border-black/5 rounded-[32px] p-6 md:p-8 shadow-sm text-center flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-800">Código QR Generado</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {generatedQR ? 'Muestra este código para recibir lana de inmediato' : 'Completa el formulario para ver tu QR'}
                </p>
              </div>
              <div className="py-6 flex flex-col items-center justify-center flex-1">
                {generatedQR ? (
                  <div className="space-y-4">
                    <div className="inline-block p-4 bg-white border border-neutral-200 rounded-3xl shadow-md">
                      <img src={generatedQR} alt="Payment QR Code" className="w-48 h-48 object-contain" />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    {qrExpiry && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 font-semibold">
                        <Clock className="h-4 w-4" />
                        Expira el {formatDate(qrExpiry)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDownloadQR}
                        className="flex-1 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold rounded-full text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </button>
                      <button 
                        onClick={handleShareQR}
                        className="flex-1 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold rounded-full text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Share2 className="h-4 w-4" />
                        Compartir
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-400 py-12">
                    <QrCode className="h-16 w-16 mb-2 opacity-30 stroke-[1]" />
                    <p className="text-xs font-semibold">El código QR aparecerá en esta zona</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code History */}
            {qrHistory.length > 0 && (
              <div className="bg-white border border-black/5 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4 md:col-span-2">
                <h3 className="text-base font-extrabold text-neutral-800 flex items-center gap-2">
                  <History className="h-5 w-5 text-[#7B2FF2]" />
                  Códigos QR Recientes
                </h3>
                <div className="divide-y divide-neutral-100 bg-neutral-50/20 border border-neutral-100 rounded-2xl overflow-hidden">
                  {qrHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div>
                        <p className="font-extrabold text-sm text-neutral-800">
                          {item.amount > 0 ? fmtMXN(item.amount) : 'Cualquier monto'}
                        </p>
                        {item.description && (
                          <p className="text-xs text-neutral-400 font-semibold mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] text-neutral-400 font-semibold">
                          {formatDate(item.createdAt)}
                        </p>
                        <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          new Date(item.expiresAt) > new Date() ? 'bg-[#DDF8E7] text-[#22A952]' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {new Date(item.expiresAt) > new Date() ? 'Activo' : 'Expirado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
