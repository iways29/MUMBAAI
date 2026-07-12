import React, { useState, useEffect, useRef } from 'react';
import { Panel, useReactFlow, getNodesBounds, getViewportForBounds } from 'reactflow';
import { Search, Play, Pause, RotateCcw, Download, ArrowUpDown, ArrowLeftRight } from 'lucide-react';
import { toPng } from 'html-to-image';

function downloadImage(dataUrl: string, filename: string = 'mumbaai-conversation.png') {
  const a = document.createElement('a');
  a.setAttribute('download', filename);
  a.setAttribute('href', dataUrl);
  a.click();
}

const imageWidth = 1920;
const imageHeight = 1080;

interface FlowControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: string;
  onFilterChange: (type: 'all' | 'user' | 'assistant' | 'merged') => void;
  timelinePosition: number;
  onTimelineChange: (position: number) => void;
  isAnimating: boolean;
  onStartAnimation: () => void;
  onResetTimeline: () => void;
  conversationName?: string;
  onApplyLayout: (direction: 'TB' | 'LR') => void;
}

export const FlowControls: React.FC<FlowControlsProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  timelinePosition,
  onTimelineChange,
  isAnimating,
  onStartAnimation,
  onResetTimeline,
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
        : `mumbaai_conversation_${timestamp}.png`;

      // Convert to PNG with custom styling
      toPng(document.querySelector('.react-flow__viewport') as HTMLElement, {
        backgroundColor: '#000000', // Match the void canvas
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
          backgroundColor: '#000000',
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
      {/* Timeline Controls — always visible; a genuine differentiator, don't bury it.
          Bottom-center keeps it clear of the top-right search cluster. */}
      <Panel position="bottom-center">
          <div className="flex items-center gap-3 bg-panel rounded-node border border-hairline p-3">
            <button
              onClick={onStartAnimation}
              className="p-2 text-ash hover:text-bone hover:bg-panel-2 rounded-[8px] transition-colors duration-fast"
              title={isAnimating ? "Pause Animation" : "Play Timeline Animation"}
            >
              {isAnimating ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              onClick={onResetTimeline}
              className="p-2 text-ash hover:text-bone hover:bg-panel-2 rounded-[8px] transition-colors duration-fast"
              title="Reset Timeline"
            >
              <RotateCcw size={16} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-smoke">Timeline</span>
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
              <span className="text-xs text-smoke w-8">
                {Math.round(timelinePosition * 100)}%
              </span>
            </div>
          </div>
      </Panel>

      {/* Search and Filter Controls */}
      <Panel position="top-right">
        <div className="flex items-center gap-2 bg-panel rounded-node border border-hairline p-3">
          <div className="flex items-center gap-1">
            <Search size={14} className="text-smoke" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-24 text-xs text-bone border-none bg-transparent focus:outline-none placeholder:text-smoke"
            />
          </div>

          <div className="w-px h-4" style={{ background: 'var(--color-hairline)' }}></div>

          {/* Auto Layout Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
              className="p-1 text-ash hover:text-bone hover:bg-panel-2 rounded transition-colors duration-fast"
              title={`Auto Layout (${currentLayout === 'TB' ? 'Vertical' : 'Horizontal'})`}
            >
              {currentLayout === 'TB' ? <ArrowUpDown size={14} /> : <ArrowLeftRight size={14} />}
            </button>
            
            {showLayoutDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-panel border border-hairline rounded-node z-10 min-w-[130px] overflow-hidden">
                <button
                  onClick={() => handleLayoutSelect('TB')}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-panel-2 flex items-center gap-2 border-b border-hairline transition-colors duration-fast ${
                    currentLayout === 'TB' ? 'text-bone' : 'text-ash'
                  }`}
                >
                  <ArrowUpDown size={12} />
                  Vertical
                  {currentLayout === 'TB' && <span className="ml-auto text-plum">✓</span>}
                </button>
                <button
                  onClick={() => handleLayoutSelect('LR')}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-panel-2 flex items-center gap-2 transition-colors duration-fast ${
                    currentLayout === 'LR' ? 'text-bone' : 'text-ash'
                  }`}
                >
                  <ArrowLeftRight size={12} />
                  Horizontal
                  {currentLayout === 'LR' && <span className="ml-auto text-plum">✓</span>}
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-4" style={{ background: 'var(--color-hairline)' }}></div>

          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value as any)}
            className="text-xs text-ash border-none bg-panel focus:outline-none cursor-pointer"
          >
            <option value="all">All</option>
            <option value="user">User</option>
            <option value="assistant">Assistant</option>
            <option value="merged">Merged</option>
          </select>

          <div className="w-px h-4" style={{ background: 'var(--color-hairline)' }}></div>

          {/* Download Button - Always visible */}
          <button
            onClick={handleDownload}
            className="p-1 text-ash hover:text-bone hover:bg-panel-2 rounded transition-colors duration-fast"
            title="Download conversation as PNG"
          >
            <Download size={14} />
          </button>

        </div>
      </Panel>
    </>
  );
};