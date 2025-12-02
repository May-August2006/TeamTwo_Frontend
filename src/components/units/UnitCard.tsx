// components/units/UnitCard.tsx
import React, { useState } from 'react';
import  { UnitType, type Unit } from '../../types/unit';
import { Button } from '../common/ui/Button';
import { UnitDetail } from './UnitDetail';

interface UnitCardProps {
  unit: Unit;
  onEdit: (unit: Unit) => void;
  onDelete: (id: number) => void;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, onEdit, onDelete }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const primaryImage = unit.imageUrls && unit.imageUrls.length > 0 ? unit.imageUrls[0] : null;

  const getUnitTypeBadge = (unitType: UnitType) => {
    const badges = {
      [UnitType.ROOM]: { color: 'bg-blue-100 text-blue-800', label: 'Room' },
      [UnitType.SPACE]: { color: 'bg-green-100 text-green-800', label: 'Space' },
      [UnitType.HALL]: { color: 'bg-purple-100 text-purple-800', label: 'Hall' },
    };
    return badges[unitType];
  };

  const getUnitTypeIcon = (unitType: UnitType) => {
    switch (unitType) {
      case UnitType.ROOM:
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case UnitType.SPACE:
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
          </svg>
        );
      case UnitType.HALL:
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return null;
    }
  };

  const openDetailModal = () => {
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const unitTypeBadge = getUnitTypeBadge(unit.unitType);
  const typeName = unit.roomType?.typeName || unit.spaceType?.name || unit.hallType?.name || 'N/A';

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        {/* Image Section */}
        <div 
          className="cursor-pointer relative" 
          onClick={openDetailModal}
        >
          {primaryImage ? (
            <div className="h-48 bg-gray-200 overflow-hidden">
              <img
                src={primaryImage}
                alt={`Unit ${unit.unitNumber}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Image Count Badge */}
          {unit.imageUrls && unit.imageUrls.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
              +{unit.imageUrls.length - 1}
            </div>
          )}

          {/* Unit Type Badge */}
          <div className="absolute top-2 left-2 flex items-center">
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${unitTypeBadge.color}`}>
              {getUnitTypeIcon(unit.unitType)}
              {unitTypeBadge.label}
            </span>
          </div>

          {/* Has Meter Badge */}
          {unit.hasMeter && (
            <div className="absolute top-10 left-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Has Meter
              </span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
              View Details
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{unit.unitNumber}</h3>
              <p className="text-gray-600 text-sm mt-1">
                {unit.level.building.buildingName} - {unit.level.levelName}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
              unit.isAvailable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {unit.isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900">{typeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Space</p>
              <p className="font-medium text-gray-900">{unit.unitSpace} sqm</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Rental Fee</p>
              <p className="font-medium text-gray-900">{unit.rentalFee} MMK</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilities</p>
              <p className="font-medium text-gray-900">
                {unit.utilities?.length || 0} active
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              onClick={() => onEdit(unit)}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              onClick={() => onDelete(unit.id)}
              variant="danger"
              size="sm"
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              onClick={openDetailModal}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Quick View
            </Button>
          </div>
        </div>
      </div>

      {/* Unit Detail Modal */}
      <UnitDetail
        unitId={unit.id}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};