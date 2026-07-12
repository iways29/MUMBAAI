import React, { useState, useRef, useEffect } from 'react';
import { Panel } from 'reactflow';
import { Sparkles, ChevronDown, Check } from 'lucide-react';
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
        <div className="p-4 bg-panel rounded-node border border-hairline max-w-sm">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <span className="text-[12px] font-semibold uppercase tracking-kicker text-smoke">
              Smart Merge
            </span>
            <span className="text-[12px] text-ash">
              {effectiveMergeCount > 0 ? `${effectiveMergeCount} selected` : 'none selected'}
            </span>
          </div>

          {canMerge ? (
            <div className="mb-3 relative" ref={dropdownRef}>
              <div className="flex">
                <button
                  data-tutorial-smartmerge
                  onClick={() => onPerformMerge()}
                  className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-plum hover:bg-plum-hover text-bone rounded-l-pill text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast disabled:opacity-50"
                  disabled={isLoading}
                >
                  <Sparkles size={13} />
                  {isLoading ? 'Merging…' : `${mergeTemplateLabels[mergeTemplate]} · ${effectiveMergeCount}`}
                </button>
                <button
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  className="px-2.5 bg-plum hover:bg-plum-hover text-bone rounded-r-pill transition-colors duration-fast disabled:opacity-50"
                  style={{ borderLeft: '1px solid rgba(255,255,255,0.25)' }}
                  disabled={isLoading}
                  title="Choose merge template"
                >
                  <ChevronDown size={12} />
                </button>
              </div>

              {showTemplateDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-panel border border-hairline rounded-node z-10 overflow-hidden">
                  {(Object.keys(mergeTemplateLabels) as MergeTemplate[]).map((template, i, arr) => (
                    <button
                      key={template}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full px-3.5 py-2.5 text-left text-[13px] hover:bg-panel-2 transition-colors duration-fast ${
                        template === mergeTemplate ? 'text-bone' : 'text-ash'
                      } ${i < arr.length - 1 ? 'border-b border-hairline' : ''}`}
                    >
                      {mergeTemplateLabels[template]}
                      {template === mergeTemplate && <Check size={12} className="float-right text-plum mt-0.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-smoke leading-relaxed mb-3">
              Select 2+ nodes to merge — tap the{' '}
              <Sparkles size={11} className="inline -mt-0.5 text-smoke" /> circle on each node
              (or Ctrl+click), then combine them into one answer.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={onFitView}
              className="flex-1 px-3 py-1.5 border border-hairline hover:border-hairline-strong text-ash hover:text-bone rounded-pill text-[12px] transition-colors duration-fast"
            >
              Fit view
            </button>
            <button
              onClick={onClearSelection}
              className="flex-1 px-3 py-1.5 border border-hairline hover:border-hairline-strong text-ash hover:text-bone rounded-pill text-[12px] transition-colors duration-fast"
            >
              Clear
            </button>
          </div>

          {/* Status line — lives here so the minimap owns bottom-right */}
          <div className="flex items-center gap-3 text-[11px] text-smoke mt-3 pt-3 border-t border-hairline">
            <span>{allMessagesCount} messages</span>
            <span>·</span>
            <span>Double-click a node to open it</span>
          </div>
        </div>
      </Panel>
    </>
  );
};
