// components/units/UnitDetail.tsx
import React, { useState, useEffect } from 'react';
import { UnitType, type Unit } from '../../types/unit';
import { unitApi } from '../../api/UnitAPI';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { Button } from '../common/ui/Button';
import { formatCurrency } from '../../utils/formatUtils';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from 'react-i18next';

interface UnitDetailProps {
  unitId: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (unit: Unit) => void;
  onDelete: (id: number, unitNumber: string) => void;
}

export const UnitDetail: React.FC<UnitDetailProps> = ({
  unitId,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const { showSuccess, showError } = useNotification();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [updatingUtility, setUpdatingUtility] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'utilities' | 'location'>('details');
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && unitId) {
      fetchUnitDetails();
    }
  }, [isOpen, unitId]);

  const fetchUnitDetails = async () => {
    setIsLoading(true);
    try {
      const response = await unitApi.getById(unitId);
      setUnit(response.data);
    } catch (error: any) {
      console.error('Error fetching unit details:', error);
      const errorMessage = error.response?.data?.message || t('units.errors.loadFailed');
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add keyboard shortcuts for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isImageModalOpen && unit?.imageUrls) {
        if (e.key === 'Escape') {
          closeImageModal();
        } else if (e.key === 'ArrowLeft') {
          prevImage();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          downloadCurrentImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, unit?.imageUrls, selectedImageIndex]);

  const getUnitTypeBadge = (unitType: UnitType) => {
    const badges = {
      [UnitType.ROOM]: { 
        color: 'bg-blue-100 text-blue-800 border border-blue-200', 
        label: t('units.types.room'),
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      },
      [UnitType.SPACE]: { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        label: t('units.types.space'),
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
          </svg>
        )
      },
      [UnitType.HALL]: { 
        color: 'bg-purple-100 text-purple-800 border border-purple-200', 
        label: t('units.types.hall'),
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      },
    };
    return badges[unitType];
  };

 const getTypeSpecificInfo = () => {
  if (!unit) return null;
  
  switch (unit.unitType) {
    case UnitType.ROOM:
      return (
        <>
          {/* Room Type Box */}
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{t('units.details.roomType')}</p>
            <p className="font-medium text-gray-900">{unit.roomType?.typeName || t('common.notAvailable')}</p>
          </div>
          
          {/* Room Description (if exists) */}
          {unit.roomType?.description && (
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">{t('units.details.description')}</p>
              <p className="font-medium text-gray-900 text-sm">{unit.roomType.description}</p>
            </div>
          )}
        </>
      );
    case UnitType.SPACE:
      return (
        <>
          {/* Space Type Box */}
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{t('units.details.spaceType')}</p>
            <p className="font-medium text-gray-900">{unit.spaceType?.name || t('common.notAvailable')}</p>
          </div>
          
          {/* Base Price per sqm Box */}
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{t('units.details.basePrice')}</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(unit.spaceType?.basePricePerSqm || 0)}/sqm
            </p>
          </div>
          
          {/* Total Price Box */}
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{t('units.details.totalPrice')}</p>
            <p className="font-medium text-gray-900">
              {formatCurrency((unit.spaceType?.basePricePerSqm || 0) * unit.unitSpace)}
            </p>
          </div>
          
          {/* Space Description (if exists) */}
          {unit.spaceType?.description && (
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">{t('units.details.description')}</p>
              <p className="font-medium text-gray-900 text-sm">{unit.spaceType.description}</p>
            </div>
          )}
        </>
      );
    case UnitType.HALL:
      return (
        <>
          {/* Hall Type Box */}
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{t('units.details.hallType')}</p>
            <p className="font-medium text-gray-900">{unit.hallType?.name || t('common.notAvailable')}</p>
          </div>
          
          {/* Capacity Box */}
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{t('units.details.capacity')}</p>
            <p className="font-medium text-gray-900">{unit.hallType?.capacity || 0} {t('units.details.people')}</p>
          </div>
          
          {/* Base Price Box (if exists) */}
          {unit.hallType?.basePrice && (
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">{t('units.details.basePrice')}</p>
              <p className="font-medium text-gray-900">{formatCurrency(unit.hallType.basePrice)}</p>
            </div>
          )}
          
          {/* Hall Description (if exists) */}
          {unit.hallType?.description && (
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">{t('units.details.description')}</p>
              <p className="font-medium text-gray-900 text-sm">{unit.hallType.description}</p>
            </div>
          )}
        </>
      );
    default:
      return null;
  }
};

  // Toggle utility status
  const toggleUtilityStatus = async (utilityTypeId: number, currentStatus: boolean) => {
    setUpdatingUtility(utilityTypeId);
    try {
      await unitApi.toggleUnitUtility(unitId, utilityTypeId, !currentStatus);
      
      // Re-fetch the complete unit data
      await fetchUnitDetails();
      
      // Show success notification
      showSuccess(t('units.utilities.toggleSuccess', { status: !currentStatus ? t('common.activated') : t('common.deactivated') }));
      
    } catch (error: any) {
      console.error('Error toggling utility status:', error);
      const errorMessage = error.response?.data?.message || t('units.errors.toggleFailed');
      showError(errorMessage);
    } finally {
      setUpdatingUtility(null);
    }
  };

  const openImageModal = (index: number = 0) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const nextImage = () => {
    if (unit?.imageUrls) {
      setSelectedImageIndex((prev) => 
        prev === unit.imageUrls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (unit?.imageUrls) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? unit.imageUrls!.length - 1 : prev - 1
      );
    }
  };

  const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
  };

  const downloadCurrentImage = () => {
    if (!unit?.imageUrls || !unit.imageUrls[selectedImageIndex]) return;
    
    const link = document.createElement('a');
    link.href = unit.imageUrls[selectedImageIndex];
    link.download = `Unit-${unit.unitNumber}-Image-${selectedImageIndex + 1}.jpg`;
    link.click();
  };

  const handleEdit = () => {
    if (unit) {
      onEdit(unit);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!unit) return;
    
    try {
      setIsDeleting(true);
      await onDelete(unit.id, unit.unitNumber);
      onClose();
    } catch (error) {
      console.error('Error deleting unit:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const unitTypeBadge = getUnitTypeBadge(unit?.unitType || UnitType.ROOM);

  return (
    <>
      {/* Unit Detail Modal - Fixed to match size from first example */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isLoading ? t('common.loading') : `${t('units.title')} ${unit?.unitNumber}`}
                </h2>
                {!isLoading && unit && (
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${unitTypeBadge.color}`}>
                    {unitTypeBadge.icon}
                    {unitTypeBadge.label}
                  </span>
                )}
              </div>
              {!isLoading && unit && (
                <p className="text-gray-600 mt-1">
                 {unit.level.building.branch.branchName || unit.level.building.branchName} • {unit.level.building.buildingName} • {unit.level.levelName} • {t('units.details.floor')} {unit.level.levelNumber}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : unit ? (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image Gallery Section - From first example */}
                  <div>
                    {/* Main Image */}
                    <div 
                      className="bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-pointer hover:opacity-95 transition-opacity group relative"
                      onClick={() => unit.imageUrls && unit.imageUrls.length > 0 && openImageModal(0)}
                    >
                      {unit.imageUrls && unit.imageUrls.length > 0 ? (
                        <>
                          <img
                            src={unit.imageUrls[0]}
                            alt={`${t('units.title')} ${unit.unitNumber}`}
                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-black/70 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {t('units.gallery.clickToView')}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-500 mt-2">{t('units.gallery.noImages')}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {unit.imageUrls && unit.imageUrls.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {unit.imageUrls.slice(0, 4).map((image, index) => (
                          <button
                            key={index}
                            onClick={() => openImageModal(index)}
                            className="relative rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors group"
                          >
                            <img
                              src={image}
                              alt={`${t('units.gallery.thumbnail')} ${index + 1}`}
                              className="w-full h-16 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity"></div>
                          </button>
                        ))}
                        {unit.imageUrls.length > 4 && (
                          <button
                            onClick={() => openImageModal(4)}
                            className="relative rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors bg-gray-100 flex items-center justify-center"
                          >
                            <span className="text-gray-600 font-medium">
                              +{unit.imageUrls.length - 4} {t('units.gallery.more')}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Unit Details Section with Tabs */}
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                        unit.isAvailable 
                          ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                          : 'bg-green-100 text-green-800 border border-green-300'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          unit.isAvailable ? 'bg-gray-500' : 'bg-green-500'
                        }`}></div>
                        {unit.isAvailable ? t('units.status.available') : t('units.status.occupied')}
                      </span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(unit.rentalFee)} {t('units.currency.perMonth')}</p>
                        <p className="text-sm text-gray-500">{t('units.details.rentalFee')}</p>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                      <nav className="flex space-x-4">
                        <button
                          onClick={() => setActiveTab('details')}
                          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'details'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {t('units.tabs.details')}
                        </button>
                        <button
                          onClick={() => setActiveTab('utilities')}
                          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'utilities'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {t('units.tabs.utilities')} ({unit.utilities?.length || 0})
                        </button>
                        <button
                          onClick={() => setActiveTab('location')}
                          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'location'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {t('units.tabs.location')}
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4">
                      {activeTab === 'details' && (
                        <div className="space-y-4">
                          {/* Unit Specifications */}
<div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
    {t('units.details.specifications')}
  </h3>
  <div className="grid grid-cols-2 gap-4">
    {/* Unit Number Box */}
    <div className="bg-white p-3 rounded-lg shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{t('units.details.unitNumber')}</p>
      <p className="font-medium text-gray-900 text-lg font-mono">{unit.unitNumber}</p>
    </div>
    
    {/* Space Area Box */}
    <div className="bg-white p-3 rounded-lg shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{t('units.details.spaceArea')}</p>
      <p className="font-medium text-gray-900 text-lg">{unit.unitSpace} sqm</p>
    </div>
    
    {/* Unit Type Box */}
    <div className="bg-white p-3 rounded-lg shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{t('units.details.unitType')}</p>
      <p className="font-medium text-gray-900 capitalize">{t(`units.types.${unit.unitType.toLowerCase()}`)}</p>
    </div>
    
    {/* Meter Box */}
    <div className="bg-white p-3 rounded-lg shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{t('units.details.meter')}</p>
      <p className={`font-medium text-lg ${unit.hasMeter ? 'text-green-600' : 'text-red-600'}`}>
        {unit.hasMeter ? (
          <span className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('units.details.hasMeter')}
          </span>
        ) : (
          <span className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('units.details.noMeter')}
          </span>
        )}
      </p>
    </div>
    
    {/* Type-specific information */}
    {getTypeSpecificInfo()}
    
    {/* Created Date Box */}
    <div className="bg-white p-3 rounded-lg shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{t('units.details.createdDate')}</p>
      <p className="font-medium text-gray-900">
        {new Date(unit.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </p>
    </div>
    
    {/* Last Updated Box */}
    <div className="bg-white p-3 rounded-lg shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{t('units.details.lastUpdated')}</p>
      <p className="font-medium text-gray-900">
        {new Date(unit.updatedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </p>
    </div>
  </div>
</div>
                        </div>
                      )}

                      {activeTab === 'utilities' && unit.utilities && unit.utilities.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {t('units.utilities.title')} ({unit.utilities.filter(u => u.isActive).length} {t('units.utilities.active')} / {unit.utilities.length} {t('units.utilities.total')})
                          </h3>
                          <div className="space-y-3">
                            {unit.utilities.map((utility) => (
                              <div 
                                key={utility.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                  utility.isActive 
                                    ? 'bg-white border-green-200 shadow-sm' 
                                    : 'bg-gray-50 border-gray-300 opacity-70'
                                }`}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className={`w-3 h-3 rounded-full ${
                                    utility.isActive ? 'bg-green-500' : 'bg-gray-400'
                                  }`}></div>
                                  <div>
                                    <p className={`font-medium ${
                                      utility.isActive ? 'text-gray-900' : 'text-gray-500'
                                    }`}>
                                      {utility.utilityName}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {formatCurrency(utility.ratePerUnit)} {t('units.utilities.perUnit')} • {utility.calculationMethod}
                                    </p>
                                    {!utility.isActive && (
                                      <p className="text-xs text-red-500 mt-1">{t('units.utilities.inactive')}</p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => toggleUtilityStatus(utility.id, utility.isActive)}
                                  variant={utility.isActive ? "secondary" : "primary"}
                                  size="sm"
                                  disabled={updatingUtility === utility.id}
                                  loading={updatingUtility === utility.id}
                                  className="min-w-[100px]"
                                >
                                  {updatingUtility === utility.id ? (
                                    t('common.updating')
                                  ) : utility.isActive ? (
                                    t('common.deactivate')
                                  ) : (
                                    t('common.activate')
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'location' && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {t('units.location.title')}
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <span className="text-gray-600">{t('units.location.branch')}</span>
                              <span className="font-medium text-gray-900">{unit.level.building.branch.branchName || unit.level.building.branchName}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <span className="text-gray-600">{t('units.location.building')}</span>
                              <span className="font-medium text-gray-900">{unit.level.building.buildingName}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <span className="text-gray-600">{t('units.location.floor')}</span>
                              <span className="font-medium text-gray-900">{unit.level.levelName} ({t('units.details.floor')} {unit.level.levelNumber})</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                  <Button
                    onClick={onClose}
                    variant="secondary"
                    className="px-6"
                  >
                    {t('common.close')}
                  </Button>
                  <Button
                    onClick={handleEdit}
                    variant="primary"
                    className="px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t('units.actions.edit')}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="danger"
                    disabled={isDeleting}
                    loading={isDeleting}
                    className="px-6"
                  >
                    {!isDeleting && (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    {isDeleting ? t('common.deleting') : t('units.actions.delete')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">😞</div>
                <p className="text-red-500 text-lg font-medium">{t('units.errors.loadFailed')}</p>
                <p className="text-gray-500 mt-2">{t('units.errors.tryAgain')}</p>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="mt-4"
                >
                  {t('common.close')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery Modal - From first example */}
      {isImageModalOpen && unit?.imageUrls && unit.imageUrls.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full w-full">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10 p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Buttons */}
            {unit.imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-4 transition-all backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-4 transition-all backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="flex items-center justify-center h-full">
              <img
                src={unit.imageUrls[selectedImageIndex]}
                alt={`${t('units.title')} ${unit.unitNumber} - ${t('units.gallery.image')} ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
              {selectedImageIndex + 1} / {unit.imageUrls.length}
            </div>

            {/* Thumbnail Strip */}
            {unit.imageUrls.length > 1 && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/50 backdrop-blur-sm rounded-xl p-3">
                {unit.imageUrls.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleThumbnailClick(index, e)}
                    className={`w-14 h-14 rounded-lg border-2 transition-all overflow-hidden ${
                      selectedImageIndex === index 
                        ? 'border-white ring-2 ring-blue-400 shadow-lg scale-110' 
                        : 'border-gray-400 hover:border-white hover:scale-105'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${t('units.gallery.thumbnail')} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};