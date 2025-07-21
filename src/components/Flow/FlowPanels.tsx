import React from 'react';
import { Panel } from 'reactflow';
import { GitBranch, Sparkles } from 'lucide-react';

interface FlowPanelsProps {
  chatPanelCollapsed: boolean;
  selectedNodes: Set<string>;
  onClearSelection: () => void;
  onFitView: () => void;
  canMerge: boolean;
  onPerformMerge: () => void;
  isLoading: boolean;
  effectiveMergeCount: number;
  allMessagesCount: number;
}

export const FlowPanels: React.FC<FlowPanelsProps> = ({
  chatPanelCollapsed,
  selectedNodes,
  onClearSelection,
  onFitView,
  canMerge,
  onPerformMerge,
  isLoading,
  effectiveMergeCount,
  allMessagesCount
}) => {
  return (
    <>
      {/* Merge Controls - Show when chat collapsed */}
      {chatPanelCollapsed && (
        <Panel position="bottom-left">
          <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <GitBranch size={14} />
              <span>Ctrl+click • Double-click to focus</span>
            </div>

            <div className="text-sm mb-3">
              <span className="text-blue-600 font-medium">Selected: {selectedNodes.size} nodes</span>
              {effectiveMergeCount > selectedNodes.size && (
                <span className="text-green-600 ml-1">+ active node</span>
              )}
            </div>

            {canMerge ? (
              <button
                onClick={onPerformMerge}
                className="flex items-center gap-2 w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium mb-2"
                disabled={isLoading}
              >
                <Sparkles size={14} />
                {isLoading ? 'Merging...' : `Smart Merge ${effectiveMergeCount} nodes`}
              </button>
            ) : (
              <div className="text-sm text-gray-500 text-center py-2 mb-2 border border-dashed border-gray-300 rounded">
                Select 2+ nodes to merge
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onFitView}
                className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
              >
                Fit View
              </button>
              <button
                onClick={onClearSelection}
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
            {allMessagesCount} messages
          </div>
          <div className="text-gray-500">
            {selectedNodes.size} selected
          </div>
          <div className="text-gray-400 mt-1">
            💡 Double-click to focus
          </div>
        </div>
      </Panel>
    </>
  );
};