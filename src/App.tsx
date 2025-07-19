import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
  MarkerType,
  Handle,
  Position,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Send, MessageCircle, ChevronLeft, ChevronRight, ChevronUp, User, Bot, Sparkles, Play, Pause, RotateCcw, History, GitBranch, Zap, Eye, EyeOff, Search, Bookmark, Share2, X, Edit } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Custom Node Component
const MessageNode = ({ data, selected }) => {
  const { message, onNodeClick, onNodeDoubleClick, isMultiSelected } = data;

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

  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isMergedNode = message.mergedFrom && message.mergedFrom.length > 0;

  return (
    <div
      className={`relative bg-white rounded-xl shadow-md border-2 transition-all cursor-pointer hover:shadow-lg min-w-[300px] max-w-[350px] ${
        selected ? 'border-yellow-400 ring-2 ring-yellow-200' :
        isMultiSelected ? 'border-red-400 ring-2 ring-red-200' :
        'border-gray-200 hover:border-gray-300'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      {/* Header */}
      <div className={`p-4 rounded-t-xl border-b ${message.type === 'user' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
              {message.type === 'user' ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-white" />
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
        <div className="text-sm text-gray-800 leading-relaxed mb-3">
          {truncateText(message.content)}
        </div>

        {message.children && message.children.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            <GitBranch size={12} />
            <span>{message.children.length} response{message.children.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {isMergedNode && (
          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-2">
            <Sparkles size={12} />
            <span>Merged from {message.mergedFrom.length} branches</span>
          </div>
        )}
      </div>

      {/* Indicators */}
      {isMultiSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}

      {isMergedNode && (
        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
          <Sparkles size={14} className="text-white" />
        </div>
      )}
    </div>
  );
};

// Define node types
const nodeTypes = {
  message: MessageNode,
};

const FlowChatAI = () => {
  const [conversations, setConversations] = useState([
    {
      id: 'conv-1',
      name: 'Project X',
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
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);
  const [isRenamingConversation, setIsRenamingConversation] = useState(false);
  const [tempConversationName, setTempConversationName] = useState('');

  // Timeline and animation
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
  const [bookmarkedNodes, setBookmarkedNodes] = useState(new Set());
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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

  // Convert conversation messages to React Flow nodes and edges
  const convertToFlowElements = useCallback((messages) => {
    const flowNodes = [];
    const flowEdges = [];
    const horizontalSpacing = 400;
    const verticalSpacing = 250;

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

      flowNodes.push({
        id: message.id,
        type: 'message',
        position: { x, y },
        data: {
          message,
          onNodeClick: handleNodeClick,
          onNodeDoubleClick: handleNodeDoubleClick,
          isMultiSelected,
        },
        selected: isSelected,
        draggable: true,
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

      // Add merge edges for merged nodes
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
  }, [selectedMessageId, selectedNodes, timelinePosition, searchTerm, filterType]);

  // Update React Flow elements when conversation changes
  useEffect(() => {
    const currentConv = conversations.find(c => c.id === activeConversation);
    if (currentConv && currentConv.messages.length > 0) {
      const { nodes: newNodes, edges: newEdges } = convertToFlowElements(currentConv.messages);
      setNodes(newNodes);
      setEdges(newEdges);

      // Auto-fit view after a brief delay
      setTimeout(() => {
        fitView({ padding: 0.3, duration: 800 });
      }, 100);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [activeConversation, conversations, convertToFlowElements, setNodes, setEdges, fitView]);

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
    // If chat panel is collapsed, open it and focus on the node
    if (chatPanelCollapsed) {
      setChatPanelCollapsed(false);
      setSelectedMessageId(messageId);
      setSelectedNodes(new Set());
      // Small delay to ensure panel opens before setting focus
      setTimeout(() => {
        setSelectedMessageId(messageId);
      }, 100);
    } else {
      setSelectedMessageId(messageId);
      setSelectedNodes(new Set());
    }
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

      // Mock API response for demo
      const mockResponses = [
        "That's a great question! Let me help you with that.",
        "I understand what you're looking for. Here's my perspective on this topic.",
        "Interesting! There are several approaches we could take here.",
        "Based on what you've mentioned, I'd suggest considering these options.",
        "That makes sense. Let me break this down for you."
      ];
      
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];

      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        collapsed: false,
        children: []
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      messages: []
    };
    setConversations(prev => [...prev, newConv]);
    setActiveConversation(newConv.id);
    setSelectedMessageId(null);
    setSelectedNodes(new Set());
  };

  const startRenamingConversation = () => {
    const currentConv = conversations.find(c => c.id === activeConversation);
    if (currentConv) {
      setTempConversationName(currentConv.name);
      setIsRenamingConversation(true);
    }
  };

  const saveConversationName = () => {
    if (tempConversationName.trim()) {
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, name: tempConversationName.trim() }
          : conv
      ));
    }
    setIsRenamingConversation(false);
    setTempConversationName('');
  };

  const cancelRenamingConversation = () => {
    setIsRenamingConversation(false);
    setTempConversationName('');
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

      // Mock merge response for demo
      const mergedMessage = {
        id: `merged-${Date.now()}`,
        type: 'assistant',
        content: `I've synthesized the different conversation paths you selected. This merged response takes into account the various directions our discussion has taken and provides a unified perspective that addresses the key points from each branch.`,
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

  const getEffectiveMergeCount = () => {
    let count = selectedNodes.size;
    if (selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      count += 1;
    }
    return count;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Split view mode */}
      {/* Chat Interface - Collapsible */}
      <div className={`${chatPanelCollapsed ? 'w-0' : 'w-2/5'} bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300 overflow-hidden`}>
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
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempConversationName}
                        onChange={(e) => setTempConversationName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveConversationName();
                          } else if (e.key === 'Escape') {
                            cancelRenamingConversation();
                          }
                        }}
                        onBlur={saveConversationName}
                        className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
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
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {conversations.map(conv => (
                          <option key={conv.id} value={conv.id}>{conv.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={startRenamingConversation}
                        className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Rename Conversation"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Merge Controls */}
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

            {/* Minimal Header when collapsed */}
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

                        {message.mergedFrom && (
                          <div className="text-xs text-purple-600 opacity-90 flex items-center gap-1 mb-1">
                            <Sparkles size={10} />
                            Merged from {message.mergedFrom.length} branches
                            {message.isMergeRoot && " • Root"}
                          </div>
                        )}

                        {/* Message Actions */}
                        <div className="flex gap-3 pt-1 border-t border-opacity-20">
                          <button
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity"
                          >
                            <Share2 size={8} />
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              const newBookmarks = new Set(bookmarkedNodes);
                              if (newBookmarks.has(message.id)) {
                                newBookmarks.delete(message.id);
                              } else {
                                newBookmarks.add(message.id);
                              }
                              setBookmarkedNodes(newBookmarks);
                            }}
                            className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity"
                          >
                            <Bookmark size={8} />
                            {bookmarkedNodes.has(message.id) ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
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

          {/* Collapse/Expand Button */}
          {chatPanelCollapsed && (
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

          {/* Whiteboard */}
          <div className="flex-1 flex flex-col bg-gray-50 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              className="bg-gray-50 h-full"
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

              {/* Timeline Controls - Top Center - Show when chat collapsed */}
              {chatPanelCollapsed && (
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
              )}

              {/* Top Controls - Only show when chat panel is not collapsed */}
              {!chatPanelCollapsed && (
                <Panel position="top-right">
                  <div className="flex items-center gap-2 bg-white rounded-xl shadow border border-gray-200 p-3">
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
              )}

              {/* Search Controls - Top Right - Show when chat collapsed */}
              {chatPanelCollapsed && (
                <Panel position="top-right">
                  <div className="flex items-center gap-2 bg-white rounded-xl shadow border border-gray-200 p-3">
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
                  </div>
                </Panel>
              )}

              {/* Merge Controls - Bottom Left - Show when chat collapsed */}
              {chatPanelCollapsed && (
                <Panel position="bottom-left">
                  <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <GitBranch size={14} />
                      <span>Ctrl+click • Double-click to focus</span>
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
                      <div className="text-sm text-gray-500 text-center py-2 mb-2">
                        Select 2+ nodes to merge
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => fitView({ padding: 0.3, duration: 800 })}
                        className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                      >
                        Fit View
                      </button>
                      <button
                        onClick={() => setSelectedNodes(new Set())}
                        className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </Panel>
              )}

              {/* Status Panel */}
              <Panel position="bottom-right">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-xs">
                  <div className="text-gray-500 mb-1">Quick Info</div>
                  {currentConversation && (
                    <>
                      <div className="text-gray-700 font-medium">
                        {getAllMessages(currentConversation.messages).length} messages
                      </div>
                      <div className="text-gray-500">
                        {selectedNodes.size} selected
                      </div>
                    </>
                  )}
                  <div className="text-gray-400 mt-1">
                    💡 Double-click to focus
                  </div>
                </div>
              </Panel>
            </ReactFlow>
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