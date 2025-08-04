import React from 'react';
import { Plus, ChevronUp, ChevronLeft, Sparkles } from 'lucide-react';
import { ConversationSelector } from '../Chat/ConversationSelector.tsx';
import { Conversation } from '../../types/conversation.ts';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleChatPanel: () => void;
  conversations: Conversation[];
  activeConversation: string;
  onConversationChange: (id: string) => void;
  onCreateConversation: () => void;
  isRenamingConversation: boolean;
  tempConversationName: string;
  onStartRenaming: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onTempNameChange: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onToggleChatPanel,
  conversations,
  activeConversation,
  onConversationChange,
  onCreateConversation,
  isRenamingConversation,
  tempConversationName,
  onStartRenaming,
  onSaveRename,
  onCancelRename,
  onTempNameChange
}) => {
  const currentConversation = conversations.find(c => c.id === activeConversation);

  if (collapsed) {
    return (
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">MUMBAAI</h3>
                {currentConversation && (
                  <span className="text-xs text-gray-500">
                    {currentConversation.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onCreateConversation}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-80 rounded transition-colors"
              title="New Conversation"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-80 rounded transition-colors"
              title="Show Info Panel"
            >
              <ChevronUp size={14} className="transform rotate-180" />
            </button>
            <button
              onClick={onToggleChatPanel}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-80 rounded transition-colors"
              title="Collapse Chat"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">MUMBAAI</h2>
              <p className="text-xs text-gray-500">Visualize your conversations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCreateConversation}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="New Conversation"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Hide Info Panel"
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={onToggleChatPanel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Collapse Chat"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Conversation Selector */}
        <div className="mb-4">
          <ConversationSelector
            conversations={conversations}
            activeConversation={activeConversation}
            onConversationChange={onConversationChange}
            isRenaming={isRenamingConversation}
            tempName={tempConversationName}
            onStartRenaming={onStartRenaming}
            onSaveRename={onSaveRename}
            onCancelRename={onCancelRename}
            onTempNameChange={onTempNameChange}
          />
        </div>

      </div>
    </div>
  );
};