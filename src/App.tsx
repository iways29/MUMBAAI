import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Send, MessageCircle, Move, Maximize2, Minimize2, ChevronRight, ChevronLeft, User, Bot, Sparkles, Play, Pause, RotateCcw, ZoomIn, ZoomOut, Home } from 'lucide-react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const CustomNode = ({ data }) => (
  <div
    className={`w-60 h-24 p-3 rounded-xl shadow-md border ${
      data.isSelected ? 'border-yellow-400 border-2' : 'border-gray-200'
    } ${data.isMultiSelected ? 'border-red-500 border-2' : ''} bg-white`}
    onClick={(e) => data.handleNodeSelect(data.message.id, e)}
    onDoubleClick={() => data.handleNodeDoubleClick(data.message.id)}
  >
    <div className={`h-7 rounded-t-lg -m-3 mb-2 ${data.message.type === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
      <div className="flex items-center p-2">
        <div
          className={`w-4 h-4 rounded-full mr-2 ${data.message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}
        ></div>
        <span className="text-xs font-semibold">{data.message.type === 'user' ? 'User' : 'Assistant'}</span>
        <span className="text-xs text-gray-500 ml-auto">{data.formatTimestamp(data.message.timestamp)}</span>
      </div>
    </div>
    <div className="text-xs text-gray-700 leading-relaxed overflow-hidden">
      {data.truncateText(data.message.content)}
    </div>
  </div>
);

const nodeTypes = {
  custom: CustomNode,
};

