import { FiPaperclip, FiSend, FiSmile } from 'react-icons/fi';

const ChatInput = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
  sending = false,
}) => {
  return (
    <div className="input-area-glass flex items-end gap-2 p-2 shadow-lg">
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-stone-400 hover:text-amber-500 hover:bg-white/10 transition-all duration-200"
        aria-label="Open emoji picker"
        title="Emoji"
      >
        <FiSmile size={20} />
      </button>

      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-stone-400 hover:text-amber-500 hover:bg-white/10 transition-all duration-200"
        aria-label="Upload file"
        title="Attach file"
      >
        <FiPaperclip size={18} />
      </button>

      <textarea
        className="flex-1 min-h-[44px] max-h-32 py-2.5 px-3 bg-transparent border-none focus:ring-0 text-amber-50 text-sm placeholder:text-stone-600 resize-none font-medium"
        rows={1}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Type your message here..."
        disabled={disabled || sending}
        style={{ outline: 'none' }}
      />

      <button
        type="button"
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 transform active:scale-90 ${
          !String(value || '').trim() || disabled || sending
          ? 'bg-white/5 text-stone-600 cursor-not-allowed'
          : 'bg-amber-500 text-stone-900 hover:bg-amber-400 shadow-[0_4px_15px_rgba(245,158,11,0.3)]'
        }`}
        onClick={onSend}
        disabled={disabled || sending || !String(value || '').trim()}
      >
        {sending ? (
          <div className="w-4 h-4 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin" />
        ) : (
          <FiSend size={18} />
        )}
      </button>
    </div>
  );
};

export default ChatInput;
