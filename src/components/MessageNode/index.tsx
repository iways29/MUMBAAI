import React from 'react';
import { Handle, Position } from 'reactflow';
import { User, Bot, Sparkles, GitBranch, Bookmark, Share2 } from 'lucide-react';
import { Message } from '../../types/conversation';

interface MessageNodeProps {
  data: {
    message: Message;
    onNodeClick?: (id: string, event: any) => void;
    onNodeDoubleClick?: (id: string, event: any) => void;
    isMultiSelected: boolean;
    selectedMessageId: string;
  };
  selected: boolean;
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateText = (text: string, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isMergedNode = message.mergedFrom && message.mergedFrom.length > 0;

  return (
    <div
      className={`relative bg-white rounded-xl shadow-md border-2 transition-all cursor-pointer hover:shadow-lg min-w-[300px] max-w-[350px] ${
      message.id === selectedMessageId ? 'border-yellow-400 ring-2 ring-yellow-200' :
      isMultiSelected ? 'border-red-400 ring-2 ring-red-200' :
      'border-gray-200 hover:border-gray-300'
    }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      {/* Header */}
      <div className={`p-4 rounded-t-xl border-b ${message.type === 'user' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
              {message.type === 'user' ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-white" />
              )}
            </div>
            <span className={`text-sm font-semibold ${message.type === 'user' ? 'text-black-700' : 'text-black-700'}`}>
              {message.type === 'user' ? 'You' : 'Assistant'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isMergedNode && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                <Sparkles size={10} />
                Merged
              </div>
            )}
            <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-800 leading-relaxed">
          {truncateText(message.content)}
        </p>
      </div>

      {/* Footer with child count and actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {message.children && message.children.length > 0 && (
            <div className="flex items-center gap-1">
              <GitBranch size={12} />
              {message.children.length} replies
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <Bookmark size={12} />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <Share2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};