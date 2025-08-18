import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Components
import { EmptyState } from './components/UI/EmptyState.tsx';
import { ChatPanel } from './components/Chat/ChatPanel.tsx';
import { FlowCanvas } from './components/Flow/FlowCanvas.tsx';
import { ConversationsListPage } from './components/Conversations/ConversationsListPage.tsx';
import { FloatingToolbar } from './components/Layout/FloatingToolbar.tsx';
import { ErrorBoundary } from './components/UI/ErrorBoundary.tsx';

// Hooks
import { useConversations } from './hooks/useConversations.ts';
import { useFlowElements } from './hooks/useFlowElements.ts';
import { useMessageOperations } from './hooks/useMessageOperations.ts';
import { usePanelManager } from './components/Layout/PanelManager.tsx';

// Authentication
import { useAuth } from './hooks/useAuth.ts';

const MUMBAAI: React.FC = () => {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS
  const { user, loading } = useAuth();
  
  // Core state management
  const conversationHook = useConversations([]);
  const panelManager = usePanelManager();
  
  // UI state
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [selectedNodes, setSelectedNodes] = useState(new Set<string>());
  const [bookmarkedNodes, setBookmarkedNodes] = useState(new Set<string>());
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Track if user wants to start (clicked the button)
  const [wantsToStart, setWantsToStart] = useState(false);
  
  // View state management - start with chat if there are conversations, otherwise conversations list
  const [currentView, setCurrentView] = useState<'conversations' | 'chat'>(() => {
    return conversationHook.conversations.length > 0 ? 'chat' : 'conversations';
  });
  
  // Chat view mode state (Combined vs Flow view)
  const [chatViewMode, setChatViewMode] = useState<'combined' | 'flow'>('combined');
  
  // Selected AI model state
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');

  // Flow elements with proper change handling
  const flowElements = useFlowElements(
    conversationHook.currentConversation?.messages || [],
    conversationHook.activeConversation, // Add this line
    selectedMessageId,
    selectedNodes,
    handleNodeClick,
    handleNodeDoubleClick
  );

  // Clear selections when conversation changes
  useEffect(() => {
    setSelectedMessageId('');
    setSelectedNodes(new Set());
  }, [conversationHook.activeConversation]);

  // Message operations
  const messageOps = useMessageOperations({
    activeConversation: conversationHook.activeConversation,
    selectedMessageId,
    selectedNodes,
    addMessage: conversationHook.addMessage,
    findMessage: conversationHook.findMessage,
    getMessageThread: conversationHook.getMessageThread,
    onMessageSent: setSelectedMessageId,
    onClearSelection: () => setSelectedNodes(new Set())
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

  function handleNodeDoubleClick(messageId: string, _event?: React.MouseEvent) {
    if (panelManager.isChatCollapsed) {
      panelManager.controls.setChatPanelCollapsed(false);
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

  const handleLayoutApplied = useCallback((layoutedNodes: any[], _layoutedEdges: any[]) => {
    // Update the flow elements with the new layouted positions
    flowElements.handleNodesChange(
      layoutedNodes.map(node => ({
        type: 'position',
        id: node.id,
        position: node.position
      }))
    );
  }, [flowElements]);

  const handleConversationChange = useCallback((id: string) => {
    // Only change if it's actually a different conversation
    if (id === conversationHook.activeConversation) return;
    
    conversationHook.setActiveConversation(id);
    // Clear selections immediately when changing conversations
    setSelectedMessageId('');
    setSelectedNodes(new Set());
    
    // Set the first message as selected if the conversation has messages
    setTimeout(() => {
      const newConv = conversationHook.conversations.find(c => c.id === id);
      if (newConv && newConv.messages.length > 0) {
        setSelectedMessageId(newConv.messages[0].id);
      }
    }, 50);
  }, [conversationHook]);

  const handleCreateFirstConversation = useCallback(() => {
    // This is called when user clicks "Start Your First Conversation"
    setWantsToStart(true);
    
    // If user is already logged in, just proceed to conversations view
    if (user) {
      setCurrentView('conversations');
      return;
    }
    // If not logged in, the EmptyState will show the auth form
  }, [user]);

  const handleCreateNewConversation = useCallback(() => {
    const newId = conversationHook.createNewConversation();
    // Clear selections for new conversation
    setSelectedMessageId('');
    setSelectedNodes(new Set());
    // Navigate to chat view when creating new conversation
    setCurrentView('chat');
    return newId;
  }, [conversationHook]);

  // Navigation handlers
  const handleNavigateToConversations = useCallback(() => {
    setCurrentView('conversations');
  }, []);

  const handleSelectConversationFromList = useCallback((id: string) => {
    handleConversationChange(id);
    setCurrentView('chat');
  }, [handleConversationChange]);

  const handleConversationNameChange = useCallback((newName: string) => {
    if (conversationHook.activeConversation) {
      conversationHook.renameConversation(conversationHook.activeConversation, newName);
    }
  }, [conversationHook]);


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

  // NOW WE CAN DO EARLY RETURNS AFTER ALL HOOKS ARE DEFINED
  
  // Show loading while checking authentication OR loading conversations
  if (loading || conversationHook.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Loading...' : 'Loading conversations...'}
          </p>
        </div>
      </div>
    );
  }

  // Show landing page only if user is not logged in
  if (!user) {
    return (
      <div className="h-screen overflow-y-auto">
        <EmptyState
          onCreateConversation={handleCreateFirstConversation}
          showAuth={wantsToStart && !user}
        />
      </div>
    );
  }

  // Show the main app interface
  if (currentView === 'conversations') {
    return (
      <>
        <FloatingToolbar
          brandName="MUMBAAI"
          conversationName=""
          onBrandClick={handleNavigateToConversations}
          onConversationNameChange={() => {}} // Not used on conversations page
          showBackButton={false}
          isConversationsPage={true}
        />
        <div style={{ marginTop: '72px', height: 'calc(100vh - 72px)', overflowY: 'auto' }}>
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className="text-red-600 text-6xl mb-4">📝</div>
                  <p className="text-red-700 font-medium text-xl mb-2">Conversations List Error</p>
                  <p className="text-red-600 mb-4">Unable to load your conversations</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            }
          >
            <ConversationsListPage
              conversations={conversationHook.conversations}
              onSelectConversation={handleSelectConversationFromList}
              onCreateConversation={() => {
                handleCreateNewConversation();
                setCurrentView('chat');
              }}
              onDeleteConversation={conversationHook.deleteConversation}
              currentUserId={user?.id || ''}
            />
          </ErrorBoundary>
        </div>
      </>
    );
  }

  return (
    <>
      <FloatingToolbar
        brandName="MUMBAAI"
        conversationName={conversationHook.currentConversation?.name || 'New Conversation'}
        onBrandClick={handleNavigateToConversations}
        onConversationNameChange={handleConversationNameChange}
        showBackButton={true}
        onBackClick={handleNavigateToConversations}
        showNewChatButton={true}
        onNewChat={handleCreateNewConversation}
        showViewToggle={true}
        viewMode={chatViewMode}
        onViewModeChange={setChatViewMode}
      />
      <div className="flex bg-gray-50" style={{ marginTop: '72px', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
      {/* Chat Panel - Only visible in Combined view */}
      {chatViewMode === 'combined' && (
        <ErrorBoundary
          fallback={
            <div className="w-96 bg-red-50 border-r border-red-200 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-red-600 text-4xl mb-2">💬</div>
                <p className="text-red-700 font-medium">Chat Panel Error</p>
                <p className="text-red-600 text-sm">Please refresh to restore chat</p>
              </div>
            </div>
          }
        >
          <ChatPanel
            collapsed={panelManager.isChatCollapsed}
            onToggleCollapse={panelManager.toggleChatPanel}
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
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </ErrorBoundary>
      )}

      {/* Flow Canvas */}
      <ErrorBoundary
        fallback={
          <div className="flex-1 bg-red-50 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-red-600 text-6xl mb-4">🌐</div>
              <p className="text-red-700 font-medium text-xl mb-2">Flow Visualization Error</p>
              <p className="text-red-600">The conversation flow couldn't be displayed</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Refresh to Restore
              </button>
            </div>
          </div>
        }
      >
        <FlowCanvas
          nodes={flowElements.nodes}
          edges={flowElements.edges}
          onNodesChange={flowElements.handleNodesChange}
          onEdgesChange={flowElements.handleEdgesChange}
          chatPanelCollapsed={chatViewMode === 'flow'}
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
          mergeTemplate={messageOps.mergeTemplate}
          onMergeTemplateChange={messageOps.setMergeTemplate}
          isLoading={messageOps.isLoading}
          effectiveMergeCount={messageOps.getEffectiveMergeCount()}
          allMessagesCount={conversationHook.getAllMessages().length}
          conversationName={conversationHook.currentConversation?.name}
          onLayoutApplied={handleLayoutApplied}
        />
      </ErrorBoundary>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <MUMBAAI />
        <Analytics />
        <SpeedInsights />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
};

export default App;