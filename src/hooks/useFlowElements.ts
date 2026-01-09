// src/hooks/useFlowElements.ts
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Node, Edge, MarkerType, NodeChange, EdgeChange } from 'reactflow';
import { Message } from '../types/conversation';
import { MessageNodeData } from '../types/flow';
import { MessageHelpers } from '../utils/messageHelpers.ts';
import { DatabaseService } from '../services/databaseService.ts';
import { useAuth } from './useAuth.ts';

export const useFlowElements = (
  messages: Message[],
  conversationId: string,
  selectedMessageId: string,
  selectedNodes: Set<string>,
  onNodeClick?: (messageId: string, event?: React.MouseEvent) => void,
  onNodeDoubleClick?: (messageId: string, event?: React.MouseEvent) => void
) => {
  const { user } = useAuth();
  const [timelinePosition, setTimelinePosition] = useState(1.0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'assistant' | 'merged'>('all');
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  
  // Track previous messages to detect changes
  const prevMessagesRef = useRef<Message[]>([]);
  const prevConversationRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadNodePositions = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      const positions = await DatabaseService.loadNodePositions(conversationId);
      setNodePositions(positions);
      setPositionsLoaded(true);
    } catch (error) {
      console.error('Failed to load node positions:', error);
      setPositionsLoaded(true); // Still mark as loaded to prevent infinite loading
    }
  }, [conversationId, user]);

  // Load node positions when conversation changes
  useEffect(() => {
    if (conversationId && conversationId !== prevConversationRef.current && user) {
      loadNodePositions();
    }
    prevConversationRef.current = conversationId;
  }, [conversationId, user, loadNodePositions]);

  // Reset positions only when switching conversations
  useEffect(() => {
    const currentConversationId = conversationId;
    
    // Only reset positions if we've switched to a completely different conversation
    if (prevConversationRef.current && 
        prevConversationRef.current !== currentConversationId && 
        currentConversationId !== '') {
      setNodePositions({});
      setPositionsLoaded(false);
    }
    
    prevMessagesRef.current = messages;
  }, [messages, conversationId]);

  const saveNodePositions = useCallback(
    async (positions: Record<string, { x: number; y: number }>) => {
      if (!conversationId || !user) return;

      try {
        await DatabaseService.saveNodePositions(conversationId, positions);
      } catch (error) {
        console.error('Failed to save node positions:', error);
      }
    },
    [conversationId, user]
  );

  // Debounced save function with logging
  const debouncedSavePositions = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      console.log('🔄 Debouncing position save for', Object.keys(positions).length, 'nodes');
      
      saveTimeoutRef.current = setTimeout(() => {
        console.log('💾 Saving node positions to database');
        saveNodePositions(positions);
      }, 1000); // Save after 1 second of no changes
    },
    [saveNodePositions]
  );

      // Memoized base flow elements (without visual state)
  const baseFlowElements = useMemo(() => {
    console.log('🔄 Recalculating base flow elements');
    const flowNodes: Node<MessageNodeData>[] = [];
    const flowEdges: Edge[] = [];
    const horizontalSpacing = 400;
    const verticalSpacing = 250;

    // Handle empty messages case or invalid state
    if (!messages || messages.length === 0 || !conversationId) {
      return { nodes: flowNodes, edges: flowEdges };
    }

    // Get all messages for timeline calculation
    const allMessages = MessageHelpers.getAllMessages(messages);
    
    const processNode = (message: Message, x: number, y: number, level = 0) => {
      // Apply timeline filter with better distribution
      if (timelinePosition < 1.0) {
        const messageTime = new Date(message.timestamp).getTime();
        const allMessageTimes = allMessages.map(m => new Date(m.timestamp).getTime()).sort((a, b) => a - b);
        const messageIndex = allMessageTimes.indexOf(messageTime);
        const totalMessages = allMessageTimes.length;
        
        // Better distribution: use exponential curve for more gradual reveal
        const messageProgress = messageIndex / Math.max(1, totalMessages - 1);
        const adjustedProgress = Math.pow(messageProgress, 0.7); // Slower start, faster end
        
        if (adjustedProgress > timelinePosition) {
          return;
        }
      }

      // Note: Search filtering is now handled at the visual level to prevent unnecessary rebuilds

      // Apply type filter
      let matchesType = true;
      if (filterType !== 'all') {
        if (filterType === 'merged') {
          matchesType = MessageHelpers.isMergedMessage(message);
        } else {
          matchesType = message.type === filterType;
        }
      }

      // Only add node if it matches the filter
      if (matchesType) {
        // Use saved position if available and positions are loaded, otherwise use calculated position
        const savedPosition = positionsLoaded ? nodePositions[message.id] : null;
        const nodePosition = savedPosition || { x, y };

        flowNodes.push({
          id: message.id,
          type: 'message',
          position: nodePosition,
          data: {
            message,
            onNodeClick,
            onNodeDoubleClick,
            // Remove visual state from base data - will be added later
          },
          selected: false,
          draggable: true,
        });
      }

      // Process children regardless of parent match
      if (message.children && message.children.length > 0) {
        const childrenWidth = (message.children.length - 1) * horizontalSpacing;
        const startX = x - childrenWidth / 2;

        message.children.forEach((child, index) => {
          const childX = startX + (index * horizontalSpacing);
          const childY = y + verticalSpacing;

          // Create edge only if both parent and child match the filter
          let childMatchesType = true;
          if (filterType !== 'all') {
            if (filterType === 'merged') {
              childMatchesType = MessageHelpers.isMergedMessage(child);
            } else {
              childMatchesType = child.type === filterType;
            }
          }

          if (matchesType && childMatchesType) {
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
          }

          processNode(child, childX, childY, level + 1);
        });
      }

      // Add merge edges for merged nodes (only if this node matches the filter)
      if (matchesType && message.mergedFrom && message.mergedFrom.length > 0) {
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
  }, [
    messages, 
    timelinePosition, 
    filterType,
    nodePositions,
    positionsLoaded,
    conversationId,
    onNodeClick,
    onNodeDoubleClick
  ]);

  // Add visual state to nodes (selection, multi-selection indicators, search highlighting)
  const { nodes, edges } = useMemo(() => {
    let filteredNodes = baseFlowElements.nodes;
    
    // Apply search filter at the visual level (don't rebuild entire flow)
    if (searchTerm) {
      filteredNodes = baseFlowElements.nodes.filter(node => 
        node.data.message.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const nodesWithVisualState = filteredNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isMultiSelected: selectedNodes.has(node.id),
        selectedMessageId,
        hasMultiSelections: selectedNodes.size > 0,
        searchTerm, // Pass search term for highlighting
      }
    }));

    return {
      nodes: nodesWithVisualState,
      edges: baseFlowElements.edges
    };
  }, [baseFlowElements, selectedNodes, selectedMessageId, searchTerm]);

  // Handle node changes (including position updates) - only for actual position changes
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // Filter for actual position changes only - exclude intermediate drag events
    const positionChanges = changes.filter(change => 
      change.type === 'position' && 
      change.position && 
      change.dragging === false // Only save when drag is complete
    );
    
    if (positionChanges.length > 0) {
      console.log('📍 Processing', positionChanges.length, 'position changes');
      
      setNodePositions(prev => {
        const newPositions = { ...prev };
        let hasActualChanges = false;
        
        positionChanges.forEach(change => {
          if (change.type === 'position' && change.position) {
            const currentPos = prev[change.id];
            const newPos = change.position;
            
            // Only update if position actually changed (avoid floating point precision issues)
            if (!currentPos || 
                Math.abs(currentPos.x - newPos.x) > 0.1 || 
                Math.abs(currentPos.y - newPos.y) > 0.1) {
              newPositions[change.id] = newPos;
              hasActualChanges = true;
              console.log('📍 Node', change.id, 'moved to', newPos);
            }
          }
        });
        
        // Only save to database if there were actual position changes
        if (hasActualChanges) {
          debouncedSavePositions(newPositions);
        } else {
          console.log('📍 No actual position changes detected');
        }
        
        return newPositions;
      });
    }
  }, [debouncedSavePositions]);

  // Handle edge changes
  const handleEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // For now, we don't allow edge modification in this app
    // This could be extended to support custom connections
  }, []);

  const setTimelinePositionSafe = useCallback((position: number | ((prev: number) => number)) => {
    if (typeof position === 'function') {
      setTimelinePosition(prev => {
        const newPos = position(prev);
        return Math.max(0, Math.min(1, newPos));
      });
    } else {
      setTimelinePosition(Math.max(0, Math.min(1, position)));
    }
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilterType('all');
    setTimelinePosition(1.0);
  }, []);

  const getFilteredMessageCount = useCallback(() => {
    const allMessages = MessageHelpers.getAllMessages(messages);
    return {
      total: allMessages.length,
      visible: nodes.length,
      filtered: allMessages.length - nodes.length
    };
  }, [messages, nodes.length]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Flow elements
    nodes,
    edges,
    
    // Change handlers
    handleNodesChange,
    handleEdgesChange,
    
    // Filter state
    timelinePosition,
    searchTerm,
    filterType,
    
    // Filter controls
    setTimelinePosition: setTimelinePositionSafe,
    setSearchTerm,
    setFilterType,
    resetFilters,
    
    // Position management
    loadNodePositions,
    saveNodePositions,
    positionsLoaded,
    
    // Stats
    getFilteredMessageCount
  };
};