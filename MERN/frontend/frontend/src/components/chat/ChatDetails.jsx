import { useMemo, useState } from 'react';

const getFileCategory = (attachment = {}) => {
  const contentType = String(attachment?.contentType || '').toLowerCase();
  const url = String(attachment?.url || attachment?.fileUrl || '').toLowerCase();

  if (contentType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(url)) return 'Images';
  if (contentType.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/.test(url)) return 'Videos';
  return 'Documents';
};

const ChatDetails = ({ conversation, messages = [] }) => {
  const [activeTab, setActiveTab] = useState('participants');

  const participants = useMemo(() => {
    if (!conversation) return [];

    return [
      { role: 'Owner', ...conversation.owner },
      { role: 'Finder', ...conversation.finder },
    ].filter((item) => item && (item._id || item.full_name));
  }, [conversation]);

  const sharedFiles = useMemo(() => {
    return messages
      .filter((message) => message?.attachment)
      .map((message) => {
        const attachment = message.attachment;
        return {
          id: message._id,
          name: attachment?.name || attachment?.originalName || 'Shared file',
          url: attachment?.url || attachment?.fileUrl || '',
          category: getFileCategory(attachment),
        };
      });
  }, [messages]);

  const filesByCategory = useMemo(() => {
    return {
      Images: sharedFiles.filter((file) => file.category === 'Images'),
      Videos: sharedFiles.filter((file) => file.category === 'Videos'),
      Documents: sharedFiles.filter((file) => file.category === 'Documents'),
    };
  }, [sharedFiles]);

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Details</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'participants' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab('participants')}
          >
            Participants
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'files' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab('files')}
          >
            Shared Files
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {activeTab === 'participants' ? (
          <div className="space-y-3">
            {participants.length === 0 ? (
              <p className="text-sm text-slate-500">No participants found.</p>
            ) : (
              participants.map((participant) => (
                <div key={`${participant.role}-${participant._id || participant.full_name}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{participant.role}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{participant.full_name || 'Unknown user'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{participant.email || 'No email'}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total files shared</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{sharedFiles.length}</p>
            </div>

            {['Images', 'Videos', 'Documents'].map((category) => (
              <div key={category} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{category}</p>
                {filesByCategory[category].length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500">No files</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {filesByCategory[category].map((file) => (
                      <a
                        key={file.id}
                        href={file.url || '#'}
                        onClick={(event) => {
                          if (!file.url) event.preventDefault();
                        }}
                        className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-100"
                        target={file.url ? '_blank' : undefined}
                        rel={file.url ? 'noreferrer' : undefined}
                      >
                        {file.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default ChatDetails;
