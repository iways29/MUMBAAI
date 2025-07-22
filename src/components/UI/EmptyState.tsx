import React, { useState } from 'react';
import { MessageCircle, Sparkles, HelpCircle, Mail, Lock } from 'lucide-react';
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

  const handleAuth = async (e: React.FormEvent) => {
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

  // If user is logged in and has clicked to start, trigger conversation creation
  React.useEffect(() => {
    if (user && showAuth && onCreateConversation) {
      onCreateConversation();
    }
  }, [user, showAuth, onCreateConversation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center max-w-lg px-6">
        {/* Logo/Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Sparkles size={40} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to FlowChatAI
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Transform your conversations into beautiful, interactive trees where every response creates a new branch of possibilities.
        </p>

        {!showAuth ? (
          <>
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MessageCircle size={24} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Visual Conversations</h3>
                <p className="text-sm text-gray-600">See your chat history as an interactive tree</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={24} className="text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Smart Merging</h3>
                <p className="text-sm text-gray-600">Combine different conversation paths with AI</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <HelpCircle size={24} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Explore Ideas</h3>
                <p className="text-sm text-gray-600">Navigate and branch conversations freely</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {onCreateConversation && (
                <button
                  onClick={onCreateConversation}
                  className="bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors w-full text-lg"
                >
                  Start Your First Conversation
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-400">
                💡 Pro tip: Try asking about project ideas, creative solutions, or any topic you'd like to explore from multiple angles
              </p>
            </div>
          </>
        ) : (
          /* Authentication Form */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                {isSignUp ? 'Create your account' : 'Sign in to continue'}
              </h2>
              <p className="text-gray-600 text-center mb-6">
                {isSignUp ? 'Join FlowChatAI to start exploring conversations' : 'Welcome back! Please sign in to your account'}
              </p>

              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes('Error') || message.includes('error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
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
              ← Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};