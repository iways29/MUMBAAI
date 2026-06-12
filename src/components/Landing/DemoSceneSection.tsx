import React, { useEffect, useMemo, useRef, useState } from 'react';

// Night-landscape backdrop (scenery tints from design.md — imagery only)
// with the real product demo rising into the foreground on scroll.

const Stars: React.FC = () => {
  const stars = useMemo(() => {
    const out: { x: number; y: number; r: number; o: number; c: string }[] = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 56; i++) {
      out.push({
        x: rand() * 1440,
        y: rand() * 420,
        r: 0.6 + rand() * 1.1,
        o: 0.12 + rand() * 0.4,
        c: rand() < 0.08 ? 'var(--color-amber)' : rand() < 0.16 ? 'var(--color-lichen)' : 'var(--color-bone)',
      });
    }
    return out;
  }, []);
  return (
    <>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={s.o} />
      ))}
    </>
  );
};

const NightLandscape: React.FC = () => (
  <svg
    viewBox="0 0 1440 800"
    preserveAspectRatio="xMidYMax slice"
    className="absolute inset-0 w-full h-full"
    aria-hidden="true"
  >
    <Stars />
    {/* far hills */}
    <path
      d="M0 520 Q 180 470 360 505 T 720 480 T 1080 510 T 1440 470 V 800 H 0 Z"
      fill="var(--scenery-floor)"
      opacity="0.5"
    />
    {/* mist band over far hills */}
    <ellipse cx="720" cy="540" rx="900" ry="60" fill="var(--scenery-mist)" />
    {/* mid hills */}
    <path
      d="M0 600 Q 240 540 480 585 T 960 565 T 1440 595 V 800 H 0 Z"
      fill="var(--scenery-forest)"
      opacity="0.85"
    />
    {/* lone tree on the mid hill */}
    <g opacity="0.9">
      <path d="M1064 566 q -2 -26 0 -38" stroke="var(--scenery-bark)" strokeWidth="3" fill="none" />
      <ellipse cx="1064" cy="520" rx="26" ry="16" fill="var(--scenery-floor)" />
      <ellipse cx="1048" cy="532" rx="16" ry="10" fill="var(--scenery-floor)" opacity="0.8" />
    </g>
    {/* mist band over mid hills */}
    <ellipse cx="500" cy="625" rx="760" ry="48" fill="var(--scenery-mist)" />
    {/* near ground */}
    <path
      d="M0 690 Q 320 650 640 678 T 1440 668 V 800 H 0 Z"
      fill="var(--scenery-bark)"
      opacity="0.95"
    />
  </svg>
);

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
      // video rises into the foreground over the scenery
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
        <NightLandscape />

        <div
          ref={videoWrapRef}
          className="relative w-full max-w-4xl px-6 md:px-12"
          style={reducedMotion ? undefined : { opacity: 0, transform: 'translateY(11vh) scale(0.93)' }}
        >
          <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-4 text-center">
            See it move
          </p>
          <h2 className="font-extralight text-bone tracking-display text-[clamp(30px,4.2vw,44px)] leading-[1.05] text-center mb-8">
            Watch a conversation branch.
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

          <p className="text-center mt-5">
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
