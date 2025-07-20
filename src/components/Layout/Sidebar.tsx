import React from 'react';
import { Plus, ChevronUp, ChevronLeft, Sparkles, GitBranch } from 'lucide-react';
import { ConversationSelector } from '../Chat/ConversationSelector';
import { Conversation } from '../../types/conversation';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleChatPanel: () => void;
  conversations: Conversation[];
  activeConversation: string;
  onConversationChange: (id: string) => void;
  onCreateConversation: () => void;
  selectedNodes: Set<string>;
  canMerge: boolean;
  onPerformMerge: () => void;
  effectiveMergeCount: number;
  onClearSelection: () => void;
  onFitView: () => void;
  isLoading: boolean;
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
  selectedNodes,
  canMerge,
  onPerformMerge,
  effectiveMergeCount,
  onClearSelection,
  onFitView,
  isLoading,
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
                <h3 className="text-sm font-bold text-gray-800">FlowChat AI</h3>
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
              <h2 className="text-xl font-bold text-gray-900">FlowChat AI</h2>
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

        {/* Merge Controls */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <GitBranch size={14} />
            <span>Ctrl+click nodes • Double-click to focus</span>
          </div>

          <div className="text-sm mb-3">
            <span className="text-blue-600 font-medium">Selected: {selectedNodes.size} nodes</span>
            {effectiveMergeCount > selectedNodes.size && (
              <span className="text-green-600 ml-1">+ active node</span>
            )}
          </div>

          {canMerge ? (
            <button
              onClick={onPerformMerge}
              className="flex items-center gap-2 w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium mb-2"
              disabled={isLoading}
              data-tutorial="merge-button"
            >
              <Sparkles size={14} />
              {isLoading ? 'Merging...' : `Smart Merge ${effectiveMergeCount} nodes`}
            </button>
          ) : (
            <div className="text-sm text-gray-500 text-center py-2 mb-2 border border-dashed border-gray-300 rounded">
              Select 2+ nodes to merge
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClearSelection}
              className="flex-1 px-2 py-1 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 border border-gray-200"
            >
              Clear
            </button>
            <button
              onClick={onFitView}
              className="flex-1 px-2 py-1 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 border border-gray-200"
            >
              Fit View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};