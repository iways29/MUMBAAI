import React from 'react';
import { MessageCircle, User, Bot, GitBranch, Sparkles, Share2, Bookmark } from 'lucide-react';
import { Message } from '../../types/conversation';
import { MessageHelpers } from '../../utils/messageHelpers';
import { ThinkingIndicator, MergeIndicator } from '../UI/LoadingSpinner';

interface MessageThreadProps {
  messages: Message[];
  selectedMessageId: string;
  isLoading: boolean;
  bookmarkedNodes: Set<string>;
  onToggleBookmark: (nodeId: string) => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  selectedMessageId,
  isLoading,
  bookmarkedNodes,
  onToggleBookmark
}) => {
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center text-gray-500 mt-32">
          <MessageCircle size={64} className="mx-auto mb-6 opacity-40" />
          <h3 className="text-xl font-medium mb-2">Start a new conversation</h3>
          <p className="text-sm mb-6">Type your message below to begin exploring ideas</p>
          <p className="text-xs text-gray-400">Double-click nodes in the tree to jump to any point</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
              message.type === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            } ${message.id === selectedMessageId ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>

              <div className="flex items-center gap-2 mb-2">
                {message.type === 'user' ? (
                  <User size={14} className="opacity-80" />
                ) : (
                  <Bot size={14} className="opacity-80" />
                )}
                <span className="text-xs font-medium opacity-90">
                  {message.type === 'user' ? 'You' : 'Assistant'}
                </span>
                <span className="text-xs opacity-60 ml-auto">
                  {MessageHelpers.formatTimestamp(message.timestamp)}
                </span>
              </div>

              <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{message.content}</div>

              {message.children && message.children.length > 0 && (
                <div className="text-xs opacity-70 flex items-center gap-1 mb-1">
                  <GitBranch size={10} />
                  {message.children.length} response{message.children.length > 1 ? 's' : ''}
                </div>
              )}

              {MessageHelpers.isMergedMessage(message) && (
                <div className="text-xs text-purple-600 opacity-90 flex items-center gap-1 mb-1">
                  <Sparkles size={10} />
                  Merged from {message.mergedFrom?.length} branches
                  {message.isMergeRoot && " • Root"}
                </div>
              )}

              {/* Message Actions */}
              <div className="flex gap-3 pt-1 border-t border-opacity-20">
                <button
                  onClick={() => handleCopyMessage(message.content)}
                  className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity"
                >
                  <Share2 size={8} />
                  Copy
                </button>
                <button
                  onClick={() => onToggleBookmark(message.id)}
                  className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity"
                >
                  <Bookmark size={8} />
                  {bookmarkedNodes.has(message.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            {/* Show different loading indicator based on context */}
            <ThinkingIndicator text="Assistant is thinking..." />
          </div>
        )}
      </div>
    </div>
  );
};