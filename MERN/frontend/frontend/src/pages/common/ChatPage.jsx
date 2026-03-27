import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ChatLayout from '../../components/chat/ChatLayout';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { assignmentApi, chatApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import '../../styles/owner/chat.css';

const POLL_INTERVAL_MS = 7000;

const normalizeConversations = (rows = []) => {
  const byAssignment = new Map();

  rows.forEach((row) => {
    const assignmentId = String(row?.assignmentId || row?._id || '');
    if (!assignmentId) return;

    const previous = byAssignment.get(assignmentId);
    if (!previous) {
      byAssignment.set(assignmentId, row);
      return;
    }

    const previousUpdated = new Date(previous?.updatedAt || previous?.lastMessage?.timestamp || 0).getTime();
    const currentUpdated = new Date(row?.updatedAt || row?.lastMessage?.timestamp || 0).getTime();
    if (currentUpdated >= previousUpdated) {
      byAssignment.set(assignmentId, row);
    }
  });

  return Array.from(byAssignment.values()).sort(
    (a, b) =>
      new Date(b?.updatedAt || b?.lastMessage?.timestamp || 0).getTime() -
      new Date(a?.updatedAt || a?.lastMessage?.timestamp || 0).getTime()
  );
};

const normalizeMessages = (rows = []) => {
  const byId = new Map();

  rows.forEach((row) => {
    const id = String(row?._id || '');
    if (!id) return;

    const previous = byId.get(id);
    if (!previous) {
      byId.set(id, row);
      return;
    }

    const previousCreated = new Date(previous?.createdAt || 0).getTime();
    const currentCreated = new Date(row?.createdAt || 0).getTime();
    if (currentCreated >= previousCreated) {
      byId.set(id, row);
    }
  });

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
  );
};

const areMessagesEqual = (currentMessages = [], nextMessages = []) => {
  if (currentMessages.length !== nextMessages.length) return false;

  for (let index = 0; index < currentMessages.length; index += 1) {
    const current = currentMessages[index];
    const next = nextMessages[index];
    if (String(current?._id || '') !== String(next?._id || '')) return false;
    if (String(current?.text || '') !== String(next?.text || '')) return false;
    if (String(current?.createdAt || '') !== String(next?.createdAt || '')) return false;
  }

  return true;
};

const areConversationsEqual = (currentRows = [], nextRows = []) => {
  if (currentRows.length !== nextRows.length) return false;

  for (let index = 0; index < currentRows.length; index += 1) {
    const current = currentRows[index];
    const next = nextRows[index];
    if (String(current?._id || '') !== String(next?._id || '')) return false;
    if (Number(current?.unreadCount || 0) !== Number(next?.unreadCount || 0)) return false;
    if (String(current?.lastMessage?.text || '') !== String(next?.lastMessage?.text || '')) return false;
    if (String(current?.lastMessage?.timestamp || '') !== String(next?.lastMessage?.timestamp || '')) return false;
    if (String(current?.assignmentStatus || '') !== String(next?.assignmentStatus || '')) return false;
    if (Boolean(current?.isActive) !== Boolean(next?.isActive)) return false;
  }

  return true;
};

