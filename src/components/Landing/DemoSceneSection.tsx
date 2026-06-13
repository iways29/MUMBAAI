import React, { useEffect, useMemo, useRef, useState } from 'react';

// Pure void backdrop with sparse constellation drift; the real product demo
// rises into the foreground on scroll.

const ParticleDrift: React.FC = () => {
  const dots = useMemo(() => {
    const out: { x: number; y: number; r: number; o: number; c: string }[] = [];
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 90; i++) {
      const roll = rand();
      out.push({
        x: rand() * 1440,
        y: rand() * 900,
        r: 0.6 + rand() * 1.4,
        o: 0.08 + rand() * 0.35,
        c:
          roll < 0.08
            ? 'var(--color-plum)'
            : roll < 0.14
            ? 'var(--color-amber)'
            : roll < 0.2
            ? 'var(--color-lichen)'
            : 'var(--color-bone)',
      });
    }
    return out;
  }, []);
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} opacity={d.o} />
      ))}
    </svg>
  );
};

export const DemoSceneSection: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const wrapper = wrapperRef.current;
    const videoWrap = videoWrapRef.current;
    if (!wrapper || !videoWrap) return;

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(wrapper);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      // video rises into the foreground over the drift
      const eased = 1 - Math.pow(1 - p, 3);
      videoWrap.style.opacity = String(Math.min(1, eased * 1.6));
      videoWrap.style.transform = `translateY(${(1 - eased) * 11}vh) scale(${0.93 + eased * 0.07})`;
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reducedMotion]);

  return (
    <div ref={wrapperRef} className="relative" style={{ height: reducedMotion ? 'auto' : '200vh' }}>
      <div
        className={`${reducedMotion ? 'relative' : 'sticky top-0'} h-screen overflow-hidden flex items-center justify-center`}
      >
        <ParticleDrift />

        <div
          ref={videoWrapRef}
          className="relative w-full max-w-4xl px-6 md:px-12"
          style={reducedMotion ? undefined : { opacity: 0, transform: 'translateY(11vh) scale(0.93)' }}
        >
          <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-5 text-center">
            See it move
          </p>
          <h2
            className="font-extralight text-bone tracking-display text-center mb-10"
            style={{ fontSize: 'clamp(40px, 5.2vw, 72px)', lineHeight: 0.96 }}
          >
            Watch It Think.
          </h2>

          <figure className="rounded-[24px] border border-hairline overflow-hidden bg-void">
            <div className="relative aspect-video">
              <iframe
                src="https://www.youtube.com/embed/O620a-fz_4g?autoplay=1&mute=1&loop=1&playlist=O620a-fz_4g&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1"
                title="MUMBAAI demo — branching a conversation on the canvas"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </figure>

          <p className="text-center mt-6">
            <a
              href="https://youtu.be/O620a-fz_4g"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-smoke hover:text-bone uppercase tracking-kicker transition-colors duration-fast"
            >
              Watch with sound ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
