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
  onPerformMerge: () => void;
  isLoading: boolean;
  effectiveMergeCount: number;
  allMessagesCount: number;
  // Add this prop for the download button
  conversationName?: string;
  // Add callback for layout
  onLayoutApplied?: (nodes: any[], edges: any[]) => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  chatPanelCollapsed,
  selectedNodes,
  onClearSelection,
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
  conversationName, // Add this prop
  onLayoutApplied
}) => {
  const { fitView } = useReactFlow();

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

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

  // Auto-fit view only for the first node in a conversation or significant changes
  const prevNodeCountRef = useRef(0);
  useEffect(() => {
    // Only auto-fit if this is the first node(s) or if nodes were previously empty
    if (nodes.length > 0 && prevNodeCountRef.current === 0) {
      const timeoutId = setTimeout(() => {
        fitView({ 
          padding: 0.2, 
          duration: 600,
          minZoom: 0.5,
          maxZoom: 1.2
        });
      }, 150);

      return () => clearTimeout(timeoutId);
    }
    
    prevNodeCountRef.current = nodes.length;
  }, [nodes.length, fitView]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 relative" style={{ width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        className="bg-gray-50 h-full"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
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
        />
      </ReactFlow>
    </div>
  );
};