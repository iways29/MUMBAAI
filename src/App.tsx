import React, { useState, useCallback, useRef } from 'react';
import { ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Components
import { EmptyState } from './components/UI/EmptyState.tsx';
import { ChatPanel } from './components/Chat/ChatPanel.tsx';
import { FlowCanvas } from './components/Flow/FlowCanvas.tsx';

// Hooks
import { useConversations } from './hooks/useConversations.ts';
import { useFlowElements } from './hooks/useFlowElements.ts';
import { useMessageOperations } from './hooks/useMessageOperations.ts';
import { usePanelManager } from './components/Layout/PanelManager.tsx';

const FlowChatAI: React.FC = () => {
  // Core state management
  const conversationHook = useConversations([]);
  const panelManager = usePanelManager();
  
  // UI state
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [selectedNodes, setSelectedNodes] = useState(new Set<string>());
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [bookmarkedNodes, setBookmarkedNodes] = useState(new Set<string>());
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Flow elements with proper change handling
  const flowElements = useFlowElements(
    conversationHook.currentConversation?.messages || [],
    selectedMessageId,
    selectedNodes,
    handleNodeClick,
    handleNodeDoubleClick
  );

  // Message operations
  const messageOps = useMessageOperations({
    activeConversation: conversationHook.activeConversation,
    selectedMessageId,
    selectedNodes,
    addMessage: conversationHook.addMessage,
    findMessage: conversationHook.findMessage,
    getMessageThread: conversationHook.getMessageThread,
    onMessageSent: setSelectedMessageId
  });

  // Event handlers
  function handleNodeClick(messageId: string, event?: React.MouseEvent) {
    if (event?.ctrlKey || event?.metaKey) {
      const newSelected = new Set(selectedNodes);
      if (newSelected.has(messageId)) {
        newSelected.delete(messageId);
      } else {
        newSelected.add(messageId);
      }
      setSelectedNodes(newSelected);
    } else {
      setSelectedMessageId(messageId);
      setSelectedNodes(new Set());
    }
  }

  function handleNodeDoubleClick(messageId: string, event?: React.MouseEvent) {
    if (panelManager.isChatCollapsed) {
      panelManager.setChatPanelCollapsed(false);
      setSelectedMessageId(messageId);
      setSelectedNodes(new Set());
      setTimeout(() => {
        setSelectedMessageId(messageId);
      }, 100);
    } else {
      setSelectedMessageId(messageId);
      setSelectedNodes(new Set());
    }
  }

  const handleConversationChange = useCallback((id: string) => {
    conversationHook.setActiveConversation(id);
    const newConv = conversationHook.conversations.find(c => c.id === id);
    if (newConv && newConv.messages.length > 0) {
      setSelectedMessageId(newConv.messages[0].id);
    } else {
      setSelectedMessageId('');
    }
    setSelectedNodes(new Set());
  }, [conversationHook]);

  const handleCreateFirstConversation = useCallback(() => {
    const newId = conversationHook.createNewConversation();
    setSelectedMessageId('');
    setSelectedNodes(new Set());
  }, [conversationHook]);

  const handleStartRenaming = useCallback(() => {
    const currentConv = conversationHook.currentConversation;
    if (currentConv) {
      panelManager.startRenamingConversation(currentConv.name);
    }
  }, [conversationHook.currentConversation, panelManager]);

  const handleSaveRename = useCallback(() => {
    const newName = panelManager.controls.saveConversationName();
    if (newName && conversationHook.activeConversation) {
      conversationHook.renameConversation(conversationHook.activeConversation, newName);
    }
  }, [panelManager, conversationHook]);

  // Timeline animation
  const startTimelineAnimation = useCallback(() => {
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      return;
    }

    setIsAnimating(true);
    flowElements.setTimelinePosition(0);

    animationRef.current = setInterval(() => {
      flowElements.setTimelinePosition(prev => {
        if (prev >= 1.0) {
          setIsAnimating(false);
          if (animationRef.current) {
            clearInterval(animationRef.current);
          }
          return 1.0;
        }
        return prev + 0.02;
      });
    }, 100);
  }, [isAnimating, flowElements]);

  const resetTimeline = useCallback(() => {
    flowElements.setTimelinePosition(1.0);
    setIsAnimating(false);
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
  }, [flowElements]);

  // Show empty state if no conversations
  if (conversationHook.conversations.length === 0) {
    return (
      <EmptyState
        onCreateConversation={handleCreateFirstConversation}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 app-main-container">
      {/* Chat Panel */}
      <ChatPanel
        collapsed={panelManager.isChatCollapsed}
        onToggleCollapse={panelManager.toggleChatPanel}
        infoPanelCollapsed={panelManager.isInfoCollapsed}
        onToggleInfoPanel={panelManager.toggleInfoPanel}
        messageThread={conversationHook.getMessageThread(selectedMessageId)}
        selectedMessageId={selectedMessageId}
        isLoading={messageOps.isLoading}
        inputText={messageOps.inputText}
        onInputChange={messageOps.setInputText}
        onSendMessage={messageOps.sendMessage}
        canSendMessage={messageOps.canSendMessage}
        currentMessage={messageOps.getCurrentMessage()}
        bookmarkedNodes={bookmarkedNodes}
        onToggleBookmark={(nodeId) => {
          const newBookmarks = new Set(bookmarkedNodes);
          if (newBookmarks.has(nodeId)) {
            newBookmarks.delete(nodeId);
          } else {
            newBookmarks.add(nodeId);
          }
          setBookmarkedNodes(newBookmarks);
        }}
        conversations={conversationHook.conversations}
        activeConversation={conversationHook.activeConversation}
        onConversationChange={handleConversationChange}
        onCreateConversation={conversationHook.createNewConversation}
        selectedNodes={selectedNodes}
        canMerge={messageOps.canMerge()}
        onPerformMerge={messageOps.performIntelligentMerge}
        effectiveMergeCount={messageOps.getEffectiveMergeCount()}
        onClearSelection={() => setSelectedNodes(new Set())}
        onFitView={() => {}} // Will be handled by FlowCanvas
        isRenamingConversation={panelManager.isRenaming}
        tempConversationName={panelManager.tempName}
        onStartRenaming={handleStartRenaming}
        onSaveRename={handleSaveRename}
        onCancelRename={panelManager.controls.cancelRenamingConversation}
        onTempNameChange={panelManager.setTempConversationName}
      />

      {/* Flow Canvas */}
      <FlowCanvas
        nodes={flowElements.nodes}
        edges={flowElements.edges}
        onNodesChange={flowElements.handleNodesChange}
        onEdgesChange={flowElements.handleEdgesChange}
        showMiniMap={showMiniMap}
        chatPanelCollapsed={panelManager.isChatCollapsed}
        selectedNodes={selectedNodes}
        onClearSelection={() => setSelectedNodes(new Set())}
        onFitView={() => {}}
        searchTerm={flowElements.searchTerm}
        onSearchChange={flowElements.setSearchTerm}
        filterType={flowElements.filterType}
        onFilterChange={flowElements.setFilterType}
        timelinePosition={flowElements.timelinePosition}
        onTimelineChange={flowElements.setTimelinePosition}
        isAnimating={isAnimating}
        onStartAnimation={startTimelineAnimation}
        onResetTimeline={resetTimeline}
        canMerge={messageOps.canMerge()}
        onPerformMerge={messageOps.performIntelligentMerge}
        isLoading={messageOps.isLoading}
        effectiveMergeCount={messageOps.getEffectiveMergeCount()}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        allMessagesCount={conversationHook.getAllMessages().length}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowChatAI />
      <Analytics />
      <SpeedInsights />
    </ReactFlowProvider>
  );
};

export default App;