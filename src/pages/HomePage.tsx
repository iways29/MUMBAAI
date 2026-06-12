import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { ReactComponent as AnthropicIcon } from '../assets/anthropic.svg';
import { ReactComponent as OpenAIIcon } from '../assets/openai.svg';
import { ReactComponent as GoogleIcon } from '../assets/google-gemini.svg';
import { FeedbackForm } from '../components/FeedbackForm.tsx';
import { WaitlistSection } from '../sections/WaitlistSection.tsx';
import { DatabaseService } from '../services/databaseService.ts';
import { BrainStoryHero } from '../components/Landing/BrainStoryHero.tsx';
import { DemoSceneSection } from '../components/Landing/DemoSceneSection.tsx';

interface HomePageProps {
  onGetStarted: () => void;
}

const STEPS = [
  {
    n: '01',
    title: 'Branch',
    body: 'Any reply can fork. Ask a follow-up in one direction without abandoning the others — every branch keeps its own context.',
  },
  {
    n: '02',
    title: 'Explore in parallel',
    body: 'Run several threads side by side, each with the model you choose — Claude, GPT, or Gemini — and compare answers on one canvas.',
  },
  {
    n: '03',
    title: 'Smart Merge',
    body: 'Select the branches worth keeping and AI synthesizes them into a single answer that carries the best of every path.',
  },
];

