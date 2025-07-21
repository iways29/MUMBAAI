import React from 'react';
import { Panel } from 'reactflow';
import { Search, Eye, EyeOff, Play, Pause, RotateCcw } from 'lucide-react';

interface FlowControlsProps {
  chatPanelCollapsed: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: string;
  onFilterChange: (type: 'all' | 'user' | 'assistant' | 'merged') => void;
  timelinePosition: number;
  onTimelineChange: (position: number) => void;
  isAnimating: boolean;
  onStartAnimation: () => void;
  onResetTimeline: () => void;
  onToggleMiniMap: () => void;
  showMiniMap: boolean;
}

export const FlowControls: React.FC<FlowControlsProps> = ({
  chatPanelCollapsed,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  timelinePosition,
  onTimelineChange,
  isAnimating,
  onStartAnimation,
  onResetTimeline,
  onToggleMiniMap,
  showMiniMap
}) => {
  return (
    <>
      {/* Timeline Controls - Show when chat collapsed */}
      {chatPanelCollapsed && (
        <Panel position="top-center">
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
            <button
              onClick={onStartAnimation}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              title={isAnimating ? "Pause Animation" : "Play Timeline Animation"}
            >
              {isAnimating ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              onClick={onResetTimeline}
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
                onChange={(e) => onTimelineChange(parseFloat(e.target.value))}
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

      {/* Search and Filter Controls */}
      <Panel position="top-right">
        <div className="flex items-center gap-2 bg-white rounded-xl shadow border border-gray-200 p-3">
          <div className="flex items-center gap-1">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-24 text-xs border-none bg-transparent focus:outline-none placeholder-gray-400"
            />
          </div>

          <div className="w-px h-4 bg-gray-300"></div>

          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value as any)}
            className="text-xs border-none bg-transparent focus:outline-none"
          >
            <option value="all">All</option>
            <option value="user">User</option>
            <option value="assistant">Assistant</option>
            <option value="merged">Merged</option>
          </select>

          {!chatPanelCollapsed && (
            <>
              <div className="w-px h-4 bg-gray-300"></div>
              <button
                onClick={onToggleMiniMap}
                className="p-1 text-gray-700 hover:bg-gray-100 rounded"
                title="Toggle MiniMap"
              >
                {showMiniMap ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </>
          )}
        </div>
      </Panel>
    </>
  );
};