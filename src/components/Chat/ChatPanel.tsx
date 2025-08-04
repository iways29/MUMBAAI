import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { MessageThread } from './MessageThread.tsx';
import { ChatInput } from './ChatInput.tsx';
import { Message } from '../../types/conversation.ts';

interface ChatPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  messageThread: Message[];
  selectedMessageId: string;
  isLoading: boolean;
  inputText: string;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  canSendMessage: boolean;
  currentMessage: Message | null;
  bookmarkedNodes: Set<string>;
  onToggleBookmark: (nodeId: string) => void;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  collapsed,
  onToggleCollapse,
  messageThread,
  selectedMessageId,
  isLoading,
  inputText,
  onInputChange,
  onSendMessage,
  canSendMessage,
  currentMessage,
  bookmarkedNodes,
  onToggleBookmark,
  selectedModel,
  onModelChange
}) => {
  if (collapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center justify-center">
        <button
          onClick={onToggleCollapse}
          className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Show Chat"
        >
          <ChevronLeft size={20} className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-2/5 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300">
      {/* Message Thread */}
      <MessageThread
        messages={messageThread}
        selectedMessageId={selectedMessageId}
        isLoading={isLoading}
        bookmarkedNodes={bookmarkedNodes}
        onToggleBookmark={onToggleBookmark}
      />

      {/* Chat Input */}
      <ChatInput
        inputText={inputText}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        canSendMessage={canSendMessage}
        isLoading={isLoading}
        selectedMessageId={selectedMessageId}
        currentMessage={currentMessage}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
    </div>
  );
};