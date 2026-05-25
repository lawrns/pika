/* global React, PikaWordmark, PikaMark, Confetti, Avatar, fmtMXN, Heart */
// Design system showcase — colors, type, components, logo, motifs.

function Swatch({ name, varName, hex, ink = '#fff' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{
        height: 96, borderRadius: 16, background: `var(${varName})`,
        display: 'flex', alignItems: 'flex-end', padding: 12,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.05)',
      }}>
        <span style={{ color: ink, fontWeight: 700, fontSize: 13 }}>{hex}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tinta-3)' }}>{varName}</span>
      </div>
    </div>
  );
}

function SystemPage() {
  return (
    <div style={{
      width: 1280, padding: 56, background: 'var(--cream)', color: 'var(--fg)',
      fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column', gap: 56,
    }}>
      {/* — Header ———————————————————————————————————— */}
      <header style={{
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 24,
        paddingBottom: 28, borderBottom: '1px solid var(--hairline)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <PikaMark size={36} color="#fff"/>
            </div>
            <span className="badge badge-brand">Design System · v1.0</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 80, lineHeight: .95, margin: 0 }}>
            pika
          </h1>
          <p style={{ fontSize: 22, color: 'var(--tinta-2)', maxWidth: 640, margin: '12px 0 0', lineHeight: 1.4 }}>
            La app para pagarle a tus amigos al instante. A warm, confetti-energy
            visual system for friend-to-friend payments in México.
          </p>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tinta-3)', lineHeight: 1.7 }}>
          <div>BRAND · ES-MX</div>
          <div>CURRENCY · MXN</div>
          <div>SCALE · 4px grid</div>
        </div>
      </header>

      {/* — Brand ————————————————————————————————————— */}
      <section>
        <SectionTitle eyebrow="01" title="Marca" subtitle="Logo, mascota y aplicaciones"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 24 }}>
          {/* Hero card */}
          <div className="confetti-bg" style={{
            background: 'var(--primary)', borderRadius: 28, padding: 48, position: 'relative',
            overflow: 'hidden', minHeight: 360, color: '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <Confetti seed={3} density={90}/>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <PikaWordmark height={72} color="#fff"/>
              <Heart size={36} color="#FFD23F"/>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="font-display" style={{ fontSize: 56, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
                Envía tu pago<br/>con Pika
              </div>
              <p style={{ marginTop: 14, opacity: 0.85, fontSize: 17, maxWidth: 380 }}>
                La app para pagarle a tus amigos al instante.
              </p>
            </div>
          </div>

          {/* Lockup grid */}
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--cream-2)' }}>
              <PikaWordmark height={48} color="var(--primary)"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tinta)' }}>
                <PikaMark size={64} color="#fff"/>
              </div>
              <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cta)' }}>
                <PikaMark size={64} color="var(--tinta)"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* — Color ————————————————————————————————————— */}
      <section>
        <SectionTitle eyebrow="02" title="Color" subtitle="Paleta cálida con energía"/>
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Brand</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            <Swatch name="Pika Purple"   varName="--pika-purple-600" hex="oklch(.45 .20 295)"/>
            <Swatch name="Sol Yellow"    varName="--pika-yellow-500" hex="oklch(.83 .16 88)"  ink="#3a2e00"/>
            <Swatch name="Lima Green"    varName="--pika-green-500"  hex="oklch(.66 .16 145)" ink="#06321a"/>
            <Swatch name="Coral"         varName="--pika-coral-500"  hex="oklch(.68 .18 30)"/>
            <Swatch name="Pink"          varName="--pika-pink-500"   hex="oklch(.72 .18 12)"/>
            <Swatch name="Sky"           varName="--pika-blue-500"   hex="oklch(.65 .15 235)"/>
          </div>
          <h4 style={{ margin: '28px 0 12px', fontSize: 13, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Neutrals</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            <Swatch name="Cream"      varName="--cream"   hex="oklch(.97 .01 90)"  ink="#3a2e00"/>
            <Swatch name="Cream 2"    varName="--cream-2" hex="oklch(.94 .01 90)"  ink="#3a2e00"/>
            <Swatch name="Paper"      varName="--paper"   hex="#FFFFFF"            ink="#3a2e00"/>
            <Swatch name="Hairline"   varName="--hairline"hex="oklch(.88 .01 280)" ink="#3a2e00"/>
            <Swatch name="Tinta 2"    varName="--tinta-2" hex="oklch(.36 .02 280)"/>
            <Swatch name="Tinta"      varName="--tinta"   hex="oklch(.18 .02 280)"/>
          </div>
        </div>
      </section>

      {/* — Type ————————————————————————————————————— */}
      <section>
        <SectionTitle eyebrow="03" title="Tipografía" subtitle="Archivo Black · Plus Jakarta Sans · JetBrains Mono"/>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
          <div className="card" style={{ padding: 32 }}>
            <div className="font-display" style={{ fontSize: 88, lineHeight: 0.95 }}>Envía,<br/>recibe,<br/>celebra.</div>
            <hr style={{ margin: '28px 0', border: 0, borderTop: '1px solid var(--hairline)' }}/>
            <div className="font-display" style={{ fontSize: 40, lineHeight: 1, marginBottom: 16 }}>Hola Mariana 👋</div>
            <h2 style={{ fontSize: 28, margin: '0 0 8px', fontWeight: 800 }}>Tu dinero, simple.</h2>
            <h3 style={{ fontSize: 18, margin: '0 0 12px', fontWeight: 700, color: 'var(--tinta-2)' }}>Sección · subtítulo</h3>
            <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, color: 'var(--tinta-2)' }}>
              Body 16/24. Use Plus Jakarta Sans para todo el texto de interfaz. Manténlo cálido,
              directo y conversacional. Evita la jerga; di "Envía" en vez de "Realizar transferencia".
            </p>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Escala</h4>
            {[
              ['Display XL', 'font-display', 56, 800],
              ['Display L',  'font-display', 40, 800],
              ['Heading',    '',             24, 800],
              ['Title',      '',             18, 700],
              ['Body',       '',             15, 500],
              ['Caption',    '',             12, 600],
            ].map(([label, cls, size, w]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '8px 0', borderBottom: '1px dashed var(--hairline)' }}>
                <div style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tinta-3)' }}>{size}px</div>
                <div className={cls} style={{ fontSize: size, fontWeight: w, lineHeight: 1.1 }}>{label}</div>
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
              <div className="font-mono tnum" style={{ fontSize: 32 }}>$1,234.56</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tinta-3)', marginTop: 4 }}>JetBrains Mono · tabular-nums</div>
            </div>
          </div>
        </div>
      </section>

      {/* — Buttons & Inputs ———————————————————————————— */}
      <section>
        <SectionTitle eyebrow="04" title="Componentes" subtitle="Botones, inputs y badges"/>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 32 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Botones</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <button className="btn btn-cta">Haz un pago</button>
                <button className="btn btn-success">Regístrate</button>
                <button className="btn btn-primary">Continuar</button>
                <button className="btn btn-ghost">Cancelar</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <button className="btn btn-cta btn-sm">Aceptar</button>
                <button className="btn btn-primary btn-sm">Enviar</button>
                <button className="btn btn-ghost btn-sm">Más tarde</button>
              </div>
              <button className="btn btn-cta btn-lg btn-block">
                <PikaMark size={20} color="var(--tinta)"/> Enviar $250
              </button>
            </div>
          </div>
          <div className="card" style={{ padding: 32 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Inputs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input" placeholder="usuario@correo.com" defaultValue="mariana@pika.mx"/>
              <input className="input" placeholder="Busca a un amigo"/>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span className="badge badge-success">Completado</span>
                <span className="badge badge-warn">Pendiente</span>
                <span className="badge badge-brand">Instantáneo</span>
                <span className="badge badge-danger">Fallido</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* — Patterns ————————————————————————————————————— */}
      <section>
        <SectionTitle eyebrow="05" title="Patrones" subtitle="Tarjeta de saldo · fila de movimiento · contacto"/>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1.05fr 1.4fr', gap: 24 }}>
          {/* Balance card */}
          <div className="confetti-bg" style={{
            borderRadius: 24, padding: 28, background: 'var(--primary)', color: '#fff',
            position: 'relative', overflow: 'hidden', minHeight: 220,
          }}>
            <Confetti seed={11} density={40}/>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ opacity: 0.8, fontSize: 13, fontWeight: 600 }}>Saldo disponible</div>
              <div className="font-display tnum" style={{ fontSize: 56, lineHeight: 1, marginTop: 4 }}>$4,820.50</div>
              <div style={{ opacity: 0.7, fontSize: 13, marginTop: 4 }}>MXN · cuenta •••• 4821</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button className="btn btn-cta btn-sm">Enviar</button>
                <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>Cobrar</button>
                <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>Recargar</button>
              </div>
            </div>
          </div>

          {/* Transaction rows */}
          <div className="card" style={{ padding: 8 }}>
            {[
              { name: 'Carlos R.',     desc: 'Tacos de la esquina', amount: -180, status: 'completed', t: '14:22' },
              { name: 'Sofía Méndez',  desc: 'Renta · marzo',       amount: 2400, status: 'completed', t: 'Ayer' },
              { name: 'Diego López',   desc: 'Concierto',           amount: -650, status: 'pending',  t: 'Ayer' },
              { name: 'Mamá ❤︎',       desc: 'Mensualidad',          amount: 1500, status: 'completed', t: '23 mar' },
            ].map((tx, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                borderBottom: i < 3 ? '1px solid var(--hairline)' : 'none',
              }}>
                <Avatar name={tx.name} size={40}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{tx.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--tinta-3)' }}>{tx.desc} · {tx.t}</div>
                </div>
                {tx.status === 'pending' && <span className="badge badge-warn">Pendiente</span>}
                <div className={`amount tnum ${tx.amount > 0 ? 'amount-pos' : ''}`} style={{ fontSize: 18 }}>
                  {fmtMXN(tx.amount, { sign: true })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { n: 'Mariana B.', s: 'Última: ayer' },
            { n: 'Carlos R.',  s: 'Frecuente' },
            { n: 'Sofía M.',   s: 'Vecinos' },
            { n: 'Diego L.',   s: 'Trabajo' },
          ].map((c, i) => (
            <div key={i} className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={c.n} size={44}/>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.n}</div>
                <div style={{ fontSize: 12, color: 'var(--tinta-3)' }}>{c.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* — Motifs ————————————————————————————————————— */}
      <section>
        <SectionTitle eyebrow="06" title="Motivos" subtitle="Confetti, formas y aplicaciones"/>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, height: 220 }}>
          <div className="confetti-bg" style={{ background: 'var(--primary)', borderRadius: 24, position: 'relative' }}>
            <Confetti seed={1} density={80}/>
          </div>
          <div className="confetti-bg" style={{ background: 'var(--cta)', borderRadius: 24, position: 'relative' }}>
            <Confetti seed={2} density={60}/>
          </div>
          <div className="confetti-bg" style={{ background: 'var(--success)', borderRadius: 24, position: 'relative' }}>
            <Confetti seed={5} density={60}/>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tinta-3)' }}>{eyebrow}</span>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      <span style={{ fontSize: 15, color: 'var(--tinta-2)' }}>{subtitle}</span>
    </div>
  );
}

window.SystemPage = SystemPage;
