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
  // New merge props
  isMultiSelectMode?: boolean;
  onPerformMerge?: (customPrompt?: string) => void;
  mergeCount?: number;
  // Streaming prop
  streamingContent?: string;
  // New tree prop
  onStartNewTree?: () => void;
  // Full-width mode: traditional chat view (no canvas beside it)
  fullWidth?: boolean;
  // Branch from a specific message bubble in the linear thread
  onBranchFrom?: (messageId: string) => void;
  // Whether the conversation has any messages at all (drives the centered
  // greeting composer in full-width mode)
  isEmpty?: boolean;
  // Short greeting shown above the centered composer
  greeting?: string;
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
  onModelChange,
  isMultiSelectMode = false,
  onPerformMerge,
  mergeCount = 0,
  streamingContent = '',
  onStartNewTree,
  fullWidth = false,
  onBranchFrom,
  isEmpty = false,
  greeting = 'What’s on your mind?'
}) => {
  if (collapsed && !fullWidth) {
    return (
      <div className="w-12 bg-void border-r border-hairline flex flex-col items-center justify-center">
        <button
          onClick={onToggleCollapse}
          className="p-3 text-smoke hover:text-bone hover:bg-panel rounded-[8px] transition-colors duration-fast"
          title="Show Chat"
        >
          <ChevronLeft size={20} className="rotate-180" />
        </button>
      </div>
    );
  }

  // Empty conversation in full-width mode: the composer sits center-screen
  // under a short greeting — the layout everyone already knows.
  if (fullWidth && isEmpty && !isLoading && !streamingContent) {
    return (
      <div className="w-full bg-void flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl -mt-14">
          <h2 className="text-center font-extralight text-bone tracking-display text-[clamp(26px,4vw,38px)] mb-9">
            {greeting}
          </h2>
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
            bare
          />
          <p className="text-center text-[12px] text-smoke mt-6 tracking-body">
            Every reply can branch — your chat becomes a map you can explore and merge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        fullWidth ? 'w-full' : 'w-2/5 border-r border-hairline'
      } bg-void flex flex-col transition-all duration-med`}
    >
      {/* Message Thread */}
      <MessageThread
        messages={messageThread}
        selectedMessageId={selectedMessageId}
        isLoading={isLoading}
        bookmarkedNodes={bookmarkedNodes}
        onToggleBookmark={onToggleBookmark}
        streamingContent={streamingContent}
        onBranchFrom={onBranchFrom}
        centered={fullWidth}
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
        isMultiSelectMode={isMultiSelectMode}
        onPerformMerge={onPerformMerge}
        mergeCount={mergeCount}
        onStartNewTree={onStartNewTree}
        centered={fullWidth}
      />
    </div>
  );
};
