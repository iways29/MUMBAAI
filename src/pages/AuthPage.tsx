import React, { useState } from 'react';
import { GitBranch, ArrowLeft, Mail, Lock, MailCheck } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';

interface AuthPageProps {
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  // 'form' → the auth form; 'verify' → the post-signup "check your email" screen
  const [stage, setStage] = useState<'form' | 'verify'>('form');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setStage('verify');
        setResendState('idle');
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

  const handleResendVerification = async () => {
    setResendState('sending');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResendState('sent');
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setResendState('error');
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

  // Post-signup: a real "check your email" screen with a resend action,
  // instead of a static line of text under the form.
  if (stage === 'verify') {
    return (
      <div className="min-h-screen bg-void flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-8 rounded-full border border-hairline flex items-center justify-center">
            <MailCheck size={24} className="text-plum" />
          </div>
          <h2 className="text-[28px] font-extralight text-bone tracking-display mb-3">
            Check your email
          </h2>
          <p className="text-ash text-[15px] leading-relaxed tracking-body mb-2">
            We sent a verification link to
          </p>
          <p className="text-bone text-[15px] font-semibold mb-8">{email}</p>
          <p className="text-smoke text-[13px] leading-relaxed max-w-[38ch] mx-auto mb-10">
            Click the link in that email to activate your account, then come back
            and sign in. It can take a minute to arrive — check spam too.
          </p>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleResendVerification}
              disabled={resendState === 'sending' || resendState === 'sent'}
              className="px-6 py-3 rounded-pill border border-hairline hover:border-hairline-strong text-bone text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast disabled:opacity-50"
            >
              {resendState === 'sending'
                ? 'Sending…'
                : resendState === 'sent'
                ? 'Email sent again'
                : 'Resend verification email'}
            </button>
            {resendState === 'error' && (
              <p className="text-danger text-[13px]">
                Couldn't resend — wait a moment and try again.
              </p>
            )}
            <button
              onClick={() => {
                setStage('form');
                setIsSignUp(false);
                setMessage('');
              }}
              className="text-[13px] text-smoke hover:text-bone transition-colors duration-fast"
            >
              Already verified? Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-smoke hover:text-bone mb-8 transition-colors duration-fast text-[14px]"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        {/* Logo and title */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-full border border-hairline flex items-center justify-center">
            <GitBranch size={20} className="text-plum" />
          </div>
          <span className="text-xl font-semibold text-bone tracking-body">MUMBAAI</span>
        </div>

        <h2 className="text-center text-[28px] font-extralight text-bone tracking-display mb-2">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="text-center text-ash text-[14px] mb-8">
          Chat is a straight line — here, every reply can branch, and the best
          branches merge back into one answer.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-panel border border-hairline py-8 px-5 rounded-[24px] sm:px-10">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-hairline hover:border-hairline-strong rounded-pill bg-transparent text-bone text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-hairline" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-panel text-smoke text-[12px] uppercase tracking-kicker">Or with email</span>
              </div>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="mt-6 space-y-6" onSubmit={handleEmailAuth}>
            <div>
              <label htmlFor="email" className="block text-[13px] font-semibold text-ash mb-1">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 pl-10 bg-void border border-hairline hover:border-hairline-strong focus:border-plum rounded-node text-bone placeholder:text-smoke text-[14px] outline-none transition-colors duration-fast"
                  placeholder="you@example.com"
                />
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-smoke" size={18} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-semibold text-ash mb-1">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 pl-10 bg-void border border-hairline hover:border-hairline-strong focus:border-plum rounded-node text-bone placeholder:text-smoke text-[14px] outline-none transition-colors duration-fast"
                  placeholder="Your password"
                />
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-smoke" size={18} />
              </div>
            </div>

            {/* Pre-submit heads-up so email verification isn't a surprise */}
            {isSignUp && (
              <p className="text-[13px] text-smoke leading-relaxed flex items-start gap-2">
                <MailCheck size={14} className="shrink-0 mt-0.5 text-smoke" />
                We'll send a verification link to this address — you'll need to
                click it before your first sign-in.
              </p>
            )}

            {message && (
              <div className="text-sm p-3 rounded-node border border-danger text-danger">
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-pill text-[12px] font-semibold uppercase tracking-kicker text-bone bg-plum hover:bg-plum-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast"
              >
                {loading ? 'Please wait…' : (isSignUp ? 'Create account' : 'Sign in')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[13px] text-smoke hover:text-bone transition-colors duration-fast"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