const ChatPage = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const finderNeedsAssignmentScope = user?.role === 'finder' && !assignmentId;

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [completing, setCompleting] = useState(false);

  const messagesContainerRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
  const pollTickRef = useRef(0);

  const activeConversation = useMemo(
    () => conversations.find((item) => item._id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const isOwner = useMemo(() => {
    if (!activeConversation) return false;
    const ownerId = activeConversation?.owner?._id || activeConversation?.owner;
    return String(ownerId) === String(user?.id);
  }, [activeConversation, user?.id]);

  const assignmentCompleted = String(activeConversation?.assignmentStatus || '').toLowerCase() === 'completed';
  const chatClosed = assignmentCompleted || !activeConversation?.isActive;
  const showCompleteButton = Boolean(activeConversation?.chatUnlocked) && !assignmentCompleted && isOwner;

  const loadConversations = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoadingSidebar(true);
      }

      const response = await chatApi.conversations();
      const rows = normalizeConversations(response.data || []);
      setConversations((previousRows) => (areConversationsEqual(previousRows, rows) ? previousRows : rows));

      if (assignmentId) {
        const byAssignment = rows.find((item) => String(item.assignmentId) === String(assignmentId));
        if (byAssignment) {
          setActiveConversationId((previousId) => (previousId === byAssignment._id ? previousId : byAssignment._id));
        } else {
          try {
            const created = await chatApi.getOrCreateConversation(assignmentId);
            const createdId = created?.data?._id;
            if (createdId) {
              const refreshed = await chatApi.conversations();
              const refreshedRows = normalizeConversations(refreshed.data || []);
              setConversations((previousRows) =>
                areConversationsEqual(previousRows, refreshedRows) ? previousRows : refreshedRows
              );
              const match = refreshedRows.find((item) => item._id === createdId);
              if (match) {
                setActiveConversationId((previousId) => (previousId === match._id ? previousId : match._id));
              }
            }
          } catch (error) {
            const message = getErrorMessage(error);
            if (!message.toLowerCase().includes('unauthorized')) {
              toast.error(message);
            }
          }
        }
      } else if (!activeConversationId && rows.length > 0) {
        setActiveConversationId(rows[0]._id);
      }
    } catch (error) {
      if (!silent) {
        toast.error(getErrorMessage(error));
      }
    } finally {
      if (!silent) {
        setLoadingSidebar(false);
      }
    }
  }, [assignmentId, activeConversationId]);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    if (!conversationId) return;

    try {
      if (!silent) setLoadingMessages(true);
      const response = await chatApi.messages(conversationId, { page: 1, limit: 100 });
      const payload = response.data || {};
      const nextMessages = normalizeMessages(payload.messages || []);
      setMessages((previousMessages) =>
        areMessagesEqual(previousMessages, nextMessages) ? previousMessages : nextMessages
      );

      if (payload.conversation) {
        setConversations((prev) =>
          prev.map((item) =>
            item._id === conversationId
              ? {
                  ...item,
                  ...payload.conversation,
                  unreadCount: 0,
                }
              : item
          )
        );
      }
    } catch (error) {
      if (!silent) toast.error(getErrorMessage(error));
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (finderNeedsAssignmentScope) return;
    loadConversations();
  }, [finderNeedsAssignmentScope, loadConversations]);

  useEffect(() => {
    if (finderNeedsAssignmentScope) return;
    if (!activeConversationId) return;
    loadMessages(activeConversationId);
  }, [activeConversationId, finderNeedsAssignmentScope, loadMessages]);

  useEffect(() => {
    if (finderNeedsAssignmentScope) return undefined;
    if (!activeConversationId) return undefined;

    const timer = setInterval(async () => {
      await loadMessages(activeConversationId, true);

      pollTickRef.current += 1;
      if (pollTickRef.current % 3 === 0) {
        await loadConversations(true);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeConversationId, finderNeedsAssignmentScope, loadConversations, loadMessages]);

  useEffect(() => {
    if (!messagesContainerRef.current || !shouldStickToBottomRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages]);

  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    shouldStickToBottomRef.current = distanceFromBottom < 80;
  };

  const handleSend = async () => {
    if (!activeConversationId || !text.trim() || !activeConversation?.chatUnlocked || chatClosed) return;

    try {
      setSending(true);
      await chatApi.send(activeConversationId, { text: text.trim() });
      setText('');
      shouldStickToBottomRef.current = true;
      await loadMessages(activeConversationId, true);
      await loadConversations(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const openConversation = (conversationId, targetAssignmentId) => {
    setActiveConversationId(conversationId);
    setShowMobileSidebar(false);
    if (targetAssignmentId) {
      navigate(`/chat/${targetAssignmentId}`);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!activeConversation?.assignmentId) {
      toast.error('Assignment is missing for this chat');
      return;
    }

    try {
      setCompleting(true);
      await assignmentApi.complete(activeConversation.assignmentId, {
        reason: 'Owner confirmed item received from chat',
      });

      toast.success('Payment released and assignment completed');
      setConfirmModalOpen(false);
      setConfirmChecked(false);
      setText('');

      await Promise.all([loadMessages(activeConversationId, true), loadConversations(true)]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCompleting(false);
    }
  };

  if (loadingSidebar) {
    return <LoadingSpinner text="Loading chat conversations..." />;
  }

  if (finderNeedsAssignmentScope) {
    return (
      <div className="owner-chat-page">
        <PageHeader title="Chat" subtitle="Chat is available only from Assignment Details after evidence verification." />
        <EmptyState
          title="Open chat from an assignment"
          description="Go to My Assignments -> Assignment Details -> Open Chat."
        />
      </div>
    );
  }

  return (
    <div className="owner-chat-page">
      <PageHeader title="Chat" subtitle="Owner and finder can chat after evidence verification." />

      <ChatLayout
        sidebar={
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            currentUserId={user?.id}
            onSelectConversation={(chat) => openConversation(chat._id, chat.assignmentId)}
          />
        }
        chat={
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            loadingMessages={loadingMessages}
            currentUserId={user?.id}
            text={text}
            onTextChange={(event) => setText(event.target.value)}
            onInputKeyDown={handleKeyDown}
            onSend={handleSend}
            sending={sending}
            chatClosed={chatClosed}
            showCompleteButton={showCompleteButton}
            onEndChat={() => {
              setConfirmChecked(false);
              setConfirmModalOpen(true);
            }}
            typingLabel={text.trim() && !chatClosed ? 'User is typing...' : ''}
            messagesContainerRef={messagesContainerRef}
            onMessagesScroll={handleMessagesScroll}
          />
        }
        details={null}
        showMobileSidebar={showMobileSidebar}
        onToggleMobileSidebar={() => {
          setShowMobileSidebar((prev) => !prev);
        }}
        showMobileDetails={false}
        onToggleMobileDetails={() => {}}
      />

      <GlassModal
        open={confirmModalOpen}
        title="Confirm Completion"
        subtitle="This will release payment and close this chat permanently."
        onClose={() => {
          if (!completing) {
            setConfirmModalOpen(false);
            setConfirmChecked(false);
          }
        }}
        onConfirm={handleConfirmCompletion}
        confirmText="Confirm"
        confirmClassName="rounded-lg border border-rose-300 bg-rose-600 text-white"
        confirmDisabled={!confirmChecked}
        loading={completing}
      >
        <div className="space-y-3">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Payment will be released to the finder</li>
            <li>This action cannot be undone</li>
            <li>Ensure you have received your item</li>
          </ul>

          <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={confirmChecked}
              onChange={(event) => setConfirmChecked(event.target.checked)}
            />
            <span>I confirm that I have received my item</span>
          </label>

          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            If you are meeting the finder in person, only confirm after receiving your item.
          </p>
        </div>
      </GlassModal>
    </div>
  );
};

export default ChatPage;
