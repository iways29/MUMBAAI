// src/hooks/useFlowElements.js
import { useCallback } from 'react';
import { MarkerType } from 'reactflow';

const useFlowElements = (
  selectedMessageId,
  selectedNodes,
  handleNodeClick,
  handleNodeDoubleClick,
  timelinePosition,
  searchTerm,
  filterType,
  isMessageVisible
) => {
  // Convert conversation messages to React Flow nodes and edges
  const convertToFlowElements = useCallback((messages) => {
    const flowNodes = [];
    const flowEdges = [];
    const horizontalSpacing = 400;
    const verticalSpacing = 250;

    const processNode = (message, x, y, level = 0) => {
      // Apply timeline filter
      if (!isMessageVisible(message.timestamp, messages)) {
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
          selectedMessageId,
        },
        selected: false,
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
  }, [
    selectedMessageId,
    selectedNodes,
    handleNodeClick,
    handleNodeDoubleClick,
    timelinePosition,
    searchTerm,
    filterType,
    isMessageVisible
  ]);

  // Get all messages in a flat array (for utility purposes)
  const getAllMessages = useCallback((messages) => {
    let allMessages = [];
    const traverse = (msgs) => {
      msgs.forEach(msg => {
        allMessages.push(msg);
        if (msg.children) traverse(msg.children);
      });
    };
    traverse(messages);
    return allMessages;
  }, []);

  // Filter messages based on current filters
  const getFilteredMessages = useCallback((messages) => {
    const allMessages = getAllMessages(messages);
    
    return allMessages.filter(message => {
      // Timeline filter
      if (!isMessageVisible(message.timestamp, allMessages)) {
        return false;
      }

      // Search filter
      if (searchTerm && !message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'merged' && (!message.mergedFrom || message.mergedFrom.length === 0)) {
          return false;
        }
        if (filterType !== 'merged' && message.type !== filterType) {
          return false;
        }
      }

      return true;
    });
  }, [searchTerm, filterType, isMessageVisible, getAllMessages]);

  // Get statistics about current view
  const getFlowStats = useCallback((messages) => {
    const all = getAllMessages(messages);
    const filtered = getFilteredMessages(messages);
    
    return {
      totalMessages: all.length,
      visibleMessages: filtered.length,
      userMessages: filtered.filter(m => m.type === 'user').length,
      assistantMessages: filtered.filter(m => m.type === 'assistant').length,
      mergedMessages: filtered.filter(m => m.mergedFrom && m.mergedFrom.length > 0).length,
    };
  }, [getAllMessages, getFilteredMessages]);

  return {
    convertToFlowElements,
    getAllMessages,
    getFilteredMessages,
    getFlowStats
  };
};

export default useFlowElements;