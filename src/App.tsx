import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronRight } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Hooks
import { useConversations } from './hooks/useConversation.ts';
import { useMessages } from './hooks/useMessages.ts';
import { useAI } from './hooks/useAI.ts';

// Components
import { MessageNode } from './components/MessageNode/index.tsx';
import { ChatPanel } from './components/ChatPanel/index.tsx';
import { FlowCanvas } from './components/FlowCanvas/index.tsx';

const nodeTypes = {
  message: MessageNode,
};

function FlowChatAI() {
  // Hooks
  const conversationHook = useConversations();
  const {
    conversations,
    activeConversation,
    currentConversation,
    isRenamingConversation,
    tempConversationName,
    setActiveConversation,
    createNewConversation,
    updateConversationName,
    startRenaming,
    finishRenaming,
    cancelRenaming,
    setTempConversationName,
    setConversations
  } = conversationHook;

  const messageHook = useMessages(currentConversation?.messages || []);
  const {
    selectedMessageId,
    selectedNodes,
    allMessages,
    messageThread,
    currentMessage,
    effectiveMergeCount,
    setSelectedMessageId,
    toggleNodeSelection,
    clearNodeSelection,
    findMessageById,
    addMessage,
    toggleMessageCollapse,
    getAllMessages
  } = messageHook;

  const { isLoading: isAILoading, error: aiError, sendMessage: sendAIMessage, performIntelligentMerge: aiMerge, clearError } = useAI();

  // Local state
  const [inputText, setInputText] = useState('');
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);

  // Timeline state
  const [timelinePosition, setTimelinePosition] = useState(1.0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // UI state
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Send message function
  const sendMessage = async () => {
    if (!inputText.trim() || isAILoading) return;
    
    const userMessage = inputText;
    setInputText('');

    try {
      // Add user message immediately
      const newMessagesWithUser = addMessage({
        type: 'user',
        content: userMessage,
        collapsed: false,
        children: []
      }, selectedMessageId);

      // Update conversation with user message
      if (currentConversation) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversation.id 
              ? { ...conv, messages: newMessagesWithUser }
              : conv
          )
        );
      }

      // Get AI response
      const aiResponse = await sendAIMessage(userMessage, messageThread);

      // Add AI message
      const newMessagesWithAI = addMessage({
        type: 'assistant',
        content: aiResponse,
        collapsed: false,
        children: []
      }, selectedMessageId);

      // Update conversation with AI message
      if (currentConversation) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversation.id 
              ? { ...conv, messages: newMessagesWithAI }
              : conv
          )
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Node interaction handlers
  const handleNodeClick = useCallback((nodeId, event) => {
    const isMultiSelect = event.metaKey || event.ctrlKey;
    
    if (isMultiSelect) {
      toggleNodeSelection(nodeId, true);
    } else {
      setSelectedMessageId(nodeId);
      clearNodeSelection();
    }
  }, [toggleNodeSelection, setSelectedMessageId, clearNodeSelection]);

  const handleNodeDoubleClick = useCallback((nodeId) => {
    setSelectedMessageId(nodeId);
    clearNodeSelection();
    fitView({ padding: 0.3, duration: 800 });
  }, [setSelectedMessageId, clearNodeSelection, fitView]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
  }, [setEdges]);

  // Intelligent merge function
  const performIntelligentMerge = async () => {
    if (selectedNodes.size < 2) return;

    try {
      const selectedMessages = Array.from(selectedNodes).map(id => 
        findMessageById(id)
      ).filter(Boolean);

      const messageContents = selectedMessages.map(msg => msg.content);
      const mergedContent = await aiMerge(messageContents);

      const mergedMessage = {
        type: 'assistant' as const,
        content: mergedContent,
        collapsed: false,
        children: [],
        mergedFrom: Array.from(selectedNodes)
      };

      const newMessages = addMessage(mergedMessage, selectedMessageId);

      if (currentConversation) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversation.id 
              ? { ...conv, messages: newMessages }
              : conv
          )
        );
      }

      clearNodeSelection();
    } catch (error) {
      console.error('Error performing merge:', error);
    }
  };

  // Timeline animation functions
  const startTimelineAnimation = () => {
    if (isAnimating) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setTimelinePosition(0);

    const animate = () => {
      setTimelinePosition(prev => {
        if (prev >= 1.0) {
          setIsAnimating(false);
          return 1.0;
        }
        const newPos = prev + 0.01;
        animationRef.current = requestAnimationFrame(animate);
        return newPos;
      });
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const resetTimeline = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
    setTimelinePosition(1.0);
  };

  // Generate nodes and edges for React Flow
  const { nodes: flowNodes, edges: flowEdges } = React.useMemo(() => {
    if (!currentConversation || !currentConversation.messages) {
      return { nodes: [], edges: [] };
    }

    const messages = currentConversation.messages;
    const flowNodes = [];
    const flowEdges = [];
    
    const horizontalSpacing = 400;
    const verticalSpacing = 200;
    
    const processNode = (message, x, y, level = 0) => {
      const isSelected = selectedNodes.has(message.id);
      
      // Apply timeline filter
      const messageTime = new Date(message.timestamp).getTime();
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const messageAge = (now - messageTime) / maxAge;
      
      if (messageAge > timelinePosition) {
        return;
      }

      // Apply search filter
      if (searchTerm && !message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }

      // Apply type filter
      if (filterType !== 'all' && message.type !== filterType) {
        return;
      }

      flowNodes.push({
        id: message.id,
        type: 'message',
        position: { x, y },
        data: {
          message,
          onNodeClick: handleNodeClick,
          onNodeDoubleClick: handleNodeDoubleClick,
          isMultiSelected: isSelected,
          selectedMessageId
        },
        style: {
          opacity: message.collapsed ? 0.6 : 1,
        },
        className: message.bookmarked ? 'bookmarked-node' : ''
      });

      // Process children
      if (message.children && message.children.length > 0 && !message.collapsed) {
        const childrenWidth = (message.children.length - 1) * horizontalSpacing;
        const startX = x - childrenWidth / 2;

        message.children.forEach((child, index) => {
          const childX = startX + (index * horizontalSpacing);
          const childY = y + verticalSpacing;

          flowEdges.push({
            id: `${message.id}-${child.id}`,
            source: message.id,
            target: child.id,
            type: 'smoothstep',
            animated: child.mergedFrom && child.mergedFrom.includes(message.id),
            style: {
              stroke: child.mergedFrom && child.mergedFrom.includes(message.id) ? '#a855f7' : '#6b7280',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: child.mergedFrom && child.mergedFrom.includes(message.id) ? '#a855f7' : '#6b7280',
            }
          });

          processNode(child, childX, childY, level + 1);
        });
      }

      // Add merge edges
      if (message.mergedFrom && message.mergedFrom.length > 0) {
        message.mergedFrom.forEach(sourceId => {
          if (sourceId !== message.id) {
            flowEdges.push({
              id: `merge-${sourceId}-${message.id}`,
              source: sourceId,
              target: message.id,
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: '#a855f7',
                strokeWidth: 3,
                strokeDasharray: '8,4',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#a855f7',
              },
              label: '✨ Merge',
              labelStyle: { fontSize: 11, fill: '#a855f7', fontWeight: 'bold' }
            });
          }
        });
      }
    };

    // Start processing from root messages
    const rootWidth = (messages.length - 1) * horizontalSpacing;
    const startX = -rootWidth / 2;

    messages.forEach((message, index) => {
      const x = startX + (index * horizontalSpacing);
      processNode(message, x, 0);
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [selectedMessageId, selectedNodes, timelinePosition, searchTerm, filterType, currentConversation, handleNodeClick, handleNodeDoubleClick]);

  // Update React Flow when conversation changes
  useEffect(() => {
    if (currentConversation && currentConversation.messages.length > 0) {
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [flowNodes, flowEdges, currentConversation, setNodes, setEdges]);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Chat Panel */}
      <div className={`${chatPanelCollapsed ? 'w-0' : 'w-96'} transition-all duration-300 flex flex-col bg-white border-r border-gray-200 shadow-sm`}>
        {!chatPanelCollapsed ? (
          <ChatPanel
            currentConversation={currentConversation}
            messageThread={messageThread}
            selectedMessageId={selectedMessageId}
            currentMessage={currentMessage}
            inputText={inputText}
            isLoading={isAILoading}
            isRenamingConversation={isRenamingConversation}
            tempConversationName={tempConversationName}
            infoPanelCollapsed={infoPanelCollapsed}
            error={aiError}
            createNewConversation={createNewConversation}
            setInputText={setInputText}
            sendMessage={sendMessage}
            setInfoPanelCollapsed={setInfoPanelCollapsed}
            setChatPanelCollapsed={setChatPanelCollapsed}
            clearError={clearError}
          />
        ) : (
          <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center justify-center">
            <button
              onClick={() => setChatPanelCollapsed(false)}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Show Chat"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 flex flex-col bg-gray-50 relative">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          showMiniMap={showMiniMap}
          chatPanelCollapsed={chatPanelCollapsed}
          infoPanelCollapsed={infoPanelCollapsed}
          timelinePosition={timelinePosition}
          isAnimating={isAnimating}
          startTimelineAnimation={startTimelineAnimation}
          resetTimeline={resetTimeline}
          setTimelinePosition={setTimelinePosition}
          fitView={fitView}
          clearNodeSelection={clearNodeSelection}
          effectiveMergeCount={effectiveMergeCount}
          performIntelligentMerge={performIntelligentMerge}
          isLoading={isAILoading}
          messageCount={getAllMessages(currentConversation?.messages || []).length}
          selectedNodesCount={selectedNodes.size}
        />
      </div>
    </div>
  );
}

const App = () => {
  return (
    <ReactFlowProvider>
      <FlowChatAI />
      <Analytics />
      <SpeedInsights />
    </ReactFlowProvider>
  );
};

export default App;