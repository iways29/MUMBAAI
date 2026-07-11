import React from 'react';
import { Handle, Position } from 'reactflow';
import { User, Bot, GitBranch, Sparkles, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MessageNodeData } from '../../types/flow.ts';
import { MessageHelpers } from '../../utils/messageHelpers.ts';
import { ReactComponent as AnthropicIcon } from '../../assets/anthropic.svg';
import { ReactComponent as OpenAIIcon } from '../../assets/openai.svg';
import { ReactComponent as GoogleIcon } from '../../assets/google-gemini.svg';

interface MessageNodeProps {
  data: MessageNodeData;
  selected?: boolean;
}

// Helper to get model display info
const getModelInfo = (model: string | undefined) => {
  if (!model) return null;

  if (model.includes('claude')) {
    const variant = model.includes('haiku') ? 'Haiku' :
                    model.includes('sonnet') ? 'Sonnet' :
                    model.includes('opus') ? 'Opus' : '';
    return { provider: 'Claude', variant, icon: AnthropicIcon };
  }

  if (model.includes('gpt')) {
    const variant = model.includes('5-mini') ? '5 Mini' :
                    model.includes('4.1-mini') ? '4.1 Mini' :
                    model.includes('4o-mini') ? '4o Mini' :
                    model.includes('gpt-5') ? '5' :
                    model.includes('gpt-4.1') ? '4.1' :
                    model.includes('gpt-4o') ? '4o' : '';
    return { provider: 'GPT', variant, icon: OpenAIIcon };
  }

  if (model.includes('gemini')) {
    const variant = model.includes('2.5-flash') ? '2.5 Flash' :
                    model.includes('1.5-flash') ? '1.5 Flash' : '';
    return { provider: 'Gemini', variant, icon: GoogleIcon };
  }

  return null;
};

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-bone">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  code: ({ children }: any) => (
    <code className="bg-panel-2 px-1 py-0.5 rounded text-xs font-mono text-bone">{children}</code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-panel-2 p-2 rounded-[8px] text-xs font-mono overflow-x-auto">{children}</pre>
  ),
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-1.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-1.5">{children}</ol>,
  li: ({ children }: any) => <li className="mb-0.5">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-base font-semibold mb-1 text-bone">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-sm font-semibold mb-1 text-bone">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-semibold mb-1 text-bone">{children}</h3>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-hairline-strong pl-2 italic text-ash mb-1.5">{children}</blockquote>
  ),
};

export const MessageNode: React.FC<MessageNodeProps> = ({ data, selected }) => {
  const { message, onNodeClick, onNodeDoubleClick, isMultiSelected, selectedMessageId, hasMultiSelections } = data;
  const modelInfo = getModelInfo(message.model);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick?.(message.id, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeDoubleClick?.(message.id, e);
  };

  // The merge-select affordance simulates ctrl+click so it shares the
  // multi-select code path in MainApp.
  const handleMergeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick?.(message.id, { ...e, ctrlKey: true } as React.MouseEvent);
  };

  const isMergedNode = MessageHelpers.isMergedMessage(message);
  const isCurrentlySelected = message.id === selectedMessageId;
  const isInMergeSet = isMultiSelected || (isCurrentlySelected && hasMultiSelections);

  const borderClass = isInMergeSet
    ? 'border-plum'
    : isCurrentlySelected
    ? 'border-plum'
    : 'border-hairline hover:border-hairline-strong';

  return (
    <div
      data-tutorial-node={message.id}
      data-node-type={message.type}
      className={`group relative rounded-node border transition-colors duration-fast cursor-pointer min-w-[280px] max-w-[340px] ${borderClass}`}
      style={{
        background: isCurrentlySelected || isInMergeSet ? 'var(--color-plum-soft)' : 'var(--color-panel)',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      {/* Header */}
      <div className="px-4 pt-3.5 pb-2.5 border-b border-hairline">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-full border border-hairline flex items-center justify-center shrink-0">
              {message.type === 'user' ? (
                <User size={13} className="text-bone" />
              ) : modelInfo ? (
                <modelInfo.icon width={13} height={13} className="text-bone" />
              ) : (
                <Bot size={13} className="text-bone" />
              )}
            </span>
            <div className="min-w-0">
              <span className="block text-[13px] font-semibold text-bone leading-tight">
                {message.type === 'user' ? 'You' : modelInfo ? modelInfo.provider : 'Assistant'}
              </span>
              {message.type === 'assistant' && modelInfo && modelInfo.variant && (
                <span className="block text-[11px] text-smoke leading-tight">{modelInfo.variant}</span>
              )}
            </div>
            {isMergedNode && (
              <span className="flex items-center gap-1 text-[11px] text-plum shrink-0">
                <Sparkles size={11} />
                Merged
              </span>
            )}
          </div>
          <span className="text-[11px] text-smoke shrink-0">
            {MessageHelpers.formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <div className="text-[13px] text-ash leading-relaxed tracking-body break-words">
          {message.type === 'assistant' ? (
            <div className="pointer-events-none">
              <ReactMarkdown components={markdownComponents}>
                {MessageHelpers.truncateText(message.content)}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-bone">
              {MessageHelpers.truncateText(message.content)}
            </div>
          )}
        </div>

        {/* Footer row: branch count + affordances */}
        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="flex items-center gap-2">
            {message.children && message.children.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-smoke">
                <GitBranch size={11} />
                {message.children.length} {message.children.length > 1 ? 'branches' : 'branch'}
              </span>
            )}
            {isMergedNode && message.mergedFrom && (
              <span className="text-[11px] text-smoke">from {message.mergedFrom.length} branches</span>
            )}
          </div>

          {/* Branch affordance — persistently visible at low emphasis,
              brightens on hover. Discoverability > minimalism here. */}
          <button
            data-tutorial-branch
            onClick={handleClick}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-kicker rounded-pill border px-2.5 py-1 transition-colors duration-fast ${
              isCurrentlySelected
                ? 'border-plum text-bone'
                : 'border-hairline text-smoke group-hover:text-ash group-hover:border-hairline-strong'
            }`}
            title="Reply from this point — your next message branches here"
          >
            <GitBranch size={10} />
            {isCurrentlySelected ? 'Branching here' : 'Branch'}
          </button>
        </div>
      </div>

      {/* Merge-set affordance — circular toggle, top-right. Persistently
          visible at low emphasis so first-time users can find it. */}
      <button
        data-tutorial-merge
        onClick={handleMergeToggle}
        className={`absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full border flex items-center justify-center transition-opacity duration-fast ${
          isInMergeSet
            ? 'bg-plum border-plum opacity-100'
            : 'bg-panel border-hairline-strong opacity-50 group-hover:opacity-100'
        }`}
        title={isInMergeSet ? 'Remove from merge selection' : 'Add to merge selection (Ctrl+click)'}
      >
        {isInMergeSet ? (
          <Check size={12} className="text-bone" />
        ) : (
          <Sparkles size={11} className="text-smoke" />
        )}
      </button>
    </div>
  );
};
