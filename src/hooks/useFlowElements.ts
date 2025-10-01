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
  const [, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Use a ref to store node positions to avoid triggering re-renders during drag
  const nodePositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Track previous messages to detect changes
  const prevMessagesRef = useRef<Message[]>([]);
  const prevConversationRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadNodePositions = useCallback(async () => {
    if (!conversationId || !user) return;

    setIsLoadingPositions(true);
    // Clear existing positions first to ensure fresh load
    nodePositionsRef.current = {};
    setNodePositions({});

    try {
      const positions = await DatabaseService.loadNodePositions(conversationId);
      setNodePositions(positions);
      nodePositionsRef.current = positions;
      setPositionsLoaded(true);
    } catch (error) {
      setPositionsLoaded(true); // Still mark as loaded to prevent infinite loading
    } finally {
      setIsLoadingPositions(false);
    }
  }, [conversationId, user]);

  // Load node positions when conversation changes OR on initial load
  useEffect(() => {
    if (conversationId && user) {
      // Clear previous positions immediately when conversation changes
      if (conversationId !== prevConversationRef.current) {
        nodePositionsRef.current = {};
        setNodePositions({});
        setPositionsLoaded(false);
        setIsLoadingPositions(false);
      }

      // Load positions for the new conversation
      if (conversationId !== prevConversationRef.current || !positionsLoaded) {
        loadNodePositions();
      }
    }
    prevConversationRef.current = conversationId;
  }, [conversationId, user, loadNodePositions]); // Removed positionsLoaded to avoid circular dependency

  const saveNodePositions = useCallback(
    async (positions: Record<string, { x: number; y: number }>) => {
      if (!conversationId || !user) return;

      try {
        await DatabaseService.saveNodePositions(conversationId, positions);
      } catch (error) {
      }
    },
    [conversationId, user]
  );

  // Debounced save function
  const debouncedSavePositions = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveNodePositions(positions);
      }, 1000); // Save after 1 second of no changes
    },
    [saveNodePositions]
  );

  const convertToFlowElements = useCallback(() => {

    // Don't create nodes until we've at least attempted to load positions
    if (!positionsLoaded) {
      return { nodes: [], edges: [] };
    }

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

      // Apply search filter
      if (searchTerm && !message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        // Still process children
        if (message.children && message.children.length > 0) {
          const childrenWidth = (message.children.length - 1) * horizontalSpacing;
          const startX = x - childrenWidth / 2;
          message.children.forEach((child, index) => {
            const childX = startX + (index * horizontalSpacing);
            const childY = y + verticalSpacing;
            processNode(child, childX, childY, level + 1);
          });
        }
        return;
      }

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
        const isMultiSelected = selectedNodes.has(message.id);

        // Use saved position from database if available, otherwise use calculated position
        const savedPosition = nodePositionsRef.current[message.id];
        const nodePosition = savedPosition ? savedPosition : { x, y };

        // Validate position bounds to prevent nodes from being too far off-screen
        const validatedPosition = {
          x: Math.max(-5000, Math.min(5000, nodePosition.x)),
          y: Math.max(-5000, Math.min(5000, nodePosition.y))
        };

        flowNodes.push({
          id: message.id,
          type: 'message',
          position: validatedPosition,
          data: {
            message,
            onNodeClick,
            onNodeDoubleClick,
            isMultiSelected,
            selectedMessageId,
            hasMultiSelections: selectedNodes.size > 0,
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
    selectedMessageId,
    selectedNodes,
    timelinePosition,
    searchTerm,
    filterType,
    conversationId,
    onNodeClick,
    onNodeDoubleClick,
    positionsLoaded  // Add this to trigger recreation when positions are loaded
  ]);

  const { nodes, edges } = useMemo(() => {
    const result = convertToFlowElements();
    return result;
  }, [convertToFlowElements]);

  // Handle node changes for position saving (doesn't interfere with React Flow)
  const handlePositionSave = useCallback((changes: NodeChange[]) => {
    const positionChanges = changes.filter(change => change.type === 'position');

    if (positionChanges.length > 0) {

      positionChanges.forEach(change => {
        if (change.type === 'position' && change.position) {
          nodePositionsRef.current[change.id] = change.position;
        }
      });

      // Save to database with debouncing
      debouncedSavePositions(nodePositionsRef.current);
    }
  }, [debouncedSavePositions]);

  // This is the function that should be called by React Flow
  // It handles both React Flow's internal state AND our position saving
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // Save positions for persistence
    handlePositionSave(changes);

    // Let the parent component handle the actual React Flow state updates
    // The parent needs to call applyNodeChanges or use useNodesState
  }, [handlePositionSave]);  // Handle edge changes
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
    isLoadingPositions,

    // Stats
    getFilteredMessageCount
  };
};