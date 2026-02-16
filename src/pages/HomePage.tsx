import React from 'react';
import { CheckCircle, Clock, Building, Play, Star, Lock, Layers, GitBranch, Combine } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="bg-stone-50">
      {/* Hero Section - Full viewport with video */}
      <section className="min-h-screen relative overflow-hidden bg-gradient-to-b from-teal-50/80 via-stone-50 to-orange-50/30">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />

          {/* Gradient orbs for depth - warm teal and coral tones */}
          <div className="absolute top-20 -left-40 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
          <div className="absolute top-40 -right-40 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute bottom-40 left-1/3 w-96 h-96 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        {/* Navigation */}
        <nav className="relative z-20 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-stone-800 tracking-tight">MUMBAAI</span>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-300 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 pt-16 pb-20 px-6 md:px-8">
          <div className="max-w-6xl mx-auto text-center">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-teal-100 rounded-full mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-sm font-medium text-stone-700">Now in MVP Phase</span>
              <span className="text-stone-300">|</span>
              <span className="text-sm text-stone-500">Join early adopters</span>
            </div>

            {/* Main Headline */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center px-6 py-3 bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl shadow-lg shadow-teal-100/50">
                <p className="text-xl sm:text-2xl md:text-3xl text-stone-600 font-semibold tracking-tight">
                  The future of AI conversation is here
                </p>
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Never Lose a Thought Again
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-stone-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop losing brilliant ideas in linear chat. Explore every possibility with visual conversation trees.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={onGetStarted}
                className="group bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-lg shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-0.5"
              >
                Start Free
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
              </button>
              <a
                href="https://youtu.be/O620a-fz_4g"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-stone-600 hover:text-teal-600 transition-colors font-medium px-4 py-2"
              >
                <div className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center shadow-sm">
                  <Play size={18} className="text-teal-600 ml-0.5" fill="currentColor" />
                </div>
                <span>Watch with sound</span>
              </a>
            </div>

            {/* Browser Mockup with Video */}
            <div className="relative max-w-5xl mx-auto perspective-1000">
              {/* Glow effect behind browser */}
              <div className="absolute -inset-4 bg-gradient-to-r from-teal-100 via-emerald-100 to-orange-100 rounded-3xl blur-2xl opacity-70" />

              {/* Browser Frame */}
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-teal-900/15 border border-stone-200/80 overflow-hidden transform hover:scale-[1.01] transition-transform duration-500 animate-float">
                {/* Browser Chrome */}
                <div className="flex items-center gap-3 px-4 py-3 bg-stone-50 border-b border-stone-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400 hover:bg-rose-500 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-1.5 text-sm text-stone-500 border border-stone-200 shadow-inner">
                      <Lock size={12} className="text-teal-600" />
                      <span>mumba.ai</span>
                    </div>
                  </div>
                  <div className="w-16" /> {/* Spacer for balance */}
                </div>

                {/* Video Container */}
                <div className="relative aspect-video bg-gray-900">
                  <iframe
                    src="https://www.youtube.com/embed/O620a-fz_4g?autoplay=1&mute=1&loop=1&playlist=O620a-fz_4g&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1"
                    title="MUMBAAI Demo"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {/* Overlay to block interactions and hide YouTube hover elements */}
                  <div className="absolute inset-0 pointer-events-auto" />
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-sm text-stone-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: ['#99f6e4', '#fcd34d', '#fda4af', '#a5f3fc', '#d8b4fe'][i-1] }}
                    />
                  ))}
                </div>
                <span className="font-medium text-stone-700">Early adopters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="text-amber-400 fill-amber-400" size={18} />
                <span className="font-medium text-stone-700">4.9/5 rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitBranch size={18} className="text-teal-600" />
                <span className="font-medium text-stone-700">10K+ branches created</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why MUMBAAI Section - Transformation Narrative */}
      <section className="relative py-28 overflow-hidden">
        <style>{`
          @keyframes float-subtle {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(1deg); }
          }
          @keyframes draw-line {
            from { stroke-dashoffset: 100; }
            to { stroke-dashoffset: 0; }
          }
          .feature-card:hover .feature-icon {
            transform: scale(1.1) rotate(-5deg);
          }
          .feature-card:hover .feature-line {
            opacity: 1;
            transform: scaleX(1);
          }
          .transform-arrow {
            animation: float-subtle 3s ease-in-out infinite;
          }
          .problem-item:hover {
            transform: translateX(-4px);
          }
          .solution-item:hover {
            transform: translateX(4px);
          }
        `}</style>

        {/* Background - Diagonal Split */}
        <div className="absolute inset-0">
          {/* Problem side - warm stone */}
          <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-orange-50/30" />
          {/* Solution side overlay - flows diagonally */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-teal-50/0 via-teal-50/60 to-emerald-50/80"
            style={{ clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 20% 100%)' }}
          />
          {/* Decorative flowing line between */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d="M 35% 0 Q 30% 50%, 25% 100%"
              stroke="url(#flowGradient)"
              strokeWidth="2"
              fill="none"
              className="hidden md:block"
            />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-8">
          {/* Section Header - Asymmetric */}
          <div className="mb-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-12 bg-gradient-to-r from-teal-500 to-transparent" />
                <span className="text-sm font-semibold text-teal-600 tracking-wider uppercase">The Difference</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-800 tracking-tight mb-6 leading-[1.1]">
                From chaos to
                <span className="relative inline-block ml-3">
                  <span className="relative z-10 bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">clarity</span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-teal-200" viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M0 6 Q25 0, 50 6 T100 6" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <p className="text-xl text-stone-500 leading-relaxed">
                Traditional AI chats are linear and forgettable. MUMBAAI transforms conversations into visual, explorable journeys.
              </p>
            </div>
          </div>

          {/* Problem/Solution - Overlapping Cards */}
          <div className="relative mb-32">
            <div className="grid lg:grid-cols-12 gap-8 items-start">

              {/* Problem Card - Left aligned, slightly rotated */}
              <div className="lg:col-span-5 lg:col-start-1">
                <div className="relative group">
                  {/* Shadow layer */}
                  <div className="absolute inset-0 bg-stone-200/50 rounded-3xl transform rotate-1 translate-x-2 translate-y-2" />
                  {/* Main card */}
                  <div className="relative bg-white rounded-3xl p-8 md:p-10 border border-stone-200 shadow-xl shadow-stone-200/50">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200">
                        <span className="text-2xl">😤</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-orange-500 tracking-wider uppercase">The Problem</span>
                        <h3 className="text-xl font-bold text-stone-800">Linear Chats</h3>
                      </div>
                    </div>
                    {/* Items */}
                    <div className="space-y-5">
                      {[
                        { text: "Lost context when exploring multiple ideas", delay: "0ms" },
                        { text: "Can't revisit or compare different approaches", delay: "50ms" },
                        { text: "Conversations disappear into endless scroll", delay: "100ms" },
                        { text: "No way to organize complex discussions", delay: "150ms" }
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="problem-item flex items-start gap-4 p-3 -ml-3 rounded-xl hover:bg-orange-50/50 transition-all duration-300 cursor-default"
                          style={{ transitionDelay: item.delay }}
                        >
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-0.5 bg-orange-400 rounded-full" />
                          </div>
                          <p className="text-stone-600 leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                    {/* Decorative corner */}
                    <div className="absolute top-6 right-6 w-20 h-20 opacity-10">
                      <div className="w-full h-full border-t-2 border-r-2 border-orange-300 rounded-tr-3xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transform Arrow - Center */}
              <div className="hidden lg:flex lg:col-span-2 items-center justify-center">
                <div className="transform-arrow relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  {/* Orbiting dots */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-300 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Solution Card - Right aligned, opposite rotation, overlapping */}
              <div className="lg:col-span-5 lg:-mt-8">
                <div className="relative group">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Shadow layer */}
                  <div className="absolute inset-0 bg-teal-200/50 rounded-3xl transform -rotate-1 -translate-x-2 translate-y-2" />
                  {/* Main card */}
                  <div className="relative bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 rounded-3xl p-8 md:p-10 shadow-2xl shadow-teal-500/25">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <span className="text-2xl">✨</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-teal-200 tracking-wider uppercase">The Solution</span>
                        <h3 className="text-xl font-bold text-white">MUMBAAI</h3>
                      </div>
                    </div>
                    {/* Items */}
                    <div className="space-y-5">
                      {[
                        { text: "Every idea branches into its own path", icon: "→" },
                        { text: "Jump between branches, compare side-by-side", icon: "⇄" },
                        { text: "Visual tree makes everything findable", icon: "◎" },
                        { text: "Merge insights from multiple paths with AI", icon: "⊕" }
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="solution-item flex items-start gap-4 p-3 -ml-3 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-default"
                        >
                          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold">
                            {item.icon}
                          </div>
                          <p className="text-teal-50 leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                    {/* Decorative corner */}
                    <div className="absolute bottom-6 left-6 w-20 h-20 opacity-20">
                      <div className="w-full h-full border-b-2 border-l-2 border-white rounded-bl-3xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Features - Connected Nodes Layout */}
          <div className="relative">
            {/* Section label */}
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full text-sm font-medium text-stone-600">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                Core Capabilities
              </span>
            </div>

            {/* Connection lines SVG - Desktop only */}
            <svg className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 pointer-events-none hidden lg:block" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path d="M 20% 50% Q 35% 30%, 50% 50%" stroke="url(#lineGrad1)" strokeWidth="2" fill="none" strokeDasharray="8 4" />
              <path d="M 50% 50% Q 65% 70%, 80% 50%" stroke="url(#lineGrad2)" strokeWidth="2" fill="none" strokeDasharray="8 4" />
            </svg>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Feature 1: Branching */}
              <div className="feature-card group relative">
                <div className="relative bg-white rounded-3xl p-8 border border-stone-200 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                  {/* Icon */}
                  <div className="feature-icon w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25 transition-transform duration-500">
                    <GitBranch size={28} className="text-white" />
                  </div>
                  {/* Number badge */}
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                    <span className="text-sm font-bold text-teal-600">01</span>
                  </div>
                  {/* Content */}
                  <h3 className="text-xl font-bold text-stone-800 mb-3">Branching Conversations</h3>
                  <p className="text-stone-500 leading-relaxed mb-4">
                    Every response creates a new branch. Explore different angles without losing your train of thought.
                  </p>
                  {/* Decorative line */}
                  <div className="feature-line h-1 w-12 bg-gradient-to-r from-teal-500 to-teal-300 rounded-full opacity-0 transform scale-x-0 origin-left transition-all duration-500" />
                </div>
              </div>

              {/* Feature 2: Visual Tree */}
              <div className="feature-card group relative md:mt-8">
                <div className="relative bg-white rounded-3xl p-8 border border-stone-200 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                  {/* Icon */}
                  <div className="feature-icon w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 transition-transform duration-500">
                    <Layers size={28} className="text-white" />
                  </div>
                  {/* Number badge */}
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-500">02</span>
                  </div>
                  {/* Content */}
                  <h3 className="text-xl font-bold text-stone-800 mb-3">Visual Tree Structure</h3>
                  <p className="text-stone-500 leading-relaxed mb-4">
                    See your entire conversation as an interactive tree. Navigate and understand your thinking process.
                  </p>
                  {/* Decorative line */}
                  <div className="feature-line h-1 w-12 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full opacity-0 transform scale-x-0 origin-left transition-all duration-500" />
                </div>
              </div>

              {/* Feature 3: Smart Merge */}
              <div className="feature-card group relative">
                <div className="relative bg-white rounded-3xl p-8 border border-stone-200 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                  {/* Icon */}
                  <div className="feature-icon w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform duration-500">
                    <Combine size={28} className="text-white" />
                  </div>
                  {/* Number badge */}
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-600">03</span>
                  </div>
                  {/* Content */}
                  <h3 className="text-xl font-bold text-stone-800 mb-3">Smart Merge</h3>
                  <p className="text-stone-500 leading-relaxed mb-4">
                    Combine insights from different branches with AI to create comprehensive solutions.
                  </p>
                  {/* Decorative line */}
                  <div className="feature-line h-1 w-12 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full opacity-0 transform scale-x-0 origin-left transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section - Editorial Journey Map */}
      <section className="py-24 px-8 bg-gradient-to-b from-stone-50 via-white to-stone-50 overflow-hidden">
        <style>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .roadmap-active-border {
            background: linear-gradient(135deg, #14b8a6, #10b981, #0d9488, #14b8a6);
            background-size: 300% 300%;
            animation: gradient-shift 4s ease infinite;
          }
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 0.4; }
            100% { transform: scale(1); opacity: 0.8; }
          }
          .roadmap-pulse {
            animation: pulse-ring 2s ease-in-out infinite;
          }
        `}</style>

        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-100 rounded-full mb-4">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              <span className="text-sm font-medium text-teal-700 tracking-wide">Building in Public</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-800 tracking-tight mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-stone-500 max-w-xl mx-auto">
              From concept to enterprise — here's where we are and where we're headed
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative max-w-4xl mx-auto mb-16">
            <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full w-[30%] bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 rounded-full relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-teal-500 rounded-full shadow-lg shadow-teal-500/30" />
              </div>
            </div>
            <div className="flex justify-between mt-3 px-1">
              <span className="text-xs font-medium text-teal-600">POC</span>
              <span className="text-xs font-bold text-teal-600">MVP</span>
              <span className="text-xs text-stone-400">Growth</span>
              <span className="text-xs text-stone-400">Advanced</span>
              <span className="text-xs text-stone-400">Enterprise</span>
            </div>
          </div>

          {/* Roadmap Cards - Staggered Grid */}
          <div className="grid md:grid-cols-5 gap-4 md:gap-3">

            {/* Phase 1: POC - Completed */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform" />
              <div className="relative bg-white rounded-2xl p-5 border border-teal-100 shadow-sm hover:shadow-md transition-all">
                {/* Status indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-teal-600 tracking-wider uppercase">Phase 1</span>
                  <div className="flex items-center gap-1.5 text-teal-600">
                    <CheckCircle size={14} />
                    <span className="text-xs font-medium">Done</span>
                  </div>
                </div>
                {/* Content */}
                <h4 className="text-lg font-bold text-stone-800 mb-2">POC</h4>
                <p className="text-sm text-stone-500 leading-relaxed mb-4">
                  Concept validation & internal demo
                </p>
                {/* Decorative dots */}
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                </div>
              </div>
            </div>

            {/* Phase 2: MVP - Current */}
            <div className="group relative md:col-span-1 md:-mt-2">
              {/* Animated gradient border */}
              <div className="absolute -inset-[2px] roadmap-active-border rounded-2xl roadmap-pulse" />
              <div className="relative bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 rounded-2xl p-5 shadow-xl shadow-teal-500/25">
                {/* Status indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-teal-100 tracking-wider uppercase">Phase 2</span>
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="text-xs font-bold text-white">Now</span>
                  </div>
                </div>
                {/* Content */}
                <h4 className="text-xl font-bold text-white mb-2">MVP</h4>
                <p className="text-sm text-teal-100 leading-relaxed mb-4">
                  Real users, personal storage, smart merge
                </p>
                {/* Progress mini-bar */}
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-white rounded-full" />
                </div>
              </div>
            </div>

            {/* Phase 3: Post-Funding - Planned */}
            <div className="group relative">
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-stone-200 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
                {/* Status indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Phase 3</span>
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <Clock size={14} />
                    <span className="text-xs font-medium">Next</span>
                  </div>
                </div>
                {/* Content */}
                <h4 className="text-lg font-bold text-stone-700 mb-2">Growth</h4>
                <p className="text-sm text-stone-400 leading-relaxed mb-4">
                  Subscriptions, improved UI, custom models
                </p>
                {/* Locked indicator */}
                <div className="flex items-center gap-2 text-stone-300">
                  <div className="h-px flex-1 bg-stone-200" />
                  <span className="text-xs">Q3 2025</span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>
              </div>
            </div>

            {/* Phase 4: Advanced - Future */}
            <div className="group relative">
              <div className="relative bg-stone-50/80 backdrop-blur-sm rounded-2xl p-5 border border-stone-150 hover:border-stone-300 transition-all opacity-80 hover:opacity-100">
                {/* Status indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-stone-300 tracking-wider uppercase">Phase 4</span>
                  <GitBranch size={14} className="text-stone-300" />
                </div>
                {/* Content */}
                <h4 className="text-lg font-bold text-stone-500 mb-2">Advanced</h4>
                <p className="text-sm text-stone-400 leading-relaxed mb-4">
                  Deep research, artifacts, MCP connectors
                </p>
                {/* Locked indicator */}
                <div className="flex items-center gap-2 text-stone-300">
                  <div className="h-px flex-1 bg-stone-200" />
                  <span className="text-xs">2026</span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>
              </div>
            </div>

            {/* Phase 5: Enterprise - Future */}
            <div className="group relative">
              <div className="relative bg-stone-50/60 backdrop-blur-sm rounded-2xl p-5 border border-stone-100 hover:border-stone-200 transition-all opacity-60 hover:opacity-90">
                {/* Status indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-stone-300 tracking-wider uppercase">Phase 5</span>
                  <Building size={14} className="text-stone-300" />
                </div>
                {/* Content */}
                <h4 className="text-lg font-bold text-stone-400 mb-2">Enterprise</h4>
                <p className="text-sm text-stone-300 leading-relaxed mb-4">
                  Integrations, priority support, security
                </p>
                {/* Locked indicator */}
                <div className="flex items-center gap-2 text-stone-200">
                  <div className="h-px flex-1 bg-stone-150" />
                  <span className="text-xs">2026+</span>
                  <div className="h-px flex-1 bg-stone-150" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <p className="text-sm text-stone-500">
              Want to influence our roadmap? <button className="text-teal-600 font-medium hover:text-teal-700 underline underline-offset-2">Share your feedback</button>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-stone-800 mb-6">
            Ready to Transform Your Conversations?
          </h2>
          <p className="text-xl text-stone-600 mb-12 max-w-2xl mx-auto">
            Join users who are already thinking better with MUMBAAI's branching conversation trees.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-lg shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-0.5"
          >
            Start Your First Conversation →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-stone-100 bg-stone-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-teal-500" />
            <span className="font-medium text-stone-700">MUMBAAI</span>
          </div>
          <p>Building the future of conversational AI</p>
        </div>
      </footer>
    </div>
  );
};
