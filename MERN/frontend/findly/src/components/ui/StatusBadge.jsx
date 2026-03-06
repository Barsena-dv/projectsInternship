
const statusConfig = {
    DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
    OPEN: { label: 'Open', className: 'bg-yellow-100 text-yellow-700' },
    ASSIGNED: { label: 'Assigned', className: 'bg-blue-100 text-blue-700' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-indigo-100 text-indigo-700' },
    COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    DISPUTED: { label: 'Disputed', className: 'bg-red-100 text-red-700' },
};

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-500' };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;
