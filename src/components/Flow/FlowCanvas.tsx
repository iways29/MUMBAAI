import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
// DownloadButton is now integrated into FlowControls

const nodeTypes = {
  message: MessageNode,
};

interface FlowCanvasProps {
  nodes: any[];
  edges: any[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  showMiniMap: boolean;
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
  onToggleMiniMap: () => void;
  allMessagesCount: number;
  // Add this prop for the download button
  conversationName?: string;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  showMiniMap,
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
  onToggleMiniMap,
  allMessagesCount,
  conversationName // Add this prop
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
    <div className="flex-1 flex flex-col bg-gray-50 relative">
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
          onToggleMiniMap={onToggleMiniMap}
          showMiniMap={showMiniMap}
          conversationName={conversationName}
        />

        {/* Flow Panels */}
        <FlowPanels
          chatPanelCollapsed={chatPanelCollapsed}
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