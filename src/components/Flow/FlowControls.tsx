import React, { useState, useEffect, useRef } from 'react';
import { Panel, useReactFlow, getNodesBounds, getViewportForBounds } from 'reactflow';
import { Search, Eye, EyeOff, Play, Pause, RotateCcw, Download, ArrowUpDown, ArrowLeftRight } from 'lucide-react';
import { toPng } from 'html-to-image';

function downloadImage(dataUrl: string, filename: string = 'flowchat-conversation.png') {
  const a = document.createElement('a');
  a.setAttribute('download', filename);
  a.setAttribute('href', dataUrl);
  a.click();
}

const imageWidth = 1920;
const imageHeight = 1080;

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
  conversationName?: string;
  onApplyLayout: (direction: 'TB' | 'LR') => void;
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
  showMiniMap,
  conversationName,
  onApplyLayout
}) => {
  const { getNodes } = useReactFlow();
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<'TB' | 'LR'>('TB');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLayoutDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLayoutSelect = (direction: 'TB' | 'LR') => {
    setCurrentLayout(direction);
    onApplyLayout(direction);
    setShowLayoutDropdown(false);
  };

  const handleDownload = () => {
    try {
      // Calculate transform for all visible nodes
      const nodesBounds = getNodesBounds(getNodes());
      const viewport = getViewportForBounds(
        nodesBounds, 
        imageWidth, 
        imageHeight, 
        0.5, // minZoom
        2,   // maxZoom
        0.1  // padding
      );

      // Generate filename based on conversation name and timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = conversationName 
        ? `${conversationName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.png`
        : `flowchat_conversation_${timestamp}.png`;

      // Convert to PNG with custom styling
      toPng(document.querySelector('.react-flow__viewport') as HTMLElement, {
        backgroundColor: '#f9fafb', // Match your app's background
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
        pixelRatio: 2, // Higher quality
        quality: 0.95,
      }).then((dataUrl) => {
        downloadImage(dataUrl, filename);
      }).catch((error) => {
        console.error('Error generating image:', error);
        // Fallback: try with basic settings
        toPng(document.querySelector('.react-flow__viewport') as HTMLElement, {
          backgroundColor: '#f9fafb',
          pixelRatio: 1,
        }).then((dataUrl) => {
          downloadImage(dataUrl, filename);
        }).catch((fallbackError) => {
          console.error('Fallback image generation failed:', fallbackError);
          alert('Failed to generate image. Please try again.');
        });
      });
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download image. Please try again.');
    }
  };

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

          {/* Auto Layout Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={`Auto Layout (${currentLayout === 'TB' ? 'Vertical' : 'Horizontal'})`}
            >
              {currentLayout === 'TB' ? <ArrowUpDown size={14} /> : <ArrowLeftRight size={14} />}
            </button>
            
            {showLayoutDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => handleLayoutSelect('TB')}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 ${
                    currentLayout === 'TB' ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <ArrowUpDown size={12} />
                  Vertical
                  {currentLayout === 'TB' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
                <button
                  onClick={() => handleLayoutSelect('LR')}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 ${
                    currentLayout === 'LR' ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <ArrowLeftRight size={12} />
                  Horizontal
                  {currentLayout === 'LR' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
              </div>
            )}
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

          <div className="w-px h-4 bg-gray-300"></div>

          {/* Download Button - Always visible */}
          <button
            onClick={handleDownload}
            className="p-1 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Download conversation as PNG"
          >
            <Download size={14} />
          </button>

          {/* MiniMap Toggle - Only visible when chat panel is expanded */}
          {!chatPanelCollapsed && (
            <button
              onClick={onToggleMiniMap}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
              title="Toggle MiniMap"
            >
              {showMiniMap ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      </Panel>
    </>
  );
};