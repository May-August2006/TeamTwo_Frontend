import React from 'react';
import type { KPI } from '../../types';

interface KPICardProps {
  kpi: KPI;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  return (
    <div className="min-h-[140px] border border-gray-200 rounded-lg transition-all duration-200 ease-in-out hover:transform hover:-translate-y-1 hover:shadow-lg hover:border-blue-300">
      <div className="p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {kpi.title}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-3xl font-bold text-blue-600">
            {kpi.value}
          </h3>
          {kpi.trend && (
            kpi.trend === 'up' ? 
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg> : 
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
          )}
        </div>
        {kpi.subtitle && (
          <p className="text-sm font-medium text-gray-500">
            {kpi.subtitle}
          </p>
        )}
      </div>
    </div>
  );
};