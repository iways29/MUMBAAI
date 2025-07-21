// src/components/FlowCanvas.jsx
import React from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Panel,
  ConnectionLineType
} from 'reactflow';
import { Play, Pause, RotateCcw, Search, Eye, EyeOff, GitBranch, Sparkles } from 'lucide-react';

const FlowCanvas = ({
  // React Flow props
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  
  // State props
  chatPanelCollapsed,
  showMiniMap,
  searchTerm,
  filterType,
  timelinePosition,
  isAnimating,
  selectedNodes,
  selectedMessageId,
  isLoading,
  currentConversation,
  
  // Setter props
  setShowMiniMap,
  setSearchTerm,
  setFilterType,
  setTimelinePosition,
  setSelectedNodes,
  
  // Handler props
  startTimelineAnimation,
  resetTimeline,
  performIntelligentMerge,
  fitView,
  getAllMessages,
  getEffectiveMergeCount
}) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 relative">
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

        {/* Timeline Controls - Top Center - Show when chat collapsed */}
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
          </Panel>
        )}

        {/* Top Controls - Only show when chat panel is not collapsed */}
        {!chatPanelCollapsed && (
          <Panel position="top-right">
            <div className="flex items-center gap-2 bg-white rounded-xl shadow border border-gray-200 p-3">
              <div className="flex items-center gap-1">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-24 text-xs border-none bg-transparent focus:outline-none placeholder-gray-400"
                />
              </div>

              <div className="w-px h-4 bg-gray-300"></div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border-none bg-transparent focus:outline-none"
              >
                <option value="all">All</option>
                <option value="user">User</option>
                <option value="assistant">Assistant</option>
                <option value="merged">Merged</option>
              </select>

              <div className="w-px h-4 bg-gray-300"></div>

              <button
                onClick={() => setShowMiniMap(!showMiniMap)}
                className="p-1 text-gray-700 hover:bg-gray-100 rounded"
                title="Toggle MiniMap"
              >
                {showMiniMap ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Panel>
        )}

        {/* Search Controls - Top Right - Show when chat collapsed */}
        {chatPanelCollapsed && (
          <Panel position="top-right">
            <div className="flex items-center gap-2 bg-white rounded-xl shadow border border-gray-200 p-3">
              <div className="flex items-center gap-1">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-24 text-xs border-none bg-transparent focus:outline-none placeholder-gray-400"
                />
              </div>

              <div className="w-px h-4 bg-gray-300"></div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border-none bg-transparent focus:outline-none"
              >
                <option value="all">All</option>
                <option value="user">User</option>
                <option value="assistant">Assistant</option>
                <option value="merged">Merged</option>
              </select>
            </div>
          </Panel>
        )}

        {/* Merge Controls - Bottom Left - Show when chat collapsed */}
        {chatPanelCollapsed && (
          <Panel position="bottom-left">
            <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <GitBranch size={14} />
                <span>Ctrl+click • Double-click to focus</span>
              </div>

              <div className="text-sm mb-3">
                <span className="text-blue-600 font-medium">Selected: {selectedNodes.size} nodes</span>
                {selectedMessageId && selectedNodes.size > 0 && !selectedNodes.has(selectedMessageId) && (
                  <span className="text-green-600 ml-1">+ active node</span>
                )}
              </div>

              {getEffectiveMergeCount() >= 2 ? (
                <button
                  onClick={performIntelligentMerge}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium mb-2"
                  disabled={isLoading}
                >
                  <Sparkles size={14} />
                  {isLoading ? 'Merging...' : `Smart Merge ${getEffectiveMergeCount()} nodes`}
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
                  onClick={() => setSelectedNodes(new Set())}
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
            {currentConversation && (
              <>
                <div className="text-gray-700 font-medium">
                  {getAllMessages(currentConversation.messages).length} messages
                </div>
                <div className="text-gray-500">
                  {selectedNodes.size} selected
                </div>
              </>
            )}
            <div className="text-gray-400 mt-1">
              💡 Double-click to focus
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;