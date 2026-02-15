import React from 'react';
import { ArrowUp, History, Sparkles } from 'lucide-react';
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
  mergeCount = 0
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isInMergeMode = isMultiSelectMode;
  const canPerformAction = isInMergeMode ? 
    (!isLoading && inputText.trim().length > 0) : 
    canSendMessage;

  // Debug logging
  React.useEffect(() => {
    console.log('ChatInput Debug:', {
      isMultiSelectMode,
      mergeCount,
      isInMergeMode,
      canPerformAction
    });
  }, [isMultiSelectMode, mergeCount, isInMergeMode, canPerformAction]);

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
      return "Enter custom merge prompt (required for custom merge)...";
    }
    return selectedMessageId ? "Ask away..." : "Message MUMBAAI";
  };

  const getButtonTitle = () => {
    if (isLoading) return 'Processing...';
    if (isInMergeMode) {
      if (inputText.trim().length === 0) {
        return 'Enter custom prompt to merge, or use template buttons below';
      }
      return `Merge ${mergeCount} nodes with custom prompt`;
    }
    return 'Send message';
  };

  return (
    <div className="bg-white p-6">
      {/* Input Container */}
      <div className={`relative rounded-2xl border p-4 transition-all ${
        isInMergeMode 
          ? 'bg-purple-50 border-purple-200 focus-within:bg-white focus-within:border-purple-300'
          : 'bg-gray-50 border-gray-100 focus-within:bg-white focus-within:border-gray-200'
      }`}>
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-sm resize-none min-h-[24px] max-h-32 overflow-y-auto outline-none border-none p-0"
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
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              canPerformAction
                ? isInMergeMode 
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={getButtonTitle()}
          >
            {isInMergeMode ? <Sparkles size={14} /> : <ArrowUp size={14} />}
          </button>
        </div>

        {/* LLM Selector - Inside text box, under input */}
        {onModelChange && (
          <div className="flex justify-start mt-3 pt-3 border-t border-gray-200">
            <LLMSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
          </div>
        )}
      </div>

      {/* Context Indicators */}
      {isInMergeMode ? (
        <div className="mt-3 text-xs text-purple-600 flex items-center gap-2 px-2">
          <Sparkles size={12} />
          <span>Custom merge mode:</span>
          <span className="text-purple-700 font-medium">
            {mergeCount} nodes selected • Enter prompt above or use template buttons in flow panel
          </span>
        </div>
      ) : selectedMessageId && currentMessage && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-2 px-2">
          <History size={12} />
          <span>Replying to:</span>
          <span className="text-gray-700 font-medium">
            {MessageHelpers.truncateText(currentMessage.content, 60)}
          </span>
        </div>
      )}
    </div>
  );
};