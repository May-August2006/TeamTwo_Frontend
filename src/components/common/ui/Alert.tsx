// components/common/ui/Alert.tsx
import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  type, 
  message, 
  onClose,
  className = '' 
}) => {
  const alertConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-400" />,
    },
  };

  const config = alertConfig[type];

  return (
    <div 
      className={`${config.bg} ${config.border} border rounded-md p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${config.text}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 ${config.bg} ${config.text} hover:${config.bg.replace('50', '100')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:${config.text.replace('800', '400')}`}
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};