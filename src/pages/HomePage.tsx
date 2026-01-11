import React from 'react';
import { MessageCircle, Sparkles, CheckCircle, Circle, Clock, Building, Zap } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MUMBAAI</span>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Conversations<br />
            <span className="text-gray-500">Reimagined</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform your AI conversations into beautiful, interactive trees. Explore every possibility, branch ideas naturally, and never lose track of your thoughts with MUMBAAI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={onGetStarted}
              className="bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg"
            >
              Get Started Free
            </button>
            <div className="text-sm text-gray-500">
              No credit card required
            </div>
          </div>

          {/* Product Roadmap */}
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-gray-50 rounded-3xl p-12 border border-gray-200">
              <div className="text-center mb-12">
                <div className="text-sm font-medium text-gray-500 mb-2">Our Development Journey</div>
                <h3 className="text-2xl font-bold text-gray-900">Product Roadmap</h3>
                <p className="text-gray-600 mt-2">Building the future of conversational AI, one phase at a time</p>
              </div>
              
              {/* Roadmap Timeline */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200 rounded-full"></div>
                
                {/* Phase 1 - POC (Completed) */}
                <div className="relative mb-16">
                  <div className="flex items-center">
                    <div className="w-1/2 pr-8 text-right">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-end gap-3 mb-4">
                          <div className="text-right">
                            <h4 className="text-lg font-bold text-gray-900">Phase 1</h4>
                            <p className="text-sm font-medium text-gray-600">POC (Proof of Concept)</p>
                          </div>
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <CheckCircle size={24} className="text-gray-900" />
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-3">
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Concept validation</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Core branching idea proven</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Internal demo</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Used to share the vision</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Initial feedback</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Demo version for stakeholders</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 font-medium text-right">
                          Status: Completed
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="w-1/2 pl-8"></div>
                  </div>
                </div>

                {/* Phase 2 - MVP (Current) */}
                <div className="relative mb-16">
                  <div className="flex items-center">
                    <div className="w-1/2 pr-8"></div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="w-1/2 pl-8">
                      <div className="bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                            <Sparkles size={24} className="text-white" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-lg font-bold text-gray-900 text-left">Phase 2</h4>
                            <p className="text-sm font-medium text-gray-600 text-left">MVP (Minimum Viable Product)</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-left">
                              <p className="text-left"><strong>First real users</strong></p>
                              <p className="text-xs text-gray-500 mt-1 text-left">Live product with actual users</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-left">
                              <p className="text-left"><strong>Individual user data</strong></p>
                              <p className="text-xs text-gray-500 mt-1 text-left">Personal conversation storage</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-left">
                              <p className="text-left"><strong>All POC features</strong></p>
                              <p className="text-xs text-gray-500 mt-1 text-left">Full branching & tree visualization</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-left">
                              <p className="text-left"><strong>Smart merge</strong></p>
                              <p className="text-xs text-gray-500 mt-1 text-left">AI-powered insight combination</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <div className="text-xs text-gray-700 font-medium">
                            Status: Current Phase
                          </div>
                          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                            YOU ARE HERE
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 3 - Post-Funding */}
                <div className="relative mb-16">
                  <div className="flex items-center">
                    <div className="w-1/2 pr-8 text-right">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-end gap-3 mb-4">
                          <div className="text-right">
                            <h4 className="text-lg font-bold text-gray-900">Phase 3</h4>
                            <p className="text-sm font-medium text-gray-600">Post-Funding</p>
                          </div>
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Clock size={24} className="text-gray-600" />
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-3">
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Improved UI</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Enhanced user experience</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Tiered subscriptions</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Basic, Mid, Pro plans</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Basic tier</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Limited features, similar to MVP</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Mid/Pro tiers</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Bring-your-own-LLM, custom models</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 font-medium text-right">
                          Status: Planned
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="w-1/2 pl-8"></div>
                  </div>
                </div>

                {/* Phase 4 - Advanced Features */}
                <div className="relative mb-16">
                  <div className="flex items-center">
                    <div className="w-1/2 pr-8"></div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="w-1/2 pl-8">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Zap size={24} className="text-gray-600" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-lg font-bold text-gray-900 text-left">Phase 4</h4>
                            <p className="text-sm font-medium text-gray-600 text-left">Advanced Features</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-left">
                              <p className="text-left"><strong>Deep research support</strong></p>
                              <p className="text-xs text-gray-500 mt-1 text-left">Advanced research workflows & citations</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-left">
                              <p className="text-left"><strong>Artifacts and canvas</strong></p>
                              <p className="text-xs text-gray-500 mt-1 text-left">Interactive documents & visual collaboration</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-left">
                              <p className="text-left"><strong>MCP connectors</strong></p>
                              <p className="text-xs text-gray-500 mt-1 text-left">Model Context Protocol integrations</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-left">
                              <p className="text-left"><strong>Projects & context awareness</strong></p>
                              <p className="text-xs text-gray-500 mt-1 text-left">Enhanced usability with project-based organization</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 font-medium text-left">
                          Status: Future Vision
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 5 - Enterprise */}
                <div className="relative">
                  <div className="flex items-center">
                    <div className="w-1/2 pr-8 text-right">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-end gap-3 mb-4">
                          <div className="text-right">
                            <h4 className="text-lg font-bold text-gray-900">Phase 5</h4>
                            <p className="text-sm font-medium text-gray-600">Enterprise Level</p>
                          </div>
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Building size={24} className="text-gray-600" />
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-3">
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Enterprise integrations</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Cloud systems compatibility</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>White-glove onboarding</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Dedicated implementation</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Priority support</strong></p>
                              <p className="text-xs text-gray-500 mt-1">24/7 enterprise assistance</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                          <div className="flex items-start gap-3 justify-end">
                            <div className="text-right">
                              <p><strong>Advanced security</strong></p>
                              <p className="text-xs text-gray-500 mt-1">Enterprise-grade compliance</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 font-medium text-right">
                          Status: Future Vision
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="w-1/2 pl-8"></div>
                  </div>
                </div>
              </div>

              {/* Current Status Banner */}
              <div className="mt-12 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="text-center">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Join Us in Phase 2</h4>
                  <p className="text-gray-600 mb-4">
                    We're currently in our MVP phase with real users experiencing the future of conversational AI.
                    Be part of our journey as we build MUMBAAI into something revolutionary.
                  </p>
                  <div className="flex justify-center items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-gray-900" />
                      <span className="text-gray-700 font-medium">Phase 1: Complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-900 rounded-full"></div>
                      <span className="text-gray-900 font-medium">Phase 2: Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Circle size={16} className="text-gray-400" />
                      <span className="text-gray-500">Phase 3-5: Starting Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>     
 {/* Why MUMBAAI Section */}
      <section className="py-20 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose MUMBAAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Traditional AI chats are linear and forgettable. MUMBAAI transforms conversations into visual, explorable journeys that actually help you think better.
            </p>
          </div>

          {/* Problem/Solution Grid */}
          <div className="grid md:grid-cols-2 gap-16 mb-20">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">The Problem with Linear AI Chats</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <p className="text-gray-600">Lost context when exploring multiple ideas</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <p className="text-gray-600">Can't revisit or compare different approaches</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <p className="text-gray-600">Conversations disappear into an endless scroll</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <p className="text-gray-600">No way to organize or structure complex discussions</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">The MUMBAAI Solution</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-600">Every idea branches into its own conversation path</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-600">Jump between branches and compare solutions side-by-side</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-600">Visual tree structure makes everything findable</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-600">Merge insights from multiple paths with MUMBAAI assistance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Features */}
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <MessageCircle size={32} className="text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Branching Conversations</h3>
              <p className="text-gray-600 leading-relaxed">
                Every response creates a new branch. Explore different angles without losing your original train of thought.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Sparkles size={32} className="text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Visual Tree Structure</h3>
              <p className="text-gray-600 leading-relaxed">
                See your entire conversation as an interactive tree. Navigate, search, and understand your thinking process.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Zap size={32} className="text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Merge</h3>
              <p className="text-gray-600 leading-relaxed">
                Combine insights from different branches with AI assistance to create comprehensive solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Conversations?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of users who are already thinking better with MUMBAAI's branching conversation trees.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg"
          >
            Start Your First Conversation
          </button>
        </div>
      </section>
    </div>
  );
};