const App = () => {
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
                  content: 'It\'s a web application for task management',
                  timestamp: new Date(Date.now() - 180000).toISOString(),
                  collapsed: false,
                  children: [
                    {
                      id: 'msg-4',
                      type: 'assistant',
                      content: 'Great! Task management apps are very useful. What features do you want to include?',
                      timestamp: new Date(Date.now() - 120000).toISOString(),
                      collapsed: false,
                      children: []
                    }
                  ]
                },
                {
                  id: 'msg-5',
                  type: 'user',
                  content: 'Actually, it\'s a mobile app instead',
                  timestamp: new Date(Date.now() - 150000).toISOString(),
                  collapsed: false,
                  children: [
                    {
                      id: 'msg-6',
                      type: 'assistant',
                      content: 'Mobile apps are exciting! Are you thinking iOS, Android, or cross-platform?',
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [isWhiteboardExpanded, setIsWhiteboardExpanded] = useState(false);
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);


  useEffect(() => {
    const conversation = conversations.find(c => c.id === activeConversation);
    if (conversation) {
      const { nodes: newNodes, edges: newEdges } = convertMessagesToFlowData(conversation.messages);
      setNodes(newNodes);
      setEdges(newEdges);
      setTimeout(() => fitView({ padding: 0.2, duration: 200 }), 100);
    }
  }, [activeConversation, conversations, fitView]);

  const convertMessagesToFlowData = (messages, parentId = null, x = 0, y = 0, level = 0) => {
    let nodes = [];
    let edges = [];
    let nextY = y;

    messages.forEach((msg, index) => {
      const nodeId = msg.id;
      const nodeX = x + (index * 300);

      nodes.push({
        id: nodeId,
        type: 'custom',
        position: { x: nodeX, y: nextY },
        data: {
          message: msg,
          isSelected: selectedMessageId === msg.id,
          isMultiSelected: selectedNodes.has(msg.id),
          handleNodeSelect,
          handleNodeDoubleClick,
          truncateText,
          formatTimestamp
        },
      });

      if (parentId) {
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
        });
      }

      if (msg.children && msg.children.length > 0) {
        const childData = convertMessagesToFlowData(msg.children, nodeId, nodeX, nextY + 150, level + 1);
        nodes = nodes.concat(childData.nodes);
        edges = edges.concat(childData.edges);
      }
    });

    return { nodes, edges };
  };

  const handleNodeDoubleClick = (messageId) => {
    setSelectedMessageId(messageId);
    if(isWhiteboardExpanded){
        setIsWhiteboardExpanded(false);
    }
  };


  const getEffectiveMergeNodes = () => {
    const multiSelected = Array.from(selectedNodes);
    if (multiSelected.length > 0 && selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      return [...multiSelected, selectedMessageId];
    }
    return multiSelected;
  };

  const findMessage = (messages, messageId) => {
    for (const message of messages) {
      if (message.id === messageId) {
        return message;
      }
      const found = findMessage(message.children, messageId);
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
              children: [...msg.children, newMessage]
            };
          }
          return {
            ...msg,
            children: addToMessages(msg.children)
          };
        });
      };

      return {
        ...conv,
        messages: addToMessages(conv.messages)
      };
    }));
  };

  const handleNodeSelect = (messageId, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
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

  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentMessage = () => {
    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation || !selectedMessageId) return null;
    return findMessage(conversation.messages, selectedMessageId);
  };

  const getMessageThread = () => {
    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation || !selectedMessageId) return [];

    const getPath = (messages, targetId, path = []) => {
      for (const msg of messages) {
        const newPath = [...path, msg];
        if (msg.id === targetId) {
          return newPath;
        }
        const found = getPath(msg.children, targetId, newPath);
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

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const messageThread = getMessageThread();
  const effectiveMergeNodes = getEffectiveMergeNodes();

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${isWhiteboardExpanded ? 'w-0' : 'w-2/5'}`}>
        {!isWhiteboardExpanded &&
          <>
            <div className="bg-white border-b border-gray-200 p-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                {currentConversation?.name || 'Select a conversation'}
              </h1>
              {selectedMessageId && (
                <p className="text-sm text-gray-500 mt-2">
                  Branching from: {getCurrentMessage()?.content.substring(0, 60)}...
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {messageThread.length > 0 ? (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {messageThread.map((message, index) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-lg px-6 py-4 rounded-2xl shadow-sm ${message.type === 'user'
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
                        </div>

                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>

                        {message.children.length > 0 && (
                          <div className="mt-3 text-xs opacity-70 flex items-center gap-1">
                            <ChevronRight size={12} />
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
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
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
                  <p className="text-xs text-gray-400">Or click a node in the tree to continue from that point</p>
                </div>
              )}
            </div>

            <div className="bg-white border-t border-gray-200 p-6">
              <div className="flex gap-3 max-w-3xl mx-auto">
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
                <div className="mt-3 text-xs text-gray-500 max-w-3xl mx-auto">
                  Replying to: {getCurrentMessage()?.content.substring(0, 80)}...
                </div>
              )}
            </div>
          </>
        }
      </div>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isWhiteboardExpanded ? 'w-full' : 'w-3/5'}`}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Whiteboard</h2>
          <button
            onClick={() => setIsWhiteboardExpanded(!isWhiteboardExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isWhiteboardExpanded ? "Collapse Whiteboard" : "Expand Whiteboard"}
          >
            {isWhiteboardExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
        <div className="flex-1 overflow-hidden bg-gray-50 relative">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
          {isWhiteboardExpanded &&
            <div className="absolute top-4 left-4 z-10 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Move size={14} />
                <span>Drag to pan • Ctrl+click for multi-select</span>
              </div>
              <div className="text-sm mb-3">
                <span className="text-blue-600 font-medium">Multi-selected: {selectedNodes.size} nodes</span>
                {selectedMessageId && selectedNodes.size > 0 && !selectedNodes.has(selectedMessageId) && (
                  <span className="text-green-600 ml-1">+ active node</span>
                )}
              </div>
              {effectiveMergeNodes.length >= 2 ? (
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const nodeIds = getEffectiveMergeNodes();
                      const conv = conversations.find(c => c.id === activeConversation);

                      const getPathToNode = (messages, targetId, path = []) => {
                        for (const msg of messages) {
                          const newPath = [...path, msg];
                          if (msg.id === targetId) {
                            return newPath;
                          }
                          const found = getPathToNode(msg.children, targetId, newPath);
                          if (found) return found;
                        }
                        return null;
                      };

                      const branchContexts = [];
                      for (let i = 0; i < nodeIds.length; i++) {
                        const nodeId = nodeIds[i];
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

                      const firstNodeForHistory = findMessage(conv.messages, nodeIds[0]);
                      const pathToFirst = firstNodeForHistory ? getPathToNode(conv.messages, nodeIds[0]) : [];
                      const commonHistory = pathToFirst.slice(0, -1);
                      const historyText = commonHistory.length > 0
                        ? commonHistory.map(msg => `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`).join('\n')
                        : '';

                      let mergePrompt = 'You are continuing a conversation. Here is the context:\n\n';

                      if (historyText) {
                        mergePrompt += 'SHARED CONVERSATION HISTORY:\n' + historyText + '\n\n';
                      }

                      mergePrompt += 'DIVERGENT BRANCHES TO MERGE:\n';
                      mergePrompt += `I have ${nodeIds.length} different conversation branches that diverged from `;
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
                        mergedFrom: nodeIds,
                        isMergeRoot: true,
                        children: []
                      };

                      const parentNode = nodeIds.map(id => findMessage(conv.messages, id))[0];

                      if (parentNode) {
                        addMessage(activeConversation, parentNode.id, mergedMessage);
                        setSelectedMessageId(mergedMessage.id);
                        setSelectedNodes(new Set());
                      }

                    } catch (error) {
                      console.error('Intelligent merge failed:', error);

                      const fallbackMessage = {
                        id: `merged-${Date.now()}`,
                        type: 'assistant',
                        content: `I attempted to synthesize insights from ${effectiveMergeNodes.length} conversation branches, but encountered a technical issue. Based on the different paths we explored, there seem to be multiple interesting directions. Could you help me understand which aspect you'd like to focus on, or would you like me to try the merge again?`,
                        timestamp: new Date().toISOString(),
                        collapsed: false,
                        mergedFrom: effectiveMergeNodes,
                        isMergeRoot: true,
                        children: []
                      };

                      const conv = conversations.find(c => c.id === activeConversation);
                      const fallbackParentNode = effectiveMergeNodes.map(id => findMessage(conv.messages, id))[0];

                      if (fallbackParentNode) {
                        addMessage(activeConversation, fallbackParentNode.id, fallbackMessage);
                        setSelectedMessageId(fallbackMessage.id);
                        setSelectedNodes(new Set());
                      }
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium mb-2"
                  disabled={isLoading}
                >
                  <Sparkles size={14} />
                  Merge {effectiveMergeNodes.length} nodes
                </button>
              ) : effectiveMergeNodes.length === 1 ? (
                <div className="text-sm text-gray-500 text-center py-2 mb-2">
                  Select 1 more node to merge with active
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-2 mb-2">
                  Ctrl+click nodes to multi-select
                </div>
              )}
            </div>
          }
        </div>
      </div>
    </div>
  );
};


const AppWrapper = () => (
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);

export default AppWrapper;