import { PikaWordmark, Confetti, Heart } from '../pika/atoms';
import { useNavigate } from 'react-router-dom';
import { Zap, Smartphone, Lock, Star } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-full min-h-screen font-sans bg-muted/30 text-neutral-900 flex flex-col">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/40 to-zinc-950 text-white px-6 md:px-12 py-16 md:py-24 min-h-[640px] flex flex-col justify-between">
        <Confetti seed={4} density={80} />

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full mb-12">
          <PikaWordmark height={40} color="#fff" />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/90">
            <a href="#how-it-works" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#benefits" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#trust" className="hover:text-white transition-colors">Seguridad</a>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Regístrate
            </button>
          </div>
          <button
            onClick={handleStart}
            className="md:hidden px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-full text-xs shadow-md"
          >
            Entrar
          </button>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center flex-1">
          <div className="md:col-span-7 flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 text-white backdrop-blur text-xs font-bold uppercase tracking-wider mb-6">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400 shrink-0" /> Capa P2P sin comisiones · México
            </span>

            <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6">
              Envía tu pago <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                con Pika
              </span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-xl mb-8 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              La forma más fácil de cobrarle y pagarle a tus amigos al instante por SPEI o DiMo. Sin CLABE, sin comisiones y sin rollos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
              <button
                onClick={handleStart}
                className="px-8 py-4 bg-white hover:bg-neutral-100 text-zinc-950 font-black rounded-full text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 active:scale-95"
              >
                Cobrar un Pika <Zap className="w-5 h-5 fill-current text-primary shrink-0" />
              </button>
              <a
                href="#how-it-works"
                className="px-6 py-4 rounded-full border border-white/20 hover:bg-white/10 text-white font-bold text-base transition-all flex items-center justify-center backdrop-blur hover:border-white/35 active:scale-95"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="flex gap-8 text-white/80 text-xs md:text-sm">
              <div>
                <span className="block font-display text-lg md:text-2xl font-black text-white">0%</span>
                Comisión P2P
              </div>
              <div className="w-px h-8 bg-white/20 self-center" />
              <div>
                <span className="block font-display text-lg md:text-2xl font-black text-white">1.4s</span>
                Pago inmediato
              </div>
              <div className="w-px h-8 bg-white/20 self-center" />
              <div>
                <span className="block font-display text-lg md:text-2xl font-black text-white">Sin App</span>
                Para el pagador
              </div>
            </div>
          </div>

          {/* Right Mascot Illustration */}
          <div className="md:col-span-5 hidden md:flex items-center justify-center relative min-h-[400px]">
            <div className="absolute right-0 top-12 transform rotate-12 scale-90">
              <Heart size={80} color="#818CF8" />
            </div>

            {/* Custom illustration placeholder */}
            <div className="w-80 h-96 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur flex flex-col items-center justify-center p-8 text-center text-white/70">
              <Smartphone className="w-16 h-16 text-white/80 mb-4" />
              <h3 className="font-bold text-lg text-white mb-2">Pika Social Layers</h3>
              <p className="text-xs text-white/75">
                "Mándame un Pika"<br />comparte un enlace simple y recibe tus fondos de inmediato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto w-full py-20 px-6">
        <div className="text-center mb-16">
          <span className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-extrabold uppercase tracking-wider">
            ¿Cómo funciona?
          </span>
          <h2 className="text-4xl md:text-5xl font-black font-display text-neutral-800 mt-4">
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
              bg: 'bg-card border border-border',
              text: 'text-primary',
            },
            {
              step: '02',
              title: 'Comparte por WhatsApp',
              desc: 'Manda el link a tu amigo. No necesita descargar ninguna app para pagarte.',
              bg: 'bg-card border border-border',
              text: 'text-primary',
            },
            {
              step: '03',
              title: 'Recibe en tu banco',
              desc: 'Tu amigo paga con SPEI o DiMo desde su banca móvil. Recibes directo y listo.',
              bg: 'bg-card border border-border',
              text: 'text-primary',
            },
          ].map((s) => (
            <div key={s.step} className={`${s.bg} rounded-[28px] p-8 min-h-[260px] flex flex-col justify-between shadow-md`}>
              <div className={`font-display text-7xl font-black ${s.text} opacity-20`}>
                {s.step}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-neutral-800 mb-2">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMERCIAL BENEFIT ── */}
      <section id="benefits" className="max-w-6xl mx-auto w-full pb-20 px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 bg-primary rounded-[32px] p-8 md:p-12 text-white flex flex-col justify-between min-h-[380px] shadow-md">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-6">
                Amigos & Negocios
              </span>
              <h2 className="text-3xl md:text-5xl font-black font-display leading-[0.95] mb-4">
                Cobra con un QR. <br /> Sin terminales.
              </h2>
              <p className="text-sm md:text-base text-white/85 leading-relaxed max-w-lg mb-8">
                Divide la cuenta de la cena, cobra la renta o acepta pagos en tu negocio usando un QR Pika. Tus clientes pagan directamente desde su banco por SPEI o CoDi. Sin rentas mensuales ni comisiones abusivas.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-white hover:bg-neutral-100 text-zinc-950 font-bold rounded-full text-sm shadow-md transition-all active:scale-95"
              >
                Comenzar ahora
              </button>
            </div>
          </div>

          <div className="md:col-span-5 bg-card border border-border rounded-[32px] p-8 md:p-12 text-foreground flex flex-col justify-between min-h-[380px] shadow-md">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider mb-6">
                Cero Balances
              </span>
              <h2 className="text-3xl font-black font-display leading-[0.95] mb-4">
                Pika no es un banco. <br /> Tampoco una wallet.
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-sm">
                No custodiamos tu dinero ni te obligamos a fonear saldos. Pika es una capa de orquestación inteligente que envía los cobros directo a la cuenta de banco que tú decidas.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-muted border border-border flex items-center gap-4">
              <Lock className="w-6 h-6 text-primary shrink-0" />
              <div className="text-xs text-muted-foreground">
                <strong>Pagos 100% regulados</strong>. Toda transacción fluye por los rieles oficiales de SPEI operados por tu banca móvil.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto bg-zinc-950 text-white py-12 px-6 md:px-12">
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
