import React from 'react';
import { Plus, Send, MessageCircle, ChevronLeft, ChevronUp, History, X, AlertTriangle } from 'lucide-react';
import { Conversation, Message } from '../../types/conversation';

interface ChatPanelProps {
  // State
  currentConversation: Conversation | undefined;
  messageThread: Message[];
  selectedMessageId: string;
  currentMessage: Message | undefined;
  inputText: string;
  isLoading: boolean;
  isRenamingConversation: boolean;
  tempConversationName: string;
  infoPanelCollapsed: boolean;
  error?: string | null;

  // Actions
  createNewConversation: () => void;
  setInputText: (text: string) => void;
  sendMessage: () => void;
  setInfoPanelCollapsed: (collapsed: boolean) => void;
  setChatPanelCollapsed: (collapsed: boolean) => void;
  clearError?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  currentConversation,
  messageThread,
  selectedMessageId,
  currentMessage,
  inputText,
  isLoading,
  isRenamingConversation,
  tempConversationName,
  infoPanelCollapsed,
  error,
  createNewConversation,
  setInputText,
  sendMessage,
  setInfoPanelCollapsed,
  setChatPanelCollapsed,
  clearError
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      {/* Header */}
      {!infoPanelCollapsed && (
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MessageCircle size={16} className="text-white" />
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
                onClick={createNewConversation}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-80 rounded transition-colors"
                title="New Conversation"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setInfoPanelCollapsed(true)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-80 rounded transition-colors"
                title="Hide Info Panel"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => setChatPanelCollapsed(true)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-80 rounded transition-colors"
                title="Collapse Chat"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
              <AlertTriangle size={12} />
              {error}
              {clearError && (
                <button onClick={clearError} className="ml-auto text-red-500 hover:text-red-700">
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-6">
        {messageThread.length > 0 ? (
          <div className="space-y-4">
            {messageThread.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                } ${message.id === selectedMessageId ? 'ring-2 ring-yellow-400' : ''}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <div className="mt-2 text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-lg px-4 py-3 rounded-2xl shadow-sm bg-white border border-gray-200 text-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">
                      <MessageCircle size={16} className="text-green-500" />
                    </div>
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a message to view the conversation thread</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {selectedMessageId && currentMessage && (
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <History size={12} />
            Replying to: {currentMessage?.content.substring(0, 60)}...
          </div>
        )}
      </div>
    </>
  );
};