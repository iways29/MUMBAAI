// src/components/ConversationPanel.jsx
import React from 'react';
import { Plus, Send, MessageCircle, ChevronLeft, ChevronRight, ChevronUp, User, Bot, Sparkles, History, GitBranch, Edit, X } from 'lucide-react';

const ConversationPanel = ({
  // State props
  chatPanelCollapsed,
  infoPanelCollapsed,
  conversations,
  activeConversation,
  selectedMessageId,
  inputText,
  isLoading,
  isRenamingConversation,
  tempConversationName,
  messageThread,
  selectedNodes,           // ADDED - needed for merge controls
  
  // Setter props
  setChatPanelCollapsed,
  setInfoPanelCollapsed,
  setActiveConversation,
  setInputText,
  setIsRenamingConversation,
  setTempConversationName,
  setSelectedNodes,        // ADDED - needed for merge controls
  
  // Handler props
  createNewConversation,
  sendMessage,
  getCurrentMessage,
  formatTimestamp,
  handleConversationRename,
  performIntelligentMerge, // ADDED - needed for merge controls
  getEffectiveMergeCount,  // ADDED - needed for merge controls
  fitView                  // ADDED - needed for merge controls
}) => {
  const currentConversation = conversations.find(c => c.id === activeConversation);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (tempConversationName.trim()) {
      // Update conversation name logic would go here
      // For now, just close the rename mode
      setIsRenamingConversation(false);
      setTempConversationName('');
    }
  };

  const handleRenameCancel = () => {
    setIsRenamingConversation(false);
    setTempConversationName('');
  };

  if (chatPanelCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center justify-center">
        <button
          onClick={() => setChatPanelCollapsed(false)}
          className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Show Chat"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-2/5 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300 overflow-hidden">
      {/* Collapsible Info Panel */}
      <div className={`${infoPanelCollapsed ? 'h-0' : 'h-auto'} border-b border-gray-200 transition-all duration-300 overflow-hidden`}>
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
                onClick={createNewConversation}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="New Conversation"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => setInfoPanelCollapsed(!infoPanelCollapsed)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={infoPanelCollapsed ? "Show Info Panel" : "Hide Info Panel"}
              >
                <ChevronUp size={18} className={`transform transition-transform ${infoPanelCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setChatPanelCollapsed(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Collapse Chat"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>

          {/* Conversation Selector with Rename */}
          <div className="mb-4">
            {isRenamingConversation ? (
              <form onSubmit={handleRenameSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={tempConversationName}
                  onChange={(e) => setTempConversationName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Conversation name"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleRenameCancel}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                >
                  <X size={14} />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <select
                  value={activeConversation}
                  onChange={(e) => setActiveConversation(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                >
                  {conversations.map(conv => (
                    <option key={conv.id} value={conv.id}>{conv.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setIsRenamingConversation(true);
                    setTempConversationName(currentConversation?.name || '');
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Rename Conversation"
                >
                  <Edit size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Merge Controls - ORIGINAL FUNCTIONALITY */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <GitBranch size={14} />
              <span>Ctrl+click nodes • Double-click to focus</span>
            </div>

            <div className="text-sm mb-3">
              <span className="text-blue-600 font-medium">Selected: {selectedNodes.size} nodes</span>
              {selectedMessageId && selectedNodes.size > 0 && !selectedNodes.has(selectedMessageId) && (
                <span className="text-green-600 ml-1">+ active node</span>
              )}
            </div>

            {getEffectiveMergeCount() >= 2 ? (
              <button
                onClick={performIntelligentMerge}
                className="flex items-center gap-2 w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium mb-2"
                disabled={isLoading}
              >
                <Sparkles size={14} />
                {isLoading ? 'Merging...' : `Smart Merge ${getEffectiveMergeCount()} nodes`}
              </button>
            ) : (
              <div className="text-sm text-gray-500 text-center py-2 mb-2 border border-dashed border-gray-300 rounded">
                Select 2+ nodes to merge
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedNodes(new Set())}
                className="flex-1 px-2 py-1 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 border border-gray-200"
              >
                Clear
              </button>
              <button
                onClick={() => fitView({ padding: 0.3, duration: 800 })}
                className="flex-1 px-2 py-1 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 border border-gray-200"
              >
                Fit View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed Info Panel Header */}
      {infoPanelCollapsed && (
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
                onClick={createNewConversation}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-80 rounded transition-colors"
                title="New Conversation"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setInfoPanelCollapsed(false)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-80 rounded transition-colors"
                title="Show Info Panel"
              >
                <ChevronUp size={14} className="transform rotate-180" />
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
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messageThread.length > 0 ? (
          <div className="space-y-4">
            {messageThread.map((message) => (
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
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>

                  <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{message.content}</div>

                  {message.children && message.children.length > 0 && (
                    <div className="text-xs opacity-70 flex items-center gap-1 mb-1">
                      <GitBranch size={10} />
                      {message.children.length} response{message.children.length > 1 ? 's' : ''}
                    </div>
                  )}

                  {message.mergedFrom && message.mergedFrom.length > 0 && (
                    <div className="text-xs opacity-70 flex items-center gap-1">
                      <Sparkles size={10} />
                      Merged from {message.mergedFrom.length} branches
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs opacity-60">Start a conversation below</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows="3"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
          >
            <Send size={16} />
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {selectedMessageId && getCurrentMessage() && (
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <History size={12} />
            Replying to: {getCurrentMessage()?.content.substring(0, 60)}...
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationPanel;