import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Calendar, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfileProps {
  user: SupabaseUser;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {getInitials(user.email || '')}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              {/* User ID */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">User ID</p>
                  <p className="text-gray-600 font-mono text-sm">{user.id}</p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Member Since</p>
                  <p className="text-gray-600">{formatDate(user.created_at)}</p>
                </div>
              </div>

              {/* Last Sign In */}
              {user.last_sign_in_at && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Sign In</p>
                    <p className="text-gray-600">{formatDate(user.last_sign_in_at)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut size={16} />
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;