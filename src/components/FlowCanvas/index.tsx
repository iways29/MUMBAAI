import React from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Panel,
  ConnectionLineType,
  Node,
  Edge
} from 'reactflow';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

interface FlowCanvasProps {
  // Flow state
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  nodeTypes: any;

  // UI state
  showMiniMap: boolean;
  chatPanelCollapsed: boolean;
  infoPanelCollapsed: boolean;

  // Timeline state
  timelinePosition: number;
  isAnimating: boolean;

  // Actions
  startTimelineAnimation: () => void;
  resetTimeline: () => void;
  setTimelinePosition: (position: number) => void;
  fitView: (options?: any) => void;
  clearNodeSelection: () => void;

  // Merge functionality
  effectiveMergeCount: number;
  performIntelligentMerge: () => void;
  isLoading: boolean;

  // Conversation info
  messageCount: number;
  selectedNodesCount: number;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  showMiniMap,
  chatPanelCollapsed,
  infoPanelCollapsed,
  timelinePosition,
  isAnimating,
  startTimelineAnimation,
  resetTimeline,
  setTimelinePosition,
  fitView,
  clearNodeSelection,
  effectiveMergeCount,
  performIntelligentMerge,
  isLoading,
  messageCount,
  selectedNodesCount
}) => {
  return (
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
      
      <Background variant="dots" gap={20} size={1} />

      {/* Timeline Controls - Show when chat collapsed */}
      {chatPanelCollapsed && (
        <Panel position="top-center">
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
            <div className="w-32">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={timelinePosition}
                onChange={(e) => setTimelinePosition(parseFloat(e.target.value))}
                className="w-full"
                disabled={isAnimating}
              />
            </div>
            <span className="text-xs text-gray-500 min-w-fit">
              {Math.round(timelinePosition * 100)}%
            </span>
          </div>
        </Panel>
      )}

      {/* Node Selection Panel */}
      {infoPanelCollapsed && (
        <Panel position="top-right">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3 w-64">
            {effectiveMergeCount >= 2 ? (
              <button
                onClick={performIntelligentMerge}
                className="flex items-center gap-2 w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium mb-2"
                disabled={isLoading}
              >
                <Sparkles size={14} />
                {isLoading ? 'Merging...' : `Smart Merge ${effectiveMergeCount} nodes`}
              </button>
            ) : (
              <div className="text-sm text-gray-500 text-center py-2 mb-2">
                Select 2+ nodes to merge
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => fitView({ padding: 0.3, duration: 800 })}
                className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
              >
                Fit View
              </button>
              <button
                onClick={clearNodeSelection}
                className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        </Panel>
      )}

      {/* Status Panel */}
      <Panel position="bottom-right">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-xs">
          <div className="text-gray-500 mb-1">Quick Info</div>
          <div className="text-gray-700 font-medium">
            {messageCount} messages
          </div>
          <div className="text-gray-500">
            {selectedNodesCount} selected
          </div>
          <div className="text-gray-400 mt-1">
            💡 Double-click to focus
          </div>
          {isLoading && (
            <div className="text-blue-500 mt-1 flex items-center gap-1">
              <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
              AI Processing...
            </div>
          )}
        </div>
      </Panel>
    </ReactFlow>
  );
};