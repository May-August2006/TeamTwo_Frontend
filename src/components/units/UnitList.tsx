// components/units/UnitList.tsx
import React from 'react';
import { UnitType, type Unit } from '../../types/unit';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { UnitCard } from './UnitCard';

interface UnitListProps {
  units: Unit[];
  onEdit: (unit: Unit) => void;
  onDelete: (id: number, unitNumber: string) => void; // Updated to include unitNumber
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
}

// Thousand separator utility function
const formatNumber = (num: number): string => {
  if (!num && num !== 0) return '0';
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Unit type badge styling
const getUnitTypeBadge = (unitType: UnitType) => {
  const badges = {
    [UnitType.ROOM]: {
      color: 'bg-blue-100 text-blue-800',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: 'Room'
    },
    [UnitType.SPACE]: {
      color: 'bg-green-100 text-green-800',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
        </svg>
      ),
      label: 'Space'
    },
    [UnitType.HALL]: {
      color: 'bg-purple-100 text-purple-800',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Hall'
    },
  };
  return badges[unitType];
};

// Render unit card in list view
const renderListCard = (unit: Unit, onEdit: (unit: Unit) => void, onDelete: (id: number, unitNumber: string) => void) => {
  const badge = getUnitTypeBadge(unit.unitType);
  
  return (
    <div key={unit.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        {/* Left Section */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
              {badge.icon}
              <span className="ml-2">{badge.label}</span>
            </div>
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
              unit.isAvailable 
                ? 'bg-gray-100 text-gray-800' // Neutral color for available units
                : 'bg-green-100 text-green-800' // Green for occupied (positive)
            }`}>
              {unit.isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Unit {unit.unitNumber}</h3>
            <p className="text-gray-600">
              {unit.level.building.buildingName} • {unit.level.levelName} (Floor {unit.level.levelNumber})
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Branch: {unit.level.building.branchName}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Space</p>
              <p className="font-semibold">{unit.unitSpace} sqm</p>
            </div>
            <div>
              <p className="text-gray-500">Rental Fee</p>
              <p className="font-semibold text-red-600">{formatNumber(unit.rentalFee)} MMK/month</p>
            </div>
            <div>
              <p className="text-gray-500">Utilities</p>
              <p className="font-semibold">{unit.utilities?.length || 0} available</p>
            </div>
            <div>
              <p className="text-gray-500">Meter</p>
              <p className={`font-semibold ${unit.hasMeter ? 'text-green-600' : 'text-gray-500'}`}>
                {unit.hasMeter ? 'Has Meter' : 'No Meter'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Section - Actions */}
        <div className="mt-4 md:mt-0 md:ml-6">
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(unit)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => onDelete(unit.id, unit.unitNumber)}
              className="px-4 py-2 bg-white border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Updated: {new Date(unit.updatedAt).toLocaleDateString()}</p>
            <p>Created: {new Date(unit.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      {/* Images Preview (if any) */}
      {unit.imageUrls && unit.imageUrls.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Images ({unit.imageUrls.length})</h4>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {unit.imageUrls.slice(0, 5).map((imageUrl, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imageUrl}
                  alt={`Unit ${unit.unitNumber} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 4 && unit.imageUrls.length > 5 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      +{unit.imageUrls.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
    <div className={`space-y-6 p-6 ${
      viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-6'
    }`}>
      {viewMode === 'grid' ? (
        units.map(unit => (
          <UnitCard
            key={unit.id}
            unit={unit}
            onEdit={onEdit}
            onDelete={(id) => onDelete(id, unit.unitNumber)}
          />
        ))
      ) : (
        units.map(unit => renderListCard(unit, onEdit, onDelete))
      )}
    </div>
  );
};