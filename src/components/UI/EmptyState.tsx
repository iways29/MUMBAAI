import React, { useState } from 'react';
import { MessageCircle, Sparkles, HelpCircle, Mail, Lock, CheckCircle, Circle, Clock, Building, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.ts';
import { supabase } from '../../lib/supabase.ts';

interface EmptyStateProps {
  onCreateConversation?: () => void;
  showAuth?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateConversation,
  showAuth = false
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created successfully!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // User will be automatically redirected after successful login
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      // User will be redirected to Google for authentication
    } catch (error: any) {
      setMessage(error.message);
      setLoading(false);
    }
  };


  // If user is logged in and has clicked to start, trigger conversation creation
  React.useEffect(() => {
    if (user && showAuth && onCreateConversation) {
      onCreateConversation();
    }
  }, [user, showAuth, onCreateConversation]);

  return (
    <>
      {!showAuth ? (
        /* Premium Landing Page */
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
                onClick={onCreateConversation}
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
                  onClick={onCreateConversation}
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Visual Thinking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Transform abstract conversations into visual mind maps. See connections, patterns, and possibilities that linear chats hide.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Sparkles size={32} className="text-gray-900" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Synthesis</h3>
                  <p className="text-gray-600 leading-relaxed">
                    AI-powered merging combines insights from different conversation branches. Get the best ideas from every path you explore.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <HelpCircle size={32} className="text-gray-900" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Infinite Exploration</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Never hit a dead end. Every conversation can branch in new directions. Explore "what if" scenarios without losing your main thread.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Team/Vision Section */}
          <section className="py-20 px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built by Conversation Enthusiasts
              </h2>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                We believe the best ideas emerge not from single exchanges, but from the exploration of interconnected thoughts. MUMBAAI was born from our frustration with losing brilliant conversations in endless scrolls.
              </p>

              <div className="bg-gray-50 rounded-2xl p-8 mb-12">
                <blockquote className="text-lg text-gray-700 mb-6 italic leading-relaxed">
                  "Every great breakthrough happened not in isolation, but through the branching paths of human curiosity. MUMBAAI is the tool that honors how minds actually work."
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">MUMBAAI Team</div>
                    <div className="text-sm text-gray-600">Reimagining Conversations</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">10K+</div>
                  <div className="text-gray-600">Conversations Branched</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
                  <div className="text-gray-600">Early Adopters</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
                  <div className="text-gray-600">Find Ideas Faster</div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Proof Section */}
          <section className="py-16 px-8 bg-gray-50">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                Loved by Thinkers, Creators, and Problem Solvers
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-yellow-400">★★★★★</span>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    "MUMBAAI completely changed how I approach complex problems. Instead of losing track of different solutions, I can explore them all visually and see which paths lead where."
                  </p>
                  <div className="text-sm font-medium text-gray-900">Sarah Chen</div>
                  <div className="text-sm text-gray-600">Product Manager, Tech Startup</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-yellow-400">★★★★★</span>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    "As a researcher, I need to explore multiple hypotheses simultaneously. MUMBAAI's branching conversations let me track every angle without losing context. It's like having a visual mind for AI."
                  </p>
                  <div className="text-sm font-medium text-gray-900">Dr. Marcus Thompson</div>
                  <div className="text-sm text-gray-600">Research Scientist</div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Ready to Transform Your Conversations?
              </h2>
              <p className="text-xl text-gray-600 mb-10">
                Join hundreds of users who are already exploring ideas in a whole new way with MUMBAAI.
              </p>
              <button
                onClick={onCreateConversation}
                className="bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg"
              >
                Start Free Today
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 px-8 border-t border-gray-100">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">MUMBAAI</span>
              </div>
              <p className="text-gray-500 text-sm">
                © 2024 MUMBAAI. Reimagining conversations.
              </p>
            </div>
          </footer>
        </div>
      ) : (
        /* Authentication Form */
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="text-gray-600">
                  {isSignUp ? 'Start exploring conversations with MUMBAAI' : 'Sign in to continue to MUMBAAI'}
                </p>
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes('Error') || message.includes('error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 bg-white"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setMessage('');
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back To Home Page
            </button>
          </div>
        </div>
      )}
    </>
  );
};