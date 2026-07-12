import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, LogOut, Check, X, Edit3, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';
import { DatabaseService } from '../services/databaseService.ts';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfileProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface EffectiveLimits {
  tier_name: string;
  tier_display_name: string;
  daily_token_limit: number | null;
  monthly_token_limit: number | null;
  daily_merge_limit: number | null;
  is_suspended: boolean;
  suspension_reason: string | null;
}

interface DailyUsage {
  tokens_used: number;
  merges_performed: number;
  requests_count: number;
}

// Plum-on-hairline usage meter. Unlimited (null limit) renders as a plain count.
const UsageMeter: React.FC<{
  label: string;
  used: number;
  limit: number | null;
}> = ({ label, used, limit }) => {
  const pct = limit && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[12px] font-semibold uppercase tracking-kicker text-smoke">{label}</span>
        <span className="text-[13px] text-ash">
          {used.toLocaleString()}
          {limit !== null ? ` / ${limit.toLocaleString()}` : ' · no limit'}
        </span>
      </div>
      {limit !== null && (
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-hairline)' }}>
          <div
            className="h-full bg-plum rounded-full transition-all duration-med"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
};

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [signingOut, setSigningOut] = useState(false);

  // Display name editing — same click-to-edit pattern as the conversation
  // name editor in FloatingToolbar
  const initialName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const [displayName, setDisplayName] = useState<string>(initialName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(displayName);
  const [nameSaveError, setNameSaveError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Usage & limits
  const [limits, setLimits] = useState<EffectiveLimits | null>(null);
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  // Danger zone
  const [deletePhase, setDeletePhase] = useState<'idle' | 'confirm'>('idle');
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setUsageLoading(true);
      const [limitsData, usageData] = await Promise.all([
        DatabaseService.getEffectiveUserLimits(),
        DatabaseService.getUserDailyUsage()
      ]);
      if (!cancelled) {
        setLimits(limitsData);
        setUsage(usageData);
        setUsageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = useCallback(async () => {
    const trimmed = editingName.trim();
    setIsEditingName(false);
    if (!trimmed || trimmed === displayName) return;

    const previous = displayName;
    setDisplayName(trimmed); // optimistic
    setNameSaveError(false);
    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    if (error) {
      console.error('Failed to update display name:', error);
      setDisplayName(previous);
      setNameSaveError(true);
    }
  }, [editingName, displayName]);

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    else if (e.key === 'Escape') {
      setEditingName(displayName);
      setIsEditingName(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);
    try {
      // Requires the server-side `delete_own_account` RPC (see
      // supabase/migrations/20260711_delete_own_account.sql) — account
      // deletion can't be done with the anon key alone.
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      setDeleteError(
        error?.message?.includes('function')
          ? 'Account deletion is not enabled yet — contact support and we will remove your account.'
          : 'Something went wrong deleting your account. Try again, or contact support.'
      );
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (email: string) => email.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-void">
      {/* Header bar */}
      <div className="border-b border-hairline px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-smoke hover:text-bone hover:bg-panel rounded-[8px] transition-colors duration-fast"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[17px] font-semibold text-bone tracking-body">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* Identity */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full border border-hairline flex items-center justify-center shrink-0">
            <span className="text-bone text-xl font-extralight tracking-display">
              {getInitials(user.email || '')}
            </span>
          </div>
          <div className="min-w-0">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleSaveName}
                className="px-3 py-1 text-[18px] text-bone bg-panel border border-plum rounded-[8px] outline-none min-w-[220px]"
                placeholder="Display name…"
              />
            ) : (
              <button
                onClick={() => {
                  setEditingName(displayName);
                  setIsEditingName(true);
                }}
                className="group flex items-center gap-2 text-[20px] font-normal text-bone hover:text-ash transition-colors duration-fast"
                title="Click to edit display name"
              >
                <span className="truncate">{displayName}</span>
                <Edit3 size={14} className="opacity-0 group-hover:opacity-60 transition-opacity duration-fast shrink-0" />
              </button>
            )}
            <p className="text-ash text-[14px] mt-0.5 truncate">{user.email}</p>
            {nameSaveError && (
              <p className="text-danger text-[12px] mt-1">Couldn't save the name — try again.</p>
            )}
          </div>
        </div>

        {/* Usage */}
        <section className="border border-hairline rounded-node bg-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-kicker text-smoke">
              Usage today
            </h2>
            {limits && (
              <span className="px-3 py-1 rounded-pill border border-hairline text-[11px] font-semibold uppercase tracking-kicker text-ash">
                {limits.tier_display_name || limits.tier_name || 'Free'}
              </span>
            )}
          </div>

          {usageLoading ? (
            <p className="text-smoke text-[13px]">Loading usage…</p>
          ) : usage ? (
            <div className="space-y-5">
              <UsageMeter
                label="Tokens"
                used={usage.tokens_used}
                limit={limits?.daily_token_limit ?? null}
              />
              <UsageMeter
                label="Merges"
                used={usage.merges_performed}
                limit={limits?.daily_merge_limit ?? null}
              />
              <p className="text-[12px] text-smoke leading-relaxed pt-1">
                Limits reset daily. If you hit one mid-conversation, this is
                where to check what's left.
              </p>
              {limits?.is_suspended && (
                <div className="flex items-start gap-2 text-[13px] text-danger border border-danger rounded-node p-3">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Your account is suspended
                    {limits.suspension_reason ? `: ${limits.suspension_reason}` : '.'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-smoke text-[13px]">Usage data isn't available right now.</p>
          )}
        </section>

        {/* Account details */}
        <section>
          <h2 className="text-[12px] font-semibold uppercase tracking-kicker text-smoke mb-4">
            Account
          </h2>
          <div className="border border-hairline rounded-node divide-y divide-[rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-[13px] text-ash">Member since</span>
              <span className="text-[13px] text-bone">{formatDate(user.created_at)}</span>
            </div>
            {user.last_sign_in_at && (
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-[13px] text-ash">Last sign in</span>
                <span className="text-[13px] text-bone">{formatDate(user.last_sign_in_at)}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3.5 gap-4">
              <span className="text-[13px] text-ash shrink-0">User ID</span>
              <span className="text-[12px] text-smoke font-mono truncate">{user.id}</span>
            </div>
          </div>
        </section>

        {/* Sign out */}
        <div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-pill border border-hairline hover:border-hairline-strong text-bone text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast disabled:opacity-50"
          >
            <LogOut size={14} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        {/* Danger zone */}
        <section className="pt-8 border-t border-hairline">
          <h2 className="text-[12px] font-semibold uppercase tracking-kicker text-danger mb-3">
            Danger zone
          </h2>
          <p className="text-[13px] text-ash leading-relaxed mb-5 max-w-[52ch]">
            Deleting your account permanently removes your conversations,
            trees, and usage history. This can't be undone.
          </p>

          {deletePhase === 'idle' ? (
            <button
              onClick={() => setDeletePhase('confirm')}
              className="px-5 py-2.5 rounded-pill border border-danger text-danger hover:bg-[rgba(240,89,78,0.08)] text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast"
            >
              Delete account
            </button>
          ) : (
            <div className="border border-danger rounded-node p-5 max-w-md">
              <p className="text-[13px] text-bone mb-3">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-void border border-hairline focus:border-danger rounded-node text-bone text-[14px] font-mono outline-none transition-colors duration-fast mb-4"
                placeholder="DELETE"
                autoFocus
              />
              {deleteError && (
                <p className="text-danger text-[13px] mb-4">{deleteError}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'DELETE' || deleting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-pill border border-danger text-danger hover:bg-[rgba(240,89,78,0.08)] text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={13} />
                  {deleting ? 'Deleting…' : 'Confirm delete'}
                </button>
                <button
                  onClick={() => {
                    setDeletePhase('idle');
                    setDeleteInput('');
                    setDeleteError(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-pill border border-hairline hover:border-hairline-strong text-ash text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast"
                >
                  <X size={13} />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
