import React from 'react';
import { Edit } from 'lucide-react';
import { Conversation } from '../../types/conversation';

interface ConversationSelectorProps {
  conversations: Conversation[];
  activeConversation: string;
  onConversationChange: (id: string) => void;
  isRenaming: boolean;
  tempName: string;
  onStartRenaming: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onTempNameChange: (name: string) => void;
}

export const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  conversations,
  activeConversation,
  onConversationChange,
  isRenaming,
  tempName,
  onStartRenaming,
  onSaveRename,
  onCancelRename,
  onTempNameChange
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveRename();
    } else if (e.key === 'Escape') {
      onCancelRename();
    }
  };

  if (isRenaming) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={tempName}
          onChange={(e) => onTempNameChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={onSaveRename}
          className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={activeConversation}
        onChange={(e) => onConversationChange(e.target.value)}
        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {conversations.map(conv => (
          <option key={conv.id} value={conv.id}>{conv.name}</option>
        ))}
      </select>
      <button
        onClick={onStartRenaming}
        className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Rename Conversation"
      >
        <Edit size={16} />
      </button>
    </div>
  );
};