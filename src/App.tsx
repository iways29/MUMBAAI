import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, MessageCircle, Move, Maximize2, Minimize2, ChevronRight, ChevronLeft, User, Bot, Sparkles, Play, Pause, RotateCcw, ZoomIn, ZoomOut, Home } from 'lucide-react';

const TreeChatMVP = () => {
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
  
  const [timelinePosition, setTimelinePosition] = useState(1.0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [nodePositions, setNodePositions] = useState({});
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [draggedNodeOffset, setDraggedNodeOffset] = useState({ x: 0, y: 0 });
  
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const animationRef = useRef(null);

  const handleZoom = (delta, centerX = null, centerY = null) => {
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(3.0, zoomLevel * zoomFactor));
    
    if (centerX !== null && centerY !== null) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = centerX - rect.left;
        const mouseY = centerY - rect.top;
        const scaleDiff = newZoom - zoomLevel;
        
        setPanOffset(prev => ({
          x: prev.x - (mouseX - rect.width / 2) * scaleDiff * 0.5,
          y: prev.y - (mouseY - rect.height / 2) * scaleDiff * 0.5
        }));
      }
    }
    
    setZoomLevel(newZoom);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    handleZoom(-e.deltaY, e.clientX, e.clientY);
  };

  const resetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleNodeMouseDown = (messageId, e) => {
    e.stopPropagation();
    setDraggedNodeId(messageId);
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const nodePos = treePositions.find(pos => pos.message.id === messageId);
      if (nodePos) {
        setDraggedNodeOffset({
          x: e.clientX - rect.left - nodePos.x * zoomLevel - panOffset.x,
          y: e.clientY - rect.top - nodePos.y * zoomLevel - panOffset.y
        });
      }
    }
  };

  const handleNodeMouseMove = (e) => {
    if (!draggedNodeId) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const newX = (e.clientX - rect.left - panOffset.x - draggedNodeOffset.x) / zoomLevel;
      const newY = (e.clientY - rect.top - panOffset.y - draggedNodeOffset.y) / zoomLevel;
      
      setNodePositions(prev => ({
        ...prev,
        [draggedNodeId]: { x: newX, y: newY }
      }));
    }
  };

  const handleNodeMouseUp = () => {
    setDraggedNodeId(null);
    setDraggedNodeOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (draggedNodeId) {
      window.addEventListener('mousemove', handleNodeMouseMove);
      window.addEventListener('mouseup', handleNodeMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleNodeMouseMove);
        window.removeEventListener('mouseup', handleNodeMouseUp);
      };
    }
  }, [draggedNodeId, draggedNodeOffset, zoomLevel, panOffset]);

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

  const getAllMessagesFromNode = (node) => {
    let messages = [node];
    if (node.children) {
      node.children.forEach(child => {
        messages = messages.concat(getAllMessagesFromNode(child));
      });
    }
    return messages;
  };

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

  const filterMessagesByTimeline = (messages, timeRatio) => {
    if (timeRatio >= 1.0) return messages;
    
    const now = Date.now();
    const oldestTime = Math.min(...getAllMessagesFromConversation(messages).map(m => new Date(m.timestamp).getTime()));
    const cutoffTime = oldestTime + (now - oldestTime) * timeRatio;
    
    const filterNode = (node) => {
      const nodeTime = new Date(node.timestamp).getTime();
      if (nodeTime > cutoffTime) return null;
      
      return {
        ...node,
        children: node.children.map(filterNode).filter(Boolean)
      };
    };
    
    return messages.map(filterNode).filter(Boolean);
  };

  const getAllMessagesFromConversation = (messages) => {
    let allMessages = [];
    messages.forEach(msg => {
      allMessages.push(msg);
      allMessages = allMessages.concat(getAllMessagesFromNode(msg));
    });
    return allMessages;
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
    setPanOffset({ x: 0, y: 0 });
  };

  const calculateTreePositions = (messages, startX = 500, startY = 120) => {
    const positions = [];
    const verticalSpacing = 140;
    const horizontalSpacing = 280;
    
    const calculateNodePositions = (nodeList, x, y, level = 0) => {
      const totalWidth = Math.max(0, (nodeList.length - 1) * horizontalSpacing);
      const startXPos = x - totalWidth / 2;
      
      nodeList.forEach((message, index) => {
        const customPos = nodePositions[message.id];
        let nodeX, nodeY;
        
        if (customPos) {
          nodeX = customPos.x;
          nodeY = customPos.y;
        } else {
          nodeX = startXPos + (index * horizontalSpacing);
          nodeY = y;
          
          if (message.mergedFrom && message.mergedFrom.length > 0) {
            const sourcePositions = message.mergedFrom.map(sourceId => {
              return positions.find(pos => pos.message.id === sourceId);
            }).filter(Boolean);
            
            if (sourcePositions.length > 0) {
              nodeX = sourcePositions.reduce((sum, pos) => sum + pos.x, 0) / sourcePositions.length;
            }
          }
        }
        
        positions.push({
          message,
          x: nodeX,
          y: nodeY,
          level,
          opacity: 1.0
        });
        
        if (message.children && message.children.length > 0 && !message.collapsed) {
          calculateNodePositions(
            message.children,
            nodeX,
            nodeY + verticalSpacing,
            level + 1
          );
        }
      });
    };
    
    const filteredMessages = filterMessagesByTimeline(messages, timelinePosition);
    calculateNodePositions(filteredMessages, startX, startY);
    
    return positions;
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.node-card') || e.target.closest('.draggable-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderTreeNode = (position, allPositions) => {
    const { message, x, y, opacity } = position;
    const isSelected = selectedMessageId === message.id;
    const isMultiSelected = selectedNodes.has(message.id);
    
    const parentPos = allPositions.find(p => 
      p.message.children && p.message.children.some(child => child.id === message.id)
    );

    const isMergedNode = message.mergedFrom && message.mergedFrom.length > 0;
    const cardWidth = 240;
    const cardHeight = 100;

    return (
      <g key={message.id} opacity={opacity}>
        {/* Regular parent-child connections */}
        {parentPos && !isMergedNode && (
          <g>
            <line
              x1={parentPos.x}
              y1={parentPos.y + cardHeight/2}
              x2={parentPos.x}
              y2={parentPos.y + 70}
              stroke="#d1d5db"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.7"
            />
            <line
              x1={parentPos.x}
              y1={parentPos.y + 70}
              x2={x}
              y2={parentPos.y + 70}
              stroke="#d1d5db"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.7"
            />
            <line
              x1={x}
              y1={parentPos.y + 70}
              x2={x}
              y2={y - cardHeight/2}
              stroke="#d1d5db"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.7"
            />
          </g>
        )}

        {/* Merge connections */}
        {isMergedNode && message.mergedFrom && (
          <g>
            {message.mergedFrom.map(sourceId => {
              const sourcePos = allPositions.find(pos => pos.message.id === sourceId);
              if (!sourcePos) return null;
              
              return (
                <g key={`merge-${sourceId}`}>
                  <path
                    d={`M ${sourcePos.x} ${sourcePos.y + cardHeight/2} Q ${sourcePos.x} ${sourcePos.y + cardHeight/2 + 30} ${(sourcePos.x + x) / 2} ${(sourcePos.y + y) / 2} Q ${x} ${y - cardHeight/2 - 30} ${x} ${y - cardHeight/2}`}
                    stroke="#a855f7"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.8"
                    strokeDasharray="6,3"
                  />
                  
                  <circle
                    cx={sourcePos.x}
                    cy={sourcePos.y + cardHeight/2}
                    r="4"
                    fill="#a855f7"
                    opacity="0.8"
                  />
                </g>
              );
            }).filter(Boolean)}
            
            <circle
              cx={x}
              cy={y - cardHeight/2}
              r="6"
              fill="#a855f7"
              stroke="white"
              strokeWidth="2"
            />
          </g>
        )}

        {/* Main card */}
        <g className="node-card draggable-node">
          <rect
            x={x - cardWidth/2}
            y={y - cardHeight/2}
            width={cardWidth}
            height={cardHeight}
            fill="white"
            stroke={isSelected ? "#f59e0b" : isMultiSelected ? "#ef4444" : draggedNodeId === message.id ? "#8b5cf6" : "#e5e7eb"}
            strokeWidth={isSelected || isMultiSelected || draggedNodeId === message.id ? "3" : "1"}
            rx="12"
            ry="12"
            className="cursor-move hover:shadow-lg transition-all"
            onClick={(e) => handleNodeSelect(message.id, e)}
            onMouseDown={(e) => handleNodeMouseDown(message.id, e)}
            filter={isSelected || isMultiSelected ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : "none"}
          />
          
          <rect
            x={x - cardWidth/2}
            y={y - cardHeight/2}
            width={cardWidth}
            height={28}
            fill={message.type === 'user' ? '#eff6ff' : '#f0fdf4'}
            rx="12"
            ry="12"
            className="pointer-events-none"
          />
          <rect
            x={x - cardWidth/2}
            y={y - cardHeight/2 + 14}
            width={cardWidth}
            height={14}
            fill={message.type === 'user' ? '#eff6ff' : '#f0fdf4'}
            className="pointer-events-none"
          />
          
          <circle
            cx={x - cardWidth/2 + 20}
            cy={y - cardHeight/2 + 14}
            r="8"
            fill={message.type === 'user' ? '#3b82f6' : '#10b981'}
            className="pointer-events-none"
          />
          
          <text
            x={x - cardWidth/2 + 35}
            y={y - cardHeight/2 + 18}
            fontSize="11"
            fontWeight="600"
            fill={message.type === 'user' ? '#1d4ed8' : '#059669'}
            className="pointer-events-none"
          >
            {message.type === 'user' ? 'User' : 'Assistant'}
          </text>
          
          <text
            x={x + cardWidth/2 - 10}
            y={y - cardHeight/2 + 18}
            fontSize="10"
            fill="#6b7280"
            textAnchor="end"
            className="pointer-events-none"
          >
            {formatTimestamp(message.timestamp)}
          </text>
          
          <foreignObject
            x={x - cardWidth/2 + 12}
            y={y - cardHeight/2 + 32}
            width={cardWidth - 24}
            height={cardHeight - 40}
            className="pointer-events-none"
          >
            <div className="text-xs text-gray-700 leading-relaxed overflow-hidden">
              {truncateText(message.content)}
            </div>
          </foreignObject>
          
          {isMultiSelected && (
            <circle
              cx={x + cardWidth/2 - 15}
              cy={y - cardHeight/2 + 15}
              r="6"
              fill="#ef4444"
              className="pointer-events-none"
            />
          )}
          
          {isMergedNode && (
            <g>
              <circle
                cx={x + cardWidth/2 - 15}
                cy={y + cardHeight/2 - 15}
                r="8"
                fill="#a855f7"
                className="pointer-events-none"
              />
              <text
                x={x + cardWidth/2 - 15}
                y={y + cardHeight/2 - 11}
                fontSize="8"
                fill="white"
                textAnchor="middle"
                className="pointer-events-none"
              >
                ✨
              </text>
            </g>
          )}
          
          {message.children.length > 0 && (
            <text
              x={x}
              y={y + cardHeight/2 - 8}
              fontSize="10"
              fill="#6b7280"
              textAnchor="middle"
              className="pointer-events-none"
            >
              {message.children.length} response{message.children.length > 1 ? 's' : ''}
            </text>
          )}
        </g>
      </g>
    );
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
  const treePositions = currentConversation && currentConversation.messages.length > 0 
    ? calculateTreePositions(currentConversation.messages) 
    : [];
  const effectiveMergeNodes = getEffectiveMergeNodes();

  return (
    <div className="flex h-screen bg-gray-50">
      {isWhiteboardExpanded ? (
        <div className="w-full h-screen flex flex-col bg-gray-50">
          <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={() => setIsWhiteboardExpanded(false)}
                className="p-3 bg-white text-gray-700 hover:bg-gray-100 rounded-xl shadow-lg border border-gray-200 transition-all"
                title="Exit Whiteboard Mode"
              >
                <Minimize2 size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
              <button
                onClick={() => handleZoom(1)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              
              <button
                onClick={() => handleZoom(-1)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              
              <div className="w-px h-6 bg-gray-300"></div>
              
              <button
                onClick={resetView}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Reset View"
              >
                <Home size={16} />
              </button>
              
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-gray-500">Zoom:</span>
                <span className="text-xs text-gray-700 w-8">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
            </div>
            
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
          </div>
          
          <div className="w-full h-full overflow-hidden pt-20">
            {currentConversation && currentConversation.messages.length > 0 ? (
              <svg 
                ref={svgRef}
                width="100%" 
                height="100%" 
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
                style={{ cursor: isDragging ? 'grabbing' : draggedNodeId ? 'grabbing' : 'grab' }}
              >
                <defs>
                  <pattern id="grid-expanded" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                  </pattern>
                  <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
                  </filter>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-expanded)" />
                
                <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
                  {treePositions.map(position => renderTreeNode(position, treePositions))}
                </g>
              </svg>
            ) : (
              <div className="text-center text-gray-500 mt-20 p-4">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
              </div>
            )}
            
            <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500 mb-1">Navigation</div>
              <div className="text-sm font-medium text-gray-700">
                Zoom: {Math.round(zoomLevel * 100)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pan: ({Math.round(panOffset.x)}, {Math.round(panOffset.y)})
              </div>
              {draggedNodeId && (
                <div className="text-xs text-purple-600 mt-1">
                  🎯 Dragging node
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {!sidebarCollapsed && (
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Project Tree</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={createNewConversation}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="New Conversation"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Collapse Sidebar"
                    >
                      <ChevronLeft size={18} />
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
                    setPanOffset({ x: 0, y: 0 });
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
                      Importance: {Math.round((currentConversation.importance || 0) * 100)}%
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
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
              </div>
              
              <div className="flex-1 overflow-hidden bg-gray-50 relative">
                {currentConversation && currentConversation.messages.length > 0 ? (
                  <>
                    <svg 
                      ref={svgRef}
                      width="100%" 
                      height="100%" 
                      className="cursor-grab active:cursor-grabbing"
                      onMouseDown={handleMouseDown}
                      onWheel={handleWheel}
                      style={{ cursor: isDragging ? 'grabbing' : draggedNodeId ? 'grabbing' : 'grab' }}
                    >
                      <defs>
                        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                        </pattern>
                        <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
                        </filter>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
                        {treePositions.map(position => renderTreeNode(position, treePositions))}
                      </g>
                    </svg>
                    
                    <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                      <button
                        onClick={() => setIsWhiteboardExpanded(true)}
                        className="p-4 bg-white text-gray-700 hover:bg-gray-100 rounded-xl shadow-lg border border-gray-200 transition-all"
                        title="Expand Whiteboard"
                      >
                        <Maximize2 size={20} />
                      </button>
                      
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => handleZoom(1)}
                            className="p-1 text-gray-700 hover:bg-gray-100 rounded"
                            title="Zoom In"
                          >
                            <ZoomIn size={14} />
                          </button>
                          <button
                            onClick={() => handleZoom(-1)}
                            className="p-1 text-gray-700 hover:bg-gray-100 rounded"
                            title="Zoom Out"
                          >
                            <ZoomOut size={14} />
                          </button>
                          <button
                            onClick={resetView}
                            className="p-1 text-gray-700 hover:bg-gray-100 rounded"
                            title="Reset View"
                          >
                            <Home size={14} />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(zoomLevel * 100)}%
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 mt-20 p-6">
                    <MessageCircle size={64} className="mx-auto mb-4 opacity-40" />
                    <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                    <p className="text-sm">Start typing below to begin your conversation</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {sidebarCollapsed && (
            <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Show Sidebar"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          
          <div className="flex-1 flex flex-col bg-white">
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
          </div>
        </>
      )}
    </div>
  );
};

export default TreeChatMVP;