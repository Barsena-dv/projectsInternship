import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiMessageSquare, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { adminApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const FLAG_PATTERNS = [
  /scam/i,
  /fraud/i,
  /threat/i,
  /abuse/i,
  /blackmail/i,
  /fake/i,
  /hack/i,
  /pay outside/i,
  /upi .*personal/i,
];

const isFlaggedText = (value = '') => FLAG_PATTERNS.some((pattern) => pattern.test(String(value || '')));

const AdminChatMonitorPage = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');

  const loadFlaggedChats = useCallback(async () => {
    try {
      setLoading(true);
      const assignmentRes = await adminApi.assignments({ limit: 70 });
      const sourceRows = assignmentRes?.data?.rows || [];

      const detailsList = await Promise.all(
        sourceRows.map(async (row) => {
          try {
            const details = await adminApi.assignmentDetails(row._id);
            return details?.data || null;
          } catch {
            return null;
          }
        })
      );

      const flagged = [];
      detailsList.forEach((details) => {
        const messages = details?.chatLogs?.messages || [];
        const flaggedMessages = messages.filter((message) => isFlaggedText(message?.text || ''));
        if (!flaggedMessages.length) return;

        flagged.push({
          assignmentId: details?.assignment?._id,
          requestName: details?.assignment?.request?.itemName || 'Unknown request',
          finder: details?.finder?.full_name || '-',
          owner: details?.owner?.full_name || '-',
          flaggedCount: flaggedMessages.length,
          latestFlaggedAt: flaggedMessages[0]?.createdAt,
          flaggedMessages: flaggedMessages.slice(0, 8),
        });
      });

      setRows(flagged.sort((a, b) => new Date(b.latestFlaggedAt).getTime() - new Date(a.latestFlaggedAt).getTime()));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlaggedChats();
  }, [loadFlaggedChats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => (
      String(row.requestName).toLowerCase().includes(q)
      || String(row.finder).toLowerCase().includes(q)
      || String(row.owner).toLowerCase().includes(q)
    ));
  }, [rows, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat Monitoring (Flagged)"
        subtitle="Conversation surveillance focused on suspicious or policy-risk message patterns"
      />

      <article className="admin-card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-black">Flagged Chat Cases</p>
            <p className="text-3xl text-rose-400 font-black">{rows.length}</p>
          </div>
          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500/40"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by request or participant"
            />
          </div>
        </div>

        {loading ? <LoadingSpinner text="Scanning flagged messages..." /> : null}
        {!loading && filtered.length === 0 ? (
          <EmptyState title="No flagged messages" description="No risky chat patterns were detected for the monitored assignment set." />
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '650px' }}>
            {filtered.map((row) => (
              <section key={row.assignmentId} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-wide">{row.requestName}</p>
                    <p className="text-xs text-slate-400">Owner: {row.owner} | Finder: {row.finder}</p>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <FiAlertTriangle /> {row.flaggedCount} Alerts
                  </div>
                </div>

                <div className="space-y-2">
                  {row.flaggedMessages.map((message) => (
                    <div key={message._id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-black text-indigo-300">{message?.sender?.full_name || 'Unknown sender'}</span>
                        <span className="text-[10px] text-slate-500">{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-100 leading-relaxed">{message.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </article>

      <article className="admin-card border-amber-500/20">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
          <FiMessageSquare /> Monitoring Logic
        </h3>
        <p className="text-xs text-slate-300">
          This module intentionally displays only flagged conversations. Flags are derived from abuse/fraud keyword heuristics over assignment messages and can be upgraded to backend moderation signals in a later iteration.
        </p>
      </article>
    </div>
  );
};

export default AdminChatMonitorPage;
