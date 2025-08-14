import React from 'react';
import { ArrowUp, History } from 'lucide-react';
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
  onModelChange
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSendMessage) {
        onSendMessage();
      }
    }
  };

  const getPlaceholderText = () => {
    return selectedMessageId ? "Ask away..." : "Message MUMBAAI";
  };

  return (
    <div className="bg-white p-6">
      {/* Input Container */}
      <div className="relative bg-gray-50 rounded-2xl border border-gray-100 p-4 focus-within:bg-white focus-within:border-gray-200 transition-all">
        <div className="flex items-end gap-3">
          <textarea
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-sm resize-none min-h-[24px] max-h-32 overflow-y-auto outline-none border-none p-0"
            disabled={isLoading}
            rows={1}
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
            onClick={onSendMessage}
            disabled={!canSendMessage}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              canSendMessage
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={isLoading ? 'Sending...' : 'Send message'}
          >
            <ArrowUp size={14} />
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

      {/* Reply Context */}
      {selectedMessageId && currentMessage && (
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