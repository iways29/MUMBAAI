import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionLineType,
  useReactFlow,
  addEdge,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MessageNode } from './MessageNode.tsx';
import { FlowControls } from './FlowControls.tsx';
import { FlowPanels } from './FlowPanels.tsx';
import { MessageNodeData } from '../../types/flow.ts';

const nodeTypes = {
  message: MessageNode,
};

interface FlowCanvasProps {
  nodes: any[];
  edges: any[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
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
  allMessagesCount
}) => {
  const { fitView } = useReactFlow();

  const onConnect = useCallback(
    (params: any) => onEdgesChange(addEdge(params, edges)),
    [onEdgesChange, edges]
  );

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.3, duration: 800 });
    onFitView();
  }, [fitView, onFitView]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 relative" data-tutorial="flow-canvas">
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