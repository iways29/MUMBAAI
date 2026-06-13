import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildFormations, brainFormation, SCENE_COUNT } from './formations.ts';

// The brain story — one continuous particle field, seven formations,
// scrubbed by damped scroll progress. See design.md § Story.
// Layout: copy lives in a left column (or top on mobile); the figure owns the
// right half (or lower half on mobile) and is large + in focus.

interface BrainStoryHeroProps {
  onGetStarted: () => void;
}

interface Beat {
  kicker?: string;
  title: string;
  sub?: string;
  align: 'split' | 'burst';
  cta?: boolean;
}

const BEATS: Beat[] = [
  {
    kicker: 'The branching AI canvas',
    title: 'One Question.\nEvery Direction.',
    sub: 'MUMBAAI turns AI chat into a canvas of parallel thoughts — branch any reply and explore everything at once.',
    align: 'split',
    cta: true,
  },
  {
    title: 'Chat Is\nA Straight Line.',
    sub: "Your thinking isn't. Ideas fall off the edges and vanish.",
    align: 'split',
  },
  {
    title: 'Branch\nAny Reply.',
    sub: 'Split the thread. Run parallel directions side by side.',
    align: 'split',
  },
  {
    title: 'See The\nWhole Map.',
    sub: 'Every branch on one canvas. Nothing lost, nothing scrolled away.',
    align: 'split',
  },
  {
    title: 'Smart\nMerge.',
    sub: 'The best of every branch, synthesized into one answer.',
    align: 'split',
  },
  {
    title: 'A Mind,\nMapped.',
    sub: 'A living network of conversations — shaped like the way you think.',
    align: 'split',
  },
  {
    title: 'Start Exploring.',
    align: 'burst',
    cta: true,
  },
];

// Per-scene field placement (world units) + scale. Index matches formation.
// Wide screens: figure pushed right, text in the left column.
// ox, oy, scale
const SCENES_WIDE: [number, number, number][] = [
  [0.46, 0.0, 1.0], // brain dim
  [0.46, 0.0, 1.15], // line
  [0.46, 0.0, 1.15], // fork
  [0.46, 0.0, 1.1], // tree
  [0.46, 0.0, 1.05], // pulse
  [0.46, 0.0, 1.1], // brain lit (network)
  [0.06, 0.0, 1.4], // explode — center + big
];
// Narrow screens: figure pushed up, text below at... we put text at TOP and
// figure lower, so figure oy is negative (down).
const SCENES_NARROW: [number, number, number][] = [
  [0.0, -0.52, 0.78], // brain dim — low + small so the hero copy is clear
  [0.0, -0.46, 0.82], // line
  [0.0, -0.46, 0.82], // fork
  [0.0, -0.46, 0.8], // tree
  [0.0, -0.5, 0.78], // pulse
  [0.0, -0.52, 0.82], // brain lit
  [0.0, 0.0, 1.2], // explode — center + big
];

