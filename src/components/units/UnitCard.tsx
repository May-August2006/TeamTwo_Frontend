// components/units/UnitCard.tsx
import React, { useState } from 'react';
import { UnitType, type Unit } from '../../types/unit';
import { Button } from '../common/ui/Button';
import { UnitDetail } from './UnitDetail';
import { formatCurrency } from '../../utils/formatUtils'; // Import the utility

interface UnitCardProps {
  unit: Unit;
  onEdit: (unit: Unit) => void;
  onDelete: (id: number, unitNumber: string) => void; // Updated to include unitNumber
}

// components/units/UnitCard.tsx - Simplified version
export const UnitCard: React.FC<UnitCardProps> = ({ unit, onEdit, onDelete }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const primaryImage = unit.imageUrls && unit.imageUrls.length > 0 ? unit.imageUrls[0] : null;

  const getUnitTypeBadge = (unitType: UnitType) => {
    const badges = {
      [UnitType.ROOM]: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'Room',
        icon: '🏢'
      },
      [UnitType.SPACE]: { 
        color: 'bg-green-100 text-green-800', 
        label: 'Space',
        icon: '📐'
      },
      [UnitType.HALL]: { 
        color: 'bg-purple-100 text-purple-800', 
        label: 'Hall',
        icon: '🎭'
      },
    };
    return badges[unitType];
  };

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group relative"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Floating Action Buttons (Visible on Hover) */}
        {showActions && (
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <button
              onClick={() => onEdit(unit)}
              className="p-2 bg-white rounded-full shadow-md hover:shadow-lg hover:bg-blue-50 transition-all duration-200 text-blue-600 hover:text-blue-700"
              title="Edit unit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(unit.id, unit.unitNumber)}
              disabled={isDeleting}
              className="p-2 bg-white rounded-full shadow-md hover:shadow-lg hover:bg-red-50 transition-all duration-200 text-red-600 hover:text-red-700"
              title="Delete unit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        {/* Image Section */}
        <div 
          className="cursor-pointer relative h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
          onClick={() => setIsDetailModalOpen(true)}
        >
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={`Unit ${unit.unitNumber}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="text-4xl mb-2 text-gray-300">
                {getUnitTypeBadge(unit.unitType).icon}
              </div>
              <p className="text-gray-400 text-xs">No Image</p>
            </div>
          )}
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getUnitTypeBadge(unit.unitType).color}`}>
              {getUnitTypeBadge(unit.unitType).label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
              unit.isAvailable 
                ? 'bg-gray-100 text-gray-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${unit.isAvailable ? 'bg-gray-500' : 'bg-green-500'}`} />
              {unit.isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Unit Header */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {unit.unitNumber}
              </h3>
              <span className="text-sm text-gray-500 font-mono">
                {unit.unitSpace} sqm
              </span>
            </div>
            <p className="text-sm text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {unit.level.building.buildingName}, Floor {unit.level.levelNumber}
            </p>
          </div>

          {/* Key Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Rental Fee</span>
              <span className="font-semibold text-gray-900">{formatCurrency(unit.rentalFee)} MMK/mo</span>
            </div>
            {/* <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Utilities</span>
              <span className="font-medium text-blue-600">{unit.utilities?.length || 0} active</span>
            </div>
            {unit.hasMeter && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Meter</span>
                <span className="font-medium text-green-600">Has meter</span>
              </div>
            )} */}
          </div>

          {/* Branch & Quick View */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {unit.level.building.branch.branchName}
            </span>
            <button
              onClick={() => setIsDetailModalOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Quick view
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Unit Detail Modal */}
      <UnitDetail
        unitId={unit.id}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={onEdit}
        onDelete={(id) => onDelete(id, unit.unitNumber)}
      />
    </>
  );
};