import { PikaWordmark, Heart } from '../pika/atoms';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Lock, Star, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-full min-h-screen font-sans bg-muted/30 text-neutral-900 flex flex-col">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-[#0E0B1F] text-white px-6 md:px-12 py-16 md:py-24 min-h-[640px] flex flex-col justify-between">
        {/* Soft Radial Glow */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#7B2FF2]/15 rounded-full blur-[130px] pointer-events-none" />

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full mb-12">
          <PikaWordmark height={40} color="#fff" />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/90">
            <a href="#how-it-works" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#benefits" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#trust" className="hover:text-white transition-colors">Seguridad</a>
            <button
              onClick={handleStart}
              className="px-5 py-2 bg-white hover:bg-neutral-100 text-[#17102A] font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              Regístrate
            </button>
          </div>
          <button
            onClick={handleStart}
            className="md:hidden px-5 py-2 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs backdrop-blur shadow-sm"
          >
            Entrar
          </button>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center flex-1">
          <div className="md:col-span-7 flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 text-white backdrop-blur text-xs font-bold uppercase tracking-wider mb-6">
              <Star className="w-3.5 h-3.5 fill-current text-[#FFC52E] shrink-0" /> Capa P2P sin comisiones · México
            </span>

            <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-[1.1] tracking-tight mb-6 text-white max-w-2xl">
              Envía tu pago con Pika
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/80 leading-relaxed max-w-xl mb-8">
              La forma más fácil de cobrarle y pagarle a tus amigos al instante por SPEI o DiMo. Sin CLABE, sin comisiones y sin rollos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
              <button
                onClick={handleStart}
                className="px-6 py-3.5 bg-[#FFC52E] hover:bg-[#FFD65C] text-[#17102A] font-black rounded-xl text-base shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 active:scale-95"
              >
                Cobrar un Pika <ArrowRight className="w-5 h-5 stroke-[2] shrink-0" />
              </button>
              <a
                href="#how-it-works"
                className="px-6 py-3.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-base transition-all flex items-center justify-center backdrop-blur hover:border-white/35 active:scale-95"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="flex gap-8 text-white/80 text-xs md:text-sm border-t border-white/10 pt-6 mt-8 w-full max-w-lg">
              <div>
                <span className="block font-display text-lg md:text-2xl font-black text-white">0%</span>
                <span className="text-white/50 text-xs">Comisión P2P</span>
              </div>
              <div className="w-px h-8 bg-white/10 self-center" />
              <div>
                <span className="block font-display text-lg md:text-2xl font-black text-white">1.4s</span>
                <span className="text-white/50 text-xs">Pago inmediato</span>
              </div>
              <div className="w-px h-8 bg-white/10 self-center" />
              <div>
                <span className="block font-display text-lg md:text-2xl font-black text-white">Sin App</span>
                <span className="text-white/50 text-xs">Para el pagador</span>
              </div>
            </div>
          </div>

          {/* Right Mascot Phone Mockup */}
          <div className="md:col-span-5 hidden md:flex items-center justify-center relative min-h-[400px]">
            <div className="absolute right-0 top-12 transform rotate-12 scale-90 opacity-20 pointer-events-none">
              <Heart size={80} color="#FFD23F" />
            </div>

            {/* Clean glassmorphism mockup panel */}
            <div className="w-72 h-[380px] rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-[16px] p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between text-left">
              {/* Top Notch / Status Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <PikaWordmark height={20} color="#fff" />
                <span className="text-[10px] text-white/40 tracking-wider">SPEI LINK</span>
              </div>

              {/* Middle Pay Details */}
              <div className="my-auto space-y-4">
                <div>
                  <span className="text-[11px] text-white/45 uppercase tracking-widest block mb-1">Monto a cobrar</span>
                  <h2 className="text-3xl font-display font-black text-white">$150.00 <span className="text-xs text-white/50">MXN</span></h2>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">De</span>
                    <span className="text-white/80 font-semibold">Sofía Ruiz</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">Concepto</span>
                    <span className="text-white/80">Cena de ayer</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="space-y-3">
                <div className="w-full bg-[#FFC52E] text-[#17102A] text-xs font-bold rounded-xl py-3 text-center shadow-md">
                  Pagar con SPEI o DiMo
                </div>
                <p className="text-[9px] text-white/40 text-center">
                  Pagos directos a tu banco · 100% regulado
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto w-full py-20 px-6">
        <div className="text-center mb-16">
          <span className="px-3 py-1.5 rounded-full bg-[#EFE4FF] text-[#6419D6] text-xs font-extrabold uppercase tracking-wider">
            ¿Cómo funciona?
          </span>
          <h2 className="text-4xl md:text-5xl font-black font-display text-[#17102A] mt-4">
            Tres pasos. Cero drama.
          </h2>
          <p className="text-neutral-500 mt-2 max-w-md mx-auto">
            Olvídate de copiar CLABEs eternas o mandar capturas. Todo se resuelve en segundos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Crea el cobro',
              desc: 'Indica el monto y el concepto. Generas un link seguro en un tap.',
              bg: 'bg-[#FFF2BF]/12 border border-[#FFF2BF]/20',
              text: 'text-[#FF7A3D]',
            },
            {
              step: '02',
              title: 'Comparte por WhatsApp',
              desc: 'Manda el link a tu amigo. No necesita descargar ninguna app para pagarte.',
              bg: 'bg-[#EFE4FF]/12 border border-[#EFE4FF]/20',
              text: 'text-[#6419D6]',
            },
            {
              step: '03',
              title: 'Recibe en tu banco',
              desc: 'Tu amigo paga con SPEI o DiMo desde su banca móvil. Recibes directo y listo.',
              bg: 'bg-[#DDF8E7]/12 border border-[#DDF8E7]/20',
              text: 'text-[#22A952]',
            },
          ].map((s) => (
            <div key={s.step} className={`${s.bg} rounded-2xl p-8 min-h-[260px] flex flex-col justify-between shadow-sm backdrop-blur`}>
              <div className={`font-display text-7xl font-black ${s.text} opacity-40`}>
                {s.step}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#17102A] mb-2">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMERCIAL BENEFIT ── */}
      <section id="benefits" className="max-w-6xl mx-auto w-full pb-20 px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 bg-[#FFC52E] rounded-[32px] p-8 md:p-12 text-[#17102A] flex flex-col justify-between min-h-[380px] shadow-md border border-neutral-300">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-black/5 text-[#17102A] text-xs font-bold uppercase tracking-wider mb-6">
                Amigos & Negocios
              </span>
              <h2 className="text-3xl md:text-5xl font-black font-display leading-[0.95] mb-4">
                Cobra con un QR. <br /> Sin terminales.
              </h2>
              <p className="text-sm md:text-base text-[#17102A]/80 leading-relaxed max-w-lg mb-8">
                Divide la cuenta de la cena, cobra la renta o acepta pagos en tu negocio usando un QR Pika. Tus clientes pagan directamente desde su banco por SPEI o CoDi. Sin rentas mensuales ni comisiones abusivas.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-[#17102A] hover:bg-[#2A2140] text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
              >
                Comenzar ahora
              </button>
            </div>
          </div>

          <div className="md:col-span-5 bg-[#17102A] rounded-[32px] p-8 md:p-12 text-white flex flex-col justify-between min-h-[380px] shadow-md">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-6">
                Cero Balances
              </span>
              <h2 className="text-3xl font-black font-display leading-[0.95] mb-4">
                Pika no es un banco. <br /> Tampoco una wallet.
              </h2>
              <p className="text-xs md:text-sm text-white/70 leading-relaxed max-w-sm">
                No custodiamos tu dinero ni te obligamos a fonear saldos. Pika es una capa de orquestación inteligente que envía los cobros directo a la cuenta de banco que tú decidas.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
              <Lock className="w-6 h-6 text-white shrink-0" />
              <div className="text-xs text-white/80">
                <strong>Pagos 100% regulados</strong>. Toda transacción fluye por los rieles oficiales de SPEI operados por tu banca móvil.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto bg-[#17102A] text-white py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <PikaWordmark height={28} color="#fff" />
          <div className="flex gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white">Términos</a>
            <a href="#" className="hover:text-white">Privacidad</a>
            <a href="#" className="hover:text-white">Contacto</a>
          </div>
          <div className="text-xs text-white/40">
            © 2026 Pika MX. Rieles operados en conjunto con socios licenciados.
          </div>
        </div>
      </footer>
    </div>
  );
}
