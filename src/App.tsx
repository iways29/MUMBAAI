// src/App.tsx - Final Complete Modularized Version
import React, { useState, useEffect, useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Import extracted components
import MessageNode from './components/MessageNode';
import ConversationPanel from './components/ConversationPanel';
import FlowCanvas from './components/FlowCanvas';

// Import custom hooks
import useConversations from './hooks/useConversations';
import useTimelineAnimation from './hooks/useTimelineAnimation';
import useFlowElements from './hooks/useFlowElements';

// Import utilities and constants
import { formatTimestamp, generateMessageId, createMessage } from './utils/messageUtils';
import { 
  NODE_TYPES, 
  FLOW_CONFIG, 
  FILTER_TYPES, 
  ERROR_MESSAGES,
  LIMITS 
} from './constants';

// Define node types
const nodeTypes = {
  [NODE_TYPES.MESSAGE]: MessageNode,
};

const FlowChatAI = () => {
  // Custom hooks - clean separation of concerns
  const {
    conversations,
    activeConversation,
    selectedMessageId,
    currentConversation,
    setActiveConversation,
    setSelectedMessageId,
    createNewConversation,
    renameConversation,
    sendMessage,
    getMessageThread,
    getCurrentMessage,
    getAllMessages,
    findMessage,
    addMessage
  } = useConversations();

  const {
    timelinePosition,
    isAnimating,
    setTimelinePosition,
    startTimelineAnimation,
    resetTimeline,
    isMessageVisible,
    getTimelinePercentage
  } = useTimelineAnimation();

  // UI State - remaining in component since it's UI-specific
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);
  const [isRenamingConversation, setIsRenamingConversation] = useState(false);
  const [tempConversationName, setTempConversationName] = useState('');
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(FILTER_TYPES.ALL);
  const [bookmarkedNodes, setBookmarkedNodes] = useState(new Set());

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Event handlers
  const handleNodeClick = useCallback((messageId, event) => {
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
  }, [selectedNodes, setSelectedMessageId]);

  const handleNodeDoubleClick = useCallback((messageId, event) => {
    if (chatPanelCollapsed) {
      setChatPanelCollapsed(false);
      setSelectedMessageId(messageId);
      setSelectedNodes(new Set());
      setTimeout(() => {
        setSelectedMessageId(messageId);
      }, 100);
    } else {
      setSelectedMessageId(messageId);
      setSelectedNodes(new Set());
    }
  }, [chatPanelCollapsed, setSelectedMessageId]);

  // Flow elements hook
  const { convertToFlowElements, getFlowStats } = useFlowElements(
    selectedMessageId,
    selectedNodes,
    handleNodeClick,
    handleNodeDoubleClick,
    timelinePosition,
    searchTerm,
    filterType,
    isMessageVisible
  );

  // Utility functions
  const getEffectiveMergeCount = useCallback(() => {
    let count = selectedNodes.size;
    if (selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      count += 1;
    }
    return count;
  }, [selectedNodes, selectedMessageId]);

  const performIntelligentMerge = useCallback(async () => {
    const effectiveMergeNodes = Array.from(selectedNodes);
    if (selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      effectiveMergeNodes.push(selectedMessageId);
    }

    if (effectiveMergeNodes.length < 2) return;

    setIsLoading(true);
    try {
      const conv = conversations.find(c => c.id === activeConversation);

      // Get the selected messages content for merging - ORIGINAL IMPLEMENTATION
      const selectedMessages = effectiveMergeNodes.map(nodeId => {
        const message = findMessage(conv.messages, nodeId);
        return message ? `${message.type === 'user' ? 'Human' : 'Assistant'}: ${message.content}` : '';
      }).filter(Boolean);

      const mergePrompt = `Please analyze and synthesize these different conversation branches into a unified response that captures the key insights from each path:

      ${selectedMessages.join('\n\n')}

      Create a comprehensive response that merges the best elements from these different directions while maintaining coherence and adding new insights where appropriate.`;

      // Call Gemini API for merge - YOUR ORIGINAL IMPLEMENTATION
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: mergePrompt
        })
      });

      if (!response.ok) {
        throw new Error(`Merge API request failed: ${response.status}`);
      }

      const data = await response.json();
      const mergedContent = data.response;

      const mergedMessage = {
        id: `merged-${Date.now()}`,
        type: 'assistant',
        content: mergedContent, // Now using real AI synthesis
        timestamp: new Date().toISOString(),
        collapsed: false,
        mergedFrom: effectiveMergeNodes,
        isMergeRoot: true,
        children: []
      };

      const parentNode = effectiveMergeNodes.map(id => findMessage(conv.messages, id))[0];

      if (parentNode) {
        addMessage(activeConversation, parentNode.id, mergedMessage);
        setSelectedMessageId(mergedMessage.id);
        setSelectedNodes(new Set());
      }

    } catch (error) {
      console.error('Intelligent merge failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedNodes,
    selectedMessageId,
    conversations,
    activeConversation,
    findMessage,
    addMessage,
    setSelectedMessageId
  ]);

  // Enhanced sendMessage wrapper
  const handleSendMessage = useCallback(async () => {
    if (inputText.length > LIMITS.MAX_MESSAGE_LENGTH) {
      console.warn(`Message exceeds maximum length of ${LIMITS.MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    await sendMessage(inputText, setInputText, setIsLoading);
  }, [sendMessage, inputText]);

  // Enhanced conversation rename handler
  const handleConversationRename = useCallback((newName) => {
    if (newName.trim()) {
      if (newName.length > LIMITS.MAX_CONVERSATION_NAME_LENGTH) {
        console.warn(`Conversation name exceeds maximum length of ${LIMITS.MAX_CONVERSATION_NAME_LENGTH} characters.`);
        return;
      }
      renameConversation(activeConversation, newName.trim());
    }
    setIsRenamingConversation(false);
    setTempConversationName('');
  }, [renameConversation, activeConversation]);

  // Enhanced conversation creation
  const handleCreateNewConversation = useCallback(() => {
    if (conversations.length >= LIMITS.MAX_CONVERSATIONS) {
      console.warn(`Maximum number of conversations (${LIMITS.MAX_CONVERSATIONS}) reached.`);
      return;
    }
    createNewConversation();
  }, [createNewConversation, conversations.length]);

  // Update React Flow elements when conversation changes
  useEffect(() => {
    if (currentConversation && currentConversation.messages.length > 0) {
      const { nodes: newNodes, edges: newEdges } = convertToFlowElements(currentConversation.messages);
      setNodes(newNodes);
      setEdges(newEdges);

      // Auto-fit view after a brief delay
      setTimeout(() => {
        fitView({ 
          padding: FLOW_CONFIG.FIT_VIEW_PADDING, 
          duration: FLOW_CONFIG.FIT_VIEW_DURATION 
        });
      }, 100);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [currentConversation, convertToFlowElements, setNodes, setEdges, fitView]);

  // Enhanced fitView function
  const handleFitView = useCallback(() => {
    fitView({ 
      padding: FLOW_CONFIG.FIT_VIEW_PADDING, 
      duration: FLOW_CONFIG.FIT_VIEW_DURATION 
    });
  }, [fitView]);

  // Computed values
  const messageThread = getMessageThread();
  const flowStats = currentConversation ? getFlowStats(currentConversation.messages) : null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation Panel */}
      <ConversationPanel
        // State props
        chatPanelCollapsed={chatPanelCollapsed}
        infoPanelCollapsed={infoPanelCollapsed}
        conversations={conversations}
        activeConversation={activeConversation}
        selectedMessageId={selectedMessageId}
        inputText={inputText}
        isLoading={isLoading}
        isRenamingConversation={isRenamingConversation}
        tempConversationName={tempConversationName}
        messageThread={messageThread}
        selectedNodes={selectedNodes}
        
        // Setter props
        setChatPanelCollapsed={setChatPanelCollapsed}
        setInfoPanelCollapsed={setInfoPanelCollapsed}
        setActiveConversation={setActiveConversation}
        setInputText={setInputText}
        setIsRenamingConversation={setIsRenamingConversation}
        setTempConversationName={setTempConversationName}
        setSelectedNodes={setSelectedNodes}
        
        // Handler props
        createNewConversation={handleCreateNewConversation}
        sendMessage={handleSendMessage}
        getCurrentMessage={getCurrentMessage}
        formatTimestamp={formatTimestamp}
        handleConversationRename={handleConversationRename}
        performIntelligentMerge={performIntelligentMerge}
        getEffectiveMergeCount={getEffectiveMergeCount}
        fitView={handleFitView}
      />

      {/* Flow Canvas */}
      <FlowCanvas
        // React Flow props
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        
        // State props
        chatPanelCollapsed={chatPanelCollapsed}
        showMiniMap={showMiniMap}
        searchTerm={searchTerm}
        filterType={filterType}
        timelinePosition={timelinePosition}
        isAnimating={isAnimating}
        selectedNodes={selectedNodes}
        selectedMessageId={selectedMessageId}
        isLoading={isLoading}
        currentConversation={currentConversation}
        
        // Setter props
        setShowMiniMap={setShowMiniMap}
        setSearchTerm={setSearchTerm}
        setFilterType={setFilterType}
        setTimelinePosition={setTimelinePosition}
        setSelectedNodes={setSelectedNodes}
        
        // Handler props
        startTimelineAnimation={startTimelineAnimation}
        resetTimeline={resetTimeline}
        performIntelligentMerge={performIntelligentMerge}
        fitView={handleFitView}
        getAllMessages={getAllMessages}
        getEffectiveMergeCount={getEffectiveMergeCount}
        
        // Stats and utilities
        flowStats={flowStats}
        getTimelinePercentage={getTimelinePercentage}
      />
    </div>
  );
};

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