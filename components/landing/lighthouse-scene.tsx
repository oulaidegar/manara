"use client";

import { useEffect, useRef } from "react";
import type { LandingPartner } from "@/lib/landing/partners";

/** Half-width of the beam, in degrees. */
const BEAM_HALF_WIDTH = 13;
/** Base rotation speed, degrees / second (~15s per revolution). */
const BEAM_SPEED = 24;
/** How quickly a name fades after the beam leaves it (opacity / second). */
const AFTERGLOW_DECAY = 0.55;
/** Typewriter speed while the beam is on a name (chars / second). */
const TYPE_SPEED = 38;

type LabelState = { glow: number; typed: number; angle: number };

type Props = {
  partners: LandingPartner[];
  fontClassName: string;
  children?: React.ReactNode;
};

export function LighthouseScene({ partners, fontClassName, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const lanternRef = useRef<SVGCircleElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const beam = beamRef.current;
    const halo = haloRef.current;
    const lantern = lanternRef.current;
    if (!root || !beam || !halo || !lantern) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const states: LabelState[] = partners.map(() => ({ glow: 0, typed: 0, angle: 0 }));
    let lx = 0;
    let ly = 0;

    const measure = () => {
      const r = root.getBoundingClientRect();
      const l = lantern.getBoundingClientRect();
      lx = l.left + l.width / 2 - r.left;
      ly = l.top + l.height / 2 - r.top;

      halo.style.left = `${lx}px`;
      halo.style.top = `${ly}px`;
      const mask = `radial-gradient(circle at ${lx}px ${ly}px, transparent 0px, #000 14px, rgba(0,0,0,0.85) 35vmax, rgba(0,0,0,0.25) 90vmax)`;
      beam.style.maskImage = mask;
      beam.style.webkitMaskImage = mask;

      // Angle of each label as seen from the lantern (0deg = up, clockwise — same as conic-gradient).
      labelRefs.current.forEach((el, i) => {
        if (!el) return;
        const b = el.getBoundingClientRect();
        const dx = b.left + b.width / 2 - r.left - lx;
        const dy = b.top + b.height / 2 - r.top - ly;
        states[i].angle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      });
    };

    const paintBeam = (a: number) => {
      const w = BEAM_HALF_WIDTH;
      beam.style.background = `conic-gradient(from ${a - w}deg at ${lx}px ${ly}px,
        rgba(255,236,196,0) 0deg,
        rgba(255,236,196,0.10) ${w * 0.45}deg,
        rgba(255,244,222,0.30) ${w}deg,
        rgba(255,236,196,0.10) ${w * 1.55}deg,
        rgba(255,236,196,0) ${w * 2}deg,
        rgba(0,0,0,0) 360deg)`;
    };

    const paintLabel = (i: number, lit: number) => {
      const el = labelRefs.current[i];
      if (!el) return;
      const s = states[i];
      const name = partners[i].name;
      const n = Math.min(name.length, Math.floor(s.typed));

      el.style.opacity = s.glow.toFixed(3);
      el.style.textShadow =
        lit > 0.01 ? `0 0 ${(10 * lit).toFixed(1)}px rgba(255,232,190,${(0.75 * lit).toFixed(2)})` : "none";
      el.style.color = `rgb(${Math.round(200 + 55 * lit)}, ${Math.round(200 + 40 * lit)}, ${Math.round(200 + 10 * lit)})`;

      const typedEl = el.querySelector<HTMLElement>("[data-typed]");
      const restEl = el.querySelector<HTMLElement>("[data-rest]");
      const cursorEl = el.querySelector<HTMLElement>("[data-cursor]");
      const metaEl = el.querySelector<HTMLElement>("[data-meta]");
      const typed = name.slice(0, n);
      if (typedEl && typedEl.textContent !== typed) typedEl.textContent = typed;
      if (restEl) {
        const rest = name.slice(n);
        if (restEl.textContent !== rest) restEl.textContent = rest;
      }
      if (cursorEl) cursorEl.style.opacity = n < name.length || lit > 0.05 ? "1" : "0";
      if (metaEl) metaEl.style.opacity = n >= name.length ? "0.55" : "0";
    };

    measure();

    if (reduceMotion) {
      paintBeam(320);
      states.forEach((s, i) => {
        s.glow = 0.7;
        s.typed = partners[i].name.length;
        paintLabel(i, 0);
      });
      const onResize = () => {
        measure();
        paintBeam(320);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let raf = 0;
    let last = performance.now();
    const start = last;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;

      // Constant sweep plus a slow wobble so the beam "swerves" rather than ticking like a clock.
      const a = (((t * BEAM_SPEED + 16 * Math.sin(t * 0.35) + 300) % 360) + 360) % 360;
      paintBeam(a);
      halo.style.opacity = (0.75 + 0.25 * Math.sin(t * 2.1)).toFixed(3);

      states.forEach((s, i) => {
        const diff = Math.abs(((s.angle - a + 540) % 360) - 180);
        const raw = Math.max(0, 1 - diff / BEAM_HALF_WIDTH);
        const lit = raw * raw * (3 - 2 * raw); // smoothstep

        s.glow = Math.max(lit, s.glow - dt * AFTERGLOW_DECAY);
        if (lit > 0.15) s.typed += dt * TYPE_SPEED;
        if (s.glow <= 0.001) {
          s.glow = 0;
          s.typed = 0;
        }
        paintLabel(i, lit);
      });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [partners]);

  return (
    <div ref={rootRef} className={`relative isolate flex-1 overflow-hidden bg-black text-white ${fontClassName}`}>
      {/* Rotating beam */}
      <div ref={beamRef} aria-hidden className="pointer-events-none absolute inset-0 z-0" />

      {/* Lantern halo */}
      <div
        ref={haloRef}
        aria-hidden
        className="pointer-events-none absolute z-20 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,240,205,0.55) 0%, rgba(255,230,180,0.12) 40%, transparent 70%)" }}
      />

      {/* Partner names — only visible while (or just after) the beam passes over them */}
      <ul aria-label="Partners" className="absolute inset-0 z-10 m-0 list-none p-0">
        {partners.map((p, i) => (
          <li key={p.name}>
            <div
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              aria-label={p.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
              style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: 0 }}
            >
              <div aria-hidden className="text-[11px] tracking-wide sm:text-sm md:text-base">
                <span data-typed />
                <span data-cursor className="manara-cursor">▌</span>
                <span data-rest className="invisible">
                  {p.name}
                </span>
              </div>
              {p.meta && (
                <div
                  data-meta
                  aria-hidden
                  className="mt-1 hidden text-[10px] uppercase tracking-[0.25em] transition-opacity duration-500 sm:block"
                  style={{ opacity: 0 }}
                >
                  {p.meta}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Lighthouse + content */}
      <div className="pointer-events-none relative z-30 flex min-h-screen flex-col items-center justify-center px-6">
        <LighthouseDrawing lanternRef={lanternRef} />
        <div className="pointer-events-auto mt-6 flex flex-col items-center text-center">{children}</div>
      </div>
    </div>
  );
}

function LighthouseDrawing({ lanternRef }: { lanternRef: React.Ref<SVGCircleElement> }) {
  return (
    <svg
      viewBox="0 0 480 285"
      className="w-[min(520px,82vw)] overflow-visible"
      fill="none"
      stroke="#fff"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Manara lighthouse"
    >
      {/* Back rocks */}
      <path d="M146 224 Q156 186 194 191 L198 224" fill="#000" />
      <path d="M288 224 L290 196 Q305 176 320 198" fill="#000" />

      {/* Tower */}
      <path d="M204 88 L192 214 L294 214 L280 88 Z" fill="#000" />
      <path d="M215 204 V181 A11 11 0 0 1 237 181 V204" />
      <circle cx="232" cy="194" r="0.8" fill="#fff" strokeWidth={1.5} />

      {/* Gallery */}
      <rect x="196" y="78" width="92" height="10" rx="3" fill="#000" />

      {/* Lantern room */}
      <rect x="216" y="56" width="52" height="22" fill="#000" />
      <rect x="229" y="59" width="26" height="16" rx="1" fill="#fff8e6" stroke="none" className="manara-lamp" />
      <line x1="228" y1="56" x2="228" y2="78" />
      <line x1="256" y1="56" x2="256" y2="78" />
      <circle ref={lanternRef} cx="242" cy="67" r="1" stroke="none" fill="none" />

      {/* Roof + finial */}
      <path d="M208 56 Q210 30 242 28 Q274 30 276 56 Z" fill="#000" />
      <circle cx="242" cy="21" r="6" fill="#000" />

      {/* Front rocks */}
      <path d="M90 250 Q100 213 146 218 Q162 226 160 246" fill="#000" />
      <path d="M284 214 Q328 180 366 236" fill="#000" />
      <path d="M148 246 Q182 200 240 203 Q300 206 314 248" fill="#000" />

      {/* Waves */}
      <g className="manara-wave">
        <path d="M8 252 Q42 242 76 250 T150 249 T196 251" />
        <path d="M310 249 Q340 236 372 244 T432 250 T476 246" />
      </g>
      <g className="manara-wave manara-wave--slow">
        <path d="M175 270 Q205 261 236 268 T302 268 T372 266" />
      </g>
    </svg>
  );
}
