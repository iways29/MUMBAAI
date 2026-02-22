import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Edit3, User, Plus, Shield } from 'lucide-react';
import { ProInterestButton } from '../UI/ProInterestButton.tsx';
import GA4 from '../../services/ga4Service.ts';

// Updated interface to include profile button props
interface FloatingToolbarProps {
  brandName: string;
  conversationName: string;
  onBrandClick: () => void;
  onConversationNameChange: (newName: string) => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onNewChat?: () => void;
  showNewChatButton?: boolean;
  showViewToggle?: boolean;
  viewMode?: 'combined' | 'flow';
  onViewModeChange?: (mode: 'combined' | 'flow') => void;
  isConversationsPage?: boolean;
  showProfileButton?: boolean;
  onProfileClick?: () => void;
  showAdminButton?: boolean;
  onAdminClick?: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  brandName,
  conversationName,
  onBrandClick,
  onConversationNameChange,
  showBackButton = false,
  onBackClick,
  onNewChat,
  showNewChatButton = false,
  showViewToggle = false,
  viewMode = 'combined',
  onViewModeChange,
  isConversationsPage = false,
  showProfileButton = false,
  onProfileClick,
  showAdminButton = false,
  onAdminClick
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(conversationName);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSaveEdit = useCallback(() => {
    if (editingName.trim() && editingName !== conversationName) {
      onConversationNameChange(editingName.trim());
    }
    setIsEditing(false);
  }, [editingName, conversationName, onConversationNameChange]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) && isEditing) {
        if (editingName.trim() && editingName !== conversationName) {
          onConversationNameChange(editingName.trim());
        }
        setIsEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditing, editingName, conversationName, onConversationNameChange]);

  useEffect(() => {
    setEditingName(conversationName);
  }, [conversationName]);

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditingName(conversationName);
  };

  const handleCancelEdit = () => {
    setEditingName(conversationName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="fixed left-0 right-0 z-50 bg-white backdrop-blur-md border-b border-gray-300 shadow-sm" style={{ top: '8px' }}>
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to conversations"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            
            {/* Brand Name */}
            <button
              onClick={onBrandClick}
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {brandName}
            </button>

            {/* Conversation Name - Only show if not on conversations page */}
            {!isConversationsPage && (
              <>
                <div className="w-px h-6 bg-gray-300" />
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="px-3 py-1 text-lg font-medium text-gray-800 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                      placeholder="Conversation name..."
                    />
                  ) : (
                    <button
                      onClick={handleStartEditing}
                      className="flex items-center gap-2 px-3 py-1 text-lg font-medium text-gray-800 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                      title="Click to edit conversation name"
                    >
                      <span>{conversationName}</span>
                      <Edit3 size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Only show other buttons if not on conversations page */}
            {!isConversationsPage && (
              <>
                {/* New Chat Button */}
                {showNewChatButton && onNewChat && (
                  <button
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    title="New Chat"
                  >
                    <Plus size={16} />
                    New Chat
                  </button>
                )}
                
                {/* View Toggle */}
                {showViewToggle && onViewModeChange && (
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => {
                        GA4.toggleViewMode('combined');
                        onViewModeChange('combined');
                      }}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'combined'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Combined
                    </button>
                    <button
                      onClick={() => {
                        GA4.toggleViewMode('flow');
                        onViewModeChange('flow');
                      }}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'flow'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Flow View
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* Pro Interest Button */}
            <ProInterestButton large={isConversationsPage} />

            {/* Admin Console Button - Show only for admins */}
            {showAdminButton && onAdminClick && (
              <button
                onClick={() => {
                  GA4.navigateAdmin();
                  onAdminClick();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                title="Admin Console"
              >
                <Shield size={16} />
                Admin
              </button>
            )}

            {/* User Profile Button - Show when enabled */}
            {showProfileButton && onProfileClick && (
              <button
                onClick={() => {
                  GA4.navigateProfile();
                  onProfileClick();
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="User Profile"
              >
                <User size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};