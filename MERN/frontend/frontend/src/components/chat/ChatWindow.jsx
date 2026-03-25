import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
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
      <div className="m-auto w-full max-w-lg px-4">
        <EmptyState title="Select a conversation" description="Choose a chat from the sidebar to start messaging." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{conversation.requestTitle || 'Request Conversation'}</h3>
            <p className="text-xs text-slate-500">
              {conversation.chatUnlocked
                ? chatClosed
                  ? 'Last seen recently'
                  : 'Online'
                : 'Offline'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                chatClosed ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {chatClosed ? 'Chat closed' : 'Chat active'}
            </span>

            {showCompleteButton ? (
              <button
                type="button"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                onClick={onEndChat}
              >
                Confirm Item Received & End Chat
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={onMessagesScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        style={{
          backgroundColor: '#e5ddd5',
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
      >
        {loadingMessages ? <LoadingSpinner text="Loading messages..." /> : null}

        {!loadingMessages && messages.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">Start the conversation</div>
        ) : null}

        {!loadingMessages
          ? messages.map((message, index) => {
              const isMine = String(message?.sender?._id) === String(currentUserId);
              const previousMessage = messages[index - 1];
              const sameSenderAsPrevious =
                String(previousMessage?.sender?._id || '') === String(message?.sender?._id || '');

              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isMine={isMine}
                  showSender={!sameSenderAsPrevious}
                  compactTop={sameSenderAsPrevious}
                />
              );
            })
          : null}

        {typingLabel ? (
          <p className="mt-3 text-xs italic text-slate-600">{typingLabel}</p>
        ) : null}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        {!conversation.chatUnlocked ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Chat will be available after evidence verification
          </div>
        ) : chatClosed ? (
          <div className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700">
            This chat has been closed
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
      </div>
    </div>
  );
};

export default ChatWindow;
