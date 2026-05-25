import React, { useState, useRef, useEffect, useLayoutEffect, createContext, useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';

// Design Canvas Context
interface DCCtxType {
  state: { scale: number };
  setZoom: (s: number) => void;
}

const DCCtx = createContext<DCCtxType | null>(null);

// ── Viewport Panning/Zooming Canvas ─────────────────────────
interface DesignCanvasProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
}

export function DesignCanvas({
  children,
  minScale = 0.1,
  maxScale = 4,
}: DesignCanvasProps) {
  const [scale, setScale] = useState(1);
  const vpRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const tf = useRef({ x: 200, y: 100, scale: 0.85 });

  const apply = () => {
    const { x, y, scale: s } = tf.current;
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    el.style.setProperty('--dc-inv-zoom', String(1 / s));
    setScale(s);
  };

  useLayoutEffect(() => {
    apply();
  }, []);

  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const zoomAt = (cx: number, cy: number, factor: number) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left;
      const py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;

      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Figma styled: ctrlKey represents trackpad pinch
      if (e.ctrlKey) {
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else {
        // pan or normal scroll
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    let drag: { id: number; lx: number; ly: number } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      const onBg = !(e.target as HTMLElement).closest('[data-dc-slot]');
      if (!(e.button === 1 || (e.button === 0 && onBg))) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
      vp.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);

    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [minScale, maxScale]);

  const api = useMemo(() => ({
    state: { scale },
    setZoom: (s: number) => {
      if (!vpRef.current) return;
      const r = vpRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const px = cx - r.left;
      const py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, s));
      const k = next / t.scale;
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
    }
  }), [scale, minScale, maxScale]);

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 0H0v100' fill='none' stroke='rgba(0,0,0,0.05)' stroke-width='1'/%3E%3C/svg%3E")`;

  return (
    <DCCtx.Provider value={api}>
      <div
        ref={vpRef}
        className="relative w-screen h-screen overflow-hidden select-none bg-[#f3f1eb]"
        style={{ touchAction: 'none' }}
      >
        {/* Infinite Grid Background */}
        <div
          ref={worldRef}
          className="absolute top-0 left-0 p-16 origin-top-left"
          style={{ width: 'max-content', minWidth: '100%', minHeight: '100%' }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              inset: -8000,
              backgroundImage: gridSvg,
              backgroundSize: '100px 100px',
              zIndex: -1,
            }}
          />
          {children}
        </div>

        {/* Floating Zoom HUD */}
        <div className="absolute flex items-center gap-3 px-4 py-2 border rounded-full shadow-lg bottom-8 right-8 bg-white/90 backdrop-blur border-neutral-200/80 z-[100] text-sm font-semibold text-neutral-700">
          <button
            onClick={() => api.setZoom(scale - 0.15)}
            className="p-1 rounded hover:bg-neutral-100 active:scale-90"
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={() => api.setZoom(scale + 0.15)}
            className="p-1 rounded hover:bg-neutral-100 active:scale-90"
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-neutral-200" />
          <button
            onClick={() => api.setZoom(0.85)}
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            Ajustar
          </button>
        </div>
      </div>
    </DCCtx.Provider>
  );
}

// ── Design Canvas Section ───────────────────────────────────
interface DCSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DCSection({ title, subtitle, children }: DCSectionProps) {
  return (
    <div className="relative mb-16">
      <div className="px-6 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-800">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
      </div>
      <div className="flex gap-12 px-6 items-start w-max">
        {children}
      </div>
    </div>
  );
}

// ── Design Canvas Artboard Card ─────────────────────────────
interface DCArtboardProps {
  label: string;
  children: React.ReactNode;
}

export function DCArtboard({ label, children }: DCArtboardProps) {
  return (
    <div className="flex flex-col gap-2" data-dc-slot="artboard">
      {/* Header labels */}
      <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
        <span className="px-2 py-0.5 rounded bg-neutral-200/70 text-neutral-700">
          {label}
        </span>
      </div>
      {/* Artboard Container */}
      <div className="overflow-hidden border border-neutral-300/60 rounded-2xl shadow-md bg-white">
        {children}
      </div>
    </div>
  );
}
