/* global React, PikaWordmark, PikaMark, Confetti, Heart */
// Marketing landing — matches the reference image: purple hero, sunshine CTA,
// green Regístrate, confetti, illustrated mascot via <image-slot>.

const { useState: useStateL } = React;

function MarketingLanding() {
  return (
    <div style={{
      width: 1280, fontFamily: 'var(--font-ui)', color: 'var(--fg)', background: 'var(--cream)',
    }}>
      {/* — HERO — confetti purple with mascot slot —————— */}
      <section className="confetti-bg" style={{
        position: 'relative', background: 'var(--primary)', color: '#fff',
        padding: '24px 56px 80px', overflow: 'hidden', minHeight: 720,
      }}>
        <Confetti seed={4} density={140}/>

        {/* nav */}
        <nav style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: '16px 0',
        }}>
          <PikaWordmark height={48} color="#fff"/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 15, fontWeight: 600 }}>
            <a href="#" style={navLinkStyle}>Cómo funciona</a>
            <a href="#" style={navLinkStyle}>Comercios</a>
            <a href="#" style={navLinkStyle}>Soporte</a>
            <a href="#" style={navLinkStyle}>Inicia sesión</a>
            <button className="btn btn-success">Regístrate</button>
          </div>
        </nav>

        {/* hero content */}
        <div style={{
          position: 'relative', zIndex: 2, marginTop: 56,
          display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 48, alignItems: 'center',
        }}>
          <div>
            <span className="badge" style={{
              background: 'rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(4px)',
              fontSize: 12, padding: '6px 14px',
            }}>★ App #1 en pagos entre amigos · MX</span>

            <h1 className="font-display" style={{
              fontSize: 104, lineHeight: 0.95, margin: '20px 0 0', letterSpacing: '-0.02em',
            }}>
              Envía tu pago<br/>con Pika
            </h1>

            <p style={{ fontSize: 24, lineHeight: 1.4, marginTop: 22, maxWidth: 520, opacity: 0.92 }}>
              La app para pagarle a tus amigos al instante. Sin comisiones, sin
              vueltas — solo un toque y listo.
            </p>

            <div style={{ display: 'flex', gap: 14, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-cta btn-lg" style={{ paddingLeft: 32, paddingRight: 32 }}>
                Haz un pago
              </button>
              <a href="#" style={{ color: '#fff', fontWeight: 600, fontSize: 15, opacity: 0.9 }}>
                Ver cómo funciona →
              </a>
            </div>

            <div style={{ display: 'flex', gap: 28, marginTop: 36, fontSize: 13, opacity: 0.85 }}>
              <div><strong style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>2M+</strong><br/>usuarios activos</div>
              <div><strong style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>$0</strong><br/>comisión P2P</div>
              <div><strong style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>1.4s</strong><br/>promedio por envío</div>
            </div>
          </div>

          {/* mascot — image-slot for the user to drop their illustration */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: 520 }}>
            {/* floating yellow heart */}
            <div style={{ position: 'absolute', right: 56, top: 80, transform: 'rotate(-8deg)' }}>
              <Heart size={88} color="#FFD23F"/>
            </div>
            {/* mascot drop zone */}
            <image-slot
              id="pika-mascot"
              shape="rounded"
              radius="32"
              placeholder="Drop mascot illustration"
              style={{
                width: 460, height: 540,
                background: 'rgba(255,255,255,0.08)',
                border: '2px dashed rgba(255,255,255,0.35)',
                borderRadius: 32,
              }}
            ></image-slot>
          </div>
        </div>
      </section>

      {/* — How it works ——————————————————————————————— */}
      <section style={{ padding: '96px 56px', background: 'var(--cream)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <span className="badge badge-brand">¿Cómo funciona?</span>
            <h2 className="font-display" style={{ fontSize: 56, margin: '14px 0 0', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Tres pasos. Cero drama.
            </h2>
          </div>
          <a href="#" style={{ color: 'var(--primary)', fontWeight: 700 }}>Ver tutorial completo →</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { n: '01', t: 'Encuentra a tu amigo', d: 'Busca por nombre, teléfono o escanea su QR.', bg: 'var(--pika-yellow-200)', ink: 'var(--tinta)' },
            { n: '02', t: 'Pon el monto',          d: 'Toca una cantidad rápida o escribe la tuya.',  bg: 'var(--pika-purple-100)', ink: 'var(--tinta)' },
            { n: '03', t: 'Confirma con Face ID', d: 'Tu amigo recibe el pago en segundos. Listo.',   bg: 'var(--pika-green-200)', ink: 'var(--tinta)' },
          ].map(s => (
            <div key={s.n} style={{
              background: s.bg, borderRadius: 28, padding: 32, minHeight: 280,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div className="font-display" style={{ fontSize: 80, lineHeight: 0.9, color: 'rgba(0,0,0,0.18)' }}>{s.n}</div>
              <div>
                <h3 style={{ fontSize: 26, margin: '0 0 8px', fontWeight: 800, letterSpacing: '-0.01em' }}>{s.t}</h3>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: 'var(--tinta-2)' }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* — Feature row ————————————————————————————————— */}
      <section style={{ padding: '24px 56px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* big yellow card */}
          <div className="confetti-bg" style={{
            background: 'var(--cta)', borderRadius: 32, padding: 48, color: 'var(--tinta)',
            position: 'relative', overflow: 'hidden', minHeight: 360, display: 'flex',
            flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <Confetti seed={9} density={50}/>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="badge" style={{ background: 'rgba(0,0,0,.08)', color: 'var(--tinta)' }}>Comercios</span>
              <h2 className="font-display" style={{ fontSize: 56, lineHeight: 0.95, margin: '14px 0 0' }}>
                Cobra con un QR.<br/>Sin terminal.
              </h2>
              <p style={{ fontSize: 18, marginTop: 14, maxWidth: 440, lineHeight: 1.4, color: 'rgba(0,0,0,0.7)' }}>
                Imprime tu código una vez y empieza a recibir pagos por SPEI y CoDi
                directo a tu cuenta. Sin renta mensual, sin comisión por transacción.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
              <button className="btn" style={{ background: 'var(--tinta)', color: '#fff' }}>Soy comerciante</button>
              <button className="btn btn-ghost" style={{ borderColor: 'rgba(0,0,0,.18)' }}>Ver demo</button>
            </div>
          </div>

          {/* phone preview card — simple device */}
          <div style={{
            background: 'var(--tinta)', borderRadius: 32, padding: 32, color: '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 360, position: 'relative', overflow: 'hidden',
          }}>
            <Confetti seed={13} density={30}/>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>Pika Card</span>
              <h2 className="font-display" style={{ fontSize: 40, lineHeight: 1, margin: '14px 0 0' }}>
                Y una tarjeta<br/>para gastar tu saldo.
              </h2>
              <p style={{ fontSize: 15, marginTop: 12, opacity: 0.7, maxWidth: 300 }}>
                Pídela gratis en la app. Llega en 3 días.
              </p>
            </div>
            {/* Mini card render */}
            <div style={{
              position: 'relative', zIndex: 1,
              alignSelf: 'flex-end', width: 320, height: 200, borderRadius: 20,
              background: 'linear-gradient(135deg, var(--primary), oklch(0.55 0.20 320))',
              padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,.4)',
              transform: 'rotate(-4deg)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PikaMark size={28} color="#fff"/>
                <span style={{ fontSize: 11, opacity: 0.7, letterSpacing: '.18em' }}>DEBIT</span>
              </div>
              <div>
                <div className="font-mono tnum" style={{ fontSize: 18, letterSpacing: '.18em' }}>•••• 4821</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, opacity: 0.8 }}>
                  <span>MARIANA B.</span><span>04/29</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* — Footer band ————————————————————————————————— */}
      <footer style={{
        padding: '40px 56px', background: 'var(--tinta)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <PikaWordmark height={36} color="#fff"/>
        <div style={{ display: 'flex', gap: 28, fontSize: 13, opacity: 0.7 }}>
          <a href="#" style={{ color: '#fff' }}>Términos</a>
          <a href="#" style={{ color: '#fff' }}>Privacidad</a>
          <a href="#" style={{ color: '#fff' }}>Seguridad</a>
          <a href="#" style={{ color: '#fff' }}>Carreras</a>
        </div>
        <div style={{ fontSize: 12, opacity: 0.5 }}>© 2026 Pika · Hecho con ♥ en CDMX</div>
      </footer>
    </div>
  );
}

const navLinkStyle = { color: '#fff', textDecoration: 'none', opacity: 0.9 };

window.MarketingLanding = MarketingLanding;
