/* global React */
// Pika shared atoms: PikaLogo, Confetti, Avatar, Money, Bolt-Sparkle marks.
// Simple primitives only — no hand-drawn character SVGs (use <image-slot> for that).

const { useMemo } = React;

// ── Logo mark ──────────────────────────────────────────────
// A friendly bolt/leaf hybrid (only basic shapes: rounded rect rotated + circle).
// Two slanted ovals + a dot — reads as a sparkle/bolt with the wordmark.
function PikaMark({ size = 32, color = '#fff' }) {
  const w = size, h = size;
  return (
    <svg width={w} height={h} viewBox="0 0 32 32" aria-hidden="true">
      <g transform="translate(16 16)">
        {/* two leaf/petal ovals */}
        <ellipse cx="-5" cy="0" rx="3.4" ry="9" transform="rotate(-35)" fill={color}/>
        <ellipse cx="5"  cy="0" rx="3.4" ry="9" transform="rotate(35)"  fill={color}/>
        {/* center dot */}
        <circle cx="0" cy="0" r="2.6" fill={color}/>
      </g>
    </svg>
  );
}

function PikaWordmark({ height = 36, color = '#fff', subdued = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.22 }}>
      <PikaMark size={height} color={color}/>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: height,
        lineHeight: 1,
        color: color,
        letterSpacing: '-0.02em',
        opacity: subdued ? 0.95 : 1,
      }}>pika</span>
    </div>
  );
}

// ── Confetti backdrop ─────────────────────────────────────
// Only uses circles, dots, slashes (rotated rects) — no hand-drawn complex SVG.
// Deterministic per `seed` so it doesn't reshuffle each re-render.
function mulberry32(a) { return function() { let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const CONFETTI_COLORS = [
  '#FFD23F', // sol yellow
  '#FF7A3D', // coral
  '#FF3D8A', // pink
  '#3DC8FF', // sky blue
  '#46DC8E', // mint
  '#FFFFFF',
  '#C8A4FF',
];

function Confetti({ seed = 7, density = 70, hueShift = 0 }) {
  const rand = useMemo(() => mulberry32(seed), [seed]);
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < density; i++) {
      const r = rand();
      const kind = r < 0.40 ? 'dot' : r < 0.70 ? 'slash' : r < 0.85 ? 'circle' : 'ring';
      arr.push({
        x: rand() * 100,
        y: rand() * 100,
        size: 4 + rand() * 14,
        rot: rand() * 360,
        color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
        kind,
        op: 0.6 + rand() * 0.4,
      });
    }
    return arr;
  }, [seed, density]);

  return (
    <svg
      className="__layer"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      {items.map((it, i) => {
        const c = it.color;
        if (it.kind === 'dot') {
          return <circle key={i} cx={it.x} cy={it.y} r={it.size * 0.06} fill={c} opacity={it.op}/>;
        }
        if (it.kind === 'circle') {
          return <circle key={i} cx={it.x} cy={it.y} r={it.size * 0.15} fill={c} opacity={it.op}/>;
        }
        if (it.kind === 'ring') {
          return <circle key={i} cx={it.x} cy={it.y} r={it.size * 0.18} fill="none" stroke={c} strokeWidth="0.5" opacity={it.op}/>;
        }
        // slash — rotated narrow rect
        return (
          <rect
            key={i}
            x={it.x - it.size * 0.04}
            y={it.y - it.size * 0.18}
            width={it.size * 0.08}
            height={it.size * 0.36}
            fill={c}
            opacity={it.op}
            rx={it.size * 0.04}
            transform={`rotate(${it.rot} ${it.x} ${it.y})`}
          />
        );
      })}
    </svg>
  );
}

// ── Avatar ───────────────────────────────────────────────
const AVATAR_BGS = [
  '#7A3DFF', '#FF7A3D', '#3DC8FF', '#46DC8E', '#FF3D8A', '#FFB23D',
];
function Avatar({ name = '', size = 44, src = null, ring = false }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  }, [name]);
  const bg = AVATAR_BGS[(name.length || 0) % AVATAR_BGS.length];
  const style = {
    width: size, height: size, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, color: '#fff', fontSize: size * 0.38,
    background: bg, flexShrink: 0,
    boxShadow: ring ? '0 0 0 3px #fff, 0 0 0 5px var(--primary)' : 'none',
    fontFamily: 'var(--font-ui)',
  };
  if (src) return <img src={src} style={{ ...style, objectFit: 'cover', color: 'transparent' }} alt={name}/>;
  return <div style={style}>{initials}</div>;
}

// ── Money formatter (MXN by default) ─────────────────────
function fmtMXN(n, { sign = false } = {}) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = sign ? (n >= 0 ? '+' : '−') : (n < 0 ? '−' : '');
  return `${prefix}$${s}`;
}

// ── Heart ornament (simple shape allowed: two circles + triangle) ──
function Heart({ size = 32, color = '#FFD23F' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-7-4.4-9.3-9.1C1.1 8.5 3.3 5 6.6 5c2 0 3.3 1 4.4 2.4C12.1 6 13.4 5 15.4 5c3.3 0 5.5 3.5 3.9 6.9C19 16.6 12 21 12 21z" fill={color}/>
    </svg>
  );
}

Object.assign(window, { PikaMark, PikaWordmark, Confetti, Avatar, fmtMXN, Heart });
