import React, { useState, useRef, useEffect } from 'react';
import { Panel } from 'reactflow';
import { GitBranch, Sparkles, ChevronDown } from 'lucide-react';
import { MergeTemplate } from '../../utils/api.ts';

interface FlowPanelsProps {
  selectedNodes: Set<string>;
  onClearSelection: () => void;
  onFitView: () => void;
  canMerge: boolean;
  onPerformMerge: (template?: MergeTemplate) => void;
  isLoading: boolean;
  effectiveMergeCount: number;
  allMessagesCount: number;
  mergeTemplate: MergeTemplate;
  onMergeTemplateChange: (template: MergeTemplate) => void;
}

export const FlowPanels: React.FC<FlowPanelsProps> = ({
  selectedNodes,
  onClearSelection,
  onFitView,
  canMerge,
  onPerformMerge,
  isLoading,
  effectiveMergeCount,
  allMessagesCount,
  mergeTemplate,
  onMergeTemplateChange
}) => {
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mergeTemplateLabels = {
    smart: 'Smart Merge',
    compare: 'Compare & Contrast',
    extract: 'Extract Key Points',
    resolve: 'Resolve Conflicts'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTemplateSelect = (template: MergeTemplate) => {
    onMergeTemplateChange(template);
    setShowTemplateDropdown(false);
    // Don't auto-trigger merge, let user click the button
  };
  return (
    <>
      {/* Merge Controls - Always visible */}
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
              <div className="mb-2 relative" ref={dropdownRef}>
                <div className="flex">
                  <button
                    onClick={() => onPerformMerge()}
                    className="flex items-center gap-2 flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-l-lg text-sm hover:bg-purple-200 transition-colors font-medium"
                    disabled={isLoading}
                  >
                    <Sparkles size={14} />
                    {isLoading ? 'Merging...' : `${mergeTemplateLabels[mergeTemplate]} ${effectiveMergeCount} nodes`}
                  </button>
                  <button
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="px-2 bg-purple-100 text-purple-700 rounded-r-lg text-sm hover:bg-purple-200 transition-colors border-l border-purple-200"
                    disabled={isLoading}
                    title="Choose merge template"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                
                {showTemplateDropdown && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {(Object.keys(mergeTemplateLabels) as MergeTemplate[]).map((template) => (
                      <button
                        key={template}
                        onClick={() => handleTemplateSelect(template)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-50 transition-colors ${
                          template === mergeTemplate ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                        } ${
                          template !== 'resolve' ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        {mergeTemplateLabels[template]}
                        {template === mergeTemplate && <span className="float-right text-purple-500">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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