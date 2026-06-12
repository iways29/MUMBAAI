import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildFormations, brainFormation, SCENE_COUNT } from './formations.ts';

// The brain story — one continuous particle field, six formations,
// scrubbed by native scroll. See design.md § Story.

interface BrainStoryHeroProps {
  onGetStarted: () => void;
}

interface Beat {
  kicker?: string;
  title: string;
  sub?: string;
  align: 'hero' | 'corner' | 'center';
  cta?: boolean;
}

const BEATS: Beat[] = [
  {
    kicker: 'AI conversations, on a canvas',
    title: "Your mind doesn't think in a straight line.",
    sub: 'MUMBAAI turns AI chat into a branching canvas — explore every direction of a thought at once.',
    align: 'hero',
    cta: true,
  },
  {
    title: 'Every chat forces it through one.',
    sub: 'One thread, one direction. Good ideas fall off the edges and scroll away.',
    align: 'corner',
  },
  {
    title: 'Branch any reply.',
    sub: 'Split the conversation into parallel threads, each exploring its own direction.',
    align: 'corner',
  },
  {
    title: 'See your whole train of thought.',
    sub: 'Every branch lives on one canvas. Nothing scrolls away, nothing gets lost.',
    align: 'corner',
  },
  {
    title: 'Smart Merge.',
    sub: 'AI synthesizes the strongest ideas from every branch into one answer.',
    align: 'corner',
  },
  {
    title: 'A conversation shaped like your mind.',
    align: 'center',
    cta: true,
  },
];

const VERTEX = `
attribute vec3 aTarget;
attribute vec3 aColor;
attribute vec3 aTargetColor;
attribute float aSeed;
uniform float uProgress;
uniform float uTime;
uniform float uScale;
uniform float uXOffset;
uniform float uSize;
varying vec3 vColor;
void main() {
  float d = clamp((uProgress - aSeed * 0.25) / 0.75, 0.0, 1.0);
  float e = d * d * (3.0 - 2.0 * d);
  vec3 pos = mix(position, aTarget, e);
  pos.x += 0.008 * sin(uTime * 0.7 + aSeed * 41.0);
  pos.y += 0.008 * cos(uTime * 0.6 + aSeed * 57.0);
  pos.xy *= uScale;
  pos.x += uXOffset;
  vColor = mix(aColor, aTargetColor, e);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * (0.7 + aSeed * 0.9) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAGMENT = `
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.22, d);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a * 0.9);
}`;

// Static SVG poster — used when WebGL is unavailable.
const BrainPoster: React.FC = () => {
  const dots = React.useMemo(() => {
    const f = brainFormation(420, true);
    const out: { x: number; y: number; c: string; o: number }[] = [];
    for (let i = 0; i < 420; i++) {
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
        <circle key={i} cx={d.x} cy={d.y} r={0.42} fill={d.c} opacity={d.o} />
      ))}
    </svg>
  );
};

const Cta: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => (
  <div className="flex flex-wrap items-center gap-3 mt-9">
    <button
      onClick={onGetStarted}
      className="rounded-pill bg-plum hover:bg-plum-hover text-bone text-[13px] font-semibold uppercase tracking-kicker px-6 py-3.5 transition-colors duration-fast"
    >
      Start free
    </button>
    <a
      href="https://youtu.be/O620a-fz_4g"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-pill border border-hairline hover:border-hairline-strong text-bone text-[13px] font-semibold uppercase tracking-kicker px-6 py-3.5 transition-colors duration-fast"
    >
      Watch the demo
    </a>
  </div>
);

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
    const COUNT = isMobile ? 6000 : 14000;
    const formations = buildFormations(COUNT);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    camera.position.z = 2.3;

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
        uXOffset: { value: 0 },
        uSize: { value: 7 },
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

    const resize = () => {
      const w = wrapper.clientWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const aspect = w / h;
      material.uniforms.uScale.value = Math.min(1, Math.max(0.42, aspect * 0.92));
      material.uniforms.uXOffset.value = aspect > 1.1 ? 0.2 : 0;
      material.uniforms.uSize.value = (isMobile ? 5.5 : 7) * dpr * (h / 800);
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

    let raf = 0;
    const t0 = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;

      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      const t = progress * (SCENE_COUNT - 1);
      const idx = Math.min(Math.floor(t), SCENE_COUNT - 2);
      if (idx !== currentSegment) loadSegment(idx);
      const frac = t - idx;
      // hold each formation, transition through the middle 50% of the segment
      const u = Math.min(1, Math.max(0, (frac - 0.25) / 0.5));
      material.uniforms.uProgress.value = u;
      material.uniforms.uTime.value = (performance.now() - t0) / 1000;

      // copy beats
      BEATS.forEach((_, i) => {
        const el = beatRefs.current[i];
        if (!el) return;
        // tight window: a beat is gone before its neighbor appears
        const vis = Math.min(1, Math.max(0, 1.2 - Math.abs(t - i) * 2.4));
        el.style.opacity = String(vis);
        el.style.pointerEvents = vis > 0.55 ? 'auto' : 'none';
        el.style.transform = `translateY(${(1 - vis) * 14}px)`;
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
          <div className="max-w-[560px]">
            <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-5">
              {BEATS[0].kicker}
            </p>
            <h1
              className="font-extralight text-bone tracking-display"
              style={{ fontSize: 'var(--text-display)', lineHeight: 0.95 }}
            >
              {BEATS[0].title}
            </h1>
            <p className="text-ash text-lg leading-relaxed mt-7 max-w-[46ch]">
              {BEATS[0].sub} Branch any reply, explore parallel threads, and let
              Smart Merge synthesize the best of every path.
            </p>
            <Cta onGetStarted={onGetStarted} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={wrapperRef} className="relative" style={{ height: '560vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {BEATS.map((beat, i) => (
          <div
            key={i}
            ref={(el) => {
              beatRefs.current[i] = el;
            }}
            className={
              beat.align === 'hero'
                ? 'absolute inset-0 flex items-center'
                : beat.align === 'center'
                ? 'absolute inset-0 flex items-center justify-center text-center'
                : 'absolute left-0 right-0 bottom-[12vh]'
            }
            style={{ opacity: i === 0 ? 1 : 0, pointerEvents: i === 0 ? 'auto' : 'none' }}
          >
            <div
              className={
                beat.align === 'corner'
                  ? 'max-w-page mx-auto w-full px-6 md:px-12'
                  : 'max-w-page mx-auto w-full px-6 md:px-12'
              }
            >
              <div className={beat.align === 'center' ? 'mx-auto max-w-[640px]' : 'max-w-[560px]'}>
                {beat.kicker && (
                  <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-5">
                    {beat.kicker}
                  </p>
                )}
                {beat.align === 'hero' ? (
                  <h1
                    className="font-extralight text-bone tracking-display"
                    style={{ fontSize: 'var(--text-display)', lineHeight: 0.95 }}
                  >
                    {beat.title}
                  </h1>
                ) : (
                  <h2
                    className="font-extralight text-bone tracking-display"
                    style={{
                      fontSize: beat.align === 'center' ? 'var(--text-heading-lg)' : '40px',
                      lineHeight: 1.05,
                    }}
                  >
                    {beat.title}
                  </h2>
                )}
                {beat.sub && (
                  <p className="text-ash text-base md:text-lg leading-relaxed tracking-body mt-5 max-w-[46ch]">
                    {beat.sub}
                  </p>
                )}
                {beat.cta && (
                  <div className={beat.align === 'center' ? 'flex justify-center' : ''}>
                    <Cta onGetStarted={onGetStarted} />
                  </div>
                )}
              </div>
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