const ROADMAP = [
  { phase: 'Phase 1', name: 'POC', desc: 'Concept validation and internal demo', status: 'done' as const, when: 'Shipped' },
  { phase: 'Phase 2', name: 'MVP', desc: 'Real users, personal storage, Smart Merge', status: 'now' as const, when: 'Now' },
  { phase: 'Phase 3', name: 'Growth', desc: 'Subscriptions, refined UI, custom models', status: 'next' as const, when: 'Q3 2026' },
  { phase: 'Phase 4', name: 'Advanced', desc: 'Deep research, artifacts, MCP connectors', status: 'later' as const, when: '2026+' },
  { phase: 'Phase 5', name: 'Enterprise', desc: 'Integrations, priority support, security', status: 'later' as const, when: '2026+' },
];

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);

  useEffect(() => {
    // Fetch waitlist config from database
    const fetchWaitlistConfig = async () => {
      const config = await DatabaseService.getAppConfig('waitlist_enabled');
      setWaitlistEnabled(config?.enabled || false);
    };

    fetchWaitlistConfig();
  }, []);

  // Either scroll to waitlist or go to auth
  const handleGetStartedClick = () => {
    if (waitlistEnabled) {
      const waitlistSection = document.getElementById('waitlist');
      waitlistSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onGetStarted();
    }
  };

  return (
    <div className="bg-void text-bone font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-void/90 border-b border-hairline" style={{ backdropFilter: 'blur(8px)' }}>
        <div className="max-w-page mx-auto flex items-center justify-between px-6 md:px-12 h-16">
          <span className="text-[17px] font-semibold tracking-body text-bone">MUMBAAI</span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-[14px] text-smoke hover:text-bone transition-colors duration-fast">
              How it works
            </a>
            <a href="#roadmap" className="text-[14px] text-smoke hover:text-bone transition-colors duration-fast">
              Roadmap
            </a>
            <a href="#feedback" className="text-[14px] text-smoke hover:text-bone transition-colors duration-fast">
              Feedback
            </a>
          </div>
          <button
            onClick={handleGetStartedClick}
            className="rounded-pill border border-hairline hover:border-hairline-strong text-bone text-[12px] font-semibold uppercase tracking-kicker px-5 py-2.5 transition-colors duration-fast"
          >
            {waitlistEnabled ? 'Join waitlist' : 'Sign in'}
          </button>
        </div>
      </nav>

      {/* The brain story */}
      <BrainStoryHero onGetStarted={handleGetStartedClick} />

      {/* Night scenery + demo video in front */}
      <DemoSceneSection />

      {/* How it works */}
      <section id="how" className="px-6 md:px-12 py-[120px] scroll-mt-20">
        <div className="max-w-page mx-auto">
          <div className="max-w-[560px] mb-16">
            <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-5">
              The loop
            </p>
            <h2 className="font-extralight tracking-display text-[clamp(36px,5vw,48px)] leading-[1.05]">
              Branch. Explore. Merge.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-x-12 gap-y-12 border-t border-hairline pt-12">
            {STEPS.map((step) => (
              <div key={step.n}>
                <p className="text-[13px] font-semibold uppercase tracking-kicker text-smoke mb-4">
                  {step.n}
                </p>
                <h3 className="text-[24px] font-normal text-bone mb-3">{step.title}</h3>
                <p className="text-[15px] text-ash leading-relaxed tracking-body max-w-[40ch]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* Models row */}
          <div className="flex flex-wrap items-center gap-4 mt-16 pt-10 border-t border-hairline">
            <div className="flex items-center gap-2">
              {[AnthropicIcon, OpenAIIcon, GoogleIcon].map((Icon, i) => (
                <span
                  key={i}
                  className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center"
                >
                  <Icon width={15} height={15} className="text-bone" />
                </span>
              ))}
            </div>
            <p className="text-[14px] text-smoke tracking-body">
              Claude, GPT, and Gemini on one canvas — pick a model per branch.
            </p>
            <span className="hidden sm:inline text-smoke">·</span>
            <p className="text-[14px] text-smoke tracking-body">
              Free during beta. No credit card.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="px-6 md:px-12 py-[120px] scroll-mt-20">
        <div className="max-w-page mx-auto">
          <div className="max-w-[560px] mb-16">
            <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-5">
              Building in public
            </p>
            <h2 className="font-extralight tracking-display text-[clamp(36px,5vw,48px)] leading-[1.05] mb-5">
              Where this is going.
            </h2>
            <p className="text-ash text-[17px] leading-relaxed">
              We're in MVP — real users, honest scope. Here's the road ahead.
            </p>
          </div>

          <div className="max-w-2xl">
            {ROADMAP.map((item) => (
              <div
                key={item.phase}
                className="grid grid-cols-[20px_1fr_auto] gap-x-5 group"
              >
                {/* Rail */}
                <div className="flex flex-col items-center">
                  {item.status === 'done' ? (
                    <span className="w-5 h-5 rounded-full border border-hairline-strong flex items-center justify-center shrink-0 mt-1">
                      <Check size={10} className="text-ash" />
                    </span>
                  ) : item.status === 'now' ? (
                    <span className="w-5 h-5 rounded-full bg-plum shrink-0 mt-1" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-hairline shrink-0 mt-1" />
                  )}
                  <span className="w-px flex-1 bg-hairline group-last:hidden" style={{ background: 'var(--color-hairline)' }} />
                </div>

                {/* Content */}
                <div className="pb-10">
                  <p className="text-[12px] font-semibold uppercase tracking-kicker text-smoke mb-1.5">
                    {item.phase}
                  </p>
                  <h3
                    className={`text-[20px] font-normal mb-1 ${
                      item.status === 'later' ? 'text-smoke' : 'text-bone'
                    }`}
                  >
                    {item.name}
                  </h3>
                  <p className="text-[14px] text-ash leading-relaxed tracking-body max-w-[52ch]">
                    {item.desc}
                  </p>
                </div>

                <span
                  className={`text-[12px] uppercase tracking-kicker mt-1 ${
                    item.status === 'now' ? 'text-plum font-semibold' : 'text-smoke'
                  }`}
                >
                  {item.when}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[14px] text-smoke mt-6">
            Want to influence the roadmap?{' '}
            <a
              href="#feedback"
              className="text-bone underline underline-offset-4 decoration-[rgba(255,255,255,0.3)] hover:decoration-[var(--color-plum)] transition-colors duration-fast"
            >
              Share your feedback
            </a>
          </p>
        </div>
      </section>

      {/* Waitlist — only when enabled */}
      {waitlistEnabled && <WaitlistSection />}

      {/* Feedback */}
      <FeedbackForm id="feedback" />

      {/* Final CTA */}
      <section className="px-6 md:px-12 py-[120px]">
        <div className="max-w-page mx-auto text-center">
          <h2 className="font-extralight tracking-display text-[clamp(40px,6vw,64px)] leading-[1.02] max-w-[18ch] mx-auto mb-10">
            Stop thinking in a straight line.
          </h2>
          <button
            onClick={handleGetStartedClick}
            className="rounded-pill bg-plum hover:bg-plum-hover text-bone text-[13px] font-semibold uppercase tracking-kicker px-8 py-4 transition-colors duration-fast"
          >
            {waitlistEnabled ? 'Join the waitlist' : 'Start free'}
          </button>
        </div>
      </section>

      {/* Footer — single line */}
      <footer className="px-6 md:px-12 py-10 border-t border-hairline">
        <div className="max-w-page mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-smoke tracking-body">
          <span className="font-semibold text-bone">MUMBAAI</span>
          <p>
            A product of{' '}
            <a
              href="https://theunreallab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ash hover:text-bone transition-colors duration-fast"
            >
              The Unreal Lab
            </a>
            , an AI venture studio.
          </p>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};