const VERTEX = `
attribute vec3 aTarget;
attribute vec3 aColor;
attribute vec3 aTargetColor;
attribute float aSeed;
uniform float uProgress;
uniform float uTime;
uniform float uScale;
uniform vec2 uOffset;
uniform float uSize;
uniform float uIntro;
uniform float uArc;
uniform vec2 uMouse;
uniform float uMouseActive;
varying vec3 vColor;
varying float vShape;
varying float vFade;
void main() {
  float d = clamp((uProgress - aSeed * 0.22) / 0.78, 0.0, 1.0);
  float e = d * d * (3.0 - 2.0 * d);
  vec3 pos = mix(position, aTarget, e);
  // arc the journey: particles bow sideways mid-transition (uArc scales it —
  // the explosion turns this up so the burst feels violent)
  float arc = e * (1.0 - e);
  pos.x += arc * uArc * sin(aSeed * 61.0);
  pos.y += arc * uArc * cos(aSeed * 47.0);
  // idle drift
  pos.x += 0.005 * sin(uTime * 0.6 + aSeed * 41.0);
  pos.y += 0.005 * cos(uTime * 0.5 + aSeed * 57.0);
  // intro burst: fly in from a scattered shell
  vec3 burstDir = normalize(vec3(sin(aSeed * 78.2), cos(aSeed * 39.1), sin(aSeed * 51.7)));
  pos += burstDir * (1.0 - uIntro) * (0.7 + aSeed * 1.6);
  pos.xy *= uScale;
  pos.xy += uOffset;
  // cursor repulsion (post-transform, world space)
  vec2 dm = pos.xy - uMouse;
  float md = max(length(dm), 0.001);
  pos.xy += (dm / md) * 0.08 * exp(-md * md * 12.0) * uMouseActive;
  vColor = mix(aColor, aTargetColor, e);
  vShape = fract(aSeed * 7.31);
  vFade = 0.15 + 0.85 * uIntro;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * (0.75 + aSeed * 0.85) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

// Crisp geometric micro-shapes: circles, diamonds, squares.
const FRAGMENT = `
varying vec3 vColor;
varying float vShape;
varying float vFade;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float d;
  if (vShape < 0.55) {
    d = length(q);
  } else if (vShape < 0.8) {
    d = (abs(q.x) + abs(q.y)) * 0.7071;
  } else {
    d = max(abs(q.x), abs(q.y)) * 0.9;
  }
  float a = (1.0 - smoothstep(0.40, 0.48, d)) * 0.95 * vFade;
  if (a < 0.02) discard;
  gl_FragColor = vec4(vColor, a);
}`;

// Static SVG poster — used when WebGL is unavailable.
const BrainPoster: React.FC = () => {
  const dots = React.useMemo(() => {
    const f = brainFormation(460, true);
    const out: { x: number; y: number; c: string; o: number }[] = [];
    for (let i = 0; i < 460; i++) {
      const r = Math.round(f.colors[i * 3] * 255);
      const g = Math.round(f.colors[i * 3 + 1] * 255);
      const b = Math.round(f.colors[i * 3 + 2] * 255);
      out.push({
        x: 50 + f.positions[i * 3] * 44,
        y: 50 - f.positions[i * 3 + 1] * 44,
        c: `rgb(${r},${g},${b})`,
        o: 0.4 + (i % 5) * 0.12,
      });
    }
    return out;
  }, []);
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={0.45} fill={d.c} opacity={d.o} />
      ))}
    </svg>
  );
};

const Cta: React.FC<{ onGetStarted: () => void; centered?: boolean }> = ({ onGetStarted, centered }) => (
  <div className={`flex flex-wrap items-center gap-3 mt-10 ${centered ? 'justify-center' : ''}`}>
    <button
      onClick={onGetStarted}
      className="rounded-pill bg-plum hover:bg-plum-hover text-bone text-[13px] font-semibold uppercase tracking-kicker px-7 py-4 transition-colors duration-fast"
    >
      Start free
    </button>
    <a
      href="https://youtu.be/O620a-fz_4g"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-pill border border-hairline hover:border-hairline-strong text-bone text-[13px] font-semibold uppercase tracking-kicker px-7 py-4 transition-colors duration-fast"
    >
      Watch the demo
    </a>
  </div>
);

const renderTitle = (title: string) =>
  title.split('\n').map((line, i) => (
    <span key={i} className="block">
      {line}
    </span>
  ));

export const BrainStoryHero: React.FC<BrainStoryHeroProps> = ({ onGetStarted }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      setWebglFailed(true);
      return;
    }

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 7000 : 16000;
    const formations = buildFormations(COUNT);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    camera.position.z = 2.3;
    const halfH = Math.tan((50 * Math.PI) / 360) * 2.3;

    const geometry = new THREE.BufferGeometry();
    const posA = new THREE.BufferAttribute(formations[0].positions.slice(), 3);
    const posB = new THREE.BufferAttribute(formations[1].positions.slice(), 3);
    const colA = new THREE.BufferAttribute(formations[0].colors.slice(), 3);
    const colB = new THREE.BufferAttribute(formations[1].colors.slice(), 3);
    [posA, posB, colA, colB].forEach((a) => a.setUsage(THREE.DynamicDrawUsage));
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) seeds[i] = Math.random();
    geometry.setAttribute('position', posA);
    geometry.setAttribute('aTarget', posB);
    geometry.setAttribute('aColor', colA);
    geometry.setAttribute('aTargetColor', colB);
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uScale: { value: 1 },
        uOffset: { value: new THREE.Vector2(0, 0) },
        uSize: { value: 8 },
        uIntro: { value: 0 },
        uArc: { value: 0.22 },
        uMouse: { value: new THREE.Vector2(99, 99) },
        uMouseActive: { value: 0 },
      },
    });
    scene.add(new THREE.Points(geometry, material));

    let currentSegment = 0;
    const loadSegment = (idx: number) => {
      currentSegment = idx;
      (posA.array as Float32Array).set(formations[idx].positions);
      (posB.array as Float32Array).set(
        formations[Math.min(idx + 1, SCENE_COUNT - 1)].positions
      );
      (colA.array as Float32Array).set(formations[idx].colors);
      (colB.array as Float32Array).set(
        formations[Math.min(idx + 1, SCENE_COUNT - 1)].colors
      );
      posA.needsUpdate = true;
      posB.needsUpdate = true;
      colA.needsUpdate = true;
      colB.needsUpdate = true;
    };

    let aspect = 1;
    let baseSize = 5;
    const resize = () => {
      const w = wrapper.clientWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      baseSize = (isMobile ? 4 : 5) * dpr * (h / 800);
    };
    resize();
    window.addEventListener('resize', resize);

    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(wrapper);

    // cursor repulsion — tracked on the sticky stage, mapped to world space
    const mouseTarget = new THREE.Vector2(99, 99);
    let mouseActiveTarget = 0;
    const onMove = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const nx = ((ev.clientX - r.left) / r.width) * 2 - 1;
      const ny = 1 - ((ev.clientY - r.top) / r.height) * 2;
      mouseTarget.set(nx * halfH * aspect, ny * halfH);
      mouseActiveTarget = 1;
    };
    const onLeave = () => {
      mouseActiveTarget = 0;
    };
    wrapper.addEventListener('pointermove', onMove);
    wrapper.addEventListener('pointerleave', onLeave);

    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    let smoothT = 0; // damped story position, 0..SCENE_COUNT-1
    let intro = 0;
    const tmpOffset = new THREE.Vector2();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || document.hidden) {
        last = performance.now();
        return;
      }
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // intro burst, time-based
      intro = Math.min(1, intro + dt / 1.7);
      const introEased = 1 - Math.pow(1 - intro, 3);
      material.uniforms.uIntro.value = introEased;

      // damped scroll progress — this is what makes it feel smooth
      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      const targetT = progress * (SCENE_COUNT - 1);
      smoothT += (targetT - smoothT) * (1 - Math.exp(-dt * 7));
      const t = smoothT;

      const idx = Math.min(Math.floor(t), SCENE_COUNT - 2);
      if (idx !== currentSegment) loadSegment(idx);
      const frac = t - idx;
      // hold each formation, transition through the middle of the segment
      const u = Math.min(1, Math.max(0, (frac - 0.22) / 0.56));
      const ue = u * u * (3 - 2 * u);
      material.uniforms.uProgress.value = u;
      material.uniforms.uTime.value = (now - t0) / 1000;

      // explosion: the final transition (into scene 6) turns the arc way up
      const explodeT = Math.max(0, t - (SCENE_COUNT - 2)); // 0..1 over last segment
      material.uniforms.uArc.value = 0.22 + explodeT * 0.9;

      // per-scene placement + scale, interpolated through the transition
      const scenes = aspect > 1.1 ? SCENES_WIDE : SCENES_NARROW;
      const a = scenes[idx];
      const b = scenes[Math.min(idx + 1, SCENE_COUNT - 1)];
      tmpOffset.set(a[0] + (b[0] - a[0]) * ue, a[1] + (b[1] - a[1]) * ue);
      (material.uniforms.uOffset.value as THREE.Vector2).copy(tmpOffset);
      const sc = a[2] + (b[2] - a[2]) * ue;
      material.uniforms.uScale.value = Math.min(1.5, Math.max(0.4, aspect * 0.7)) * sc;
      material.uniforms.uSize.value = baseSize;

      // cursor easing
      const mu = material.uniforms.uMouse.value as THREE.Vector2;
      mu.lerp(mouseTarget, 1 - Math.exp(-dt * 10));
      material.uniforms.uMouseActive.value +=
        (mouseActiveTarget - material.uniforms.uMouseActive.value) * (1 - Math.exp(-dt * 6));

      // copy beats
      BEATS.forEach((_, i) => {
        const el = beatRefs.current[i];
        if (!el) return;
        const vis = Math.min(1, Math.max(0, 1.2 - Math.abs(t - i) * 2.4));
        el.style.opacity = String(vis);
        el.style.pointerEvents = vis > 0.55 ? 'auto' : 'none';
        el.style.transform = `translateY(${(1 - vis) * 16}px)`;
      });
      if (hintRef.current) {
        hintRef.current.style.opacity = String(progress < 0.015 ? 1 : 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      wrapper.removeEventListener('pointermove', onMove);
      wrapper.removeEventListener('pointerleave', onLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  // Reduced motion / no WebGL: a single calm screen — lit brain poster + copy.
  if (reducedMotion || webglFailed) {
    return (
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full md:w-3/5 opacity-90">
          <BrainPoster />
        </div>
        <div className="relative max-w-page mx-auto w-full px-6 md:px-12">
          <div className="max-w-[520px]">
            <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-6">
              {BEATS[0].kicker}
            </p>
            <h1
              className="font-extralight text-bone tracking-display"
              style={{ fontSize: 'clamp(52px, 7.5vw, 104px)', lineHeight: 0.92 }}
            >
              {renderTitle(BEATS[0].title)}
            </h1>
            <p className="text-ash text-lg leading-relaxed mt-8 max-w-[44ch]">
              {BEATS[0].sub}
            </p>
            <Cta onGetStarted={onGetStarted} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={wrapperRef} className="relative" style={{ height: '660vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {BEATS.map((beat, i) => (
          <div
            key={i}
            ref={(el) => {
              beatRefs.current[i] = el;
            }}
            className={
              beat.align === 'burst'
                ? 'absolute inset-0 flex items-center justify-center text-center'
                : 'absolute inset-0 flex items-start md:items-center pt-[16vh] md:pt-0'
            }
            style={{ opacity: i === 0 ? 1 : 0, pointerEvents: i === 0 ? 'auto' : 'none' }}
          >
            <div className="max-w-page mx-auto w-full px-6 md:px-12">
              {beat.align === 'burst' ? (
                <div className="mx-auto max-w-[680px]">
                  <h2
                    className="font-extralight text-bone tracking-display"
                    style={{ fontSize: 'clamp(48px, 7vw, 96px)', lineHeight: 0.94 }}
                  >
                    {renderTitle(beat.title)}
                  </h2>
                  {beat.cta && <Cta onGetStarted={onGetStarted} centered />}
                </div>
              ) : (
                <div className="max-w-[520px] text-center md:text-left">
                  {beat.kicker && (
                    <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-6">
                      {beat.kicker}
                    </p>
                  )}
                  <h1
                    className="font-extralight text-bone tracking-display"
                    style={{ fontSize: 'clamp(48px, 6.5vw, 96px)', lineHeight: 0.92 }}
                  >
                    {renderTitle(beat.title)}
                  </h1>
                  {beat.sub && (
                    <p className="text-ash text-base md:text-lg leading-relaxed tracking-body mt-7 max-w-[42ch] mx-auto md:mx-0">
                      {beat.sub}
                    </p>
                  )}
                  {beat.cta && <Cta onGetStarted={onGetStarted} />}
                </div>
              )}
            </div>
          </div>
        ))}

        <div
          ref={hintRef}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-smoke text-[12px] uppercase tracking-kicker transition-opacity duration-slow"
        >
          <span>Scroll — watch a thought branch</span>
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
            <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};
