import { useState } from 'react';
import { HelpCircle, MessageSquare, ChevronDown, Check, Copy } from 'lucide-react';

export default function HelpPage() {
  const [copied, setCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "¿Cómo funciona Pika?",
      a: "Pika te permite cobrar de manera rápida sin necesidad de compartir CLABEs largas o registrar usuarios. Solo creas un cobro indicando el monto y el concepto, y te generamos un enlace único. Quien te paga puede hacerlo directamente usando SPEI o DiMo desde su banca móvil. ¡Cero drama!"
    },
    {
      q: "¿Hay comisiones ocultas o costos?",
      a: "¡Ninguno! Pika es totalmente gratuito para recibir y enviar dinero. Las transferencias SPEI entrantes y los retiros a tu banco se liquidan al instante sin comisiones."
    },
    {
      q: "¿Cuánto tiempo tarda en reflejarse mi dinero?",
      a: "El dinero llega al instante. Cuando un pagador completa la transferencia SPEI usando tus instrucciones de Pika, nuestro sistema liquida la transacción de forma inmediata y lo verás en tu Balance Pika."
    },
    {
      q: "¿Cómo retiro los fondos a mi cuenta bancaria?",
      a: "Muy sencillo: ve a la sección de 'Wallet', presiona el botón '- Retirar SPEI', ingresa el monto y tu cuenta CLABE personal de 18 dígitos. La transferencia se ejecutará al instante hacia tu banco habitual."
    },
    {
      q: "¿Es seguro usar Pika?",
      a: "Absolutamente. Pika opera sobre canales encriptados y procesa transferencias directamente a través del Sistema de Pagos Electrónicos Interbancarios (SPEI) del Banco de México, garantizando la máxima seguridad bancaria."
    }
  ];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("soporte@pika.mx");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-[#17102A] tracking-tight">Centro de Ayuda</h1>
        <p className="text-neutral-400 font-semibold text-sm mt-1">
          Resolvemos tus dudas sin rollos ni complicaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: FAQ accordion list */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#17102A] mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" /> Preguntas frecuentes
            </h2>
            
            <div className="space-y-3.5">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-[#E5E7EB] rounded-2xl overflow-hidden transition-all bg-[#f7f5fa]/40 hover:bg-[#f7f5fa]/70"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#17102A] select-none"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform text-neutral-400 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs leading-relaxed text-neutral-500 font-medium border-t border-[#E5E7EB]/50 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Outbound support options */}
        <div className="space-y-6">
          {/* WhatsApp Support Hero Card */}
          <div className="bg-gradient-to-br from-primary to-primary-glow text-white rounded-[28px] p-6 relative overflow-hidden shadow-lg border border-primary/20">
            <div className="relative z-10 flex flex-col items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/80 mb-2">Soporte Pika</span>
              <h3 className="text-xl font-bold font-display leading-tight mb-2">¿Prefieres chatear?</h3>
              <p className="text-xs text-white/85 leading-relaxed mb-6 font-medium">
                Escríbenos directamente por WhatsApp. Nuestro equipo te atiende de volada para resolver cualquier duda.
              </p>
              <button
                onClick={() => window.open('https://wa.me/5215500000000?text=Hola%20Pika!%20Necesito%20ayuda%20con%20mi%20cuenta.', '_blank')}
                className="w-full py-3 bg-[#FFC52E] hover:bg-[#FFD65C] text-[#17102A] font-extrabold rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 fill-current shrink-0 text-[#17102A]" /> Chatear en WhatsApp
              </button>
            </div>
          </div>

          {/* Email Support Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-[#17102A] mb-1.5">Soporte por correo</h4>
              <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed mb-4">
                ¿Tienes un problema de facturación o una consulta corporativa?
              </p>
            </div>
            
            <div className="flex items-center justify-between bg-[#f7f5fa] border border-[#E5E7EB] rounded-2xl px-4 py-3">
              <span className="text-xs font-mono font-bold text-[#17102A]">soporte@pika.mx</span>
              <button 
                onClick={handleCopyEmail}
                className="p-2 hover:bg-neutral-200/60 active:scale-90 rounded-lg text-neutral-500 hover:text-[#17102A] transition-all"
                title="Copiar correo"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
