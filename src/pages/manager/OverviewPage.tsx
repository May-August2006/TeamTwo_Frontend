/** @format */

import React, { useState, useEffect } from 'react';

interface KPI {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  format?: 'currency' | 'number' | 'percentage';
}

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
  timestamp: string;
  actionRequired: boolean;
}

export const OverviewPage: React.FC = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockKPIs: KPI[] = [
      {
        id: '1',
        title: 'Total Tenants',
        value: 45,
        change: 12,
        changeType: 'increase',
        format: 'number'
      },
      {
        id: '2',
        title: 'Occupancy Rate',
        value: 92,
        change: 5,
        changeType: 'increase',
        format: 'percentage'
      },
      {
        id: '3',
        title: 'Monthly Revenue',
        value: 125000,
        change: -3,
        changeType: 'decrease',
        format: 'currency'
      },
      {
        id: '4',
        title: 'Pending Payments',
        value: 8,
        change: 2,
        changeType: 'increase',
        format: 'number'
      },
      {
        id: '5',
        title: 'Active Leases',
        value: 42,
        change: 8,
        changeType: 'increase',
        format: 'number'
      }
    ];

    const mockAlerts: Alert[] = [
      {
        id: '1',
        title: 'Lease Expiring',
        message: '3 leases are expiring in the next 30 days',
        type: 'warning',
        timestamp: '2024-01-15',
        actionRequired: true
      },
      {
        id: '2',
        title: 'Payment Overdue',
        message: '5 tenants have overdue payments',
        type: 'error',
        timestamp: '2024-01-14',
        actionRequired: true
      },
      {
        id: '3',
        title: 'Maintenance Scheduled',
        message: 'Monthly maintenance scheduled for common areas',
        type: 'info',
        timestamp: '2024-01-13',
        actionRequired: false
      }
    ];

    setKpis(mockKPIs);
    setAlerts(mockAlerts);
    setLoading(false);
  }, []);

  const handleAlertAction = (alertId: string, action: string) => {
    console.log(`Action ${action} on alert ${alertId}`);
    // Implement alert action logic
  };

  const formatValue = (kpi: KPI) => {
    switch (kpi.format) {
      case 'currency':
        return `$${kpi.value.toLocaleString()}`;
      case 'percentage':
        return `${kpi.value}%`;
      default:
        return kpi.value.toLocaleString();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Dashboard Overview</h1>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">{kpi.title}</h3>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatValue(kpi)}
              </span>
              <div className={`flex items-center text-sm ${
                kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.changeType === 'increase' ? (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {Math.abs(kpi.change)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'warning'
                    ? 'border-yellow-400 bg-yellow-50'
                    : alert.type === 'error'
                    ? 'border-red-400 bg-red-50'
                    : alert.type === 'info'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-green-400 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <span className="text-xs text-gray-500 mt-2 block">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {alert.actionRequired && (
                    <button
                      onClick={() => handleAlertAction(alert.id, 'view')}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};