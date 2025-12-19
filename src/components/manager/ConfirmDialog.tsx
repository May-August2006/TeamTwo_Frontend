import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning',
}) => {
  const getConfirmButtonColor = () => {
    switch (severity) {
      case 'error': 
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning': 
        return 'bg-[#1E40AF] hover:bg-[#1E3A8A] focus:ring-[#1E40AF]';
      default: 
        return 'bg-[#1E40AF] hover:bg-[#1E3A8A] focus:ring-[#1E40AF]';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonColor()} transition-colors`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};