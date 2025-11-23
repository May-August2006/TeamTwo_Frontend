// components/contracts/ContractForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { tenantApi } from '../../api/TenantAPI';
import { roomApi } from '../../api/RoomAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { CreateContractRequest, Room, Tenant, UtilityType } from '../../types/contract';

interface ContractCreateFormProps {
  onSubmit: (data: CreateContractRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Contract duration options with their month values
const contractDurationOptions = [
  { value: 'THREE_MONTHS', label: '3 Months', months: 3 },
  { value: 'SIX_MONTHS', label: '6 Months', months: 6 },
  { value: 'ONE_YEAR', label: '1 Year', months: 12 },
  { value: 'TWO_YEARS', label: '2 Years', months: 24 }
];

export const ContractForm: React.FC<ContractCreateFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<CreateContractRequest>({
    contractNumber: '',
    tenantId: 0,
    roomId: 0,
    startDate: '',
    endDate: '',
    rentalFee: 0,
    securityDeposit: 0,
    contractDurationType: 'ONE_YEAR',
    gracePeriodDays: 5,
    noticePeriodDays: 30,
    renewalNoticeDays: 60,
    contractTerms: '',
    utilityTypeIds: [],
    agreedToTerms: false
  });

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [utilities, setUtilities] = useState<UtilityType[]>([]);
  
  const [searchTerm, setSearchTerm] = useState({
    tenant: '',
    room: ''
  });
  
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedUtilityIds, setSelectedUtilityIds] = useState<number[]>([]);
  
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [utilitiesLoading, setUtilitiesLoading] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDropdown, setShowDropdown] = useState({
    tenant: false,
    room: false
  });

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsContent] = useState(`
TERMS AND CONDITIONS FOR COMMERCIAL LEASE AGREEMENT

1. PARTIES
This Lease Agreement is made between the Landlord and the Tenant as specified in this contract.

2. PREMISES
The Landlord leases to the Tenant the premises described in this contract for commercial purposes only.

3. TERM
The lease term shall commence on the Start Date and continue until the End Date specified in this contract.

4. RENT
Tenant shall pay the monthly rental fee as specified in this contract, due on the first day of each month.

5. SECURITY DEPOSIT
The security deposit shall be held by Landlord as security for the performance of Tenant's obligations.

6. UTILITIES
Utilities included in this contract are as specified. Additional utilities may be charged separately.

7. USE OF PREMISES
The premises shall be used only for the purpose specified in the tenant's business registration.

8. MAINTENANCE
Tenant shall maintain the premises in good condition and promptly report any necessary repairs.

9. DEFAULT
If Tenant fails to pay rent or breaches any terms, Landlord may terminate this agreement.

10. GOVERNING LAW
This agreement shall be governed by the laws of the Republic of the Union of Myanmar.

By agreeing to these terms, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions stated above.
  `.trim());

  const tenantInputRef = useRef<HTMLInputElement>(null);
  const roomInputRef = useRef<HTMLInputElement>(null);

  // Helper function to extract array data from API response
  const extractArrayData = <T,>(response: any): T[] => {
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.content && Array.isArray(response.content)) {
      return response.content;
    } else if (response?.result && Array.isArray(response.result)) {
      return response.result;
    } else {
      for (const key in response) {
        if (Array.isArray(response[key])) {
          return response[key];
        }
      }
    }
    return [];
  };

  // Function to calculate end date based on start date and duration
  const calculateEndDate = (startDate: string, durationType: string): string => {
    if (!startDate) return '';
    
    const durationOption = contractDurationOptions.find(option => option.value === durationType);
    if (!durationOption) return '';
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + durationOption.months);
    
    // Subtract one day to make it inclusive (e.g., 1-year contract from Jan 1 to Dec 31)
    end.setDate(end.getDate() - 1);
    
    return end.toISOString().split('T')[0];
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Starting to load initial data...');
      
      try {
        // Load tenants
        setTenantsLoading(true);
        const tenantsResponse = await tenantApi.getAll();
        const tenantsData = extractArrayData<Tenant>(tenantsResponse);
        setTenants(tenantsData);
        setFilteredTenants([]);

        // Load rooms
        setRoomsLoading(true);
        const roomsResponse = await roomApi.getAvailable();
        const roomsData = extractArrayData<Room>(roomsResponse);
        setRooms(roomsData);
        setFilteredRooms([]);

        // Load utilities
        setUtilitiesLoading(true);
        try {
          const utilitiesResponse = await utilityApi.getAll();
          const utilitiesData = extractArrayData<UtilityType>(utilitiesResponse);
          setUtilities(utilitiesData);
        } catch (utilityError) {
          console.warn('Failed to load utilities:', utilityError);
          setUtilities([]);
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
        setTenants([]);
        setRooms([]);
        setUtilities([]);
      } finally {
        setTenantsLoading(false);
        setRoomsLoading(false);
        setUtilitiesLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Auto-calculate end date when start date or duration changes
  useEffect(() => {
    if (formData.startDate && formData.contractDurationType) {
      const calculatedEndDate = calculateEndDate(formData.startDate, formData.contractDurationType);
      
      // Only auto-update if end date is empty or matches previous calculation
      // This preserves manual end date entries
      if (!formData.endDate || formData.endDate === calculateEndDate(formData.startDate, formData.contractDurationType)) {
        setFormData(prev => ({
          ...prev,
          endDate: calculatedEndDate
        }));
      }
    }
  }, [formData.startDate, formData.contractDurationType]);

  // Filter tenants based on search
  useEffect(() => {
    if (searchTerm.tenant.trim()) {
      const filtered = tenants.filter(tenant => 
        tenant.tenantName?.toLowerCase().includes(searchTerm.tenant.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchTerm.tenant.toLowerCase()) ||
        tenant.phone?.includes(searchTerm.tenant)
      );
      setFilteredTenants(filtered);
    } else {
      setFilteredTenants([]);
    }
  }, [searchTerm.tenant, tenants]);

  // Filter rooms based on search
  useEffect(() => {
    if (searchTerm.room.trim()) {
      const filtered = rooms.filter(room => 
        room.roomNumber?.toLowerCase().includes(searchTerm.room.toLowerCase()) ||
        room.level?.levelName?.toLowerCase().includes(searchTerm.room.toLowerCase()) ||
        room.level?.building?.buildingName?.toLowerCase().includes(searchTerm.room.toLowerCase()) ||
        room.roomType?.typeName?.toLowerCase().includes(searchTerm.room.toLowerCase())
      );
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms([]);
    }
  }, [searchTerm.room, rooms]);

  const handleTenantSearch = (term: string) => {
    setSearchTerm(prev => ({ ...prev, tenant: term }));
    setShowDropdown(prev => ({ ...prev, tenant: term.trim().length > 0 }));
  };

  const handleRoomSearch = (term: string) => {
    setSearchTerm(prev => ({ ...prev, room: term }));
    setShowDropdown(prev => ({ ...prev, room: term.trim().length > 0 }));
  };

  const handleTenantInputFocus = () => {
    if (searchTerm.tenant.trim().length > 0) {
      setShowDropdown(prev => ({ ...prev, tenant: true }));
    }
  };

  const handleRoomInputFocus = () => {
    if (searchTerm.room.trim().length > 0) {
      setShowDropdown(prev => ({ ...prev, room: true }));
    }
  };

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData(prev => ({ ...prev, tenantId: tenant.id }));
    setSearchTerm(prev => ({ ...prev, tenant: tenant.tenantName || '' }));
    setShowDropdown(prev => ({ ...prev, tenant: false }));
    setFilteredTenants([]);
  };

  const selectRoom = (room: Room) => {
    setSelectedRoom(room);
    setFormData(prev => ({ 
      ...prev, 
      roomId: room.id,
      rentalFee: room.rentalFee || 0
    }));
    setSearchTerm(prev => ({ ...prev, room: room.roomNumber || '' }));
    setShowDropdown(prev => ({ ...prev, room: false }));
    setFilteredRooms([]);
  };

  const handleUtilityToggle = (utilityId: number) => {
    setSelectedUtilityIds(prev => 
      prev.includes(utilityId)
        ? prev.filter(id => id !== utilityId)
        : [...prev, utilityId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.contractNumber.trim()) {
      newErrors.contractNumber = 'Contract number is required';
    }

    if (!formData.tenantId || formData.tenantId === 0) {
      newErrors.tenantId = 'Please select a tenant';
    }

    if (!formData.roomId || formData.roomId === 0) {
      newErrors.roomId = 'Please select a room';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.rentalFee || formData.rentalFee <= 0) {
      newErrors.rentalFee = 'Rental fee must be greater than 0';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      setErrors(prev => ({ ...prev, terms: 'You must agree to the terms and conditions' }));
      return;
    }

    if (validateForm()) {
      const submitData: CreateContractRequest = {
        ...formData,
        utilityTypeIds: selectedUtilityIds,
        agreedToTerms: true,
        termsAgreementVersion: '1.0'
      };
      
      console.log('Submitting contract data:', submitData);
      onSubmit(submitData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const clearTenantSelection = () => {
    setSelectedTenant(null);
    setFormData(prev => ({ ...prev, tenantId: 0 }));
    setSearchTerm(prev => ({ ...prev, tenant: '' }));
    setFilteredTenants([]);
  };

  const clearRoomSelection = () => {
    setSelectedRoom(null);
    setFormData(prev => ({ ...prev, roomId: 0, rentalFee: 0 }));
    setSearchTerm(prev => ({ ...prev, room: '' }));
    setFilteredRooms([]);
  };

  const closeDropdown = (type: 'tenant' | 'room') => {
    setShowDropdown(prev => ({ ...prev, [type]: false }));
  };

  const TermsAndConditionsModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Terms and Conditions</h2>
          <p className="text-gray-600 mt-1">Please read and agree to the terms before creating the contract</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
              {termsContent}
            </pre>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
              I have read, understood, and agree to be bound by these Terms and Conditions
            </label>
          </div>
          
          {errors.terms && (
            <p className="text-red-500 text-sm mb-4">{errors.terms}</p>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowTermsModal(false);
                setAgreedToTerms(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (agreedToTerms) {
                  setShowTermsModal(false);
                  setErrors(prev => ({ ...prev, terms: '' }));
                } else {
                  setErrors(prev => ({ ...prev, terms: 'You must agree to the terms and conditions' }));
                }
              }}
              disabled={!agreedToTerms}
            >
              Agree and Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const allLoading = tenantsLoading || roomsLoading || utilitiesLoading;

  if (allLoading) {
    return (
      <div className="flex justify-center items-center py-12 flex-col">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600 mt-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
        {/* Contract Basic Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contract Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Number *
              </label>
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={handleChange}
                required
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contractNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter contract number (e.g., CT-2024-001)"
              />
              {errors.contractNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.contractNumber}</p>
              )}
            </div>

            {/* Tenant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant *
              </label>
              <div className="relative">
                {selectedTenant ? (
                  <div className="flex items-center justify-between p-3 border border-green-500 rounded-md bg-green-50">
                    <div>
                      <p className="font-medium text-green-900">{selectedTenant.tenantName}</p>
                      <p className="text-sm text-green-700">{selectedTenant.email} | {selectedTenant.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearTenantSelection}
                      className="text-red-500 hover:text-red-700 ml-2 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={tenantInputRef}
                      type="text"
                      value={searchTerm.tenant}
                      onChange={(e) => handleTenantSearch(e.target.value)}
                      onFocus={handleTenantInputFocus}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.tenantId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Search tenant by name, email, or phone..."
                    />
                    {showDropdown.tenant && filteredTenants.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
                          <span className="text-sm text-gray-600">{filteredTenants.length} tenants found</span>
                          <button
                            type="button"
                            onClick={() => closeDropdown('tenant')}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Close
                          </button>
                        </div>
                        {filteredTenants.map(tenant => (
                          <div
                            key={tenant.id}
                            onClick={() => selectTenant(tenant)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{tenant.tenantName}</p>
                            <p className="text-sm text-gray-600">{tenant.email} | {tenant.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              {errors.tenantId && (
                <p className="text-red-500 text-sm mt-1">{errors.tenantId}</p>
              )}
            </div>

            {/* Room Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room *
              </label>
              <div className="relative">
                {selectedRoom ? (
                  <div className="flex items-center justify-between p-3 border border-green-500 rounded-md bg-green-50">
                    <div>
                      <p className="font-medium text-green-900">{selectedRoom.roomNumber}</p>
                      <p className="text-sm text-green-700">
                        {selectedRoom.level?.levelName} - {selectedRoom.roomType?.typeName}
                      </p>
                      <p className="text-sm text-green-700">
                        {selectedRoom.rentalFee?.toLocaleString()} MMK
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearRoomSelection}
                      className="text-red-500 hover:text-red-700 ml-2 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={roomInputRef}
                      type="text"
                      value={searchTerm.room}
                      onChange={(e) => handleRoomSearch(e.target.value)}
                      onFocus={handleRoomInputFocus}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.roomId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Search room by number, level, or building..."
                    />
                    {showDropdown.room && filteredRooms.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
                          <span className="text-sm text-gray-600">{filteredRooms.length} rooms found</span>
                          <button
                            type="button"
                            onClick={() => closeDropdown('room')}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Close
                          </button>
                        </div>
                        {filteredRooms.map(room => (
                          <div
                            key={room.id}
                            onClick={() => selectRoom(room)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{room.roomNumber}</p>
                                <p className="text-sm text-gray-600">
                                  {room.level?.levelName} • {room.roomType?.typeName}
                                </p>
                              </div>
                              <p className="font-semibold text-green-600">
                                {room.rentalFee?.toLocaleString()} MMK
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              {errors.roomId && (
                <p className="text-red-500 text-sm mt-1">{errors.roomId}</p>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rental Fee (MMK) *
              </label>
              <input
                type="number"
                name="rentalFee"
                value={formData.rentalFee}
                onChange={handleChange}
                required
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rentalFee ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
                step="0.01"
              />
              {errors.rentalFee && (
                <p className="text-red-500 text-sm mt-1">{errors.rentalFee}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Deposit (MMK)
              </label>
              <input
                type="number"
                name="securityDeposit"
                value={formData.securityDeposit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Duration
              </label>
              <select
                name="contractDurationType"
                value={formData.contractDurationType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {contractDurationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contract Terms */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Terms</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grace Period (Days)
              </label>
              <input
                type="number"
                name="gracePeriodDays"
                value={formData.gracePeriodDays}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notice Period (Days)
              </label>
              <input
                type="number"
                name="noticePeriodDays"
                value={formData.noticePeriodDays}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Renewal Notice (Days)
              </label>
              <input
                type="number"
                name="renewalNoticeDays"
                value={formData.renewalNoticeDays}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Contract Terms
            </label>
            <textarea
              name="contractTerms"
              value={formData.contractTerms}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any additional contract terms and conditions..."
            />
          </div>
        </div>

        {/* Utility Types Selection */}
        {utilities.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Included Utilities</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {utilities.map(utility => (
                <div key={utility.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={`utility-${utility.id}`}
                    checked={selectedUtilityIds.includes(utility.id)}
                    onChange={() => handleUtilityToggle(utility.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <label 
                      htmlFor={`utility-${utility.id}`}
                      className="block text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {utility.utilityName}
                    </label>
                    {utility.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {utility.description}
                      </p>
                    )}
                    <div className="flex items-center mt-1 text-xs text-gray-600">
                      <span className="font-medium">
                        {utility.ratePerUnit?.toLocaleString() || '0'} MMK
                      </span>
                      <span className="mx-2">•</span>
                      <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {utility.calculationMethod?.toLowerCase() || 'fixed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedUtilityIds.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                {selectedUtilityIds.length} utility type(s) selected
              </p>
            )}
          </div>
        )}

        {/* Terms and Conditions Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions Agreement</h3>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900">
                  Terms and Conditions Agreement Required
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  You must read and agree to our standard Terms and Conditions before creating a contract.
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setShowTermsModal(true)}
                  >
                    Read Terms & Conditions
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {agreedToTerms && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 text-green-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">You have agreed to the Terms and Conditions</span>
              </div>
            </div>
          )}

          {errors.terms && (
            <p className="text-red-500 text-sm mt-2">{errors.terms}</p>
          )}
        </div>

        {/* Form Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 bg-white p-6 rounded-lg">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading || !agreedToTerms}
          >
            Create Contract
          </Button>
        </div>
      </form>

      {showTermsModal && <TermsAndConditionsModal />}
    </>
  );
};