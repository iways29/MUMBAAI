import React from 'react';
import { Handle, Position } from 'reactflow';
import { User, Bot, GitBranch, Sparkles } from 'lucide-react';
import { MessageNodeData } from '../../types/flow';
import { MessageHelpers } from '../../utils/messageHelpers';

interface MessageNodeProps {
  data: MessageNodeData;
  selected?: boolean;
}

export const MessageNode: React.FC<MessageNodeProps> = ({ data, selected }) => {
  const { message, onNodeClick, onNodeDoubleClick, isMultiSelected, selectedMessageId } = data;

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

  return (
    <div
      className={`relative bg-white rounded-xl shadow-md border-2 transition-all cursor-pointer hover:shadow-lg min-w-[300px] max-w-[350px] ${
        isCurrentlySelected ? 'border-yellow-400 ring-2 ring-yellow-200' :
        isMultiSelected ? 'border-red-400 ring-2 ring-red-200' :
        'border-gray-200 hover:border-gray-300'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-tutorial={
        message.type === 'user' && message.content.includes('creative project') ? 'first-user-node' :
        message.type === 'assistant' && !isMergedNode ? 'ai-response-node' :
        undefined
      }
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      {/* Header */}
      <div className={`p-4 rounded-t-xl border-b ${
        message.type === 'user' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'
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
            <span className={`text-sm font-semibold ${
              message.type === 'user' ? 'text-blue-700' : 'text-green-700'
            }`}>
              {message.type === 'user' ? 'You' : 'Assistant'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {MessageHelpers.formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-sm text-gray-800 leading-relaxed mb-3">
          {MessageHelpers.truncateText(message.content)}
        </div>

        {message.children && message.children.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            <GitBranch size={12} />
            <span>{message.children.length} response{message.children.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {isMergedNode && (
          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-2">
            <Sparkles size={12} />
            <span>Merged from {message.mergedFrom?.length} branches</span>
          </div>
        )}
      </div>

      {/* Indicators */}
      {isMultiSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-xs font-bold">✓</span>
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