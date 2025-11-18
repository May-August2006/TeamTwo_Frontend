import React from 'react';

interface KpiCardProps {
  kpi: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down';
    trendValue?: string;
  };
}

const KPICard: React.FC<KpiCardProps> = ({ kpi }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full relative overflow-visible">
      <h3 className="text-gray-600 text-sm font-medium mb-2">
        {kpi.title}
      </h3>
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold text-blue-600">
          {kpi.value}
        </div>
        {kpi.trend && (
          <div className="flex items-center">
            {kpi.trend === 'up' ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            <span className={`text-sm ml-1 ${
              kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpi.trendValue}
            </span>
          </div>
        )}
      </div>
      {kpi.subtitle && (
        <p className="text-gray-500 text-sm mt-2">
          {kpi.subtitle}
        </p>
      )}
    </div>
  );
};

export default KPICard;