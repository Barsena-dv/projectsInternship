import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, requestApi } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

const FinderRequestDetailsPage = () => {
  const { id: requestId } = useParams();

  const [loading, setLoading] = useState(true);
  const [requestItem, setRequestItem] = useState(null);
  const [existingAssignment, setExistingAssignment] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applicationSent, setApplicationSent] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [requestRes, assignmentsRes] = await Promise.all([
        requestApi.byId(requestId),
        assignmentApi.my().catch(() => ({ data: [] })),
      ]);

      const requestData = requestRes?.data || null;
      const finderAssignments = assignmentsRes?.data || [];
      const matched = finderAssignments.find(
        (row) => String(row?.request?._id || row?.request) === String(requestId)
      ) || null;

      setRequestItem(requestData);
      setExistingAssignment(matched);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const requestIsOpen = String(requestItem?.requestStatus || '').toLowerCase() === 'open';

  const actionState = useMemo(() => {
    if (existingAssignment) {
      return {
        disabled: true,
        label: 'Already Assigned',
        helper: 'This request is already assigned to you. Continue from My Assignments.',
      };
    }

    if (applicationSent) {
      return {
        disabled: true,
        label: 'Application sent',
        helper: 'Waiting for owner approval.',
      };
    }

    if (!requestIsOpen) {
      return {
        disabled: true,
        label: 'Unavailable',
        helper: 'This request is no longer open for assignments.',
      };
    }

    return {
      disabled: false,
      label: 'Apply for Assignment',
      helper: 'Next step: submit your application for this request.',
    };
  }, [applicationSent, existingAssignment, requestIsOpen]);

  const applyForAssignment = async () => {
    try {
      setApplying(true);
      await assignmentApi.accept(requestId);
      setApplicationSent(true);
      toast.success('Application sent. Waiting for owner approval.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading request details..." />;
  }

  if (!requestItem) {
    return <EmptyState title="Request not found" description="This request may have been removed or closed." />;
  }

  return (
    <div>
      <PageHeader
        title="Request Details"
        subtitle="Review complete request information before applying."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" to="/finder/requests">Back to Requests</Link>
            <Link className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" to="/finder/assignments">My Assignments</Link>
          </div>
        )}
      />

      <section className="pnf-card p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge value={requestItem.requestStatus || 'open'} />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {requestItem?.planId?.planName || 'Service plan'}
          </span>
        </div>

        <h2 className="text-lg font-semibold text-slate-900">{requestItem.itemName}</h2>
        <p className="mt-2 text-sm text-slate-700">{requestItem.itemDescription || '-'}</p>

        <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-medium">Category:</span> {requestItem.itemCategory || '-'}</p>
          <p><span className="font-medium">Reward:</span> {formatCurrency(requestItem?.planId?.rewardAmount || 0)}</p>
          <p><span className="font-medium">Last Seen:</span> {requestItem.lastSeenLocation || '-'}</p>
          <p><span className="font-medium">Created At:</span> {formatDate(requestItem.createdAt)}</p>
          <p><span className="font-medium">Deadline:</span> {formatDate(requestItem.serviceDeadline)}</p>
          <p><span className="font-medium">Service Duration:</span> {requestItem?.planId?.searchDuration || '-'} days</p>
        </div>
      </section>

      <section className="pnf-card mt-4 p-5">
        <h3 className="text-base font-semibold text-slate-900">Assignment Action</h3>
        <p className="mt-2 text-sm text-slate-600">{actionState.helper}</p>

        <button
          type="button"
          className="pnf-btn-primary mt-4 rounded-lg px-3 py-2 text-sm"
          disabled={actionState.disabled || applying}
          onClick={applyForAssignment}
        >
          {applying ? 'Applying...' : actionState.label}
        </button>
      </section>
    </div>
  );
};

export default FinderRequestDetailsPage;
