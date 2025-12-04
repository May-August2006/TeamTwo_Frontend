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

export const UnitCard: React.FC<UnitCardProps> = ({ unit, onEdit, onDelete }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const primaryImage = unit.imageUrls && unit.imageUrls.length > 0 ? unit.imageUrls[0] : null;

  const getUnitTypeBadge = (unitType: UnitType) => {
    const badges = {
      [UnitType.ROOM]: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'Room',
        icon: (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      },
      [UnitType.SPACE]: { 
        color: 'bg-green-100 text-green-800', 
        label: 'Space',
        icon: (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
          </svg>
        )
      },
      [UnitType.HALL]: { 
        color: 'bg-purple-100 text-purple-800', 
        label: 'Hall',
        icon: (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      },
    };
    return badges[unitType];
  };

  // Get type-specific name with formatting
  const getTypeName = () => {
    switch (unit.unitType) {
      case UnitType.ROOM:
        return unit.roomType?.typeName || 'N/A';
      case UnitType.SPACE:
        return `${unit.spaceType?.name || 'N/A'} (${formatCurrency(unit.spaceType?.basePricePerSqm || 0)}/sqm)`;
      case UnitType.HALL:
        return `${unit.hallType?.name || 'N/A'} (${unit.hallType?.capacity || 0} people)`;
      default:
        return 'N/A';
    }
  };

  const openDetailModal = () => {
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true);
      await onDelete(unit.id, unit.unitNumber);
    } catch (error) {
      console.error('Error in delete handler:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const unitTypeBadge = getUnitTypeBadge(unit.unitType);
  const typeName = getTypeName();

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1">
        {/* Image Section */}
        <div 
          className="cursor-pointer relative h-56 overflow-hidden" 
          onClick={openDetailModal}
        >
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={`Unit ${unit.unitNumber}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-5xl mb-2 text-gray-300">
                {unit.unitType === UnitType.ROOM ? '🏢' : 
                 unit.unitType === UnitType.SPACE ? '📐' : '🎭'}
              </div>
              <p className="text-gray-400 text-sm">No Image Available</p>
            </div>
          )}
          
          {/* Image Count Badge */}
          {unit.imageUrls && unit.imageUrls.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                +{unit.imageUrls.length - 1}
              </span>
            </div>
          )}

          {/* Unit Type Badge */}
          <div className="absolute top-3 left-3 flex items-center">
            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${unitTypeBadge.color}`}>
              {unitTypeBadge.icon}
              {unitTypeBadge.label}
            </span>
          </div>

          {/* Has Meter Badge */}
          {unit.hasMeter && (
            <div className="absolute top-14 left-3">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 shadow-sm">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Has Meter
              </span>
            </div>
          )}

          {/* Availability Badge - Updated colors for mall owners */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
              unit.isAvailable 
                ? 'bg-gray-100 text-gray-800' // Neutral gray for available units
                : 'bg-green-100 text-green-800' // Green for occupied (positive revenue)
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                unit.isAvailable ? 'bg-gray-500' : 'bg-green-500'
              }`}></div>
              {unit.isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
            <div className="p-4 w-full text-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-gray-900 font-semibold text-sm">Click to view details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
              <span className="bg-gray-100 px-2 py-1 rounded-md mr-2 font-mono">{unit.unitNumber}</span>
              <span className="text-gray-600 text-sm">Unit</span>
            </h3>
            <div className="flex items-center text-gray-600 text-sm mb-3">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{unit.level.building.buildingName} - Floor {unit.level.levelNumber}</span>
            </div>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Unit Type</p>
              <p className="font-semibold text-gray-900 truncate">{typeName}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Space Area</p>
              <p className="font-semibold text-gray-900">{unit.unitSpace} sqm</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Monthly Rent</p>
              <p className="font-semibold text-red-600 text-lg">{formatCurrency(unit.rentalFee)} MMK</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Utilities</p>
              <p className="font-semibold text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {unit.utilities?.length || 0} active
              </p>
            </div>
          </div>

          {/* Branch Information */}
          <div className="mb-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm text-blue-700 font-medium">
                {unit.level.building.branchName}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => onEdit(unit)}
              variant="primary"
              size="sm"
              className="flex-1 justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button
              onClick={handleDeleteClick}
              variant="danger"
              size="sm"
              disabled={isDeleting}
              loading={isDeleting}
              className="flex-1 justify-center shadow-md"
            >
              {!isDeleting && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              onClick={openDetailModal}
              variant="secondary"
              size="sm"
              className="flex-1 justify-center shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Quick View
            </Button>
          </div>

          {/* Created Date */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Created: {new Date(unit.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Unit Detail Modal */}
      <UnitDetail
        unitId={unit.id}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        onEdit={onEdit}
        onDelete={(id) => onDelete(id, unit.unitNumber)}
      />
    </>
  );
};