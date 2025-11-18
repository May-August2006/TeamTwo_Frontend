import React from 'react';
import type { Alert } from '../../types';

interface AlertCardProps {
  alert: Alert;
  onAction: (alertId: string, action: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onAction }) => {
  const getIcon = () => {
    switch (alert.type) {
      case 'overdue':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'expiry':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.93 4.93l9.07 9.07-9.07 9.07-9.07-9.07 9.07-9.07z" />
          </svg>
        );
    }
  };

  const getChipColor = () => {
    switch (alert.priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionButton = () => {
    switch (alert.type) {
      case 'overdue':
        return (
          <button
            onClick={() => onAction(alert.id, 'send_notice')}
            className="px-3 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
          >
            Send Notice
          </button>
        );
      case 'expiry':
        return (
          <button
            onClick={() => onAction(alert.id, 'renew')}
            className="px-3 py-1 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          >
            Renew
          </button>
        );
      case 'maintenance':
        return (
          <button
            onClick={() => onAction(alert.id, 'schedule')}
            className="px-3 py-1 text-xs font-medium text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          >
            Schedule
          </button>
        );
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (alert.type) {
      case 'overdue':
        return 'bg-red-50 border-red-100';
      case 'expiry':
        return 'bg-amber-50 border-amber-100';
      case 'maintenance':
        return 'bg-green-50 border-green-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className={`
      border rounded-lg mb-3 p-5 transition-all duration-200 ease-in-out 
      hover:transform hover:-translate-y-0.5 hover:shadow-md
      ${getBackgroundColor()}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">
              {alert.title}
            </h4>
            <p className="text-sm text-gray-600">
              {alert.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded-lg border ${getChipColor()}`}>
            {alert.priority}
          </span>
          {getActionButton()}
        </div>
      </div>
    </div>
  );
};