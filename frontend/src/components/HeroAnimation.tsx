import { useEffect, useRef } from "react";

// Canvas particle engine: programming glyphs drift across the hero, then
// physically assemble into the word ANVESHAN, hold, disperse, and repeat.
// Respects prefers-reduced-motion (renders the assembled state statically).

const WORD = "ANVESHAN";
const GLYPHS = ".,:*#+?@/\\|=<>[](){}~^%$&;:".split("");
const SCATTER_MS = 1900;
const ASSEMBLE_MS = 2200;
const HOLD_MS = 2600;
const DISPERSE_MS = 1300;
const CYCLE_MS = SCATTER_MS + ASSEMBLE_MS + HOLD_MS + DISPERSE_MS;

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
  accent: boolean;
  delay: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function HeroAnimation() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let disposed = false;
    let inView = true;
    let W = 0;
    let H = 0;
    let particles: Particle[] = [];
    let start = performance.now();

    const build = () => {
      const parent = canvas.parentElement;
      W = Math.max(320, parent?.clientWidth ?? 640);
      H = Math.max(240, parent?.clientHeight ?? 380);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sample the word's pixels offscreen to derive particle targets.
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const octx = off.getContext("2d");
      if (!octx) return;
      const fs = Math.min(W / (WORD.length * 0.74), H * 0.4);
      octx.fillStyle = "#ffffff";
      octx.font = `700 ${fs}px "Playfair Display Variable", Georgia, serif`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillText(WORD, W / 2, H / 2);
      const img = octx.getImageData(0, 0, W, H).data;

      const gap = Math.max(4, Math.round(fs / 15));
      const targets: { x: number; y: number }[] = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          if (img[(y * W + x) * 4 + 3] > 120) targets.push({ x, y });
        }
      }
      particles = targets.map((t) => ({
        x: rand(0, W),
        y: rand(0, H),
        tx: t.x,
        ty: t.y,
        vx: rand(-0.45, 0.45),
        vy: rand(-0.35, 0.35),
        char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        size: rand(9, 14),
        accent: Math.random() < 0.08,
        delay: rand(0, 0.3),
      }));
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of particles) {
        ctx.globalAlpha = p.accent ? 0.95 : 0.85;
        ctx.fillStyle = p.accent ? "#F39291" : "#F5EFD5";
        ctx.font = `${p.size}px "JetBrains Mono Variable", monospace`;
        ctx.fillText(p.char, p.tx, p.ty);
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (!inView || document.hidden) return;

      const t = (now - start) % CYCLE_MS;
      const dt = Math.min((now - (frame.last ?? now)) / 16.7, 3);
      frame.last = now;

      let alpha = 0.9;
      if (t < SCATTER_MS) {
        // Phase 1 — free drift
        for (const p of particles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < -20) p.x = W + 20;
          if (p.x > W + 20) p.x = -20;
          if (p.y < -20) p.y = H + 20;
          if (p.y > H + 20) p.y = -20;
        }
        alpha = 0.55;
      } else if (t < SCATTER_MS + ASSEMBLE_MS) {
        // Phase 2 — physical convergence toward letterform targets
        const k = (t - SCATTER_MS) / ASSEMBLE_MS;
        alpha = 0.55 + 0.45 * k;
        for (const p of particles) {
          const local = Math.min(Math.max((k - p.delay) / (1 - p.delay), 0), 1);
          const ease = 1 - Math.pow(1 - local, 3);
          p.x += (p.tx - p.x) * (0.04 + 0.14 * ease) * dt;
          p.y += (p.ty - p.y) * (0.04 + 0.14 * ease) * dt;
        }
      } else if (t < SCATTER_MS + ASSEMBLE_MS + HOLD_MS) {
        // Phase 3 — hold with a faint typographic shimmer
        const ht = now / 420;
        for (const p of particles) {
          p.x += (p.tx - p.x) * 0.1 * dt;
          p.y += (p.ty - p.y) * 0.1 * dt;
        }
        ctx.globalAlpha = 0.92;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const p of particles) {
          ctx.globalAlpha = p.accent ? 0.95 : 0.8 + 0.2 * Math.sin(ht + p.tx);
          ctx.fillStyle = p.accent ? "#F39291" : "#F5EFD5";
          ctx.font = `${p.size}px "JetBrains Mono Variable", monospace`;
          ctx.fillText(p.char, p.x, p.y);
        }
        ctx.globalAlpha = 1;
        return;
      } else {
        // Phase 4 — explosive dispersal, then the cycle restarts
        const k = (t - SCATTER_MS - ASSEMBLE_MS - HOLD_MS) / DISPERSE_MS;
        alpha = 0.9 * (1 - k);
        for (const p of particles) {
          if (k < 0.06 && p.vx === 0) {
            const dx = p.x - W / 2;
            const dy = p.y - H / 2;
            const d = Math.max(Math.hypot(dx, dy), 1);
            p.vx = (dx / d) * rand(2, 5) + rand(-0.6, 0.6);
            p.vy = (dy / d) * rand(2, 5) + rand(-0.6, 0.6);
          }
          p.x += p.vx * 3 * dt;
          p.y += p.vy * 3 * dt;
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of particles) {
        ctx.globalAlpha = alpha * (p.accent ? 1 : 0.88);
        ctx.fillStyle = p.accent ? "#F39291" : "#F5EFD5";
        ctx.font = `${p.size}px "JetBrains Mono Variable", monospace`;
        ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    };

    build();
    if (reduced) {
      drawStatic();
    } else {
      frame.last = 0;
      raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      build();
      if (reduced) drawStatic();
    };
    window.addEventListener("resize", onResize);

    // Wait for the display font before resampling letterform targets.
    document.fonts?.ready.then(() => {
      if (disposed) return;
      onResize();
    });

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-testid="hero-particle-canvas"
      className="absolute inset-0"
    />
  );
}
