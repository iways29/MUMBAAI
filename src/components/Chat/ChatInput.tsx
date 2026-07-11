import React from 'react';
import { ArrowUp, History, Sparkles, Plus } from 'lucide-react';
import { Message } from '../../types/conversation.ts';
import { MessageHelpers } from '../../utils/messageHelpers.ts';
import { LLMSelector } from './LLMSelector.tsx';

interface ChatInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  canSendMessage: boolean;
  isLoading: boolean;
  selectedMessageId: string;
  currentMessage: Message | null;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  // New merge props
  isMultiSelectMode?: boolean;
  onPerformMerge?: (customPrompt?: string) => void;
  mergeCount?: number;
  // New tree prop
  onStartNewTree?: () => void;
  // Full-width mode: constrain to a readable centered measure
  centered?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  onInputChange,
  onSendMessage,
  canSendMessage,
  isLoading,
  selectedMessageId,
  currentMessage,
  selectedModel = 'gemini-1.5-flash',
  onModelChange,
  isMultiSelectMode = false,
  onPerformMerge,
  mergeCount = 0,
  onStartNewTree,
  centered = false
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isInMergeMode = isMultiSelectMode;
  const canPerformAction = isInMergeMode ?
    (!isLoading && inputText.trim().length > 0) :
    canSendMessage;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canPerformAction) {
        if (isInMergeMode) {
          onPerformMerge?.(inputText.trim() || undefined);
        } else {
          onSendMessage();
        }
        // Keep focus on textarea after sending
        setTimeout(() => textareaRef.current?.focus(), 0);
      }
    }
  };

  const handleButtonClick = () => {
    if (isInMergeMode) {
      onPerformMerge?.(inputText.trim() || undefined);
    } else {
      onSendMessage();
    }
    // Keep focus on textarea after clicking send button
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const getPlaceholderText = () => {
    if (isInMergeMode) {
      return 'Describe how to merge the selected branches…';
    }
    return selectedMessageId ? 'Reply — this starts a new branch…' : 'Message MUMBAAI';
  };

  const getButtonTitle = () => {
    if (isLoading) return 'Processing…';
    if (isInMergeMode) {
      if (inputText.trim().length === 0) {
        return 'Enter a custom prompt, or use the Smart Merge panel on the canvas';
      }
      return `Merge ${mergeCount} branches with this prompt`;
    }
    return 'Send message';
  };

  return (
    <div className={`bg-void p-5 border-t border-hairline ${centered ? '[&>*]:max-w-3xl [&>*]:mx-auto' : ''}`}>
      {/* Input Container */}
      <div
        data-tutorial-input
        className={`relative rounded-node border p-4 transition-colors duration-fast bg-panel ${
          isInMergeMode
            ? 'border-plum'
            : 'border-hairline focus-within:border-hairline-strong'
        }`}
      >
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
            className="flex-1 bg-transparent text-bone placeholder:text-smoke text-[15px] tracking-body resize-none min-h-[24px] max-h-32 overflow-y-auto outline-none border-none p-0"
            disabled={isLoading}
            rows={1}
            autoFocus
            style={{
              height: 'auto',
              minHeight: '24px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`; // 128px = max-h-32
            }}
          />
          <button
            onClick={handleButtonClick}
            disabled={!canPerformAction}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-fast flex-shrink-0 ${
              canPerformAction
                ? 'bg-plum hover:bg-plum-hover text-bone'
                : 'bg-panel-2 text-smoke cursor-not-allowed'
            }`}
            title={getButtonTitle()}
          >
            {isInMergeMode ? <Sparkles size={14} /> : <ArrowUp size={14} />}
          </button>
        </div>

        {/* LLM Selector - Inside text box, under input */}
        {onModelChange && (
          <div className="flex justify-start mt-3 pt-3 border-t border-hairline">
            <LLMSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
          </div>
        )}
      </div>

      {/* Context Indicators */}
      {isInMergeMode ? (
        <div className="mt-3 text-[12px] text-plum flex items-center gap-2 px-2">
          <Sparkles size={12} />
          <span className="text-ash">
            Merging <span className="text-bone font-medium">{mergeCount} branches</span> — type a
            prompt above, or use a template from the canvas panel
          </span>
        </div>
      ) : selectedMessageId && currentMessage ? (
        <div className="mt-3 text-[12px] text-smoke flex items-center justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            <History size={12} className="shrink-0" />
            <span className="shrink-0">Branching from:</span>
            <span className="text-ash font-medium truncate">
              {MessageHelpers.truncateText(currentMessage.content, 50)}
            </span>
          </div>
          {onStartNewTree && (
            <button
              onClick={onStartNewTree}
              className="flex items-center gap-1 px-2 py-1 text-ash hover:text-bone hover:bg-panel rounded-[8px] transition-colors duration-fast shrink-0"
              title="Start a new conversation tree"
            >
              <Plus size={12} />
              <span>New tree</span>
            </button>
          )}
        </div>
      ) : onStartNewTree && (
        <div className="mt-3 text-[12px] px-2">
          <span className="text-smoke">Starting a new conversation tree</span>
        </div>
      )}
    </div>
  );
};
