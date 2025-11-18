import React from 'react';
import StatusChip from './StatusChip';

interface Invoice {
  id: string;
  tenant: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'overdue' | 'pending';
}

interface OverdueInvoicesCardProps {
  invoices: Invoice[];
}

const OverdueInvoicesCard: React.FC<OverdueInvoicesCardProps> = ({ invoices }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <h3 className="text-lg font-semibold text-red-600 mb-4">
        Overdue Invoices
      </h3>
      {invoices.map((invoice) => (
        <div key={invoice.id} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold">
              {invoice.tenant}
            </span>
            <StatusChip status={invoice.status} />
          </div>
          <p className="text-gray-600 text-sm mb-1">
            {invoice.id} • Due: {invoice.dueDate}
          </p>
          <p className="font-semibold">
            ₹{invoice.amount.toLocaleString()}
          </p>
        </div>
      ))}
      <button className="w-full border border-red-500 text-red-600 py-2 px-4 rounded hover:bg-red-50 text-sm">
        Send Reminders
      </button>
    </div>
  );
};

export default OverdueInvoicesCard;