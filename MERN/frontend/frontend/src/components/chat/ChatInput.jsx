const ChatInput = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
  sending = false,
}) => {
  return (
    <div className="chat-input-wrapper flex items-end gap-2 p-2 shadow-sm">
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
        aria-label="Open emoji picker"
        title="Emoji"
      >
        :)
      </button>

      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
        aria-label="Upload file"
        title="Attach file"
      >
        +
      </button>

      <textarea
        className="pnf-input min-h-11 flex-1 resize-none border-slate-200"
        rows={1}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Type a message"
        disabled={disabled || sending}
      />

      <button
        type="button"
        className="pnf-btn-primary rounded-lg px-4 py-2 text-sm"
        onClick={onSend}
        disabled={disabled || sending || !String(value || '').trim()}
      >
        {sending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default ChatInput;
