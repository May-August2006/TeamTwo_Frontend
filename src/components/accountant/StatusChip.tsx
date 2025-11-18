import React from 'react';

interface StatusChipProps {
  status: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const getStyles = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 text-xs rounded border ${getStyles(status)}`}>
      {getLabel(status)}
    </span>
  );
};

export default StatusChip;