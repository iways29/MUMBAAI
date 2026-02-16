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
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Layers size={22} className="text-white" />
              </div>
              <span className="text-xl font-bold text-stone-800">MUMBAAI</span>
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
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-stone-800 mb-6 leading-[1.1] tracking-tight">
              AI Conversations
              <br />
              <span className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                That Actually Branch
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

      {/* Why MUMBAAI Section */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-800 mb-6">
              Why Choose MUMBAAI?
            </h2>
            <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
              Traditional AI chats are linear and forgettable. MUMBAAI transforms conversations into visual, explorable journeys.
            </p>
          </div>

          {/* Problem/Solution Grid */}
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div className="bg-rose-50/60 rounded-2xl p-8 border border-rose-100">
              <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-500">✗</span>
                The Problem with Linear Chats
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-2.5 flex-shrink-0" />
                  <p className="text-stone-600">Lost context when exploring multiple ideas</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-2.5 flex-shrink-0" />
                  <p className="text-stone-600">Can't revisit or compare different approaches</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-2.5 flex-shrink-0" />
                  <p className="text-stone-600">Conversations disappear into endless scroll</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-2.5 flex-shrink-0" />
                  <p className="text-stone-600">No way to organize complex discussions</p>
                </div>
              </div>
            </div>

            <div className="bg-teal-50/60 rounded-2xl p-8 border border-teal-100">
              <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">✓</span>
                The MUMBAAI Solution
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2.5 flex-shrink-0" />
                  <p className="text-stone-600">Every idea branches into its own path</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2.5 flex-shrink-0" />
                  <p className="text-stone-600">Jump between branches, compare side-by-side</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2.5 flex-shrink-0" />
                  <p className="text-stone-600">Visual tree makes everything findable</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2.5 flex-shrink-0" />
                  <p className="text-stone-600">Merge insights from multiple paths with AI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-teal-100">
                <GitBranch size={28} className="text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-3">Branching Conversations</h3>
              <p className="text-stone-600 leading-relaxed">
                Every response creates a new branch. Explore different angles without losing your train of thought.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-100">
                <Layers size={28} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-3">Visual Tree Structure</h3>
              <p className="text-stone-600 leading-relaxed">
                See your entire conversation as an interactive tree. Navigate and understand your thinking process.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                <Combine size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-3">Smart Merge</h3>
              <p className="text-stone-600 leading-relaxed">
                Combine insights from different branches with AI to create comprehensive solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-20 px-8 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm font-medium text-teal-600 mb-2">Our Development Journey</div>
            <h2 className="text-3xl font-bold text-stone-800">Product Roadmap</h2>
          </div>

          {/* Simplified Timeline */}
          <div className="space-y-6">
            {/* Phase 1 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/25">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-stone-800">Phase 1: POC</h4>
                    <p className="text-sm text-stone-500">Concept validation & internal demo</p>
                  </div>
                  <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">Completed</span>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ring-teal-100 shadow-lg shadow-teal-500/25">
                <Layers size={24} className="text-white" />
              </div>
              <div className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow-lg shadow-teal-500/25">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Phase 2: MVP</h4>
                    <p className="text-sm text-teal-100">Real users, personal storage, smart merge</p>
                  </div>
                  <span className="text-xs font-medium bg-white text-teal-600 px-2 py-1 rounded-full">You are here</span>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-stone-200">
                <Clock size={24} className="text-stone-400" />
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-stone-800">Phase 3: Post-Funding</h4>
                    <p className="text-sm text-stone-500">Subscriptions, improved UI, custom models</p>
                  </div>
                  <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-full">Planned</span>
                </div>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-stone-200">
                <GitBranch size={24} className="text-stone-400" />
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-stone-800">Phase 4: Advanced</h4>
                    <p className="text-sm text-stone-500">Deep research, artifacts, MCP connectors</p>
                  </div>
                  <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-full">Future</span>
                </div>
              </div>
            </div>

            {/* Phase 5 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-stone-200">
                <Building size={24} className="text-stone-400" />
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-stone-800">Phase 5: Enterprise</h4>
                    <p className="text-sm text-stone-500">Integrations, priority support, security</p>
                  </div>
                  <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-full">Future</span>
                </div>
              </div>
            </div>
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
