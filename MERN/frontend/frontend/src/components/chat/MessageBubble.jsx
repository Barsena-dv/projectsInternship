import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/helpers';

const MessageBubble = ({ message, isMine = false, showSender = true, compactTop = false }) => {
  const senderName = message?.sender?.full_name || (message?.sender?.email ? message.sender.email : 'System Message');
  const senderImage = message?.sender?.profileImage?.url || message?.sender?.profileImage;

  return (
    <div className={`flex items-end gap-2 chat-animate-in ${isMine ? 'justify-end' : 'justify-start'} ${compactTop ? 'mt-1' : 'mt-5'}`}>
      
      {!isMine && showSender && (
        <Avatar src={senderImage} name={senderName} size="xs" className="mb-1" />
      )}
      
      {!isMine && !showSender && <div className="w-6" />} {/* Spacer for alignment */}

      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
        {showSender && !isMine && (
          <span className="sender-name-peer mb-1 ml-1">{senderName}</span>
        )}
        
        <article
          className={`relative px-4 py-2.5 text-sm shadow-md ${
            isMine ? 'message-bubble-mine' : 'message-bubble-peer'
          }`}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message?.text || ''}</p>
          
          <div className={`flex items-center justify-end gap-1.5 mt-1 ${isMine ? 'text-amber-900/60' : 'text-stone-500'}`}>
            <span className="text-[9px] font-bold uppercase">
              {formatDate(message?.createdAt)}
            </span>
          </div>
        </article>
      </div>

    </div>
  );
};

export default MessageBubble;
