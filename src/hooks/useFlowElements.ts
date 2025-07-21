import { useState, useCallback, useMemo } from 'react';
import { Node, Edge, MarkerType } from 'reactflow';
import { Message } from '../types/conversation.ts';
import { MessageNodeData } from '../types/flow.ts';
import { MessageHelpers } from '../utils/messageHelpers.ts';

export const useFlowElements = (
  messages: Message[],
  selectedMessageId: string,
  selectedNodes: Set<string>,
  onNodeClick?: (messageId: string, event?: React.MouseEvent) => void,
  onNodeDoubleClick?: (messageId: string, event?: React.MouseEvent) => void
) => {
  const [timelinePosition, setTimelinePosition] = useState(1.0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'assistant' | 'merged'>('all');

  const convertToFlowElements = useCallback(() => {
    const flowNodes: Node<MessageNodeData>[] = [];
    const flowEdges: Edge[] = [];
    const horizontalSpacing = 400;
    const verticalSpacing = 250;

    if (!messages || messages.length === 0) {
      return { nodes: flowNodes, edges: flowEdges };
    }

    // Get all messages for timeline calculation
    const allMessages = MessageHelpers.getAllMessages(messages);
    
    const processNode = (message: Message, x: number, y: number, level = 0) => {
      // Apply timeline filter
      if (timelinePosition < 1.0) {
        const messageTime = new Date(message.timestamp).getTime();
        const now = Date.now();
        const oldestTime = Math.min(...allMessages.map(m => new Date(m.timestamp).getTime()));
        const cutoffTime = oldestTime + (now - oldestTime) * timelinePosition;

        if (messageTime > cutoffTime) {
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
        const isSelected = selectedMessageId === message.id;
        const isMultiSelected = selectedNodes.has(message.id);

        flowNodes.push({
          id: message.id,
          type: 'message',
          position: { x, y },
          data: {
            message,
            onNodeClick,
            onNodeDoubleClick,
            isMultiSelected,
            selectedMessageId,
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
    onNodeClick,
    onNodeDoubleClick
  ]);

  const { nodes, edges } = useMemo(() => convertToFlowElements(), [convertToFlowElements]);

  const setTimelinePositionSafe = useCallback((position: number) => {
    setTimelinePosition(Math.max(0, Math.min(1, position)));
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

  return {
    // Flow elements
    nodes,
    edges,
    
    // Filter state
    timelinePosition,
    searchTerm,
    filterType,
    
    // Filter controls
    setTimelinePosition: setTimelinePositionSafe,
    setSearchTerm,
    setFilterType,
    resetFilters,
    
    // Stats
    getFilteredMessageCount
  };
};