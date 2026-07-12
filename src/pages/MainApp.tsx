import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

// Components
import { ChatPanel } from '../components/Chat/ChatPanel.tsx';
import { FlowCanvas } from '../components/Flow/FlowCanvas.tsx';
import { ConversationSidebar } from '../components/Conversations/ConversationSidebar.tsx';
import { FloatingToolbar, AppViewMode } from '../components/Layout/FloatingToolbar.tsx';
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
import { generateConversationTitle } from '../utils/titleGenerator.ts';

interface MainAppProps {
  user: any;
}

// Short, time-aware greetings for the centered composer. One per new chat.
const GREETINGS_MORNING = ['Morning. What’s first?', 'What’s on your mind today?', 'Where should we start?'];
const GREETINGS_DAY = ['What’s on your mind?', 'One question. Every direction.', 'What are we exploring today?', 'Ask anything.'];
const GREETINGS_NIGHT = ['Working late? Let’s think.', 'Night thoughts welcome.', 'What’s keeping you up?'];

const pickGreeting = () => {
  const hour = new Date().getHours();
  const pool = hour < 6 ? GREETINGS_NIGHT : hour < 12 ? GREETINGS_MORNING : hour < 22 ? GREETINGS_DAY : GREETINGS_NIGHT;
  return pool[Math.floor(Math.random() * pool.length)];
};

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
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // View mode: traditional chat / split / canvas-only. Empty conversations
  // are always effectively 'chat' — there's no tree to show yet.
  const [viewMode, setViewMode] = useState<AppViewMode>('chat');

  // Selected AI model state
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-20250514');

  // Greeting for the centered composer — re-rolled per conversation change
  const greeting = useMemo(
    () => pickGreeting(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationHook.activeConversation]
  );

  // Flow elements with proper change handling
  const flowElements = useFlowElements(
    conversationHook.currentConversation?.messages || [],
    conversationHook.activeConversation,
    selectedMessageId,
    selectedNodes,
    handleNodeClick,
    handleNodeDoubleClick
  );

  // Clear selections when conversation changes. Skipped exactly once when a
  // send creates the conversation it's sending into — React batches the
  // "conversation changed" and "first message selected" updates into one
  // commit there, and clearing would wipe the fresh selection (leaving the
  // thread empty and the streaming reply invisible).
  const skipSelectionClearRef = useRef(false);
  useEffect(() => {
    if (skipSelectionClearRef.current) {
      skipSelectionClearRef.current = false;
      return;
    }
    setSelectedNodes(new Set());
    // Land on the conversation's latest message (covers row clicks, page
    // refresh, and deletion fallback) so the linear thread never opens empty.
    // "Start new tree" clears selection separately and stays cleared.
    const conv = conversationHook.currentConversation;
    if (conv && conv.messages.length > 0) {
      const all = MessageHelpers.getAllMessages(conv.messages);
      const latest = all.reduce((a, b) =>
        new Date(a.timestamp).getTime() >= new Date(b.timestamp).getTime() ? a : b
      );
      setSelectedMessageId(latest.id);
    } else {
      setSelectedMessageId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ----- View gating & the reveal (ONBOARDING_PRD §4) -----
  const currentMessages = conversationHook.currentConversation?.messages || [];
  const hasMessages = currentMessages.length > 0;
  const hasActiveConversation = !!conversationHook.currentConversation;
  const effectiveView: AppViewMode = hasMessages ? viewMode : 'chat';

  // Animate the canvas in when this conversation's count goes 0 → 1+ in this
  // session (the discovery moment): auto-switch to split with the reveal.
  const [revealAnimate, setRevealAnimate] = useState(false);
  const prevMsgStateRef = useRef<{ id: string; hadMessages: boolean }>({ id: '', hadMessages: false });
  useEffect(() => {
    const prev = prevMsgStateRef.current;
    const id = conversationHook.activeConversation;
    if (prev.id === id && !prev.hadMessages && hasMessages) {
      setRevealAnimate(true);
      setViewMode('split');
    } else if (prev.id !== id) {
      setRevealAnimate(false);
    }
    prevMsgStateRef.current = { id, hadMessages: hasMessages };
  }, [conversationHook.activeConversation, hasMessages]);

  // ----- Auto-title: replace "New Chat N" with a generated title -----
  const titledRef = useRef(new Set<string>());
  useEffect(() => {
    const conv = conversationHook.currentConversation;
    if (!conv || conv.messages.length === 0) return;
    if (!/^New Chat \d+$/.test(conv.name)) return;
    if (titledRef.current.has(conv.id)) return;
    const firstUserMessage = MessageHelpers.getAllMessages(conv.messages).find(m => m.type === 'user');
    if (!firstUserMessage) return;
    titledRef.current.add(conv.id);
    generateConversationTitle(firstUserMessage.content, selectedModel).then(title => {
      conversationHook.renameConversation(conv.id, title);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationHook.currentConversation, selectedModel]);

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

  // Branch from the linear thread: select that message AND make sure the
  // canvas is on screen — the stat/pill is a doorway, not a dead label.
  const handleBranchFromThread = useCallback((messageId: string) => {
    handleNodeClick(messageId);
    setViewMode(prev => (prev === 'chat' ? 'split' : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodes]);

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

    // Conversations with content open straight into split view — the
    // differentiator stays visible; empty ones start as plain chat.
    // (Selection lands on the latest message via the conversation-change
    // effect above.)
    const conv = conversationHook.conversations.find(c => c.id === id);
    setViewMode(conv && conv.messages.length > 0 ? 'split' : 'chat');
  }, [conversationHook]);

  const handleCreateNewConversation = useCallback(async () => {
    const countBefore = conversationHook.conversations.length;
    const newId = await conversationHook.createNewConversation();
    setSelectedMessageId('');
    setSelectedNodes(new Set());
    setViewMode('chat');
    setShowProfile(false);
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
    setViewMode('chat');
    setShowProfile(false);
    if (newId) {
      onboarding.startReplay(newId);
    }
  }, [conversationHook, onboarding]);

  // Brand click: back to a fresh start state (no active conversation)
  const handleBrandClick = useCallback(() => {
    conversationHook.setActiveConversation('');
    setSelectedMessageId('');
    setSelectedNodes(new Set());
    setViewMode('chat');
    setShowProfile(false);
  }, [conversationHook]);

  const handleConversationNameChange = useCallback((newName: string) => {
    if (conversationHook.activeConversation) {
      conversationHook.renameConversation(conversationHook.activeConversation, newName);
    }
  }, [conversationHook]);

  // Send that also creates the conversation when none is active (the
  // centered composer on a fresh start).
  const handleSend = useCallback(async () => {
    let convId = conversationHook.activeConversation;
    if (!convId || !conversationHook.currentConversation) {
      const countBefore = conversationHook.conversations.length;
      const newId = await conversationHook.createNewConversation();
      if (!newId) return;
      convId = newId;
      onboarding.maybeStartFirstRunTour(countBefore, newId);
      // Creation and first send land in one batched commit here: seed the
      // reveal tracker so the 0→1 message transition is still detected
      // (split view + animation), and keep the first-message selection so
      // the streaming reply renders live in the thread.
      prevMsgStateRef.current = { id: newId, hadMessages: false };
      skipSelectionClearRef.current = true;
    }
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

  if (showProfile) {
    return <UserProfile user={user} onBack={() => setShowProfile(false)} />;
  }

  const showChatPane = effectiveView === 'chat' || effectiveView === 'split';
  const showCanvasPane = (effectiveView === 'split' || effectiveView === 'canvas') && hasMessages;

  const chatPanel = (
    <ChatPanel
      fullWidth={effectiveView === 'chat'}
      collapsed={effectiveView === 'split' ? panelManager.isChatCollapsed : false}
      onToggleCollapse={panelManager.toggleChatPanel}
      messageThread={conversationHook.getMessageThread(selectedMessageId)}
      selectedMessageId={selectedMessageId}
      isLoading={messageOps.isLoading}
      inputText={messageOps.inputText}
      onInputChange={messageOps.setInputText}
      onSendMessage={handleSend}
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
      onBranchFrom={handleBranchFromThread}
      isEmpty={!hasMessages}
      greeting={greeting}
    />
  );

  return (
    <ReactFlowProvider>
      <FloatingToolbar
        brandName="MUMBAAI"
        conversationName={hasActiveConversation ? (conversationHook.currentConversation?.name || '') : ''}
        onBrandClick={handleBrandClick}
        onConversationNameChange={handleConversationNameChange}
        showViewToggle={hasMessages}
        viewMode={effectiveView}
        onViewModeChange={setViewMode}
        showProfileButton={true}
        onProfileClick={() => setShowProfile(true)}
        onReplayTutorial={handleReplayTutorial}
      />
      <div className="flex bg-void" style={{ marginTop: '56px', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        {/* Conversations sidebar — always present, collapsible to a rail */}
        <ErrorBoundary
          fallback={
            <div className="w-[320px] border-r border-hairline flex items-center justify-center">
              <p className="text-ash text-sm p-4 text-center">Couldn't load your conversations — refresh to retry.</p>
            </div>
          }
        >
          <ConversationSidebar
            conversations={conversationHook.conversations}
            activeConversationId={conversationHook.activeConversation}
            onSelectConversation={handleConversationChange}
            onCreateConversation={handleCreateNewConversation}
            onDeleteConversation={conversationHook.deleteConversation}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          />
        </ErrorBoundary>

        {/* Chat pane (full-width traditional, or 2/5 beside the canvas) */}
        {showChatPane && (
          <ErrorBoundary
            fallback={
              <div className="flex-1 bg-void flex items-center justify-center">
                <div className="text-center p-8 max-w-sm">
                  <p className="text-bone font-medium text-lg mb-2">Chat hit an error</p>
                  <p className="text-ash text-sm mb-6">Your conversation is safe — refresh to restore it.</p>
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
            {chatPanel}
          </ErrorBoundary>
        )}

        {/* Flow Canvas */}
        {showCanvasPane && (
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
                chatPanelCollapsed={effectiveView === 'canvas'}
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
