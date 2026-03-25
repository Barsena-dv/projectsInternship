export const resolveNotificationTarget = (notification, role) => {
  const requestId = notification?.requestId || notification?.data?.requestId;
  const assignmentId = notification?.assignmentId || notification?.data?.assignmentId;
  const type = String(notification?.type || notification?.notificationType || '').toLowerCase();

  if (role === 'owner') {
    if (requestId) return `/owner/requests/${requestId}`;
    if (assignmentId) return '/owner/requests';
    return '/notifications';
  }

  if (role === 'finder') {
    if (assignmentId) return `/finder/assignments/${assignmentId}`;
    if (requestId) return `/finder/requests/${requestId}`;

    if (type.includes('assignment')) return '/finder/assignments';
    return '/notifications';
  }

  if (role === 'admin') {
    if (requestId) return `/owner/requests/${requestId}`;
    return '/admin/dashboard';
  }

  return '/notifications';
};
