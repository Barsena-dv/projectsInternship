import { useState } from 'react';
import { toast } from 'react-toastify';
import ComingSoon from '../../components/common/ComingSoon';
import PageHeader from '../../components/common/PageHeader';
import { chatApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const OwnerChatPage = () => {
  const [conversationId, setConversationId] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const res = await chatApi.messages(conversationId);
      setMessages(res.data?.messages || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await chatApi.send(conversationId, { text });
      setText('');
      await loadMessages();
      toast.success('Message sent');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader title="Chat" subtitle="Chat is available after evidence verification unlock" />

      <ComingSoon
        title="Conversation bootstrap is limited in current backend routes"
        description="Use a known conversationId (from backend/logs) to fetch/send messages. This page is wired for active conversations."
      />

      <section className="pnf-card mt-4 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="pnf-input"
            placeholder="Conversation ID"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
          />
          <button className="pnf-btn-outline rounded-lg px-4 py-2 text-sm" type="button" onClick={loadMessages} disabled={loading}>
            Load Messages
          </button>
        </div>

        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <article className="rounded-lg border border-slate-200 p-2 text-sm" key={msg._id}>
                <p className="font-medium text-slate-800">{msg.sender?.full_name || 'User'}</p>
                <p className="text-slate-600">{msg.text}</p>
              </article>
            ))
          )}
        </div>

        <form className="mt-3 flex gap-2" onSubmit={send}>
          <input className="pnf-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type message" />
          <button className="pnf-btn-primary rounded-lg px-4 py-2 text-sm" type="submit" disabled={!conversationId}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
};

export default OwnerChatPage;
