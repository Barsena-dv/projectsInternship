import { formatDate } from '../../utils/helpers';

const MessageBubble = ({ message, isMine = false, showSender = true, compactTop = false }) => {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${compactTop ? 'mt-1' : 'mt-4'}`}>
      <div className={`relative max-w-[86%] md:max-w-[72%] ${isMine ? 'pr-2' : 'pl-2'}`}>
        <article
          className={`relative rounded-lg px-3 py-2 text-sm shadow-sm ${
            isMine ? 'message-bubble-mine' : 'message-bubble-peer'
          }`}
        >
          {showSender ? (
            <p className={`mb-0.5 text-[11px] font-semibold ${isMine ? 'text-emerald-700' : 'text-slate-500'}`}>
              {message?.sender?.full_name || 'User'}
            </p>
          ) : null}

          <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{message?.text || ''}</p>

          <p className="mt-1 text-right text-[10px] text-slate-500">{formatDate(message?.createdAt)}</p>
        </article>

        <span
          aria-hidden="true"
          className={`absolute top-0 h-0 w-0 border-y-[7px] border-y-transparent ${
            isMine ? 'right-0 border-l-[9px] border-l-amber-500' : 'left-0 border-r-[9px] border-r-stone-800'
          }`}
        />
      </div>
    </div>
  );
};

export default MessageBubble;
