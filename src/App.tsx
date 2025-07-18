import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  ConnectionLineType,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Send, MessageCircle, Maximize2, Minimize2, User, Bot, Sparkles, Play, Pause, RotateCcw, History, GitBranch, Zap, Eye, EyeOff, Filter, Search, Bookmark, Share2, Download, Upload, Settings } from 'lucide-react';
import './reactflow-custom.css';
// Custom Node Component
const MessageNode = ({ data, selected }) => {
  const { message, onNodeClick, onNodeDoubleClick, isMultiSelected, truncateLength = 100 } = data;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onNodeClick?.(message.id, e);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onNodeDoubleClick?.(message.id, e);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isMergedNode = message.mergedFrom && message.mergedFrom.length > 0;
  
  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg border-2 transition-all cursor-pointer hover:shadow-xl min-w-[280px] max-w-[320px] ${
        selected ? 'border-yellow-400 ring-2 ring-yellow-200' : 
        isMultiSelected ? 'border-red-400 ring-2 ring-red-200' : 
        'border-gray-200 hover:border-gray-300'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header */}
      <div className={`p-3 rounded-t-xl ${message.type === 'user' ? 'bg-blue-50' : 'bg-green-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
              {message.type === 'user' ? (
                <User size={12} className="text-white" />
              ) : (
                <Bot size={12} className="text-white" />
              )}
            </div>
            <span className={`text-sm font-semibold ${message.type === 'user' ? 'text-blue-700' : 'text-green-700'}`}>
              {message.type === 'user' ? 'User' : 'Assistant'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-sm text-gray-800 leading-relaxed">
          {truncateText(message.content, truncateLength)}
        </div>
        
        {message.children.length > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
            <GitBranch size={12} />
            <span>{message.children.length} response{message.children.length > 1 ? 's' : ''}</span>
          </div>
        )}
        
        {isMergedNode && (
          <div className="mt-3 flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            <Sparkles size={12} />
            <span>Synthesized from {message.mergedFrom.length} branches</span>
          </div>
        )}
      </div>

      {/* Indicators */}
      {isMultiSelected && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
      
      {isMergedNode && (
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <Sparkles size={12} className="text-white" />
        </div>
      )}
    </div>
  );
};

// Define node types
const nodeTypes = {
  message: MessageNode,
};

const TreeChatApp = () => {
  const [conversations, setConversations] = useState([
    {
      id: 'conv-1',
      name: 'Project X',
      semanticTags: ['web-development', 'project-planning'],
      theme: 'Technical Discussion',
      importance: 0.8,
      clusterGroup: 'development',
      messages: [
        {
          id: 'msg-1',
          type: 'user',
          content: 'Hello, I need help with my project.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          collapsed: false,
          children: [
            {
              id: 'msg-2',
              type: 'assistant',
              content: 'I\'d be happy to help! What kind of project are you working on?',
              timestamp: new Date(Date.now() - 240000).toISOString(),
              collapsed: false,
              children: [
                {
                  id: 'msg-3',
                  type: 'user',
                  content: 'It\'s a web application for task management with real-time collaboration features.',
                  timestamp: new Date(Date.now() - 180000).toISOString(),
                  collapsed: false,
                  children: [
                    {
                      id: 'msg-4',
                      type: 'assistant',
                      content: 'Great! Task management apps are very useful. What features do you want to include? Real-time collaboration is exciting - are you thinking about WebSocket integration?',
                      timestamp: new Date(Date.now() - 120000).toISOString(),
                      collapsed: false,
                      children: []
                    }
                  ]
                },
                {
                  id: 'msg-5',
                  type: 'user',
                  content: 'Actually, it\'s a mobile app instead. I want to focus on React Native.',
                  timestamp: new Date(Date.now() - 150000).toISOString(),
                  collapsed: false,
                  children: [
                    {
                      id: 'msg-6',
                      type: 'assistant',
                      content: 'Mobile apps are exciting! React Native is a great choice. Are you thinking iOS, Android, or cross-platform? What\'s your experience level with React Native?',
                      timestamp: new Date(Date.now() - 60000).toISOString(),
                      collapsed: false,
                      children: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]);

  const [activeConversation, setActiveConversation] = useState('conv-1');
  const [selectedMessageId, setSelectedMessageId] = useState('msg-4');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [isWhiteboardExpanded, setIsWhiteboardExpanded] = useState(false);
  
  // Timeline and animation
  const [timelinePosition, setTimelinePosition] = useState(1.0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, getNodes, getEdges } = useReactFlow();
  
  // UI state
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'user', 'assistant', 'merged'
  const [bookmarkedNodes, setBookmarkedNodes] = useState(new Set());
  const [showTimestamps, setShowTimestamps] = useState(true);

  // Convert conversation messages to React Flow nodes and edges
  const convertToFlowElements = useCallback((messages) => {
    const flowNodes = [];
    const flowEdges = [];
    const horizontalSpacing = 350;
    const verticalSpacing = 200;
    
    const processNode = (message, x, y, level = 0) => {
      // Apply timeline filter
      const messageTime = new Date(message.timestamp).getTime();
      const now = Date.now();
      const oldestTime = Math.min(...getAllMessages(messages).map(m => new Date(m.timestamp).getTime()));
      const cutoffTime = oldestTime + (now - oldestTime) * timelinePosition;
      
      if (timelinePosition < 1.0 && messageTime > cutoffTime) {
        return;
      }

      // Apply search filter
      if (searchTerm && !message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }

      // Apply type filter
      if (filterType !== 'all') {
        if (filterType === 'merged' && (!message.mergedFrom || message.mergedFrom.length === 0)) {
          return;
        }
        if (filterType !== 'merged' && message.type !== filterType) {
          return;
        }
      }

      const isSelected = selectedMessageId === message.id;
      const isMultiSelected = selectedNodes.has(message.id);
      const isBookmarked = bookmarkedNodes.has(message.id);

      flowNodes.push({
        id: message.id,
        type: 'message',
        position: { x, y },
        data: {
          message,
          onNodeClick: handleNodeClick,
          onNodeDoubleClick: handleNodeDoubleClick,
          isMultiSelected,
          truncateLength: isWhiteboardExpanded ? 150 : 100
        },
        selected: isSelected,
        className: `${isBookmarked ? 'bookmarked-node' : ''} ${message.type}-node`,
        style: {
          opacity: timelinePosition < 1.0 && messageTime > cutoffTime ? 0.3 : 1,
        }
      });

      // Process children
      if (message.children && message.children.length > 0) {
        const childrenWidth = (message.children.length - 1) * horizontalSpacing;
        const startX = x - childrenWidth / 2;
        
        message.children.forEach((child, index) => {
          const childX = startX + (index * horizontalSpacing);
          const childY = y + verticalSpacing;
          
          // Create edge
          flowEdges.push({
            id: `${message.id}-${child.id}`,
            source: message.id,
            target: child.id,
            type: 'smoothstep',
            animated: child.mergedFrom && child.mergedFrom.includes(message.id),
            style: {
              stroke: child.mergedFrom && child.mergedFrom.includes(message.id) ? '#a855f7' : '#d1d5db',
              strokeWidth: child.mergedFrom && child.mergedFrom.includes(message.id) ? 3 : 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: child.mergedFrom && child.mergedFrom.includes(message.id) ? '#a855f7' : '#d1d5db',
            }
          });
          
          processNode(child, childX, childY, level + 1);
        });
      }

      // Add merge edges for merged nodes
      if (message.mergedFrom && message.mergedFrom.length > 0) {
        message.mergedFrom.forEach(sourceId => {
          if (sourceId !== message.id) { // Avoid self-loops
            flowEdges.push({
              id: `merge-${sourceId}-${message.id}`,
              source: sourceId,
              target: message.id,
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: '#a855f7',
                strokeWidth: 3,
                strokeDasharray: '5,5',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#a855f7',
              },
              label: '✨ Merge',
              labelStyle: { fontSize: 10, fill: '#a855f7' }
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
  }, [selectedMessageId, selectedNodes, timelinePosition, searchTerm, filterType, bookmarkedNodes, isWhiteboardExpanded]);

  // Update React Flow elements when conversation changes
  useEffect(() => {
    const currentConv = conversations.find(c => c.id === activeConversation);
    if (currentConv && currentConv.messages.length > 0) {
      const { nodes: newNodes, edges: newEdges } = convertToFlowElements(currentConv.messages);
      setNodes(newNodes);
      setEdges(newEdges);
      
      // Auto-fit view after a brief delay
      setTimeout(() => {
        fitView({ padding: 0.1, duration: 500 });
      }, 100);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [activeConversation, conversations, convertToFlowElements, setNodes, setEdges, fitView]);

  // Helper functions
  const getAllMessages = (messages) => {
    let allMessages = [];
    const traverse = (msgs) => {
      msgs.forEach(msg => {
        allMessages.push(msg);
        if (msg.children) traverse(msg.children);
      });
    };
    traverse(messages);
    return allMessages;
  };

  const findMessage = (messages, messageId) => {
    for (const message of messages) {
      if (message.id === messageId) {
        return message;
      }
      const found = findMessage(message.children || [], messageId);
      if (found) return found;
    }
    return null;
  };

  const addMessage = (conversationId, parentMessageId, newMessage) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;
      
      if (!parentMessageId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage]
        };
      }
      
      const addToMessages = (messages) => {
        return messages.map(msg => {
          if (msg.id === parentMessageId) {
            return {
              ...msg,
              children: [...(msg.children || []), newMessage]
            };
          }
          return {
            ...msg,
            children: addToMessages(msg.children || [])
          };
        });
      };

      return {
        ...conv,
        messages: addToMessages(conv.messages)
      };
    }));
  };

  // Event handlers
  const handleNodeClick = (messageId, event) => {
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
  };

  const handleNodeDoubleClick = (messageId, event) => {
    setSelectedMessageId(messageId);
    setSelectedNodes(new Set());
  };

  const toggleBookmark = (messageId) => {
    const newBookmarks = new Set(bookmarkedNodes);
    if (newBookmarks.has(messageId)) {
      newBookmarks.delete(messageId);
    } else {
      newBookmarks.add(messageId);
    }
    setBookmarkedNodes(newBookmarks);
  };

  // Timeline animation
  const startTimelineAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      return;
    }
    
    setIsAnimating(true);
    setTimelinePosition(0);
    
    animationRef.current = setInterval(() => {
      setTimelinePosition(prev => {
        if (prev >= 1.0) {
          setIsAnimating(false);
          clearInterval(animationRef.current);
          return 1.0;
        }
        return prev + 0.02;
      });
    }, 100);
  };

  const resetTimeline = () => {
    setTimelinePosition(1.0);
    setIsAnimating(false);
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
  };

  // Message thread and sending
  const getMessageThread = () => {
    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation || !selectedMessageId) return [];
    
    const getPath = (messages, targetId, path = []) => {
      for (const msg of messages) {
        const newPath = [...path, msg];
        if (msg.id === targetId) {
          return newPath;
        }
        const found = getPath(msg.children || [], targetId, newPath);
        if (found) return found;
      }
      return null;
    };

    const fullPath = getPath(conversation.messages, selectedMessageId) || [];
    
    const selectedMessage = findMessage(conversation.messages, selectedMessageId);
    if (selectedMessage && selectedMessage.isMergeRoot) {
      return [selectedMessage];
    }
    
    const mergeRootIndex = fullPath.findIndex(msg => msg.isMergeRoot);
    if (mergeRootIndex !== -1) {
      return fullPath.slice(mergeRootIndex);
    }
    
    return fullPath;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
      collapsed: false,
      children: []
    };

    addMessage(activeConversation, selectedMessageId, userMessage);
    setSelectedMessageId(userMessage.id);
    
    const userInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const thread = getMessageThread();
      const contextMessages = thread.map(msg => 
        `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      
      const contextPrompt = `Here is our conversation history:\n\n${contextMessages}\n\nHuman: ${userInput}\n\nPlease respond naturally, taking into account the full conversation context above.`;
      
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: contextPrompt }),
      });
    
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }
    
      const data = await apiResponse.json();
      const response = data.response;
          
      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        collapsed: false,
        children: []
      };

      addMessage(activeConversation, userMessage.id, assistantMessage);
      setSelectedMessageId(assistantMessage.id);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        collapsed: false,
        children: []
      };
      addMessage(activeConversation, userMessage.id, errorMessage);
      setSelectedMessageId(errorMessage.id);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = () => {
    const newConv = {
      id: `conv-${Date.now()}`,
      name: `New Chat ${conversations.length + 1}`,
      semanticTags: ['general'],
      theme: 'New Discussion',
      importance: 0.5,
      clusterGroup: 'general',
      messages: []
    };
    setConversations(prev => [...prev, newConv]);
    setActiveConversation(newConv.id);
    setSelectedMessageId(null);
    setSelectedNodes(new Set());
  };

  // Smart merge with AI
  const performIntelligentMerge = async () => {
    const effectiveMergeNodes = Array.from(selectedNodes);
    if (selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      effectiveMergeNodes.push(selectedMessageId);
    }

    if (effectiveMergeNodes.length < 2) return;

    setIsLoading(true);
    try {
      const conv = conversations.find(c => c.id === activeConversation);
      
      const getPathToNode = (messages, targetId, path = []) => {
        for (const msg of messages) {
          const newPath = [...path, msg];
          if (msg.id === targetId) {
            return newPath;
          }
          const found = getPathToNode(msg.children || [], targetId, newPath);
          if (found) return found;
        }
        return null;
      };
      
      const branchContexts = [];
      for (let i = 0; i < effectiveMergeNodes.length; i++) {
        const nodeId = effectiveMergeNodes[i];
        const node = findMessage(conv.messages, nodeId);
        
        if (node) {
          const pathToNode = getPathToNode(conv.messages, nodeId);
          const conversationText = pathToNode ? pathToNode.map(msg => 
            `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
          ).join('\n') : `${node.type === 'user' ? 'Human' : 'Assistant'}: ${node.content}`;
          
          branchContexts.push(`--- Conversation Branch ${i + 1} ---\n${conversationText}`);
        }
      }
      
      const allBranches = branchContexts.join('\n\n');
      
      const firstNodeForHistory = findMessage(conv.messages, effectiveMergeNodes[0]);
      const pathToFirst = firstNodeForHistory ? getPathToNode(conv.messages, effectiveMergeNodes[0]) : [];
      const commonHistory = pathToFirst.slice(0, -1);
      const historyText = commonHistory.length > 0 
        ? commonHistory.map(msg => `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`).join('\n')
        : '';
      
      let mergePrompt = 'You are continuing a conversation. Here is the context:\n\n';
      
      if (historyText) {
        mergePrompt += 'SHARED CONVERSATION HISTORY:\n' + historyText + '\n\n';
      }
      
      mergePrompt += 'DIVERGENT BRANCHES TO MERGE:\n';
      mergePrompt += `I have ${effectiveMergeNodes.length} different conversation branches that diverged from `;
      mergePrompt += historyText ? 'the above conversation' : 'the start';
      mergePrompt += '. Each represents a different direction our conversation took:\n\n';
      mergePrompt += allBranches + '\n\n';
      mergePrompt += 'Please synthesize these different paths into a coherent response that:\n\n';
      mergePrompt += '1. Acknowledges the conversation history and maintains continuity\n';
      mergePrompt += '2. Integrates insights from each branch meaningfully\n';
      mergePrompt += '3. Resolves any contradictions by finding the most coherent perspective\n';
      mergePrompt += '4. Creates a unified direction for continuing our conversation\n';
      mergePrompt += '5. Maintains natural conversational flow\n\n';
      mergePrompt += 'Your response should feel like a natural continuation that acknowledges the different directions we explored and synthesizes them into a coherent next step. Respond as the Assistant continuing our conversation, taking into account all the context and branches above.';

      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: mergePrompt }),
      });
    
      if (!apiResponse.ok) {
          throw new Error('Failed to fetch from merge API');
      }
    
      const data = await apiResponse.json();
      const response = data.response;
        
      const mergedMessage = {
        id: `merged-${Date.now()}`,
        type: 'assistant',
        content: response,
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
  };

  // Export/Import functionality
  const exportConversation = () => {
    const conv = conversations.find(c => c.id === activeConversation);
    if (conv) {
      const dataStr = JSON.stringify(conv, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${conv.name.replace(/\s+/g, '_')}_conversation.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const messageThread = getMessageThread();
  const getCurrentMessage = () => {
    if (!selectedMessageId) return null;
    return findMessage(currentConversation?.messages || [], selectedMessageId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {isWhiteboardExpanded ? (
        // Full whiteboard mode
        <div className="w-full h-screen flex flex-col bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            className="bg-gray-50"
          >
            <Controls showInteractive={false} />
            {showMiniMap && (
              <MiniMap 
                nodeColor={(node) => {
                  if (node.data?.message?.type === 'user') return '#3b82f6';
                  if (node.data?.message?.mergedFrom) return '#a855f7';
                  return '#10b981';
                }}
                className="bg-white border border-gray-200 rounded-lg"
              />
            )}
            <Background variant="dots" gap={20} size={1} />
            
            {/* Top Panel */}
            <Panel position="top-left">
              <div className="flex gap-3">
                <button
                  onClick={() => setIsWhiteboardExpanded(false)}
                  className="p-3 bg-white text-gray-700 hover:bg-gray-100 rounded-xl shadow-lg border border-gray-200 transition-all"
                  title="Exit Whiteboard Mode"
                >
                  <Minimize2 size={20} />
                </button>
              </div>
            </Panel>

            <Panel position="top-center">
              <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
                <button
                  onClick={startTimelineAnimation}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  title={isAnimating ? "Pause Animation" : "Play Timeline Animation"}
                >
                  {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                </button>
                
                <button
                  onClick={resetTimeline}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Reset Timeline"
                >
                  <RotateCcw size={16} />
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Timeline:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={timelinePosition}
                    onChange={(e) => setTimelinePosition(parseFloat(e.target.value))}
                  className="w-32"
                  disabled={isAnimating}
                />
                <span className="text-xs text-gray-500 w-8">
                  {Math.round(timelinePosition * 100)}%
                </span>
              </div>
            </div>
            </Panel>

            <Panel position="top-right">
              <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
                <button
                  onClick={() => setShowMiniMap(!showMiniMap)}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Toggle MiniMap"
                >
                  {showMiniMap ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-xs border-none bg-transparent focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                  <option value="merged">Merged</option>
                </select>
                
                <button
                  onClick={exportConversation}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Export Conversation"
                >
                  <Download size={16} />
                </button>
              </div>
            </Panel>
            
            {/* Merge Controls */}
            <Panel position="bottom-left">
              <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <GitBranch size={14} />
                  <span>Ctrl+click for multi-select • Double-click to focus</span>
                </div>
                
                <div className="text-sm mb-3">
                  <span className="text-blue-600 font-medium">Multi-selected: {selectedNodes.size} nodes</span>
                  {selectedMessageId && selectedNodes.size > 0 && !selectedNodes.has(selectedMessageId) && (
                    <span className="text-green-600 ml-1">+ active node</span>
                  )}
                </div>
                
                {(selectedNodes.size >= 2 || (selectedNodes.size >= 1 && selectedMessageId && !selectedNodes.has(selectedMessageId))) ? (
                  <button
                    onClick={performIntelligentMerge}
                    className="flex items-center gap-2 w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium mb-2"
                    disabled={isLoading}
                  >
                    <Sparkles size={14} />
                    {isLoading ? 'Merging...' : `Merge ${selectedNodes.size + (selectedMessageId && !selectedNodes.has(selectedMessageId) ? 1 : 0)} nodes`}
                  </button>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2 mb-2">
                    Select 2+ nodes to merge
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => fitView({ padding: 0.1, duration: 500 })}
                    className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                  >
                    Fit View
                  </button>
                  <button
                    onClick={() => setSelectedNodes(new Set())}
                    className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </Panel>

            {/* Search Panel */}
            <Panel position="bottom-right">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {selectedMessageId && (
                  <div className="text-xs text-gray-500">
                    Active: {findMessage(currentConversation?.messages || [], selectedMessageId)?.content.substring(0, 30)}...
                  </div>
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>
      ) : (
        // Split view mode: Chat 40% (left) + Whiteboard 60% (right)
        <>
          {/* Chat Interface - 40% */}
          <div className="w-2/5 bg-white border-r border-gray-200 flex flex-col shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Tree Chat AI</h2>
                <div className="flex gap-2">
                  <button
                    onClick={createNewConversation}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="New Conversation"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    onClick={() => setIsWhiteboardExpanded(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Expand Whiteboard"
                  >
                    <Maximize2 size={18} />
                  </button>
                  <button
                    onClick={exportConversation}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Export Conversation"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
              
              <select
                value={activeConversation}
                onChange={(e) => {
                  setActiveConversation(e.target.value);
                  const newConv = conversations.find(c => c.id === e.target.value);
                  if (newConv && newConv.messages.length > 0) {
                    setSelectedMessageId(newConv.messages[0].id);
                  } else {
                    setSelectedMessageId(null);
                  }
                  setSelectedNodes(new Set());
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {conversations.map(conv => (
                  <option key={conv.id} value={conv.id}>{conv.name}</option>
                ))}
              </select>
              
              {currentConversation && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    {currentConversation.theme}
                  </div>
                  <div className="text-xs text-blue-700">
                    Tags: {currentConversation.semanticTags?.join(', ') || 'None'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Messages: {getAllMessages(currentConversation.messages).length} • 
                    Importance: {Math.round((currentConversation.importance || 0) * 100)}%
                  </div>
                </div>
              )}
              
              {/* Merge Controls */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <GitBranch size={14} />
                  <span>Ctrl+click nodes • Double-click to focus chat</span>
                </div>
                
                <div className="text-sm mb-3">
                  <span className="text-blue-600 font-medium">Multi-selected: {selectedNodes.size} nodes</span>
                  {selectedMessageId && selectedNodes.size > 0 && !selectedNodes.has(selectedMessageId) && (
                    <span className="text-green-600 ml-1">+ active node</span>
                  )}
                </div>
                
                {(selectedNodes.size >= 2 || (selectedNodes.size >= 1 && selectedMessageId && !selectedNodes.has(selectedMessageId))) ? (
                  <button
                    onClick={performIntelligentMerge}
                    className="flex items-center gap-2 w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium mb-2"
                    disabled={isLoading}
                  >
                    <Sparkles size={14} />
                    {isLoading ? 'Merging...' : `Smart Merge ${selectedNodes.size + (selectedMessageId && !selectedNodes.has(selectedMessageId) ? 1 : 0)} nodes`}
                  </button>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2 mb-2">
                    Select 2+ nodes to merge conversations
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 border"
                  >
                    <Search size={12} />
                    Clear
                  </button>
                  <button
                    onClick={() => setSelectedNodes(new Set())}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 border"
                  >
                    <Zap size={12} />
                    Clear
                  </button>
                  <button
                    onClick={() => setFilterType('all')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 border"
                  >
                    <Filter size={12} />
                    All
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {messageThread.length > 0 ? (
                <div className="space-y-6">
                  {messageThread.map((message, index) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-lg px-6 py-4 rounded-2xl shadow-sm ${
                        message.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      } ${message.id === selectedMessageId ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
                        
                        <div className="flex items-center gap-2 mb-2">
                          {message.type === 'user' ? (
                            <User size={16} className="opacity-80" />
                          ) : (
                            <Bot size={16} className="opacity-80" />
                          )}
                          <span className="text-sm font-medium opacity-90">
                            {message.type === 'user' ? 'You' : 'Assistant'}
                          </span>
                          <span className="text-xs opacity-60 ml-auto">
                            {formatTimestamp(message.timestamp)}
                          </span>
                          {bookmarkedNodes.has(message.id) && (
                            <Bookmark size={12} className="text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                        
                        {message.children && message.children.length > 0 && (
                          <div className="mt-3 text-xs opacity-70 flex items-center gap-1">
                            <GitBranch size={12} />
                            {message.children.length} response{message.children.length > 1 ? 's' : ''}
                          </div>
                        )}
                        
                        {message.mergedFrom && (
                          <div className="mt-3 text-xs text-purple-600 opacity-90 flex items-center gap-1">
                            <Sparkles size={12} />
                            Synthesized from {message.mergedFrom.length} branches
                            {message.isMergeRoot && " • Conversation starts here"}
                          </div>
                        )}

                        {/* Message Actions */}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => toggleBookmark(message.id)}
                            className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                          >
                            <Bookmark size={10} />
                            {bookmarkedNodes.has(message.id) ? 'Saved' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                            }}
                            className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                          >
                            <Share2 size={10} />
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          <span className="ml-2">
                            {selectedNodes.size >= 2 ? 'Synthesizing branches...' : 'Assistant is thinking...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-32">
                  <MessageCircle size={64} className="mx-auto mb-6 opacity-40" />
                  <h3 className="text-xl font-medium mb-2">Start a new conversation</h3>
                  <p className="text-sm mb-6">Type your message below to begin exploring ideas</p>
                  <p className="text-xs text-gray-400">Double-click nodes in the tree to jump to any point</p>
                </div>
              )}
            </div>
            
            <div className="bg-white border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={selectedMessageId ? "Reply to selected message..." : "Start a new conversation..."}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputText.trim()}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
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
          
          {/* Whiteboard - 60% */}
          <div className="w-3/5 flex flex-col bg-gray-50 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              className="bg-gray-50"
            >
              <Controls showInteractive={false} position="top-left" />
              {showMiniMap && (
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.data?.message?.type === 'user') return '#3b82f6';
                    if (node.data?.message?.mergedFrom) return '#a855f7';
                    return '#10b981';
                  }}
                  className="bg-white border border-gray-200 rounded-lg"
                  position="bottom-left"
                />
              )}
              <Background variant="dots" gap={20} size={1} />
              
              {/* Timeline Controls */}
              <Panel position="top-center">
                <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
                  <button
                    onClick={startTimelineAnimation}
                    className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    title={isAnimating ? "Pause Animation" : "Play Timeline Animation"}
                  >
                    {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  
                  <button
                    onClick={resetTimeline}
                    className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Reset Timeline"
                  >
                    <RotateCcw size={16} />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Timeline:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={timelinePosition}
                      onChange={(e) => setTimelinePosition(parseFloat(e.target.value))}
                      className="w-32"
                      disabled={isAnimating}
                    />
                    <span className="text-xs text-gray-500 w-8">
                      {Math.round(timelinePosition * 100)}%
                    </span>
                  </div>
                </div>
              </Panel>

              {/* View Controls */}
              <Panel position="top-right">
                <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-1">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-24 text-xs border-none bg-transparent focus:outline-none placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-xs border-none bg-transparent focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="user">User</option>
                    <option value="assistant">Assistant</option>
                    <option value="merged">Merged</option>
                  </select>
                  
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <button
                    onClick={() => setShowMiniMap(!showMiniMap)}
                    className="p-1 text-gray-700 hover:bg-gray-100 rounded"
                    title="Toggle MiniMap"
                  >
                    {showMiniMap ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Panel>

              {/* Status Panel */}
              <Panel position="bottom-right">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs">
                  <div className="text-gray-500 mb-1">Quick Info</div>
                  {currentConversation && (
                    <>
                      <div className="text-gray-700 font-medium">
                        {getAllMessages(currentConversation.messages).length} total messages
                      </div>
                      <div className="text-gray-500">
                        {selectedNodes.size} selected • {bookmarkedNodes.size} bookmarked
                      </div>
                    </>
                  )}
                  <div className="text-gray-400 mt-1">
                    💡 Double-click node to focus chat
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </>
      )}
    </div>
  );
};

// Main App Component with React Flow Provider
const App = () => {
  return (
    <ReactFlowProvider>
      <TreeChatApp />
    </ReactFlowProvider>
  );
};

export default App;