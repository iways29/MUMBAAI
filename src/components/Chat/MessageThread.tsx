import React, { useEffect, useRef } from 'react';
import { MessageCircle, User, Bot, GitBranch, Sparkles, Share2, Bookmark } from 'lucide-react';
import { Message } from '../../types/conversation.ts';
import { MessageHelpers } from '../../utils/messageHelpers.ts';
import { ThinkingIndicator } from '../UI/LoadingSpinner.tsx';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length, isLoading]);

  // Also scroll when the loading state changes (when AI responds)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        }
      }, 100);
    }
  }, [isLoading, messages.length]);

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
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
    <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl px-4 py-3 rounded-2xl ${
              message.type === 'user'
                ? 'bg-gray-100 text-gray-900 shadow-sm ml-8'
                : 'bg-transparent text-gray-900'
            } ${message.id === selectedMessageId ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>

              <div className="flex items-center gap-2 mb-2">
                {message.type === 'user' ? (
                  <User size={14} className="opacity-80 flex-shrink-0" />
                ) : (
                  <Bot size={14} className="opacity-70 flex-shrink-0" />
                )}
                <span className={`text-xs font-medium ${message.type === 'user' ? 'opacity-90' : 'opacity-70'}`}>
                  {message.type === 'user' ? 'You' : 'Assistant'}
                </span>
                <span className={`text-xs opacity-60 flex-shrink-0 ${message.type === 'user' ? 'ml-auto' : ''}`}>
                  {MessageHelpers.formatTimestamp(message.timestamp)}
                </span>
              </div>

              <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2 break-words">{message.content}</div>

              {/* Message Actions and Info */}
              <div className={`flex items-center gap-3 pt-1 border-t ${
                message.type === 'user' ? 'border-gray-400 border-opacity-30' : 'border-gray-200'
              }`}>
                {/* Response count */}
                {message.children && message.children.length > 0 && (
                  <div className="text-xs opacity-70 flex items-center gap-1">
                    <GitBranch size={8} />
                    {message.children.length} response{message.children.length > 1 ? 's' : ''}
                  </div>
                )}

                {/* Merged info */}
                {MessageHelpers.isMergedMessage(message) && (
                  <div className={`text-xs flex items-center gap-1 ${
                    message.type === 'user' ? 'text-gray-600' : 'text-purple-600'
                  } opacity-90`}>
                    <Sparkles size={8} />
                    Merged from {message.mergedFrom?.length} branches
                    {message.isMergeRoot && " • Root"}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 ml-auto">
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
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <ThinkingIndicator text="Assistant is thinking..." />
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};