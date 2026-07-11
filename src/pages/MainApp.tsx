import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

// Components
import { ChatPanel } from '../components/Chat/ChatPanel.tsx';
import { FlowCanvas } from '../components/Flow/FlowCanvas.tsx';
import { ConversationSidebar } from '../components/Conversations/ConversationSidebar.tsx';
import { FloatingToolbar } from '../components/Layout/FloatingToolbar.tsx';
import { ErrorBoundary } from '../components/UI/ErrorBoundary.tsx';
import { OnboardingTour } from '../components/Onboarding/OnboardingTour.tsx';
import UserProfile from './UserProfile.tsx';

// Hooks
import { useConversations } from '../hooks/useConversations.ts';
import { useFlowElements } from '../hooks/useFlowElements.ts';
import { useMessageOperations } from '../hooks/useMessageOperations.ts';
import { useOnboarding } from '../hooks/useOnboarding.ts';
import { usePanelManager } from '../components/Layout/PanelManager.tsx';

// Helpers
import { MessageHelpers } from '../utils/messageHelpers.ts';

interface MainAppProps {
  user: any;
}

export const MainApp: React.FC<MainAppProps> = ({ user }) => {
  // Core state management
  const conversationHook = useConversations([]);
  const panelManager = usePanelManager();
  const onboarding = useOnboarding(user);

  // UI state
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [selectedNodes, setSelectedNodes] = useState(new Set<string>());
  const [bookmarkedNodes, setBookmarkedNodes] = useState(new Set<string>());
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTourClosing, setShowTourClosing] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // View state — 'home' is the sidebar + chat shell (the default screen),
  // 'chat' is the focused conversation view, 'profile' the account page.
  const [currentView, setCurrentView] = useState<'home' | 'chat' | 'profile'>('home');

  // Chat view mode state (panel+canvas vs canvas only)
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

  // ----- The reveal: single pane → split (ONBOARDING_PRD §4) -----
  const currentMessages = conversationHook.currentConversation?.messages || [];
  const hasMessages = currentMessages.length > 0;
  // Animate the canvas in only when this conversation's count goes 0 → 1+ in
  // this session; conversations opened with messages skip the animation.
  const [revealAnimate, setRevealAnimate] = useState(false);
  const prevMsgStateRef = useRef<{ id: string; hadMessages: boolean }>({ id: '', hadMessages: false });
  useEffect(() => {
    const prev = prevMsgStateRef.current;
    const id = conversationHook.activeConversation;
    if (prev.id === id && !prev.hadMessages && hasMessages) {
      setRevealAnimate(true);
    } else if (prev.id !== id) {
      setRevealAnimate(false);
    }
    prevMsgStateRef.current = { id, hadMessages: hasMessages };
  }, [conversationHook.activeConversation, hasMessages]);

  // ----- Onboarding: grandfather pre-existing accounts once loaded -----
  const grandfatheredRef = useRef(false);
  useEffect(() => {
    if (!conversationHook.loading && !grandfatheredRef.current) {
      grandfatheredRef.current = true;
      onboarding.grandfatherIfExistingUser(conversationHook.conversations.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationHook.loading]);

  // ----- Onboarding: step completion watchers (ONBOARDING_PRD §5) -----
  const tourIsHere =
    onboarding.isActive && conversationHook.activeConversation === onboarding.tourConversationId;
  const allTourMessages = tourIsHere ? MessageHelpers.getAllMessages(currentMessages) : [];
  const assistantCount = allTourMessages.filter(m => m.type === 'assistant' && !m.isMergeRoot).length;
  const hasMergeRoot = allTourMessages.some(m => m.isMergeRoot);
  const effectiveMergeCount = messageOps.getEffectiveMergeCount();

  useEffect(() => {
    if (!tourIsHere) return;
    if (onboarding.step === 1 && assistantCount >= 1) {
      onboarding.advance();
    } else if (onboarding.step === 3 && assistantCount >= 2) {
      onboarding.advance();
    } else if (onboarding.step === 4 && effectiveMergeCount >= 2) {
      onboarding.advance();
    } else if (onboarding.step === 5 && hasMergeRoot) {
      setShowTourClosing(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourIsHere, onboarding.step, assistantCount, effectiveMergeCount, hasMergeRoot]);

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
    flowElements.handleNodesChange(
      layoutedNodes.map(node => ({
        type: 'position',
        id: node.id,
        position: node.position
      }))
    );
  }, [flowElements]);

  const handleConversationChange = useCallback((id: string) => {
    if (id === conversationHook.activeConversation) return;

    conversationHook.setActiveConversation(id);
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

  const handleCreateNewConversation = useCallback(async () => {
    const countBefore = conversationHook.conversations.length;
    const newId = await conversationHook.createNewConversation();
    setSelectedMessageId('');
    setSelectedNodes(new Set());
    setCurrentView('chat');
    // First-ever conversation on a fresh account → auto-start the tour
    if (newId) {
      onboarding.maybeStartFirstRunTour(countBefore, newId);
    }
    return newId;
  }, [conversationHook, onboarding]);

  // Explicit "show me that demo again" — always a fresh conversation,
  // never touches the once-per-account flag (ONBOARDING_PRD §6).
  const handleReplayTutorial = useCallback(async () => {
    const newId = await conversationHook.createNewConversation();
    setSelectedMessageId('');
    setSelectedNodes(new Set());
    setShowTourClosing(false);
    setCurrentView('chat');
    if (newId) {
      onboarding.startReplay(newId);
    }
  }, [conversationHook, onboarding]);

  // Navigation handlers
  const handleNavigateToHome = useCallback(() => {
    setCurrentView('home');
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

  // Send from the home composer: create a conversation on the fly when none
  // is active, then hand off to the focused chat view where the canvas
  // reveal will fire after the first exchange.
  const handleHomeSend = useCallback(async () => {
    let convId = conversationHook.activeConversation;
    if (!convId || !conversationHook.currentConversation) {
      const countBefore = conversationHook.conversations.length;
      const newId = await conversationHook.createNewConversation();
      if (!newId) return;
      convId = newId;
      if (newId) {
        onboarding.maybeStartFirstRunTour(countBefore, newId);
      }
    }
    setCurrentView('chat');
    messageOps.sendMessage(convId);
  }, [conversationHook, messageOps, onboarding]);

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

  if (currentView === 'profile') {
    return <UserProfile user={user} onBack={handleNavigateToHome} />;
  }

  // ----- Home shell: sidebar + full-width linear chat (ONBOARDING_PRD §3) -----
  if (currentView === 'home') {
    return (
      <ReactFlowProvider>
        <FloatingToolbar
          brandName="MUMBAAI"
          conversationName=""
          onBrandClick={handleNavigateToHome}
          onConversationNameChange={() => { }}
          showBackButton={false}
          isConversationsPage={true}
          showProfileButton={true}
          onProfileClick={handleNavigateToProfile}
          onReplayTutorial={handleReplayTutorial}
        />
        <div className="flex bg-void" style={{ marginTop: '56px', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          <ErrorBoundary
            fallback={
              <div className="w-[280px] border-r border-hairline flex items-center justify-center">
                <p className="text-ash text-sm p-4 text-center">Couldn't load your conversations — refresh to retry.</p>
              </div>
            }
          >
            <ConversationSidebar
              conversations={conversationHook.conversations}
              activeConversationId={conversationHook.activeConversation}
              onSelectConversation={handleSelectConversationFromList}
              onCreateConversation={handleCreateNewConversation}
              onDeleteConversation={conversationHook.deleteConversation}
            />
          </ErrorBoundary>

          {/* Main pane: a plain, familiar chat surface — no second half until
              there's something to show in it */}
          <ErrorBoundary
            fallback={
              <div className="flex-1 bg-void flex items-center justify-center">
                <div className="text-center p-8 max-w-sm">
                  <p className="text-bone font-medium text-lg mb-2">Something went wrong</p>
                  <p className="text-ash text-sm mb-6">A refresh usually fixes it.</p>
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
            <ChatPanel
              fullWidth
              collapsed={false}
              onToggleCollapse={() => { }}
              messageThread={conversationHook.getMessageThread(selectedMessageId)}
              selectedMessageId={selectedMessageId}
              isLoading={messageOps.isLoading}
              inputText={messageOps.inputText}
              onInputChange={messageOps.setInputText}
              onSendMessage={handleHomeSend}
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
              streamingContent={messageOps.streamingContent}
              onBranchFrom={handleNodeClick}
            />
          </ErrorBoundary>
        </div>
      </ReactFlowProvider>
    );
  }

  // ----- Focused conversation view -----
  const showCanvas = hasMessages || chatViewMode === 'flow';
  const showPanel = chatViewMode === 'combined';

  return (
    <ReactFlowProvider>
      <FloatingToolbar
        brandName="MUMBAAI"
        conversationName={conversationHook.currentConversation?.name || 'New Conversation'}
        onBrandClick={handleNavigateToHome}
        onConversationNameChange={handleConversationNameChange}
        showBackButton={true}
        onBackClick={handleNavigateToHome}
        showNewChatButton={true}
        onNewChat={handleCreateNewConversation}
        showViewToggle={true}
        viewMode={chatViewMode}
        onViewModeChange={setChatViewMode}
        onReplayTutorial={handleReplayTutorial}
      />
      <div className="flex bg-void" style={{ marginTop: '56px', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        {/* Chat Panel — full width until the first exchange completes */}
        {showPanel && (
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
              fullWidth={!hasMessages}
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
              onBranchFrom={handleNodeClick}
            />
          </ErrorBoundary>
        )}

        {/* Flow Canvas — mounts only once there's a tree to show */}
        {showCanvas && (
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
            <div className={`flex-1 flex min-w-0 ${revealAnimate ? 'canvas-reveal' : ''}`}>
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
            </div>
          </ErrorBoundary>
        )}
      </div>

      {/* Guided tour callouts */}
      {tourIsHere && (
        <OnboardingTour
          step={onboarding.step}
          showClosing={showTourClosing}
          onAdvance={onboarding.advance}
          onSkip={() => {
            setShowTourClosing(false);
            onboarding.skip();
          }}
          onFinish={() => {
            setShowTourClosing(false);
            onboarding.finish();
          }}
        />
      )}
    </ReactFlowProvider>
  );
};
