import React, { useState } from 'react';
import { GitBranch, Plus, Search, Clock, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { Conversation } from '../../types/conversation.ts';
import { MessageHelpers } from '../../utils/messageHelpers.ts';

interface ConversationsListPageProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation?: (id: string) => void;
  currentUserId?: string;
}

export const ConversationsListPage: React.FC<ConversationsListPageProps> = ({
  conversations,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  currentUserId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'messages'>('recent');

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter(conv =>
      conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'messages':
          return b.messages.length - a.messages.length;
        case 'recent':
        default:
          const aLastMessage = a.messages[a.messages.length - 1];
          const bLastMessage = b.messages[b.messages.length - 1];
          if (!aLastMessage && !bLastMessage) return 0;
          if (!aLastMessage) return 1;
          if (!bLastMessage) return -1;
          return new Date(bLastMessage.timestamp).getTime() - new Date(aLastMessage.timestamp).getTime();
      }
    });

  const getConversationPreview = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return 'No messages yet';

    const content = lastMessage.content.length > 100
      ? lastMessage.content.substring(0, 100) + '…'
      : lastMessage.content;

    return content;
  };

  const getLastActiveTime = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return 'Never';
    return MessageHelpers.formatTimestamp(lastMessage.timestamp);
  };

  return (
    <div className="bg-void min-h-full">
      {/* Header */}
      <div className="border-b border-hairline">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-[26px] font-extralight text-bone tracking-display mb-1">
                Your canvases
              </h1>
              <p className="text-ash text-[14px] tracking-body">
                Every conversation is a tree — pick one up where you left it.
              </p>
            </div>
            <button
              onClick={onCreateConversation}
              className="flex items-center gap-1.5 bg-plum hover:bg-plum-hover text-bone px-5 py-2.5 rounded-pill transition-colors duration-fast text-[12px] font-semibold uppercase tracking-kicker"
            >
              <Plus size={14} />
              New canvas
            </button>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-smoke" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-panel border border-hairline hover:border-hairline-strong focus:border-plum rounded-pill text-[14px] text-bone placeholder:text-smoke outline-none transition-colors duration-fast"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'messages')}
              className="px-4 py-2.5 bg-panel border border-hairline rounded-pill text-[13px] text-ash outline-none cursor-pointer"
            >
              <option value="recent">Most recent</option>
              <option value="name">Name</option>
              <option value="messages">Message count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversations Grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-20 max-w-sm mx-auto">
            {searchTerm ? (
              <div>
                <div className="w-12 h-12 mx-auto mb-5 rounded-full border border-hairline flex items-center justify-center">
                  <Search size={20} className="text-smoke" />
                </div>
                <h3 className="text-[17px] font-medium text-bone mb-2">Nothing matches</h3>
                <p className="text-ash text-[14px]">Try a different search term.</p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 mx-auto mb-5 rounded-full border border-hairline flex items-center justify-center">
                  <GitBranch size={20} className="text-smoke" />
                </div>
                <h3 className="text-[17px] font-medium text-bone mb-2">No canvases yet</h3>
                <p className="text-ash text-[14px] leading-relaxed mb-7">
                  Start your first conversation — ask anything, then branch it in
                  every direction.
                </p>
                <button
                  onClick={onCreateConversation}
                  className="bg-plum hover:bg-plum-hover text-bone px-6 py-3 rounded-pill transition-colors duration-fast text-[12px] font-semibold uppercase tracking-kicker"
                >
                  Start your first canvas
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-panel rounded-node border border-hairline hover:border-hairline-strong transition-colors duration-fast cursor-pointer group"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-bone mb-1.5 truncate">
                        {conversation.name}
                      </h3>
                      <div className="flex items-center gap-4 text-[12px] text-smoke">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          {MessageHelpers.getAllMessages(conversation.messages).length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {getLastActiveTime(conversation)}
                        </span>
                        {conversation.messages.some(m => MessageHelpers.isMergedMessage(m)) && (
                          <span className="flex items-center gap-1 text-plum">
                            <Sparkles size={12} />
                            merged
                          </span>
                        )}
                      </div>
                    </div>
                    {onDeleteConversation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-smoke hover:text-danger transition-all duration-fast shrink-0"
                        title="Delete conversation"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Preview */}
                  <p className="text-[13px] text-ash line-clamp-3 leading-relaxed tracking-body">
                    {getConversationPreview(conversation)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {conversations.length > 0 && (
        <div className="border-t border-hairline mt-10">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-8 text-[12px] text-smoke">
              <span>{conversations.length} canvases</span>
              <span>{conversations.reduce((sum, conv) => sum + MessageHelpers.getAllMessages(conv.messages).length, 0)} messages</span>
              <span>
                {conversations.filter(conv => {
                  const lastMessage = conv.messages[conv.messages.length - 1];
                  if (!lastMessage) return false;
                  const daysSince = (Date.now() - new Date(lastMessage.timestamp).getTime()) / (1000 * 60 * 60 * 24);
                  return daysSince <= 7;
                }).length} active this week
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
