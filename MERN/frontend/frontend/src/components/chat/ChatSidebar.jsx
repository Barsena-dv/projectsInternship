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
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Chats</h2>
        <div className="mt-2">
          <input
            className="pnf-input h-10 border-slate-200 bg-white"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search chats"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No chats available.</p>
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
                className={`w-full border-b border-slate-200 px-4 py-3 text-left transition ${
                  isActive ? 'bg-blue-50' : 'bg-transparent hover:bg-slate-100'
                }`}
                onClick={() => onSelectConversation(chat)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                    {getInitials(peerName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{chat?.requestTitle || 'Request'}</p>
                      <p className="shrink-0 text-[11px] text-slate-400">
                        {chat?.lastMessage?.timestamp ? formatDate(chat.lastMessage.timestamp) : ''}
                      </p>
                    </div>

                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{peerName}</p>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-xs text-slate-600">{chat?.lastMessage?.text || 'No messages yet'}</p>
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
