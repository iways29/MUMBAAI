import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ConnectionLineType,
  useReactFlow,
  BackgroundVariant,
  NodeChange,
  EdgeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MessageNode } from './MessageNode.tsx';
import { FlowControls } from './FlowControls.tsx';
import { FlowPanels } from './FlowPanels.tsx';
import { getLayoutedElements, LayoutDirection } from '../../utils/layoutUtils.ts';
import { MergeTemplate } from '../../utils/api.ts';

const nodeTypes = {
  message: MessageNode,
};

interface FlowCanvasProps {
  nodes: any[];
  edges: any[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  chatPanelCollapsed: boolean;
  selectedNodes: Set<string>;
  onClearSelection: () => void;
  onSelectionChange?: (selectedNodeIds: string[]) => void;
  onFitView: () => void;
  // Flow controls props
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: string;
  onFilterChange: (type: any) => void;
  timelinePosition: number;
  onTimelineChange: (position: number) => void;
  isAnimating: boolean;
  onStartAnimation: () => void;
  onResetTimeline: () => void;
  // Merge controls
  canMerge: boolean;
  onPerformMerge: (template?: MergeTemplate) => void;
  isLoading: boolean;
  effectiveMergeCount: number;
  allMessagesCount: number;
  mergeTemplate: MergeTemplate;
  onMergeTemplateChange: (template: MergeTemplate) => void;
  // Add this prop for the download button
  conversationName?: string;
  // Add callback for layout
  onLayoutApplied?: (nodes: any[], edges: any[]) => void;
  // Add callback for node drag stop to save positions
  onNodeDragStop?: () => void;
  // Add flag to indicate if positions were loaded from database
  hasLoadedPositions?: boolean;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  chatPanelCollapsed,
  selectedNodes,
  onClearSelection,
  onSelectionChange,
  onFitView,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  timelinePosition,
  onTimelineChange,
  isAnimating,
  onStartAnimation,
  onResetTimeline,
  canMerge,
  onPerformMerge,
  isLoading,
  effectiveMergeCount,
  allMessagesCount,
  mergeTemplate,
  onMergeTemplateChange,
  conversationName,
  onLayoutApplied,
  onNodeDragStop,
  hasLoadedPositions = false
}) => {
  const { fitView } = useReactFlow();

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    // Handle selection changes from React Flow
    const selectionChanges = changes.filter(change => change.type === 'select');
    if (selectionChanges.length > 0 && onSelectionChange) {
      
      // Calculate the new selection state based on the changes
      const currentSelection = new Set(nodes.filter(node => node.selected).map(node => node.id));
      
      selectionChanges.forEach(change => {
        if (change.type === 'select' && 'selected' in change) {
          if (change.selected) {
            currentSelection.add(change.id);
          } else {
            currentSelection.delete(change.id);
          }
        }
      });
      
      onSelectionChange(Array.from(currentSelection));
    }
  }, [onNodesChange, onSelectionChange, nodes]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const handleNodeDragStart = useCallback(() => {
    // Node drag started - this can be used to set drag state if needed
  }, []);

  const handleNodeDragStop = useCallback(() => {
    // Node drag ended - save positions to database with delay
    if (onNodeDragStop) {
      // Add a small delay to ensure the final position is captured
      setTimeout(() => {
        onNodeDragStop();
      }, 100);
    }
  }, [onNodeDragStop]);

  const handlePaneClick = useCallback(() => {
    // Clear selection when clicking on background
    if (onClearSelection) {
      onClearSelection();
    }
  }, [onClearSelection]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 800 });
    onFitView();
  }, [fitView, onFitView]);

  const handleApplyLayout = useCallback((direction: LayoutDirection) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    );
    
    // Apply the layout through the callback
    if (onLayoutApplied) {
      onLayoutApplied(layoutedNodes, layoutedEdges);
    }
    
    // Fit view after layout is applied
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [nodes, edges, onLayoutApplied, fitView]);

  // Auto-fit view for initial load - different behavior for saved vs new nodes
  const prevNodeCountRef = useRef(0);
  const hasAppliedInitialFit = useRef(false);
  const prevConversationName = useRef(conversationName);
  
  // Reset fit flag when conversation changes
  useEffect(() => {
    if (conversationName !== prevConversationName.current) {
      hasAppliedInitialFit.current = false;
      prevConversationName.current = conversationName;
    }
  }, [conversationName]);
  
  useEffect(() => {
    // Only auto-fit if this is the first node(s) or if nodes were previously empty
    if (nodes.length > 0 && prevNodeCountRef.current === 0 && !hasAppliedInitialFit.current) {
      const timeoutId = setTimeout(() => {
        if (hasLoadedPositions) {
          // For saved positions: center view on existing nodes
          fitView({ 
            padding: 0.2, 
            duration: 600,
            minZoom: 0.3,
            maxZoom: 1.5
          });
        } else {
          // For new conversations: fit to calculated layout
          fitView({ 
            padding: 0.2, 
            duration: 600,
            minZoom: 0.5,
            maxZoom: 1.2
          });
        }
        hasAppliedInitialFit.current = true;
      }, 150);

      return () => clearTimeout(timeoutId);
    }
    
    prevNodeCountRef.current = nodes.length;
  }, [nodes.length, fitView, hasLoadedPositions]);

  // Additional effect: Center view when positions are loaded for existing nodes
  useEffect(() => {
    if (hasLoadedPositions && nodes.length > 0 && !hasAppliedInitialFit.current) {
      const timeoutId = setTimeout(() => {
        fitView({ 
          padding: 0.2, 
          duration: 400,
          minZoom: 0.3,
          maxZoom: 1.5
        });
        hasAppliedInitialFit.current = true;
      }, 200); // Slightly longer delay to ensure nodes are rendered

      return () => clearTimeout(timeoutId);
    }
  }, [hasLoadedPositions, nodes.length, fitView]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 relative" style={{ width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        className="bg-gray-50 h-full"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={[1, 2]} // Allow panning with left and right mouse buttons
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.3}
        maxZoom={2}
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.2
        }}
      >
        <Controls showInteractive={false} position="top-left" />
        
        
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

        {/* Flow Controls */}
        <FlowControls
          chatPanelCollapsed={chatPanelCollapsed}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          filterType={filterType}
          onFilterChange={onFilterChange}
          timelinePosition={timelinePosition}
          onTimelineChange={onTimelineChange}
          isAnimating={isAnimating}
          onStartAnimation={onStartAnimation}
          onResetTimeline={onResetTimeline}
          conversationName={conversationName}
          onApplyLayout={handleApplyLayout}
        />

        {/* Flow Panels */}
        <FlowPanels
          selectedNodes={selectedNodes}
          onClearSelection={onClearSelection}
          onFitView={handleFitView}
          canMerge={canMerge}
          onPerformMerge={onPerformMerge}
          isLoading={isLoading}
          effectiveMergeCount={effectiveMergeCount}
          allMessagesCount={allMessagesCount}
          mergeTemplate={mergeTemplate}
          onMergeTemplateChange={onMergeTemplateChange}
        />
      </ReactFlow>
    </div>
  );
};