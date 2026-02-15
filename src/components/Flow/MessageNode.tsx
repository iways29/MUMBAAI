import React from 'react';
import { Handle, Position } from 'reactflow';
import { User, Bot, GitBranch, Sparkles, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MessageNodeData } from '../../types/flow.ts';
import { MessageHelpers } from '../../utils/messageHelpers.ts';

interface MessageNodeProps {
  data: MessageNodeData;
  selected?: boolean;
}

export const MessageNode: React.FC<MessageNodeProps> = ({ data, selected }) => {
  const { message, onNodeClick, onNodeDoubleClick, isMultiSelected, selectedMessageId, hasMultiSelections } = data;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick?.(message.id, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeDoubleClick?.(message.id, e);
  };

  const isMergedNode = MessageHelpers.isMergedMessage(message);
  const isCurrentlySelected = message.id === selectedMessageId;
  const isThisNodeMultiSelected = isMultiSelected;
  const isMultiSelectModeActive = hasMultiSelections || false;

  // Determine border styling based on selection state
  const getBorderStyling = () => {
    // If this node is multi-selected OR (this is active node AND multi-select mode is active)
    if (isThisNodeMultiSelected || (isCurrentlySelected && isMultiSelectModeActive)) {
      return 'border-red-400 ring-2 ring-red-200';
    } else if (isCurrentlySelected && !isMultiSelectModeActive) {
      // Single selection gets blue border only when no multi-selection is happening
      return 'border-blue-400 ring-2 ring-blue-200';
    } else {
      // Default styling
      return 'border-gray-200 hover:border-gray-300';
    }
  };

  return (
    <div
      className={`relative rounded-xl shadow-md border-2 transition-all cursor-pointer hover:shadow-lg min-w-[300px] max-w-[350px] ${
        message.type === 'user' ? 'bg-blue-50' : 'bg-green-50'
      } ${getBorderStyling()}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      {/* Header */}
      <div className={`p-4 rounded-t-xl border-b ${
        message.type === 'user' ? 'border-blue-100' : 'border-green-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
            }`}>
              {message.type === 'user' ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-white" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-gray-900">
                {message.type === 'user' ? 'You' : 'Assistant'}
              </span>
              {message.type === 'assistant' && message.model && (
                <span className="text-xs text-gray-500">
                  {message.model.includes('claude') ? 'Claude' :
                   message.model.includes('gpt') ? 'GPT' :
                   message.model.includes('gemini') ? 'Gemini' : message.model}
                  {' · '}
                  {message.model.includes('haiku') ? 'Haiku' :
                   message.model.includes('sonnet') ? 'Sonnet' :
                   message.model.includes('opus') ? 'Opus' :
                   message.model.includes('5-mini') ? '5 Mini' :
                   message.model.includes('4.1-mini') ? '4.1 Mini' :
                   message.model.includes('4o-mini') ? '4o Mini' :
                   message.model.includes('gpt-5') ? '5' :
                   message.model.includes('gpt-4.1') ? '4.1' :
                   message.model.includes('gpt-4o') ? '4o' :
                   message.model.includes('2.5-flash') ? '2.5 Flash' :
                   message.model.includes('1.5-flash') ? '1.5 Flash' :
                   message.model}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-800 flex-shrink-0">
            {MessageHelpers.formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-sm text-gray-900 leading-relaxed mb-3 break-words">
          {message.type === 'assistant' ? (
            <div className="prose prose-sm max-w-none prose-gray pointer-events-none">
              <ReactMarkdown 
                components={{
                  p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                  strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({children}) => <em className="italic">{children}</em>,
                  code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                  pre: ({children}) => <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">{children}</pre>,
                  ul: ({children}) => <ul className="list-disc pl-3 mb-1">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal pl-3 mb-1">{children}</ol>,
                  li: ({children}) => <li className="mb-0.5">{children}</li>,
                  h1: ({children}) => <h1 className="text-base font-semibold mb-1 text-gray-900">{children}</h1>,
                  h2: ({children}) => <h2 className="text-sm font-semibold mb-1 text-gray-900">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-semibold mb-1 text-gray-900">{children}</h3>,
                  blockquote: ({children}) => <blockquote className="border-l-2 border-gray-300 pl-2 italic text-gray-700 mb-1">{children}</blockquote>
                }}
              >
                {MessageHelpers.truncateText(message.content)}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {MessageHelpers.truncateText(message.content)}
            </div>
          )}
        </div>

        {message.children && message.children.length > 0 && (
          <div className={`inline-flex items-center gap-2 text-xs text-gray-900 px-3 py-1.5 rounded border ${
            message.type === 'user' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <GitBranch size={12} />
            <span>{message.children.length} response{message.children.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {isMergedNode && (
          <div className="flex items-center gap-2 text-xs text-purple-900 bg-purple-50 px-2 py-1 rounded mt-2">
            <Sparkles size={12} />
            <span>Merged from {message.mergedFrom?.length} branches</span>
          </div>
        )}
      </div>

      {/* Indicators */}
      {isThisNodeMultiSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}

      {/* Active node indicator when in multi-select mode */}
      {isCurrentlySelected && isMultiSelectModeActive && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
          <Star size={12} className="text-white" />
        </div>
      )}

      {isMergedNode && (
        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
          <Sparkles size={14} className="text-white" />
        </div>
      )}
    </div>
  );
};