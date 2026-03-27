import { useMemo, useState } from 'react';
import { formatDate } from '../../utils/helpers';

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return `${parts[0][0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
};

const ChatSidebar = ({
  conversations = [],
  activeConversationId = '',
  currentUserId,
  onSelectConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((chat) => {
      const owner = chat?.owner || {};
      const finder = chat?.finder || {};
      const title = String(chat?.requestTitle || '').toLowerCase();
      const ownerName = String(owner?.full_name || '').toLowerCase();
      const finderName = String(finder?.full_name || '').toLowerCase();
      const preview = String(chat?.lastMessage?.text || '').toLowerCase();
      return title.includes(query) || ownerName.includes(query) || finderName.includes(query) || preview.includes(query);
    });
  }, [conversations, searchQuery]);

  return (
    <aside className="flex h-full min-h-0 flex-col border-r pnf-soft-border bg-(--pnf-surface-2)">
      <div className="border-b px-4 py-3 pnf-soft-border">
        <h2 className="pnf-heading text-sm font-semibold">Chats</h2>
        <div className="mt-2">
          <input
            className="pnf-input h-10"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search chats"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <p className="pnf-muted px-4 py-6 text-sm">No chats available.</p>
        ) : (
          filteredConversations.map((chat) => {
            const isActive = chat._id === activeConversationId;
            const isOwner = String(chat?.owner?._id || chat?.owner) === String(currentUserId);
            const peer = isOwner ? chat?.finder : chat?.owner;
            const peerName = peer?.full_name || 'User';

            return (
              <button
                key={chat._id}
                type="button"
                className={`w-full border-b px-4 py-3 text-left transition pnf-soft-border ${
                  isActive ? 'bg-(--pnf-accent-soft)' : 'bg-transparent hover:bg-(--pnf-tone-1)'
                }`}
                onClick={() => onSelectConversation(chat)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--pnf-tone-3) text-xs font-semibold text-(--pnf-tone-9)">
                    {getInitials(peerName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="pnf-heading line-clamp-1 text-sm font-semibold">{chat?.requestTitle || 'Request'}</p>
                      <p className="pnf-muted-2 shrink-0 text-[11px]">
                        {chat?.lastMessage?.timestamp ? formatDate(chat.lastMessage.timestamp) : ''}
                      </p>
                    </div>

                    <p className="pnf-muted mt-0.5 line-clamp-1 text-xs">{peerName}</p>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="pnf-muted line-clamp-1 text-xs">{chat?.lastMessage?.text || 'No messages yet'}</p>
                      {chat?.unreadCount > 0 ? (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
