import React, { useState } from 'react';
import { MessageCircle, Plus, Search, Clock, MessageSquare, Trash2 } from 'lucide-react';
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
    if (!lastMessage) return "No messages yet";
    
    const content = lastMessage.content.length > 100 
      ? lastMessage.content.substring(0, 100) + "..."
      : lastMessage.content;
    
    return content;
  };

  const getLastActiveTime = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return "Never";
    return MessageHelpers.formatTimestamp(lastMessage.timestamp);
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Conversations</h1>
              <p className="text-gray-600">Manage and explore your FlowChat AI conversations</p>
            </div>
            <button
              onClick={onCreateConversation}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              New Conversation
            </button>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'messages')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name</option>
              <option value="messages">Message Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversations Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16">
            {searchTerm ? (
              <div>
                <Search size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No conversations found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              <div>
                <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No conversations yet</h3>
                <p className="text-gray-500 mb-6">Create your first conversation to get started</p>
                <button
                  onClick={onCreateConversation}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Conversation
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                        {conversation.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          <span>{MessageHelpers.getAllMessages(conversation.messages).length} messages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{getLastActiveTime(conversation)}</span>
                        </div>
                      </div>
                    </div>
                    {onDeleteConversation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {getConversationPreview(conversation)}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {conversation.messages.some(m => m.type === 'user') && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full" title="Contains user messages" />
                      )}
                      {conversation.messages.some(m => m.type === 'assistant') && (
                        <div className="w-2 h-2 bg-green-400 rounded-full" title="Contains AI responses" />
                      )}
                      {conversation.messages.some(m => MessageHelpers.isMergedMessage(m)) && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full" title="Contains merged messages" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                      Click to open →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {conversations.length > 0 && (
        <div className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <span>{conversations.length} total conversations</span>
              <span>{conversations.reduce((sum, conv) => sum + MessageHelpers.getAllMessages(conv.messages).length, 0)} total messages</span>
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