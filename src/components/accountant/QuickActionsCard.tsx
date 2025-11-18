import React from 'react';

interface QuickActionsCardProps {
  onRecordPayment: () => void;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ onRecordPayment }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        Quick Actions
      </h3>
      <button 
        onClick={onRecordPayment}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mb-2"
      >
        Record Payment
      </button>
      <button className="w-full border border-blue-600 text-blue-600 py-2 px-4 rounded hover:bg-blue-50 mb-2">
        Generate Invoice
      </button>
      <button className="w-full border border-blue-600 text-blue-600 py-2 px-4 rounded hover:bg-blue-50">
        View Daily Report
      </button>
    </div>
  );
};

export default QuickActionsCard;