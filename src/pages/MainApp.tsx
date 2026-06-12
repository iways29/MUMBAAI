import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

// Components
import { ChatPanel } from '../components/Chat/ChatPanel.tsx';
import { FlowCanvas } from '../components/Flow/FlowCanvas.tsx';
import { ConversationsListPage } from '../components/Conversations/ConversationsListPage.tsx';
import { FloatingToolbar } from '../components/Layout/FloatingToolbar.tsx';
import { ErrorBoundary } from '../components/UI/ErrorBoundary.tsx';
import UserProfile from './UserProfile.tsx';

// Hooks
import { useConversations } from '../hooks/useConversations.ts';
import { useFlowElements } from '../hooks/useFlowElements.ts';
import { useMessageOperations } from '../hooks/useMessageOperations.ts';
import { usePanelManager } from '../components/Layout/PanelManager.tsx';

interface MainAppProps {
  user: any;
}

export const MainApp: React.FC<MainAppProps> = ({ user }) => {
  // Core state management
  const conversationHook = useConversations([]);
  const panelManager = usePanelManager();

  // UI state
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [selectedNodes, setSelectedNodes] = useState(new Set<string>());
  const [bookmarkedNodes, setBookmarkedNodes] = useState(new Set<string>());
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // View state management - start with chat if there are conversations, otherwise conversations list
  const [currentView, setCurrentView] = useState<'conversations' | 'chat' | 'profile'>(() => {
    return conversationHook.conversations.length > 0 ? 'chat' : 'conversations';
  });

  // Chat view mode state (Combined vs Flow view)
  const [chatViewMode, setChatViewMode] = useState<'combined' | 'flow'>('combined');

  // Selected AI model state
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-20250514');

  // Flow elements with proper change handling
  const flowElements = useFlowElements(
    conversationHook.currentConversation?.messages || [],
    conversationHook.activeConversation,
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
    onClearSelection: () => setSelectedNodes(new Set()),
    selectedModel
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

  const handleNavigateToProfile = useCallback(() => {
    setCurrentView('profile');
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

  // Show loading while loading conversations
  if (conversationHook.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-void">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 mx-auto mb-4" style={{ borderColor: 'var(--color-hairline)', borderTopColor: 'var(--color-plum)' }}></div>
          <p className="text-ash text-sm">Loading conversations…</p>
        </div>
      </div>
    );
  }

  // Show the main app interface
  if (currentView === 'conversations') {
    return (
      <ReactFlowProvider>
        <FloatingToolbar
          brandName="MUMBAAI"
          conversationName=""
          onBrandClick={handleNavigateToConversations}
          onConversationNameChange={() => { }} // Not used on conversations page
          showBackButton={false}
          isConversationsPage={true}
          showProfileButton={true}
          onProfileClick={handleNavigateToProfile}
        />
        <div className="bg-void" style={{ marginTop: '56px', height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-full bg-void">
                <div className="text-center p-8 max-w-sm">
                  <p className="text-bone font-medium text-lg mb-2">Couldn't load your conversations</p>
                  <p className="text-ash text-sm mb-6">Something went wrong on our side. A refresh usually fixes it.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 rounded-pill border border-hairline hover:border-hairline-strong text-bone text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast"
                  >
                    Refresh
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
      </ReactFlowProvider>
    );
  }

  if (currentView === 'profile') {
    return <UserProfile user={user} onBack={handleNavigateToConversations} />;
  }

  return (
    <ReactFlowProvider>
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
      <div className="flex bg-void" style={{ marginTop: '56px', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        {/* Chat Panel - Only visible in Combined view */}
        {chatViewMode === 'combined' && (
          <ErrorBoundary
            fallback={
              <div className="w-96 bg-void border-r border-hairline flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="text-bone font-medium">Chat panel hit an error</p>
                  <p className="text-ash text-sm mt-1">Refresh the page to restore it</p>
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
              isMultiSelectMode={messageOps.getEffectiveMergeCount() > 1}
              onPerformMerge={messageOps.performCustomMerge}
              mergeCount={messageOps.getEffectiveMergeCount()}
              streamingContent={messageOps.streamingContent}
              onStartNewTree={() => {
                setSelectedMessageId('');
                setSelectedNodes(new Set());
              }}
            />
          </ErrorBoundary>
        )}

        {/* Flow Canvas */}
        <ErrorBoundary
          fallback={
            <div className="flex-1 bg-void flex items-center justify-center">
              <div className="text-center p-8 max-w-sm">
                <p className="text-bone font-medium text-lg mb-2">The canvas couldn't render</p>
                <p className="text-ash text-sm mb-6">Your conversation is safe — refresh to restore the view.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 rounded-pill border border-hairline hover:border-hairline-strong text-bone text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast"
                >
                  Refresh
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
            onFitView={() => { }}
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
    </ReactFlowProvider>
  );
};