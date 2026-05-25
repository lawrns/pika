/* global React, IOSDevice, PikaMark, PikaWordmark, Confetti, Avatar, fmtMXN, Heart */
// Pika mobile prototype — fully interactive
// Screens: login → home → send (pick/amount/confirm/success) → qr → movimientos → perfil
// Tab bar switches between home / movimientos / qr / perfil; Enviar opens flow modal.

const { useState, useMemo, useEffect, useRef } = React;

// ─── Seed data ────────────────────────────────────────────────
const CONTACTS = [
  { id: 'c1', name: 'Sofía Méndez',  phone: '+52 55 1234 5678', fav: true,  tag: 'Casa' },
  { id: 'c2', name: 'Carlos Reyes',  phone: '+52 55 8765 4321', fav: true,  tag: 'Comida' },
  { id: 'c3', name: 'Mariana Báez',  phone: '+52 33 2222 1111', fav: true,  tag: 'Vecinos' },
  { id: 'c4', name: 'Diego López',   phone: '+52 55 9988 7766', fav: false, tag: 'Trabajo' },
  { id: 'c5', name: 'Lupita ❤︎',     phone: '+52 55 4400 3322', fav: true,  tag: 'Familia' },
  { id: 'c6', name: 'Andrés Cruz',   phone: '+52 81 7788 9900', fav: false, tag: 'Roomies' },
  { id: 'c7', name: 'Valeria Soto',  phone: '+52 55 1010 2020', fav: false, tag: 'Gym' },
  { id: 'c8', name: 'Jorge Hdez',    phone: '+52 55 3030 4040', fav: false, tag: 'Trabajo' },
];

const INITIAL_TX = [
  { id: 't1', name: 'Carlos Reyes',    desc: 'Tacos del Güero',  amount: -180,  status: 'completed', when: 'Hoy · 14:22' },
  { id: 't2', name: 'Sofía Méndez',    desc: 'Renta · marzo',     amount: 2400,  status: 'completed', when: 'Ayer' },
  { id: 't3', name: 'Diego López',     desc: 'Boletos Tame Impala', amount: -650, status: 'pending',  when: 'Ayer' },
  { id: 't4', name: 'Mariana Báez',    desc: 'Café',              amount: -85,   status: 'completed', when: '22 mar' },
  { id: 't5', name: 'Lupita ❤︎',       desc: 'Mensualidad',       amount: 1500,  status: 'completed', when: '20 mar' },
  { id: 't6', name: 'Valeria Soto',    desc: 'Yoga',              amount: -300,  status: 'completed', when: '18 mar' },
  { id: 't7', name: 'Andrés Cruz',     desc: 'Servicios depa',    amount: -1240, status: 'completed', when: '15 mar' },
];

