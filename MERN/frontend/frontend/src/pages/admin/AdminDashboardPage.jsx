import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { adminApi } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'Users' },
  { key: 'requests', label: 'Requests' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'disputes', label: 'Disputes' },
  { key: 'payments', label: 'Payments' },
  { key: 'logs', label: 'Audit Logs' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'fraud', label: 'Fraud Signals' },
  { key: 'settings', label: 'Settings' },
];

const toCsv = (rows = []) => {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const lines = rows.map((row) => keys
    .map((key) => {
      const value = row[key] == null ? '' : String(row[key]);
      const escaped = value.replaceAll('"', '""');
      return `"${escaped}"`;
    })
    .join(','));

  return [header, ...lines].join('\n');
};

const downloadCsv = (filename, csvText) => {
  if (!csvText) {
    toast.info('No rows to export.');
    return;
  }

  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState(null);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFilters, setUserFilters] = useState({ role: '', status: '', verification: '', q: '' });

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState('');

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('');
  const [trackingAnalytics, setTrackingAnalytics] = useState(null);

  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeStatusFilter, setDisputeStatusFilter] = useState('');

  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const [auditLogs, setAuditLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [notificationSummary, setNotificationSummary] = useState({ unreadCount: 0, failedCount: 0, byType: [] });

  const [fraudSignals, setFraudSignals] = useState([]);
  const [fraudThreshold, setFraudThreshold] = useState(50);

  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState({
    defaultAssignmentDeadlineHours: 4,
    trackingIntervalMinutes: 15,
    maxEvidenceImages: 5,
    maxEvidenceVideoSeconds: 120,
    disputeWindowHours: 48,
  });

  const loadOverview = useCallback(async () => {
    const data = await adminApi.dashboard();
    setDashboard(data?.data || null);
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await adminApi.users(userFilters);
    setUsers(res?.data?.rows || []);
  }, [userFilters]);

  const loadRequests = useCallback(async () => {
    const params = requestStatusFilter ? { status: requestStatusFilter } : {};
    const res = await adminApi.requests(params);
    setRequests(res?.data?.rows || []);
  }, [requestStatusFilter]);

  const loadAssignments = useCallback(async () => {
    const params = assignmentStatusFilter ? { status: assignmentStatusFilter } : {};
    const res = await adminApi.assignments(params);
    setAssignments(res?.data?.rows || []);
  }, [assignmentStatusFilter]);

  const loadDisputes = useCallback(async () => {
    const params = disputeStatusFilter ? { status: disputeStatusFilter } : {};
    const res = await adminApi.disputes(params);
    setDisputes(res?.data?.rows || []);
  }, [disputeStatusFilter]);

  const loadPayments = useCallback(async () => {
    const params = paymentStatusFilter ? { status: paymentStatusFilter } : {};
    const res = await adminApi.payments(params);
    setPayments(res?.data?.rows || []);
  }, [paymentStatusFilter]);

  const loadAuditLogs = useCallback(async () => {
    const params = logSearch ? { search: logSearch, limit: 100 } : { limit: 100 };
    const res = await adminApi.auditLogs(params);
    setAuditLogs(res?.data?.logs || []);
  }, [logSearch]);

  const loadNotifications = useCallback(async () => {
    const res = await adminApi.notifications({ limit: 80 });
    const data = res?.data || {};
    setNotifications(data.rows || []);
    setNotificationSummary({
      unreadCount: data.unreadCount || 0,
      failedCount: data.failedCount || 0,
      byType: data.byType || [],
    });
  }, []);

  const loadFraudSignals = useCallback(async () => {
    const res = await adminApi.fraudSignals({ threshold: fraudThreshold });
    setFraudSignals(res?.data || []);
  }, [fraudThreshold]);

  const loadSettings = useCallback(async () => {
    const res = await adminApi.settings();
    const data = res?.data || null;
    setSettings(data);
    if (data) {
      setSettingsDraft({
        defaultAssignmentDeadlineHours: data.defaultAssignmentDeadlineHours ?? 4,
        trackingIntervalMinutes: data.trackingIntervalMinutes ?? 15,
        maxEvidenceImages: data.maxEvidenceImages ?? 5,
        maxEvidenceVideoSeconds: data.maxEvidenceVideoSeconds ?? 120,
        disputeWindowHours: data.disputeWindowHours ?? 48,
      });
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadOverview(),
          loadUsers(),
          loadRequests(),
          loadAssignments(),
          loadDisputes(),
          loadPayments(),
          loadAuditLogs(),
          loadNotifications(),
          loadFraudSignals(),
          loadSettings(),
        ]);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    run();
    // Intentionally initial-load only to avoid request storms while typing in filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshByTab = async () => {
    try {
      if (activeTab === 'overview') await loadOverview();
      if (activeTab === 'users') await loadUsers();
      if (activeTab === 'requests') await loadRequests();
      if (activeTab === 'assignments') await loadAssignments();
      if (activeTab === 'disputes') await loadDisputes();
      if (activeTab === 'payments') await loadPayments();
      if (activeTab === 'logs') await loadAuditLogs();
      if (activeTab === 'notifications') await loadNotifications();
      if (activeTab === 'fraud') await loadFraudSignals();
      if (activeTab === 'settings') await loadSettings();
      toast.success('Section refreshed.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onSelectUser = async (userId) => {
    try {
      const res = await adminApi.userProfile(userId);
      setSelectedUser(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onSelectRequest = async (requestId) => {
    try {
      const res = await adminApi.requestDetails(requestId);
      setSelectedRequest(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onSelectAssignment = async (assignmentId) => {
    try {
      const [details, analytics] = await Promise.all([
        adminApi.assignmentDetails(assignmentId),
        adminApi.trackingAnalytics(assignmentId),
      ]);
      setSelectedAssignment(details?.data || null);
      setTrackingAnalytics(analytics?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onSelectDispute = async (disputeId) => {
    try {
      const res = await adminApi.disputeDetails(disputeId);
      setSelectedDispute(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onSelectPayment = async (paymentId) => {
    try {
      const res = await adminApi.paymentDetails(paymentId);
      setSelectedPayment(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleVerifyFinder = async (userId, isApproved) => {
    try {
      const reason = window.prompt('Optional reason:') || '';
      await adminApi.verifyFinder(userId, { isApproved, reason });
      toast.success(isApproved ? 'Finder verified.' : 'Finder verification rejected.');
      await loadUsers();
      if (selectedUser?.user?._id === userId) await onSelectUser(userId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUserStatus = async (userId, status) => {
    try {
      const reason = window.prompt('Status change reason:') || '';
      await adminApi.updateUserStatus(userId, { status, reason });
      toast.success('User status updated.');
      await loadUsers();
      if (selectedUser?.user?._id === userId) await onSelectUser(userId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const reason = window.prompt('Reason:') || '';
      if (action === 'delete') await adminApi.deleteRequest(requestId, { reason });
      if (action === 'force_close') await adminApi.forceCloseRequest(requestId, { reason });
      if (action === 'reopen') await adminApi.reopenRequest(requestId, { reason });
      toast.success('Request action completed.');
      await loadRequests();
      if (selectedRequest?.request?._id === requestId) await onSelectRequest(requestId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAssignmentStatus = async (assignmentId, status) => {
    try {
      const reason = window.prompt('Reason:') || '';
      await adminApi.updateAssignmentStatus(assignmentId, { status, reason });
      toast.success('Assignment status updated.');
      await loadAssignments();
      if (selectedAssignment?.assignment?._id === assignmentId) await onSelectAssignment(assignmentId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleExtendDeadline = async (assignmentId) => {
    try {
      const input = window.prompt('Extension minutes (1-2880):', '60');
      const extensionMinutes = Number(input || 0);
      if (!Number.isFinite(extensionMinutes) || extensionMinutes <= 0) {
        toast.error('Enter a valid minute value.');
        return;
      }
      const reason = window.prompt('Reason:') || '';
      await adminApi.extendAssignmentDeadline(assignmentId, { extensionMinutes, reason });
      toast.success('Assignment deadline extended.');
      await loadAssignments();
      if (selectedAssignment?.assignment?._id === assignmentId) await onSelectAssignment(assignmentId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleResolveDispute = async (disputeId, decision) => {
    try {
      const resolutionDetails = window.prompt('Resolution details:') || '';
      if (!resolutionDetails.trim()) {
        toast.error('Resolution details are required.');
        return;
      }

      const penalizeFinder = decision === 'owner_wins' ? window.confirm('Penalize finder?') : false;
      const penalizeOwner = decision === 'finder_wins' ? window.confirm('Penalize owner?') : false;

      await adminApi.resolveDispute(disputeId, {
        adminDecision: decision,
        resolutionDetails,
        penalizeFinder,
        penalizeOwner,
      });

      toast.success('Dispute resolved.');
      await loadDisputes();
      if (selectedDispute?.dispute?._id === disputeId) await onSelectDispute(disputeId);
      await loadOverview();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePaymentAction = async (paymentId, action) => {
    try {
      const reason = window.prompt('Reason:') || '';
      if (action === 'force_release') await adminApi.forceReleasePayment(paymentId, { reason });
      if (action === 'refund') await adminApi.refundPayment(paymentId, { reason });
      if (action === 'flag') await adminApi.flagPayment(paymentId, { reason });
      toast.success('Payment action completed.');
      await loadPayments();
      if (selectedPayment?.payment?._id === paymentId) await onSelectPayment(paymentId);
      await loadOverview();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const exportLogs = () => {
    const rows = auditLogs.map((log) => ({
      createdAt: formatDate(log.createdAt),
      action: log.action,
      entityType: log.entityType,
      user: log?.user?.full_name || '',
      email: log?.user?.email || '',
      details: JSON.stringify(log.details || {}),
    }));
    downloadCsv('admin-audit-logs.csv', toCsv(rows));
  };

  const saveSettings = async () => {
    try {
      await adminApi.updateSettings({
        defaultAssignmentDeadlineHours: Number(settingsDraft.defaultAssignmentDeadlineHours),
        trackingIntervalMinutes: Number(settingsDraft.trackingIntervalMinutes),
        maxEvidenceImages: Number(settingsDraft.maxEvidenceImages),
        maxEvidenceVideoSeconds: Number(settingsDraft.maxEvidenceVideoSeconds),
        disputeWindowHours: Number(settingsDraft.disputeWindowHours),
      });
      toast.success('System settings updated.');
      await loadSettings();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const coreMetrics = dashboard?.coreMetrics || {};
  const trends = dashboard?.trends || {};
  const alerts = dashboard?.alerts || {};

  const disputeResolutionRows = useMemo(() => disputes.filter((row) => row.status === 'open'), [disputes]);

  if (loading) {
    return <LoadingSpinner text="Loading admin control layer..." />;
  }

  return (
    <div>
      <PageHeader
        title="Admin Control Layer"
        subtitle="System control, safety, trust, monitoring, disputes, payments, and fraud intelligence"
        actions={(
          <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={refreshByTab}>
            Refresh Current Section
          </button>
        )}
      />

      <section className="pnf-card p-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${activeTab === tab.key ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'overview' ? (
        <section className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Users" value={coreMetrics.totalUsers || 0} />
            <StatCard title="Active Users (24h)" value={coreMetrics.activeUsers || 0} />
            <StatCard title="Total Requests" value={coreMetrics.totalRequests || 0} />
            <StatCard title="Active Assignments" value={coreMetrics.activeAssignments || 0} />
            <StatCard title="Completed Assignments" value={coreMetrics.completedAssignments || 0} />
            <StatCard title="Failed/Expired" value={coreMetrics.failedAssignments || 0} />
            <StatCard title="Active Disputes" value={coreMetrics.activeDisputes || 0} />
            <StatCard title="Payments Released" value={coreMetrics?.payments?.released?.count || 0} helper={formatCurrency(coreMetrics?.payments?.released?.totalAmount || 0)} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="pnf-card p-4">
              <h3 className="text-sm font-semibold text-slate-800">Completion Rate</h3>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{Number(trends.completionRate || 0).toFixed(2)}%</p>
            </article>
            <article className="pnf-card p-4">
              <h3 className="text-sm font-semibold text-slate-800">Failure Rate</h3>
              <p className="mt-2 text-2xl font-bold text-rose-700">{Number(trends.failureRate || 0).toFixed(2)}%</p>
            </article>
            <article className="pnf-card p-4">
              <h3 className="text-sm font-semibold text-slate-800">Dispute Rate</h3>
              <p className="mt-2 text-2xl font-bold text-amber-700">{Number(trends.disputeRate || 0).toFixed(2)}%</p>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="pnf-card p-4">
              <h3 className="text-base font-semibold text-slate-900">Requests Per Day</h3>
              {!Array.isArray(trends.requestsPerDay) || trends.requestsPerDay.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No trend data available.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {trends.requestsPerDay.map((row) => (
                    <div key={row._id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
                      <span>{row._id}</span>
                      <span className="font-semibold">{row.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="pnf-card p-4">
              <h3 className="text-base font-semibold text-slate-900">Alerts</h3>
              <div className="mt-2 space-y-2 text-sm">
                <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  Inactive assignment spike: {alerts?.inactiveAssignmentsSpike?.isSpike ? 'Yes' : 'No'}
                </p>
                <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2">High dispute users: {(alerts.highDisputeUsers || []).length}</p>
                <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2">Suspicious tracking users: {(alerts.suspiciousFinderActivity || []).length}</p>
                <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2">Repeated finder failures: {(alerts.repeatedFinderFailures || []).length}</p>
                <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2">Payment issues: {(alerts.paymentIssues || []).length}</p>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === 'users' ? (
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="pnf-card p-4">
            <div className="grid gap-2 md:grid-cols-4">
              <select className="pnf-input" value={userFilters.role} onChange={(event) => setUserFilters((prev) => ({ ...prev, role: event.target.value }))}>
                <option value="">All Roles</option>
                <option value="owner">Owner</option>
                <option value="finder">Finder</option>
                <option value="admin">Admin</option>
              </select>
              <select className="pnf-input" value={userFilters.status} onChange={(event) => setUserFilters((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="blocked">Blocked</option>
              </select>
              <select className="pnf-input" value={userFilters.verification} onChange={(event) => setUserFilters((prev) => ({ ...prev, verification: event.target.value }))}>
                <option value="">All Verification</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
              <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={loadUsers}>Apply Filters</button>
            </div>

            <input
              className="pnf-input mt-2"
              placeholder="Search by name, email, phone"
              value={userFilters.q}
              onChange={(event) => setUserFilters((prev) => ({ ...prev, q: event.target.value }))}
            />

            <div className="mt-3 max-h-130 space-y-2 overflow-y-auto pr-1">
              {users.map((row) => (
                <article key={row._id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{row.full_name}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={row.role} />
                      <StatusBadge value={row.accountStatus} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{row.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="pnf-btn-outline rounded-lg px-2 py-1 text-xs" onClick={() => onSelectUser(row._id)}>View</button>
                    {row.role === 'finder' ? (
                      <>
                        <button type="button" className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700" onClick={() => handleVerifyFinder(row._id, true)}>Verify</button>
                        <button type="button" className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700" onClick={() => handleVerifyFinder(row._id, false)}>Reject</button>
                      </>
                    ) : null}
                    <button type="button" className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700" onClick={() => handleUserStatus(row._id, 'suspended')}>Suspend</button>
                    <button type="button" className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700" onClick={() => handleUserStatus(row._id, 'blocked')}>Block</button>
                    <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700" onClick={() => handleUserStatus(row._id, 'active')}>Activate</button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="pnf-card p-4">
            <h3 className="text-base font-semibold text-slate-900">User Deep View</h3>
            {!selectedUser ? (
              <EmptyState title="No user selected" description="Choose a user from the left panel to inspect full analytics." />
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {selectedUser?.user?.full_name || '-'}</p>
                <p><span className="font-medium">Role:</span> {selectedUser?.user?.role || '-'}</p>
                <p><span className="font-medium">Rating:</span> {Number(selectedUser?.user?.ratingAvg || 0).toFixed(1)} ({selectedUser?.user?.ratingCount || 0})</p>
                <p><span className="font-medium">Assignments:</span> {selectedUser?.analytics?.totalAssignments || 0}</p>
                <p><span className="font-medium">Success Rate:</span> {selectedUser?.analytics?.successRate || 0}%</p>
                <p><span className="font-medium">Failure Rate:</span> {selectedUser?.analytics?.failureRate || 0}%</p>
                <p><span className="font-medium">Disputes Involved:</span> {selectedUser?.analytics?.disputes?.raised || 0} raised / {selectedUser?.analytics?.disputes?.against || 0} against</p>
                <p><span className="font-medium">Finder Earnings:</span> {formatCurrency(selectedUser?.analytics?.finderEarnings?.totalProcessed || 0)}</p>
                <p><span className="font-medium">Owner Payments:</span> {formatCurrency(selectedUser?.analytics?.ownerPayments?.total || 0)}</p>
                <p><span className="font-medium">Tracking Suspicious Jumps:</span> {selectedUser?.analytics?.tracking?.suspicion?.suspiciousJumps || 0}</p>
                <p><span className="font-medium">Long Inactivity Gaps:</span> {selectedUser?.analytics?.tracking?.suspicion?.noMovementLongGap || 0}</p>
              </div>
            )}
          </article>
        </section>
      ) : null}

      {activeTab === 'requests' ? (
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="pnf-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <select className="pnf-input" value={requestStatusFilter} onChange={(event) => setRequestStatusFilter(event.target.value)}>
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
              <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={loadRequests}>Apply</button>
            </div>

            <div className="max-h-140 space-y-2 overflow-y-auto pr-1">
              {requests.map((row) => (
                <article key={row._id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{row.itemName}</p>
                    <StatusBadge value={row.requestStatus} />
                  </div>
                  <p className="text-xs text-slate-600">Owner: {row?.owner?.full_name || '-'}</p>
                  <p className="text-xs text-slate-600">Payment: {row?.payment?.paymentStatus || 'none'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="pnf-btn-outline rounded-lg px-2 py-1 text-xs" onClick={() => onSelectRequest(row._id)}>View</button>
                    <button type="button" className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700" onClick={() => handleRequestAction(row._id, 'delete')}>Delete</button>
                    <button type="button" className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700" onClick={() => handleRequestAction(row._id, 'force_close')}>Force Close</button>
                    <button type="button" className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700" onClick={() => handleRequestAction(row._id, 'reopen')}>Reopen</button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="pnf-card p-4">
            <h3 className="text-base font-semibold text-slate-900">Request Full Details</h3>
            {!selectedRequest ? (
              <EmptyState title="No request selected" description="Pick a request to inspect owner, assignment, evidence, timeline, and chat context." />
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-medium">Owner:</span> {selectedRequest?.owner?.full_name || '-'}</p>
                <p><span className="font-medium">Finder:</span> {selectedRequest?.assignment?.finder?.full_name || '-'}</p>
                <p><span className="font-medium">Payment Status:</span> {selectedRequest?.payment?.paymentStatus || '-'}</p>
                <p><span className="font-medium">Assignment Status:</span> {selectedRequest?.assignment?.status || '-'}</p>
                <p><span className="font-medium">Evidence:</span> {selectedRequest?.evidence?.verificationStatus || 'none'}</p>
                <p><span className="font-medium">Timeline Events:</span> {selectedRequest?.timeline?.length || 0}</p>
                <p><span className="font-medium">Chat Messages:</span> {selectedRequest?.chatHistory?.messages?.length || 0}</p>
              </div>
            )}
          </article>
        </section>
      ) : null}

      {activeTab === 'assignments' ? (
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="pnf-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <select className="pnf-input" value={assignmentStatusFilter} onChange={(event) => setAssignmentStatusFilter(event.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={loadAssignments}>Apply</button>
            </div>

            <div className="max-h-140 space-y-2 overflow-y-auto pr-1">
              {assignments.map((row) => (
                <article key={row._id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{row?.request?.itemName || 'Assignment'}</p>
                    <StatusBadge value={row.status} />
                  </div>
                  <p className="text-xs text-slate-600">Finder: {row?.finder?.full_name || '-'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="pnf-btn-outline rounded-lg px-2 py-1 text-xs" onClick={() => onSelectAssignment(row._id)}>View</button>
                    <button type="button" className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700" onClick={() => handleAssignmentStatus(row._id, 'active')}>Mark Active</button>
                    <button type="button" className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700" onClick={() => handleAssignmentStatus(row._id, 'expired')}>Force Expire</button>
                    <button type="button" className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700" onClick={() => handleAssignmentStatus(row._id, 'cancelled')}>Cancel</button>
                    <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700" onClick={() => handleExtendDeadline(row._id)}>Extend</button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="pnf-card p-4">
            <h3 className="text-base font-semibold text-slate-900">Assignment Deep View</h3>
            {!selectedAssignment ? (
              <EmptyState title="No assignment selected" description="Select assignment to inspect owner, finder, tracking, evidence, and chat logs." />
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-medium">Owner:</span> {selectedAssignment?.owner?.full_name || '-'}</p>
                <p><span className="font-medium">Finder:</span> {selectedAssignment?.finder?.full_name || '-'}</p>
                <p><span className="font-medium">Deadline:</span> {formatDate(selectedAssignment?.assignment?.deadlineAt)}</p>
                <p><span className="font-medium">Tracking Updates:</span> {selectedAssignment?.tracking?.length || 0}</p>
                <p><span className="font-medium">Evidence Status:</span> {selectedAssignment?.evidence?.verificationStatus || 'none'}</p>
                <p><span className="font-medium">Chat Logs:</span> {selectedAssignment?.chatLogs?.messages?.length || 0}</p>
                <p><span className="font-medium">Timeline Events:</span> {selectedAssignment?.timeline?.length || 0}</p>
                <p><span className="font-medium">Suspicious Jumps:</span> {trackingAnalytics?.analytics?.suspiciousJumps || 0}</p>
                <p><span className="font-medium">Long Gaps:</span> {trackingAnalytics?.analytics?.noMovementLongGap || 0}</p>
              </div>
            )}
          </article>
        </section>
      ) : null}

      {activeTab === 'disputes' ? (
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="pnf-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <select className="pnf-input" value={disputeStatusFilter} onChange={(event) => setDisputeStatusFilter(event.target.value)}>
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
              <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={loadDisputes}>Apply</button>
            </div>

            <div className="max-h-140 space-y-2 overflow-y-auto pr-1">
              {disputes.map((row) => (
                <article key={row._id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{String(row.reason || '').replaceAll('_', ' ')}</p>
                    <StatusBadge value={row.status} />
                  </div>
                  <p className="text-xs text-slate-600">Raised by: {row?.raisedBy?.full_name || '-'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="pnf-btn-outline rounded-lg px-2 py-1 text-xs" onClick={() => onSelectDispute(row._id)}>View</button>
                    {row.status === 'open' ? (
                      <>
                        <button type="button" className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700" onClick={() => handleResolveDispute(row._id, 'finder_wins')}>Finder Correct</button>
                        <button type="button" className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700" onClick={() => handleResolveDispute(row._id, 'owner_wins')}>Owner Correct</button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="pnf-card p-4">
            <h3 className="text-base font-semibold text-slate-900">Dispute Deep View</h3>
            {!selectedDispute ? (
              <EmptyState title="No dispute selected" description="Select a dispute to inspect full case context." />
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-medium">Owner:</span> {selectedDispute?.assignment?.request?.owner?.full_name || '-'}</p>
                <p><span className="font-medium">Finder:</span> {selectedDispute?.assignment?.finder?.full_name || '-'}</p>
                <p><span className="font-medium">Evidence:</span> {selectedDispute?.evidence?.verificationStatus || 'none'}</p>
                <p><span className="font-medium">Tracking Logs:</span> {selectedDispute?.tracking?.length || 0}</p>
                <p><span className="font-medium">Chat Messages:</span> {selectedDispute?.chatHistory?.messages?.length || 0}</p>
                <p><span className="font-medium">Timeline Events:</span> {selectedDispute?.timeline?.length || 0}</p>
                <p><span className="font-medium">Admin Decision:</span> {selectedDispute?.dispute?.adminDecision || '-'}</p>
              </div>
            )}
          </article>

          {disputeResolutionRows.length > 0 ? (
            <article className="pnf-card p-4 xl:col-span-2">
              <h3 className="text-base font-semibold text-slate-900">Open Dispute Queue</h3>
              <div className="mt-2 space-y-2">
                {disputeResolutionRows.map((row) => (
                  <div key={row._id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 px-3 py-2 text-sm">
                    <span>{row?.raisedBy?.full_name || 'User'} vs {row?.againstUser?.full_name || 'User'}</span>
                    <StatusBadge value={row.status} />
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'payments' ? (
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="pnf-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <select className="pnf-input" value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="locked">Locked</option>
                <option value="released">Released</option>
                <option value="refunded">Refunded</option>
              </select>
              <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={loadPayments}>Apply</button>
            </div>

            <div className="max-h-140 space-y-2 overflow-y-auto pr-1">
              {payments.map((row) => (
                <article key={row._id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{row?.request?.itemName || 'Payment'}</p>
                    <StatusBadge value={row.paymentStatus} />
                  </div>
                  <p className="text-xs text-slate-600">Owner: {row?.owner?.full_name || '-'}</p>
                  <p className="text-xs text-slate-600">Amount: {formatCurrency(row.amount)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="pnf-btn-outline rounded-lg px-2 py-1 text-xs" onClick={() => onSelectPayment(row._id)}>View</button>
                    <button type="button" className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700" onClick={() => handlePaymentAction(row._id, 'force_release')}>Force Release</button>
                    <button type="button" className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700" onClick={() => handlePaymentAction(row._id, 'refund')}>Refund</button>
                    <button type="button" className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700" onClick={() => handlePaymentAction(row._id, 'flag')}>Flag</button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="pnf-card p-4">
            <h3 className="text-base font-semibold text-slate-900">Payment Details</h3>
            {!selectedPayment ? (
              <EmptyState title="No payment selected" description="Select a payment to inspect linked owner, request, assignment, and payout." />
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-medium">Owner:</span> {selectedPayment?.payment?.owner?.full_name || '-'}</p>
                <p><span className="font-medium">Request:</span> {selectedPayment?.payment?.request?.itemName || '-'}</p>
                <p><span className="font-medium">Assignment:</span> {selectedPayment?.assignment?._id || '-'}</p>
                <p><span className="font-medium">Amount:</span> {formatCurrency(selectedPayment?.payment?.amount || 0)}</p>
                <p><span className="font-medium">Status:</span> {selectedPayment?.payment?.paymentStatus || '-'}</p>
                <p><span className="font-medium">Created:</span> {formatDate(selectedPayment?.payment?.createdAt)}</p>
                <p><span className="font-medium">Released:</span> {formatDate(selectedPayment?.payment?.releasedAt)}</p>
              </div>
            )}
          </article>
        </section>
      ) : null}

      {activeTab === 'logs' ? (
        <section className="mt-4 pnf-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input className="pnf-input max-w-md" placeholder="Search logs" value={logSearch} onChange={(event) => setLogSearch(event.target.value)} />
            <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={loadAuditLogs}>Apply</button>
            <button type="button" className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" onClick={exportLogs}>Export CSV</button>
          </div>

          {auditLogs.length === 0 ? (
            <EmptyState title="No audit logs" description="No activity logs found for current filters." />
          ) : (
            <div className="max-h-155 space-y-2 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <article key={log._id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                  </div>
                  <p className="text-xs text-slate-600">{log.entityType} • {log?.user?.full_name || 'System'}</p>
                  <p className="mt-1 text-xs text-slate-600">{JSON.stringify(log.details || {})}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'notifications' ? (
        <section className="mt-4 pnf-card p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard title="Unread" value={notificationSummary.unreadCount} />
            <StatCard title="Failed (audit tracked)" value={notificationSummary.failedCount} />
            <StatCard title="Total in view" value={notifications.length} />
          </div>

          <div className="mt-3 grid gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-900">By Type</h3>
              <div className="mt-2 space-y-2">
                {(notificationSummary.byType || []).map((row) => (
                  <div key={row._id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
                    <span>{row._id || 'unknown'}</span>
                    <span className="font-medium">{row.count}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-900">Recent Notifications</h3>
              <div className="mt-2 max-h-105 space-y-2 overflow-y-auto pr-1">
                {notifications.slice(0, 60).map((item) => (
                  <div key={item._id} className="rounded border border-slate-200 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <StatusBadge value={item.type} />
                    </div>
                    <p className="text-xs text-slate-600">To: {item?.user?.full_name || '-'} • {item?.user?.email || '-'}</p>
                    <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === 'fraud' ? (
        <section className="mt-4 pnf-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              className="pnf-input max-w-xs"
              type="number"
              min={0}
              max={100}
              value={fraudThreshold}
              onChange={(event) => setFraudThreshold(Number(event.target.value || 0))}
            />
            <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={loadFraudSignals}>Apply Threshold</button>
          </div>

          {fraudSignals.length === 0 ? (
            <EmptyState title="No high-risk users" description="No users crossed the current risk threshold." />
          ) : (
            <div className="space-y-2">
              {fraudSignals.map((row) => (
                <article key={row.userId} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{row.full_name}</p>
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Risk Score: {row.riskScore}</span>
                  </div>
                  <p className="text-xs text-slate-600">{row.email}</p>
                  <p className="mt-1 text-xs text-slate-600">Failures: {row.assignmentStats?.failed || 0} • Disputes: {row.disputeCount || 0} • Suspicious jumps: {row.trackingSignals?.suspiciousJumps || 0}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'settings' ? (
        <section className="mt-4 pnf-card p-4">
          <h3 className="text-base font-semibold text-slate-900">System Settings</h3>
          {!settings ? (
            <LoadingSpinner text="Loading settings..." />
          ) : (
            <form
              className="mt-3 grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                saveSettings();
              }}
            >
              <label className="text-sm text-slate-700">
                Default assignment deadline (hours)
                <input
                  className="pnf-input mt-1"
                  type="number"
                  min={1}
                  max={168}
                  value={settingsDraft.defaultAssignmentDeadlineHours}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, defaultAssignmentDeadlineHours: event.target.value }))}
                />
              </label>

              <label className="text-sm text-slate-700">
                Tracking interval (minutes)
                <input
                  className="pnf-input mt-1"
                  type="number"
                  min={1}
                  max={120}
                  value={settingsDraft.trackingIntervalMinutes}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, trackingIntervalMinutes: event.target.value }))}
                />
              </label>

              <label className="text-sm text-slate-700">
                Max evidence images
                <input
                  className="pnf-input mt-1"
                  type="number"
                  min={1}
                  max={20}
                  value={settingsDraft.maxEvidenceImages}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, maxEvidenceImages: event.target.value }))}
                />
              </label>

              <label className="text-sm text-slate-700">
                Max evidence video seconds
                <input
                  className="pnf-input mt-1"
                  type="number"
                  min={30}
                  max={900}
                  value={settingsDraft.maxEvidenceVideoSeconds}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, maxEvidenceVideoSeconds: event.target.value }))}
                />
              </label>

              <label className="text-sm text-slate-700 md:col-span-2">
                Dispute time window (hours)
                <input
                  className="pnf-input mt-1"
                  type="number"
                  min={1}
                  max={720}
                  value={settingsDraft.disputeWindowHours}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, disputeWindowHours: event.target.value }))}
                />
              </label>

              <button type="submit" className="pnf-btn-primary rounded-lg px-3 py-2 text-sm md:col-span-2">Save Settings</button>
              <p className="text-xs text-slate-500 md:col-span-2">Last updated at: {formatDate(settings.updatedAt)}</p>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
