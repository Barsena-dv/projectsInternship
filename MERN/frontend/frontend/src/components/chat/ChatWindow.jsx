import { FiInfo, FiMoreVertical } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import Avatar from '../common/Avatar';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';

const ChatWindow = ({
  conversation,
  messages = [],
  loadingMessages = false,
  currentUserId,
  text,
  onTextChange,
  onInputKeyDown,
  onSend,
  sending = false,
  chatClosed = false,
  showCompleteButton = false,
  onEndChat,
  typingLabel = '',
  messagesContainerRef,
  onMessagesScroll,
}) => {
  if (!conversation) {
    return (
      <div className="m-auto w-full max-w-lg px-4 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-amber-500/20 mb-6 border border-white/5">
           <FiInfo size={40} />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Select a conversation</h3>
        <p className="text-stone-500 text-sm max-w-xs mx-auto">Choose a contact from the sidebar to view your messages and start collaborating.</p>
      </div>
    );
  }

  const isOwner = String(conversation?.owner?._id || conversation?.owner) === String(currentUserId);
  const peer = isOwner ? conversation?.finder : conversation?.owner;
  const peerName = peer?.full_name || (peer?.email ? peer.email : 'External Collaborator');
  const peerImage = peer?.profileImage?.url || peer?.profileImage;

  return (
    <div className="flex h-full min-h-0 flex-col chat-main">
      {/* Premium Header */}
      <header className="chat-header px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <Avatar src={peerImage} name={peerName} size="md" className="border-amber-500/10" />
             <div className="min-w-0">
                <h3 className="text-sm font-black text-white truncate leading-none mb-1.5">{conversation.requestTitle || 'Conversation'}</h3>
                <div className="flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${chatClosed ? 'bg-stone-600' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse'}`} />
                   <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                     {peerName} • {chatClosed ? 'Offline' : 'Active Now'}
                   </p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2">
             {showCompleteButton && !chatClosed && (
                <button
                  type="button"
                  className="hidden md:flex px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-all duration-200"
                  onClick={onEndChat}
                >
                  Mark Received
                </button>
             )}
             <button className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500 hover:text-white hover:bg-white/5 transition-all">
                <FiMoreVertical size={18} />
             </button>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        onScroll={onMessagesScroll}
        className="messages-container min-h-0 flex-1 overflow-y-auto px-6 py-6 pnf-sidebar-scroll"
      >
        {loadingMessages ? (
          <div className="flex flex-col items-center justify-center py-12">
             <LoadingSpinner />
             <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mt-4">Decrypting stream...</p>
          </div>
        ) : null}

        {!loadingMessages && messages.length === 0 ? (
          <div className="py-20 text-center">
             <div className="px-6 py-2 rounded-full bg-white/5 border border-white/5 inline-block text-[10px] font-black text-stone-500 uppercase tracking-widest">
                System: Encrypted bridge established
             </div>
             <p className="mt-4 text-xs font-bold text-stone-600 italic">No messages yet. Send a greeting!</p>
          </div>
        ) : null}

        {!loadingMessages
          ? messages.map((message, index) => {
              const isMsgMine = String(message?.sender?._id) === String(currentUserId);
              const previousMessage = messages[index - 1];
              const sameSenderAsPrevious =
                String(previousMessage?.sender?._id || '') === String(message?.sender?._id || '');

              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isMine={isMsgMine}
                  showSender={!sameSenderAsPrevious}
                  compactTop={sameSenderAsPrevious}
                />
              );
            })
          : null}

        {typingLabel ? (
          <div className="flex items-center gap-2 mt-4 ml-2 animate-pulse">
             <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                <div className="w-1 h-1 rounded-full bg-amber-500/60" />
                <div className="w-1 h-1 rounded-full bg-amber-500/80" />
             </div>
             <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{typingLabel}</span>
          </div>
        ) : null}
      </div>

      {/* Input / Status Footer */}
      <footer className="chat-footer">
        {!conversation.chatUnlocked ? (
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-center">
             <p className="text-[11px] font-black text-amber-500/80 uppercase tracking-widest leading-relaxed">
               Security Protocol Active<br/>
               <span className="text-stone-500 font-bold opacity-80">Awaiting evidence verification for full link</span>
             </p>
          </div>
        ) : chatClosed ? (
          <div className="p-4 rounded-2xl bg-stone-900/50 border border-white/5 flex items-center justify-center text-center">
             <p className="text-[11px] font-black text-stone-500 uppercase tracking-widest">
               Communication session ended by owner
             </p>
          </div>
        ) : (
          <ChatInput
            value={text}
            onChange={onTextChange}
            onKeyDown={onInputKeyDown}
            onSend={onSend}
            disabled={chatClosed}
            sending={sending}
          />
        )}
      </footer>
    </div>
  );
};

export default ChatWindow;
