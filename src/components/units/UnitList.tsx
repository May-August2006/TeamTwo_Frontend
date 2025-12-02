// components/units/UnitList.tsx
import React from 'react';
import type { Unit, UnitType } from '../../types/unit';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { UnitCard } from './UnitCard';

interface UnitListProps {
  units: Unit[];
  onEdit: (unit: Unit) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
}

export const UnitList: React.FC<UnitListProps> = ({
  units,
  onEdit,
  onDelete,
  isLoading = false,
  viewMode = 'grid'
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
        <p className="text-gray-500">Try adjusting your search filters or create a new unit.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 p-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
        : 'grid-cols-1'
    }`}>
      {units.map(unit => (
        <UnitCard
          key={unit.id}
          unit={unit}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};