import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Edit3, User, Plus, HelpCircle } from 'lucide-react';
import { ProInterestButton } from '../UI/ProInterestButton.tsx';

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
  // Always-available tutorial replay (ONBOARDING_PRD §6)
  onReplayTutorial?: () => void;
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
  onReplayTutorial
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
    <div className="fixed top-0 left-0 right-0 z-50 bg-void border-b border-hairline">
      <div className="px-5 h-14 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0">
          {showBackButton && onBackClick && (
            <button
              onClick={onBackClick}
              className="p-2 text-smoke hover:text-bone hover:bg-panel rounded-[8px] transition-colors duration-fast"
              title="Back to conversations"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Brand Name */}
          <button
            onClick={onBrandClick}
            className="text-[15px] font-semibold text-bone hover:text-ash transition-colors duration-fast tracking-body"
          >
            {brandName}
          </button>

          {/* Conversation Name - Only show if not on conversations page */}
          {!isConversationsPage && (
            <>
              <div className="w-px h-5" style={{ background: 'var(--color-hairline)' }} />
              <div className="flex items-center gap-2 min-w-0">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="px-3 py-1 text-[14px] text-bone bg-panel border border-plum rounded-[8px] outline-none min-w-[200px]"
                    placeholder="Conversation name…"
                  />
                ) : (
                  <button
                    onClick={handleStartEditing}
                    className="flex items-center gap-2 px-3 py-1 text-[14px] text-ash hover:text-bone hover:bg-panel rounded-[8px] transition-colors duration-fast group min-w-0"
                    title="Click to edit conversation name"
                  >
                    <span className="truncate">{conversationName}</span>
                    <Edit3 size={13} className="opacity-0 group-hover:opacity-60 transition-opacity duration-fast shrink-0" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2.5">
          {/* Only show other buttons if not on conversations page */}
          {!isConversationsPage && (
            <>
              {/* New Chat Button */}
              {showNewChatButton && onNewChat && (
                <button
                  onClick={onNewChat}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-plum hover:bg-plum-hover text-bone rounded-pill transition-colors duration-fast text-[12px] font-semibold uppercase tracking-kicker"
                  title="New Chat"
                >
                  <Plus size={14} />
                  New chat
                </button>
              )}

              {/* Panel toggle — canvas is always the base surface; this only
                  controls whether the chat panel sits beside it */}
              {showViewToggle && onViewModeChange && (
                <div className="flex items-center gap-1 border border-hairline rounded-pill p-1">
                  <button
                    onClick={() => onViewModeChange('combined')}
                    className={`px-3 py-1 text-[12px] font-medium rounded-pill transition-colors duration-fast ${
                      viewMode === 'combined'
                        ? 'bg-panel-2 text-bone'
                        : 'text-smoke hover:text-bone'
                    }`}
                    title="Chat panel beside the canvas"
                  >
                    Panel
                  </button>
                  <button
                    onClick={() => onViewModeChange('flow')}
                    className={`px-3 py-1 text-[12px] font-medium rounded-pill transition-colors duration-fast ${
                      viewMode === 'flow'
                        ? 'bg-panel-2 text-bone'
                        : 'text-smoke hover:text-bone'
                    }`}
                    title="Canvas only — chat panel hidden"
                  >
                    Canvas only
                  </button>
                </div>
              )}
            </>
          )}

          {/* Pro Interest Button */}
          <ProInterestButton large={isConversationsPage} />

          {/* Replay tutorial — visible everywhere, every session */}
          {onReplayTutorial && (
            <button
              onClick={onReplayTutorial}
              className="p-2 text-smoke hover:text-bone hover:bg-panel rounded-[8px] transition-colors duration-fast"
              title="Replay tutorial"
            >
              <HelpCircle size={18} />
            </button>
          )}

          {/* User Profile Button - Show when enabled */}
          {showProfileButton && onProfileClick && (
            <button
              onClick={onProfileClick}
              className="p-2 text-smoke hover:text-bone hover:bg-panel rounded-[8px] transition-colors duration-fast"
              title="User Profile"
            >
              <User size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
