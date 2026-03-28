import { useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/helpers';

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
    <aside className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="px-5 py-4">
        <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4">Conversations</h2>
        <div className="relative group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={14} />
          <input
            className="sidebar-search w-full h-10 pl-9 pr-4 text-xs font-medium"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search messages..."
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pnf-sidebar-scroll px-2 pb-4">
        {filteredConversations.length === 0 ? (
          <div className="px-4 py-8 text-center">
             <p className="text-stone-500 text-xs font-medium">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((chat) => {
            const isActive = chat._id === activeConversationId;
            const isOwner = String(chat?.owner?._id || chat?.owner) === String(currentUserId);
            const peer = isOwner ? chat?.finder : chat?.owner;
            const peerName = peer?.full_name || (peer?.email ? peer.email : 'External Collaborator');
            const peerImage = peer?.profileImage?.url || peer?.profileImage;

            return (
              <button
                key={chat._id}
                type="button"
                className={`w-full flex items-center gap-3 p-3 mb-1 rounded-xl text-left chat-sidebar-item ${
                  isActive ? 'active' : ''
                }`}
                onClick={() => onSelectConversation(chat)}
              >
                <div className="relative shrink-0">
                  <Avatar 
                    src={peerImage} 
                    name={peerName} 
                    size="md" 
                    className={isActive ? 'border-amber-500/40' : 'border-white/5'} 
                  />
                  {chat?.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 border-2 border-stone-900 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-amber-100' : 'text-stone-200'}`}>
                      {chat?.requestTitle || 'Request'}
                    </p>
                    <span className="text-[10px] text-stone-500 font-bold shrink-0">
                      {chat?.lastMessage?.timestamp ? formatDate(chat.lastMessage.timestamp) : ''}
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-500/80 font-bold mb-1 truncate">{peerName}</p>
                  
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                      {chat?.lastMessage?.text || 'No messages yet'}
                    </p>
                    {chat?.unreadCount > 0 && (
                       <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-stone-900 font-black text-[9px]">
                         {chat.unreadCount}
                       </span>
                    )}
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