// ─── Lightweight icons (basic shapes only) ────────────────────
const I = {
  home: (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  list: (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  qr:   (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="15" y="15" width="6" height="6" rx="1" fill={c}/></svg>,
  user: (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  send: (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 12l18-9-7 18-3-7-8-2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" fill="none"/></svg>,
  search:(c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth="2"/><path d="M20 20l-3.5-3.5" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  arrow: (c='currentColor', dir='down-left') => {
    const rot = { 'down-left': 225, 'up-right': 45, right: 0 }[dir] || 0;
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rot}deg)` }}><path d="M5 12h14m-6-6l6 6-6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  },
  plus: (c='currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  back: (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:(c='#fff') => <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-10" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell: (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 7H4c0-1 2-2 2-7z M10 19a2 2 0 004 0" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  star: (c='currentColor', filled=false) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? c : 'none'}><path d="M12 2l3 7 7 .5-5.5 5 1.5 7-6-3.5L6 21.5l1.5-7L2 9.5 9 9l3-7z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  close:(c='currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  chev: (c='currentColor') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// Page wrapper that gives all screens a common page-content area below the status bar
function Page({ children, bg = 'var(--cream)' }) {
  return (
    <div style={{ background: bg, minHeight: '100%', paddingTop: 56 }}>
      {children}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────
function TabBar({ tab, setTab, onSend }) {
  const items = [
    { id: 'home', label: 'Inicio',   icon: I.home },
    { id: 'tx',   label: 'Movs',     icon: I.list },
    { id: 'send', label: '',         icon: I.send, isCTA: true },
    { id: 'qr',   label: 'Cobrar',   icon: I.qr },
    { id: 'me',   label: 'Perfil',   icon: I.user },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
      padding: '8px 14px 28px',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--hairline)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {items.map(it => {
          if (it.isCTA) {
            return (
              <button key={it.id} onClick={onSend} style={{
                width: 60, height: 60, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'var(--cta)', color: 'var(--tinta)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginTop: -28,
                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.2), 0 0 0 6px #fff',
              }}>
                {it.icon('var(--tinta)')}
              </button>
            );
          }
          const active = tab === it.id;
          return (
            <button key={it.id} onClick={() => setTab(it.id)} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 4px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
              color: active ? 'var(--primary)' : 'var(--tinta-3)',
            }}>
              {it.icon(active ? 'var(--primary)' : 'var(--tinta-3)')}
              <span style={{ fontSize: 10, fontWeight: 700 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState('55 1234 5678');
  return (
    <div className="confetti-bg" style={{
      background: 'var(--primary)', height: '100%', color: '#fff', position: 'relative',
      display: 'flex', flexDirection: 'column', padding: '92px 28px 28px',
    }}>
      <Confetti seed={22} density={90}/>
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <PikaWordmark height={56} color="#fff"/>
        <h1 className="font-display" style={{ fontSize: 48, lineHeight: 0.95, margin: '32px 0 0' }}>
          Envía tu pago<br/>con Pika
        </h1>
        <p style={{ fontSize: 17, opacity: 0.85, marginTop: 14, maxWidth: 280 }}>
          La app para pagarle a tus amigos al instante.
        </p>

        <div style={{ flex: 1 }}/>

        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
          <label style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '.08em' }}>Teléfono</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span className="font-mono tnum" style={{ fontSize: 18, fontWeight: 700 }}>+52</span>
            <input
              value={phone} onChange={e => setPhone(e.target.value)}
              className="font-mono tnum"
              style={{
                flex: 1, background: 'none', border: 'none', color: '#fff',
                fontSize: 22, fontWeight: 700, outline: 'none', padding: 0,
              }}
            />
          </div>
        </div>

        <button onClick={onLogin} className="btn btn-cta btn-lg btn-block">Continuar</button>
        <button className="btn btn-block" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', marginTop: 10 }}>
          Regístrate
        </button>
        <p style={{ textAlign: 'center', fontSize: 12, opacity: 0.7, marginTop: 18 }}>
          Al continuar aceptas los <u>Términos</u> y la <u>Privacidad</u>.
        </p>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────
function HomeScreen({ balance, transactions, onSend, onRequest, goTab, goSendTo }) {
  const recent = transactions.slice(0, 4);
  const favs = CONTACTS.filter(c => c.fav).slice(0, 5);
  return (
    <Page>
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Mariana Báez" size={36}/>
            <div>
              <div style={{ fontSize: 12, color: 'var(--tinta-3)' }}>Hola,</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Mariana 👋</div>
            </div>
          </div>
          <button style={{
            width: 40, height: 40, borderRadius: 999, background: 'var(--paper)',
            border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', cursor: 'pointer',
          }}>
            {I.bell('var(--fg)')}
            <span style={{ position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 999, background: 'var(--pika-coral-500)' }}/>
          </button>
        </div>

        {/* Balance card */}
        <div className="confetti-bg" style={{
          marginTop: 16, padding: 22, borderRadius: 24,
          background: 'var(--primary)', color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <Confetti seed={31} density={35}/>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>Saldo disponible</div>
            <div className="font-display tnum" style={{ fontSize: 46, lineHeight: 1.05, marginTop: 2 }}>{fmtMXN(balance)}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>MXN · cuenta •••• 4821</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button onClick={onSend} className="btn btn-cta btn-sm">Enviar</button>
              <button onClick={onRequest} className="btn btn-sm" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>Cobrar</button>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>+ Recargar</button>
            </div>
          </div>
        </div>

        {/* Favoritos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Frecuentes</h3>
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Ver todos</button>
        </div>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '12px 0 2px', margin: '0 -20px', paddingLeft: 20, paddingRight: 20 }}>
          <button onClick={onSend} style={{
            flex: '0 0 64px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 56, height: 56, borderRadius: 999, border: '1.5px dashed var(--hairline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
            }}>{I.plus('var(--primary)')}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tinta-2)' }}>Nuevo</span>
          </button>
          {favs.map(c => (
            <button key={c.id} onClick={() => goSendTo(c)} style={{
              flex: '0 0 64px', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <Avatar name={c.name} size={56}/>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg)' }}>{c.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Recent */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Movimientos</h3>
          <button onClick={() => goTab('tx')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Ver más</button>
        </div>
        <div className="card" style={{ marginTop: 10, marginBottom: 130, padding: 4 }}>
          {recent.map((tx, i) => <TxRow key={tx.id} tx={tx} divide={i < recent.length - 1}/>)}
        </div>
      </div>
    </Page>
  );
}

function TxRow({ tx, divide }) {
  const isIn = tx.amount > 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderBottom: divide ? '1px solid var(--hairline)' : 'none',
    }}>
      <div style={{ position: 'relative' }}>
        <Avatar name={tx.name} size={40}/>
        <div style={{
          position: 'absolute', right: -2, bottom: -2,
          width: 18, height: 18, borderRadius: 999, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 2px #fff',
        }}>
          {I.arrow(isIn ? 'var(--success)' : 'var(--primary)', isIn ? 'down-left' : 'up-right')}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{tx.name}</div>
        <div style={{ fontSize: 11, color: 'var(--tinta-3)' }}>{tx.desc} · {tx.when}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className={`amount tnum ${isIn ? 'amount-pos' : 'amount-neg'}`} style={{ fontSize: 16 }}>
          {fmtMXN(tx.amount, { sign: true })}
        </div>
        {tx.status === 'pending' && <span className="badge badge-warn" style={{ marginTop: 2 }}>Pendiente</span>}
      </div>
    </div>
  );
}

// ─── Movimientos ─────────────────────────────────────────────
function TxScreen({ transactions }) {
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => {
    if (filter === 'in')  return transactions.filter(t => t.amount > 0);
    if (filter === 'out') return transactions.filter(t => t.amount < 0);
    return transactions;
  }, [transactions, filter]);

  const stats = useMemo(() => {
    const inAmt  = transactions.filter(t => t.amount > 0).reduce((s,t) => s+t.amount, 0);
    const outAmt = transactions.filter(t => t.amount < 0).reduce((s,t) => s+t.amount, 0);
    return { inAmt, outAmt };
  }, [transactions]);

  return (
    <Page>
      <div style={{ padding: '8px 20px 0' }}>
        <h1 className="font-display" style={{ fontSize: 32, margin: 0, lineHeight: 1 }}>Movimientos</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--tinta-3)', fontSize: 13 }}>Marzo 2026</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Entradas</div>
            <div className="amount tnum amount-pos" style={{ fontSize: 22, marginTop: 4 }}>{fmtMXN(stats.inAmt, { sign: true })}</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Salidas</div>
            <div className="amount tnum" style={{ fontSize: 22, marginTop: 4 }}>{fmtMXN(stats.outAmt, { sign: true })}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {[{ k:'all', l:'Todos' }, { k:'in', l:'Entradas' }, { k:'out', l:'Salidas' }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              flex: 1, padding: '8px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: filter === f.k ? 'var(--primary)' : 'var(--cream-2)',
              color: filter === f.k ? '#fff' : 'var(--fg)',
            }}>{f.l}</button>
          ))}
        </div>

        <div className="card" style={{ marginTop: 14, marginBottom: 130, padding: 4 }}>
          {filtered.map((tx, i) => <TxRow key={tx.id} tx={tx} divide={i < filtered.length - 1}/>)}
        </div>
      </div>
    </Page>
  );
}

// ─── QR (cobrar) ─────────────────────────────────────────────
function QRScreen() {
  const [amount, setAmount] = useState('');
  const display = amount ? Number(amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0';

  return (
    <Page bg="var(--primary)">
      <div className="confetti-bg" style={{ minHeight: '100%', background: 'var(--primary)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <Confetti seed={51} density={60}/>
        <div style={{ position: 'relative', zIndex: 1, padding: '8px 20px 140px' }}>
          <h1 className="font-display" style={{ fontSize: 32, margin: 0, lineHeight: 1 }}>Cobrar</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 13 }}>Comparte tu QR o tu @</p>

          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <div style={{ opacity: 0.8, fontSize: 12, fontWeight: 600 }}>Monto a cobrar (opcional)</div>
            <div className="font-display tnum" style={{ fontSize: 56, lineHeight: 1, marginTop: 4 }}>${display}</div>
          </div>

          {/* fake QR — simple grid of squares only */}
          <div style={{ background: '#fff', borderRadius: 24, padding: 18, marginTop: 18, color: 'var(--fg)' }}>
            <FakeQR size={260}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '4px 6px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>@mariana.bp</div>
                <div style={{ fontSize: 12, color: 'var(--tinta-3)' }}>Pika · MXN</div>
              </div>
              <button className="btn btn-primary btn-sm">Compartir</button>
            </div>
          </div>

          {/* quick amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
            {[50, 100, 200, 500].map(v => (
              <button key={v} onClick={() => setAmount(String(v))} style={{
                padding: '12px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700, fontSize: 14,
              }}>${v}</button>
            ))}
          </div>
          <button onClick={() => setAmount('')} className="btn btn-block" style={{ marginTop: 12, background: 'rgba(255,255,255,0.14)', color: '#fff' }}>Limpiar</button>
        </div>
      </div>
    </Page>
  );
}

function FakeQR({ size = 240, seed = 7 }) {
  const cells = 21;
  const grid = useMemo(() => {
    const rng = mulberry32X(seed);
    const m = [];
    for (let i = 0; i < cells; i++) {
      const row = [];
      for (let j = 0; j < cells; j++) {
        row.push(rng() < 0.48 ? 1 : 0);
      }
      m.push(row);
    }
    // finder squares corners
    const stamp = (r, c) => {
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
        const on = (i === 0 || i === 6 || j === 0 || j === 6) || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        m[r+i][c+j] = on ? 1 : 0;
      }
    };
    stamp(0, 0); stamp(0, cells - 7); stamp(cells - 7, 0);
    return m;
  }, [seed]);

  const cell = size / cells;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {grid.map((row, i) => row.map((v, j) => v
        ? <rect key={`${i}-${j}`} x={j*cell} y={i*cell} width={cell*0.96} height={cell*0.96} rx={cell*0.18} fill="#1a1233"/>
        : null
      ))}
      {/* center logo */}
      <rect x={size/2 - 26} y={size/2 - 26} width="52" height="52" rx="14" fill="var(--primary)"/>
      <g transform={`translate(${size/2} ${size/2})`}>
        <ellipse cx="-5" cy="0" rx="3.4" ry="9" transform="rotate(-35)" fill="#fff"/>
        <ellipse cx="5"  cy="0" rx="3.4" ry="9" transform="rotate(35)"  fill="#fff"/>
        <circle cx="0" cy="0" r="2.6" fill="#fff"/>
      </g>
    </svg>
  );
}
function mulberry32X(a) { return function() { let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ─── Perfil ──────────────────────────────────────────────────
function ProfileScreen({ balance }) {
  const rows = [
    { l: 'Tarjeta Pika',     v: '•••• 4821',     a: 'var(--primary)' },
    { l: 'Cuenta CLABE',    v: '012 180 ••• 821', a: 'var(--pika-blue-500)' },
    { l: 'Beneficiarios',    v: '3 contactos',    a: 'var(--pika-coral-500)' },
    { l: 'Notificaciones',   v: 'Activadas',      a: 'var(--success)' },
    { l: 'Seguridad',        v: 'Face ID · PIN', a: 'var(--pika-pink-500)' },
    { l: 'Ayuda',            v: '24/7',           a: 'var(--tinta)' },
  ];
  return (
    <Page>
      <div style={{ padding: '8px 20px 140px' }}>
        <div className="confetti-bg" style={{
          borderRadius: 24, padding: 22, background: 'var(--primary)', color: '#fff', overflow: 'hidden', position: 'relative',
        }}>
          <Confetti seed={71} density={36}/>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name="Mariana Báez" size={64} ring={true}/>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20 }}>Mariana Báez</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>@mariana.bp · Miembro desde 2024</div>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 10 }}>
              <div style={{ fontSize: 10, opacity: 0.75 }}>Saldo</div>
              <div className="amount tnum" style={{ color: '#fff', fontSize: 18 }}>{fmtMXN(balance)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 10 }}>
              <div style={{ fontSize: 10, opacity: 0.75 }}>Nivel</div>
              <div className="amount" style={{ color: '#fff', fontSize: 18 }}>Pika Pro</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16, padding: 4 }}>
          {rows.map((r, i) => (
            <div key={r.l} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--hairline)' : 'none',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: r.a,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800,
              }}>•</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.l}</div>
                <div style={{ fontSize: 12, color: 'var(--tinta-3)' }}>{r.v}</div>
              </div>
              {I.chev('var(--tinta-3)')}
            </div>
          ))}
        </div>

        <button className="btn btn-ghost btn-block" style={{ marginTop: 16 }}>Cerrar sesión</button>
      </div>
    </Page>
  );
}

// ─── Send flow modal (multi-step) ────────────────────────────
function SendFlow({ open, onClose, balance, onCommit, presetContact }) {
  const [step, setStep] = useState('pick'); // pick → amount → confirm → success
  const [contact, setContact] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setStep(presetContact ? 'amount' : 'pick');
      setContact(presetContact || null);
      setAmount(''); setNote(''); setSearch('');
    }
  }, [open, presetContact]);

  if (!open) return null;

  const filtered = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const favs = filtered.filter(c => c.fav);
  const others = filtered.filter(c => !c.fav);

  const numAmount = parseFloat(amount) || 0;
  const insufficient = numAmount > balance;
  const validAmount = numAmount > 0 && !insufficient;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: 'var(--cream)', display: 'flex', flexDirection: 'column',
    }}>
      {/* status spacer */}
      <div style={{ height: 56 }}/>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
        <button onClick={step === 'pick' ? onClose : () => setStep(step === 'amount' ? 'pick' : 'amount')} style={{
          width: 40, height: 40, borderRadius: 999, background: 'var(--paper)',
          border: '1px solid var(--hairline)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{step === 'pick' ? I.close('var(--fg)') : I.back('var(--fg)')}</button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>
          {step === 'pick' && 'Enviar a…'}
          {step === 'amount' && 'Monto'}
          {step === 'confirm' && 'Confirmar pago'}
          {step === 'success' && ''}
        </div>
        <div style={{ width: 40 }}/>
      </div>

      {step === 'pick' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 28px' }}>
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 48,
          }}>
            {I.search('var(--tinta-3)')}
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nombre, teléfono o @user"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 15 }}/>
          </div>

          {favs.length > 0 && (
            <>
              <h4 style={{ fontSize: 11, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '20px 0 10px' }}>Frecuentes</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {favs.map(c => (
                  <button key={c.id} onClick={() => { setContact(c); setStep('amount'); }} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 4,
                  }}>
                    <Avatar name={c.name} size={56}/>
                    <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{c.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <h4 style={{ fontSize: 11, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '20px 0 10px' }}>Todos</h4>
          <div className="card" style={{ padding: 4 }}>
            {others.map((c, i) => (
              <button key={c.id} onClick={() => { setContact(c); setStep('amount'); }} style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderBottom: i < others.length - 1 ? '1px solid var(--hairline)' : 'none', textAlign: 'left',
              }}>
                <Avatar name={c.name} size={42}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tinta-3)' }}>{c.phone}</div>
                </div>
                {I.chev('var(--tinta-3)')}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'amount' && contact && (
        <AmountStep
          contact={contact}
          amount={amount} setAmount={setAmount}
          note={note} setNote={setNote}
          balance={balance}
          insufficient={insufficient}
          validAmount={validAmount}
          onContinue={() => setStep('confirm')}
        />
      )}

      {step === 'confirm' && contact && (
        <ConfirmStep
          contact={contact} amount={numAmount} note={note}
          onCancel={() => setStep('amount')}
          onConfirm={() => {
            onCommit({ contact, amount: numAmount, note });
            setStep('success');
          }}
        />
      )}

      {step === 'success' && contact && (
        <SuccessStep amount={numAmount} contact={contact} onDone={onClose}/>
      )}
    </div>
  );
}

function AmountStep({ contact, amount, setAmount, note, setNote, balance, insufficient, validAmount, onContinue }) {
  const display = amount === '' ? '0' : amount;
  const press = (d) => {
    if (d === 'del') { setAmount(amount.slice(0, -1)); return; }
    if (d === '.') {
      if (amount.includes('.')) return;
      setAmount(amount === '' ? '0.' : amount + '.');
      return;
    }
    if (amount === '0') { setAmount(d); return; }
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return;
    if (!amount.includes('.') && amount.length >= 6) return;
    setAmount(amount + d);
  };
  const keys = ['1','2','3','4','5','6','7','8','9','.','0','del'];

  return (
    <>
      <div style={{ padding: '4px 20px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px',
          background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 999,
        }}>
          <Avatar name={contact.name} size={26}/>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Para {contact.name}</span>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--tinta-3)', fontWeight: 600 }}>Monto en MXN</div>
          <div className="font-display tnum" style={{
            fontSize: 84, lineHeight: 1, marginTop: 4, color: validAmount ? 'var(--fg)' : (insufficient ? 'var(--danger)' : 'var(--fg)'),
            letterSpacing: '-0.03em',
          }}>
            <span style={{ opacity: amount === '' ? 0.25 : 1 }}>$</span>{display}
          </div>
          <div style={{ fontSize: 13, color: insufficient ? 'var(--danger)' : 'var(--tinta-3)', marginTop: 6, fontWeight: 600 }}>
            {insufficient ? 'Saldo insuficiente · ' + fmtMXN(balance) : 'Saldo: ' + fmtMXN(balance)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[100, 250, 500, 1000].map(v => (
            <button key={v} onClick={() => setAmount(String(v))} style={{
              padding: '8px 14px', borderRadius: 999, border: '1px solid var(--hairline)',
              background: 'var(--paper)', cursor: 'pointer', fontWeight: 700, fontSize: 13,
            }}>${v}</button>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 18,
          background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 16, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 18 }}>📝</span>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="¿Para qué es? (opcional)"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14 }}/>
        </div>
      </div>

      {/* keypad */}
      <div style={{ flex: 1 }}/>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {keys.map(k => (
            <button key={k} onClick={() => press(k)} style={{
              height: 56, borderRadius: 14, border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)',
              color: 'var(--fg)',
            }}>
              {k === 'del' ? '⌫' : k}
            </button>
          ))}
        </div>
        <button onClick={onContinue} disabled={!validAmount} className="btn btn-cta btn-lg btn-block"
          style={{ marginTop: 8, marginBottom: 24, opacity: validAmount ? 1 : 0.5, pointerEvents: validAmount ? 'auto' : 'none' }}>
          Continuar
        </button>
      </div>
    </>
  );
}

function ConfirmStep({ contact, amount, note, onCancel, onConfirm }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 28px' }}>
      <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
        <Avatar name={contact.name} size={84}/>
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--tinta-3)', fontWeight: 600 }}>Enviarás a</div>
        <div style={{ fontWeight: 800, fontSize: 20 }}>{contact.name}</div>
        <div style={{ fontSize: 12, color: 'var(--tinta-3)' }}>{contact.phone}</div>
        <div className="font-display tnum" style={{ fontSize: 64, lineHeight: 1, marginTop: 16 }}>{fmtMXN(amount)}</div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 20 }}>
        <Row k="Comisión"  v="Gratis" green/>
        <Row k="Llegada"   v="Al instante" green/>
        {note && <Row k="Nota" v={note}/>}
        <hr style={{ border: 0, borderTop: '1px solid var(--hairline)', margin: '12px 0' }}/>
        <Row k="Total"     v={fmtMXN(amount)} bold/>
      </div>

      <div style={{
        marginTop: 16, padding: 12, borderRadius: 14, background: 'var(--pika-purple-100)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 999, background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: 14 }}>🔒</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--pika-purple-700)' }}>
          Confirma con Face ID. Tu pago llega en 1.4 s en promedio.
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      <button onClick={onConfirm} className="btn btn-cta btn-lg btn-block">
        Confirmar y enviar
      </button>
      <button onClick={onCancel} className="btn btn-ghost btn-block" style={{ marginTop: 8 }}>
        Cancelar
      </button>
    </div>
  );
}

function Row({ k, v, green, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--tinta-3)' }}>{k}</span>
      <span style={{
        fontSize: bold ? 17 : 14, fontWeight: bold ? 800 : 700,
        color: green ? 'oklch(0.45 0.16 145)' : 'var(--fg)',
        fontFamily: bold ? 'var(--font-display)' : 'inherit',
      }}>{v}</span>
    </div>
  );
}

function SuccessStep({ amount, contact, onDone }) {
  const [punch, setPunch] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPunch(true), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="confetti-bg" style={{
      flex: 1, position: 'relative', background: 'var(--primary)', color: '#fff',
      display: 'flex', flexDirection: 'column', padding: '8px 24px 28px', overflow: 'hidden',
    }}>
      <Confetti seed={Math.floor(Math.random() * 1000)} density={200}/>
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 999, background: 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: punch ? 'scale(1)' : 'scale(0.3)',
          transition: 'transform .55s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 16px 40px -8px rgba(0,0,0,.35)',
        }}>
          {I.check('#fff')}
        </div>
        <h2 className="font-display" style={{ fontSize: 44, lineHeight: 1, margin: '24px 0 6px' }}>¡Listo!</h2>
        <p style={{ fontSize: 16, opacity: 0.9 }}>Enviaste <strong>{fmtMXN(amount)}</strong> a</p>
        <p style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 0' }}>{contact.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, opacity: 0.8, fontSize: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#46DC8E' }}/>
          Llegó en 1.2 s
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <button onClick={onDone} className="btn btn-cta btn-lg btn-block">Hecho</button>
        <button className="btn btn-block" style={{ marginTop: 8, background: 'rgba(255,255,255,0.14)', color: '#fff' }}>Enviar otro</button>
      </div>
    </div>
  );
}

// ─── Request modal ─────────────────────────────────────────
function RequestModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      background: 'rgba(15,8,40,0.55)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        background: 'var(--cream)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        width: '100%', padding: 24, animation: 'slideUp .25s ease-out',
      }}>
        <div style={{ width: 44, height: 4, borderRadius: 999, background: 'var(--hairline)', margin: '0 auto 14px' }}/>
        <h3 className="font-display" style={{ fontSize: 28, margin: 0 }}>Pídele a alguien</h3>
        <p style={{ margin: '4px 0 14px', color: 'var(--tinta-3)', fontSize: 14 }}>Comparte un link, un QR o envía un cobro.</p>
        {[
          { i: '🔗', l: 'Crear link de pago', s: 'Comparte por WhatsApp' },
          { i: '📷', l: 'Mostrar QR',         s: 'Que escaneen y paguen' },
          { i: '💸', l: 'Solicitar a un amigo', s: 'Le llega una notificación' },
        ].map(o => (
          <button key={o.l} style={{
            width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
            padding: 16, marginTop: 8, background: 'var(--paper)', border: '1px solid var(--hairline)',
            borderRadius: 18, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 24 }}>{o.i}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.l}</div>
              <div style={{ fontSize: 12, color: 'var(--tinta-3)' }}>{o.s}</div>
            </div>
            {I.chev('var(--tinta-3)')}
          </button>
        ))}
        <button onClick={onClose} className="btn btn-ghost btn-block" style={{ marginTop: 14 }}>Cerrar</button>
      </div>
    </div>
  );
}

// ─── Root prototype ──────────────────────────────────────────
function PikaApp({ startScreen = 'login' }) {
  const [screen, setScreen] = useState(startScreen);  // login → app
  const [tab, setTab] = useState('home');
  const [sendOpen, setSendOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [presetContact, setPresetContact] = useState(null);
  const [balance, setBalance] = useState(4820.50);
  const [transactions, setTransactions] = useState(INITIAL_TX);

  const commitSend = ({ contact, amount, note }) => {
    setBalance(b => b - amount);
    setTransactions(txs => [{
      id: 'tx' + Date.now(),
      name: contact.name,
      desc: note || 'Pago',
      amount: -amount,
      status: 'completed',
      when: 'Ahora',
    }, ...txs]);
  };

  const openSendTo = (c) => { setPresetContact(c); setSendOpen(true); };

  let body;
  if (screen === 'login') {
    body = <LoginScreen onLogin={() => setScreen('app')}/>;
  } else if (tab === 'home') {
    body = <HomeScreen
      balance={balance} transactions={transactions}
      onSend={() => { setPresetContact(null); setSendOpen(true); }}
      onRequest={() => setReqOpen(true)}
      goTab={setTab}
      goSendTo={openSendTo}
    />;
  } else if (tab === 'tx') {
    body = <TxScreen transactions={transactions}/>;
  } else if (tab === 'qr') {
    body = <QRScreen/>;
  } else if (tab === 'me') {
    body = <ProfileScreen balance={balance}/>;
  }

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {body}
      {screen === 'app' && <TabBar tab={tab} setTab={setTab} onSend={() => { setPresetContact(null); setSendOpen(true); }}/>}
      <SendFlow
        open={sendOpen} onClose={() => { setSendOpen(false); setPresetContact(null); }}
        balance={balance} onCommit={commitSend} presetContact={presetContact}
      />
      <RequestModal open={reqOpen} onClose={() => setReqOpen(false)}/>
    </div>
  );
}

// Single screen wrapper for canvas artboards (no chrome).
function PikaScreen({ initialScreen = 'app', initialTab = 'home', expand = null }) {
  return <PikaApp startScreen={initialScreen} key={initialScreen + initialTab}/>;
}

Object.assign(window, { PikaApp, PikaScreen, HomeScreen, TxScreen, QRScreen, ProfileScreen, LoginScreen });
