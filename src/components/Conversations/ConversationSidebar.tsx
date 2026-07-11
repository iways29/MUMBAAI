import React, { useState } from 'react';
import { Plus, Search, GitBranch, Sparkles, MoreHorizontal, Trash2 } from 'lucide-react';
import { Conversation } from '../../types/conversation.ts';
import { MessageHelpers } from '../../utils/messageHelpers.ts';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation?: (id: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // id of the row whose overflow menu is open; 'confirm' phase per row
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredConversations = conversations
    .filter(conv =>
      conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1];
      const bLast = b.messages[b.messages.length - 1];
      if (!aLast && !bLast) return 0;
      if (!aLast) return 1;
      if (!bLast) return -1;
      return new Date(bLast.timestamp).getTime() - new Date(aLast.timestamp).getTime();
    });

  const getPreview = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return 'No messages yet';
    return lastMessage.content.length > 64
      ? lastMessage.content.substring(0, 64) + '…'
      : lastMessage.content;
  };

  const getLastActiveTime = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return '';
    return MessageHelpers.formatTimestamp(lastMessage.timestamp);
  };

  const closeMenus = () => {
    setMenuOpenId(null);
    setConfirmDeleteId(null);
  };

  return (
    <aside className="w-[280px] shrink-0 h-full bg-void border-r border-hairline flex flex-col">
      {/* New chat */}
      <div className="p-4 pb-3">
        <button
          onClick={onCreateConversation}
          className="w-full flex items-center justify-center gap-1.5 bg-plum hover:bg-plum-hover text-bone px-4 py-2.5 rounded-pill transition-colors duration-fast text-[12px] font-semibold uppercase tracking-kicker"
        >
          <Plus size={14} />
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-smoke" />
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-panel border border-hairline hover:border-hairline-strong focus:border-plum rounded-pill text-[13px] text-bone placeholder:text-smoke outline-none transition-colors duration-fast"
          />
        </div>
      </div>

      {/* Conversation rows */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filteredConversations.length === 0 ? (
          <div className="px-4 py-10 text-center">
            {searchTerm ? (
              <p className="text-smoke text-[13px]">Nothing matches.</p>
            ) : (
              <p className="text-smoke text-[13px] leading-relaxed">
                No conversations yet — ask anything below to start your first.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const hasMerge = conversation.messages.some(m => MessageHelpers.isMergedMessage(m));
              const branchCount = MessageHelpers.getAllMessages(conversation.messages).length;
              return (
                <li key={conversation.id} className="relative group">
                  <button
                    onClick={() => {
                      closeMenus();
                      onSelectConversation(conversation.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-node border transition-colors duration-fast ${
                      isActive
                        ? 'border-hairline bg-panel'
                        : 'border-transparent hover:bg-panel'
                    }`}
                  >
                    <div className="flex items-center gap-2 pr-6">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-plum shrink-0" />}
                      <span className={`text-[13px] font-medium truncate ${isActive ? 'text-bone' : 'text-ash group-hover:text-bone'}`}>
                        {conversation.name}
                      </span>
                    </div>
                    <p className="text-[12px] text-smoke truncate mt-0.5 pr-6">
                      {getPreview(conversation)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-smoke">
                      {branchCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <GitBranch size={10} />
                          {branchCount}
                        </span>
                      )}
                      {hasMerge && (
                        <span className="inline-flex items-center gap-1 text-plum">
                          <Sparkles size={10} />
                          merged
                        </span>
                      )}
                      <span className="ml-auto">{getLastActiveTime(conversation)}</span>
                    </div>
                  </button>

                  {/* Overflow menu */}
                  {onDeleteConversation && (
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                          setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id);
                        }}
                        className={`p-1 rounded-[8px] text-smoke hover:text-bone hover:bg-panel-2 transition-all duration-fast ${
                          menuOpenId === conversation.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Conversation options"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {menuOpenId === conversation.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-panel border border-hairline rounded-node overflow-hidden min-w-[150px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirmDeleteId === conversation.id) {
                                onDeleteConversation(conversation.id);
                                closeMenus();
                              } else {
                                setConfirmDeleteId(conversation.id);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-danger hover:bg-panel-2 transition-colors duration-fast"
                          >
                            <Trash2 size={13} />
                            {confirmDeleteId === conversation.id ? 'Confirm delete' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer count */}
      {conversations.length > 0 && (
        <div className="px-4 py-3 border-t border-hairline">
          <p className="text-[11px] text-smoke">
            {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </aside>
  );
};
