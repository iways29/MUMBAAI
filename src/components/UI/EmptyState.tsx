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
                  Get Started
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
              ← Back to landing page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};