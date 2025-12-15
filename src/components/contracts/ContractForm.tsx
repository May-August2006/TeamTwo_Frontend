// components/contracts/ContractForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { tenantApi } from '../../api/TenantAPI';
import { unitApi } from '../../api/UnitAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { contractApi } from '../../api/ContractAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import type { CreateContractRequest, Unit, Tenant, UtilityType, ContractDurationType, Contract } from '../../types/contract';

interface ContractFormProps {
  isOpen: boolean;
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  initialData?: Contract;
  isRenewal?: boolean;
  isEdit?: boolean;
}

// Contract duration options with their month values
const contractDurationOptions = [
  { value: 'THREE_MONTHS', label: '3 Months', months: 3 },
  { value: 'SIX_MONTHS', label: '6 Months', months: 6 },
  { value: 'ONE_YEAR', label: '1 Year', months: 12 },
  { value: 'TWO_YEARS', label: '2 Years', months: 24 }
];

// Validation rules with character limits - STRICTLY ENFORCED
const VALIDATION_RULES = {
  contractNumberPattern: /^SGH-\d{4}-\d{4}$/,
  contractNumberMaxLength: 13,
  minRentalFee: 100000,
  maxRentalFee: 999999999.99,
  minSecurityDeposit: 0,
  maxSecurityDeposit: 999999999,
  minGracePeriodDays: 3,
  maxGracePeriodDays: 30,
  minNoticePeriodDays: 30,
  maxNoticePeriodDays: 365,
  minRenewalNoticeDays: 60,
  maxRenewalNoticeDays: 365,
  minUtilitiesCount: 3, // Minimum 3 utilities required
  maxContractTermsLength: 5000,
  // Character limits for ALL fields
  maxContractNumberLength: 20,
  maxTerminationReasonLength: 500,
  maxTenantNameLength: 100,
  maxEmailLength: 100,
  maxPhoneLength: 20,
  maxContactPersonLength: 100,
  maxAddressLength: 500,
  maxNrcLength: 20,
  maxUnitNumberLength: 50,
  maxBuildingNameLength: 100,
  maxLevelNameLength: 50,
  maxUtilityNameLength: 100,
  maxUtilityDescriptionLength: 500,
  maxFileNameLength: 255
};

export const ContractForm: React.FC<ContractFormProps> = ({ 
  isOpen,
  onSubmit, 
  onClose, 
  isLoading = false,
  initialData,
  isRenewal = false,
  isEdit = false
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    contractNumber: initialData?.contractNumber || `SGH-${currentYear}-`,
    tenantId: initialData?.tenant?.id || 0,
    unitId: initialData?.unit?.id || 0,
    startDate: initialData?.startDate || '', // Empty by default
    endDate: initialData?.endDate || '', // Empty by default
    rentalFee: initialData?.rentalFee || 0,
    securityDeposit: initialData?.securityDeposit || 0,
    contractDurationType: initialData?.contractDurationType || '', // Empty by default
    gracePeriodDays: initialData?.gracePeriodDays || VALIDATION_RULES.minGracePeriodDays,
    noticePeriodDays: initialData?.noticePeriodDays || VALIDATION_RULES.minNoticePeriodDays,
    renewalNoticeDays: initialData?.renewalNoticeDays || VALIDATION_RULES.minRenewalNoticeDays,
    contractTerms: initialData?.contractTerms || '',
    utilityTypeIds: initialData?.includedUtilities?.map(u => u.id) || [],
    agreedToTerms: isEdit || isRenewal ? true : false,
    termsAgreementVersion: '1.0'
  });

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [utilities, setUtilities] = useState<UtilityType[]>([]);
  
  const [searchTerm, setSearchTerm] = useState({
    tenant: initialData?.tenant?.tenantName || '',
    unit: initialData?.unit?.unitNumber || ''
  });
  
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(initialData?.tenant || null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(initialData?.unit || null);
  const [selectedUtilityIds, setSelectedUtilityIds] = useState<number[]>(initialData?.includedUtilities?.map(u => u.id) || []);
  
  const [loading, setLoading] = useState(false);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [utilitiesLoading, setUtilitiesLoading] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDropdown, setShowDropdown] = useState({
    tenant: false,
    unit: false
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(isEdit || isRenewal ? true : false);
  const [manualEndDate, setManualEndDate] = useState(false);
  const [calculatedRentalFee, setCalculatedRentalFee] = useState(initialData?.rentalFee || 0);
  const [rentalFeeEditable, setRentalFeeEditable] = useState(false);
  const [utilitiesError, setUtilitiesError] = useState('');

  const tenantInputRef = useRef<HTMLInputElement>(null);
  const unitInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contractNumberInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const termsContent = `
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
  `.trim();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      loadInitialData();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      contractNumber: initialData?.contractNumber || `SGH-${currentYear}-`,
      tenantId: initialData?.tenant?.id || 0,
      unitId: initialData?.unit?.id || 0,
      startDate: initialData?.startDate || '', // Empty by default
      endDate: initialData?.endDate || '', // Empty by default
      rentalFee: initialData?.rentalFee || 0,
      securityDeposit: initialData?.securityDeposit || 0,
      contractDurationType: initialData?.contractDurationType || '', // Empty by default
      gracePeriodDays: initialData?.gracePeriodDays || VALIDATION_RULES.minGracePeriodDays,
      noticePeriodDays: initialData?.noticePeriodDays || VALIDATION_RULES.minNoticePeriodDays,
      renewalNoticeDays: initialData?.renewalNoticeDays || VALIDATION_RULES.minRenewalNoticeDays,
      contractTerms: initialData?.contractTerms || '',
      utilityTypeIds: initialData?.includedUtilities?.map(u => u.id) || [],
      agreedToTerms: isEdit || isRenewal ? true : false,
      termsAgreementVersion: '1.0'
    });
    setSelectedTenant(initialData?.tenant || null);
    setSelectedUnit(initialData?.unit || null);
    setSelectedUtilityIds(initialData?.includedUtilities?.map(u => u.id) || []);
    setSelectedFile(null);
    setAgreedToTerms(isEdit || isRenewal ? true : false);
    setManualEndDate(false);
    setRentalFeeEditable(false);
    setErrors({});
    setFileError('');
    setUtilitiesError('');
    setSearchTerm({
      tenant: initialData?.tenant?.tenantName || '',
      unit: initialData?.unit?.unitNumber || ''
    });
  };

  const extractArrayData = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    if (response?.content && Array.isArray(response.content)) return response.content;
    if (response?.result && Array.isArray(response.result)) return response.result;
    
    for (const key in response) {
      if (Array.isArray(response[key])) return response[key];
    }
    return [];
  };

  const calculateEndDate = (startDate: string, durationType: ContractDurationType): string => {
    if (!startDate || !durationType) return '';
    
    const durationOption = contractDurationOptions.find(option => option.value === durationType);
    if (!durationOption) return '';
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + durationOption.months);
    end.setDate(end.getDate() - 1);
    
    return end.toISOString().split('T')[0];
  };

  const calculateRentalFee = (unitRentalFee: number, durationType: ContractDurationType): number => {
    const durationOption = contractDurationOptions.find(option => option.value === durationType);
    return durationOption ? unitRentalFee * durationOption.months : unitRentalFee;
  };

  const loadInitialData = async () => {
    try {
      setTenantsLoading(true);
      setUnitsLoading(true);
      setUtilitiesLoading(true);

      // Load tenants
      const tenantsResponse = await tenantApi.getAll();
      const tenantsData = extractArrayData<Tenant>(tenantsResponse);
      setTenants(tenantsData);

      // Load units
      let unitsResponse;
      if (isEdit || isRenewal) {
        unitsResponse = await unitApi.getAll();
      } else {
        unitsResponse = await unitApi.getAvailable();
      }
      const unitsData = extractArrayData<Unit>(unitsResponse);
      setUnits(unitsData);

      // Load utilities
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
      showError('Failed to load form data. Please try again.');
    } finally {
      setTenantsLoading(false);
      setUnitsLoading(false);
      setUtilitiesLoading(false);
    }
  };

  // Calculate end date when start date or duration changes
  useEffect(() => {
    if (formData.startDate && formData.contractDurationType && !manualEndDate) {
      const calculatedEndDate = calculateEndDate(formData.startDate, formData.contractDurationType);
      setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
    }
  }, [formData.startDate, formData.contractDurationType, manualEndDate]);

  // Calculate rental fee when unit or duration changes
  useEffect(() => {
    if (selectedUnit && formData.contractDurationType && !rentalFeeEditable) {
      const unitRentalFee = selectedUnit.rentalFee || 0;
      const calculatedFee = calculateRentalFee(unitRentalFee, formData.contractDurationType);
      setCalculatedRentalFee(calculatedFee);
      setFormData(prev => ({ ...prev, rentalFee: calculatedFee }));
    }
  }, [selectedUnit, formData.contractDurationType, rentalFeeEditable]);

  // Set next day as start date for renewal
  useEffect(() => {
    if (isRenewal && initialData?.endDate) {
      const nextDay = new Date(initialData.endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayString = nextDay.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, startDate: nextDayString }));
    }
  }, [isRenewal, initialData]);

  useEffect(() => {
    if (agreedToTerms) {
      setFormData(prev => ({ ...prev, agreedToTerms: true }));
    }
  }, [agreedToTerms]);

  useEffect(() => {
    if (searchTerm.tenant.trim()) {
      const filtered = tenants.filter(tenant => 
        (tenant.tenantName?.toLowerCase().includes(searchTerm.tenant.toLowerCase()) || '') &&
        tenant.tenantName?.length <= VALIDATION_RULES.maxTenantNameLength
      );
      setFilteredTenants(filtered);
    } else {
      setFilteredTenants([]);
    }
  }, [searchTerm.tenant, tenants]);

  useEffect(() => {
    if (searchTerm.unit.trim()) {
      const filtered = units.filter(unit => 
        (unit.unitNumber?.toLowerCase().includes(searchTerm.unit.toLowerCase()) || '') &&
        unit.unitNumber?.length <= VALIDATION_RULES.maxUnitNumberLength
      );
      setFilteredUnits(filtered);
    } else {
      setFilteredUnits([]);
    }
  }, [searchTerm.unit, units]);

  // Validate utilities count whenever it changes
  useEffect(() => {
    if (selectedUtilityIds.length < VALIDATION_RULES.minUtilitiesCount) {
      setUtilitiesError(`Please select at least ${VALIDATION_RULES.minUtilitiesCount} utilities`);
    } else {
      setUtilitiesError('');
    }
  }, [selectedUtilityIds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');

    if (file) {
      // STRICT: Check filename length
      if (file.name.length > VALIDATION_RULES.maxFileNameLength) {
        setFileError(`File name cannot exceed ${VALIDATION_RULES.maxFileNameLength} characters`);
        showError(`File name is too long. Maximum ${VALIDATION_RULES.maxFileNameLength} characters allowed.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
      const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
      
      if (!allowedTypes.includes(fileExtension)) {
        setFileError('Please select a valid document (PDF, DOC, DOCX, XLS, XLSX)');
        showError('Invalid file type. Please select a valid document.');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setFileError('File size must be less than 10MB');
        showError('File size must be less than 10MB');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
      showSuccess('File selected successfully');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTenantSearch = (term: string) => {
    // STRICT: Enforce character limit
    if (term.length > VALIDATION_RULES.maxTenantNameLength) {
      setErrors(prev => ({ ...prev, tenantSearch: `Tenant search cannot exceed ${VALIDATION_RULES.maxTenantNameLength} characters` }));
      showWarning(`Tenant search term cannot exceed ${VALIDATION_RULES.maxTenantNameLength} characters`);
      return;
    }
    
    // Clear error if within limit
    if (errors.tenantSearch) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tenantSearch;
        return newErrors;
      });
    }
    
    setSearchTerm(prev => ({ ...prev, tenant: term }));
    setShowDropdown(prev => ({ ...prev, tenant: term.trim().length > 0 }));
  };

  const handleUnitSearch = (term: string) => {
    // STRICT: Enforce character limit
    if (term.length > VALIDATION_RULES.maxUnitNumberLength) {
      setErrors(prev => ({ ...prev, unitSearch: `Unit search cannot exceed ${VALIDATION_RULES.maxUnitNumberLength} characters` }));
      showWarning(`Unit search term cannot exceed ${VALIDATION_RULES.maxUnitNumberLength} characters`);
      return;
    }
    
    // Clear error if within limit
    if (errors.unitSearch) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.unitSearch;
        return newErrors;
      });
    }
    
    setSearchTerm(prev => ({ ...prev, unit: term }));
    setShowDropdown(prev => ({ ...prev, unit: term.trim().length > 0 }));
  };

  const handleTenantInputFocus = () => {
    if (searchTerm.tenant.trim().length > 0) {
      setShowDropdown(prev => ({ ...prev, tenant: true }));
    }
  };

  const handleUnitInputFocus = () => {
    if (searchTerm.unit.trim().length > 0) {
      setShowDropdown(prev => ({ ...prev, unit: true }));
    }
  };

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData(prev => ({ ...prev, tenantId: tenant.id }));
    setSearchTerm(prev => ({ ...prev, tenant: tenant.tenantName || '' }));
    setShowDropdown(prev => ({ ...prev, tenant: false }));
    setFilteredTenants([]);
    
    // Clear tenant error
    if (errors.tenantId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tenantId;
        return newErrors;
      });
    }
  };

  const selectUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    const unitRentalFee = unit.rentalFee || 0;
    
    // Only calculate fee if duration is selected
    if (formData.contractDurationType) {
      const calculatedFee = calculateRentalFee(unitRentalFee, formData.contractDurationType);
      setCalculatedRentalFee(calculatedFee);
      setFormData(prev => ({ 
        ...prev, 
        unitId: unit.id,
        rentalFee: calculatedFee
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        unitId: unit.id,
        rentalFee: unitRentalFee // Just use monthly fee
      }));
    }
    
    setRentalFeeEditable(false);
    setSearchTerm(prev => ({ ...prev, unit: unit.unitNumber || '' }));
    setShowDropdown(prev => ({ ...prev, unit: false }));
    setFilteredUnits([]);
    
    // Clear unit error
    if (errors.unitId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.unitId;
        return newErrors;
      });
    }
  };

  const handleUtilityToggle = (utilityId: number) => {
    const newUtilityIds = selectedUtilityIds.includes(utilityId)
      ? selectedUtilityIds.filter(id => id !== utilityId)
      : [...selectedUtilityIds, utilityId];
    
    setSelectedUtilityIds(newUtilityIds);
    setFormData(prev => ({
      ...prev,
      utilityTypeIds: newUtilityIds
    }));

    // Clear utilities error when user selects/deselects
    if (newUtilityIds.length >= VALIDATION_RULES.minUtilitiesCount && utilitiesError) {
      setUtilitiesError('');
    }
  };

  // STRICT VALIDATION FUNCTION
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Contract Number validation (STRICT)
    if (!formData.contractNumber.trim()) {
      newErrors.contractNumber = 'Contract number is required';
    } else if (!VALIDATION_RULES.contractNumberPattern.test(formData.contractNumber)) {
      newErrors.contractNumber = 'Contract number must be in format: SGH-YYYY-NNNN (e.g., SGH-2025-9999)';
    } else if (formData.contractNumber.length > VALIDATION_RULES.contractNumberMaxLength) {
      newErrors.contractNumber = `Contract number cannot exceed ${VALIDATION_RULES.contractNumberMaxLength} characters`;
    }

    // 2. Tenant validation (STRICT)
    if (!formData.tenantId || formData.tenantId === 0) {
      newErrors.tenantId = 'Please select a tenant';
    }

    // 3. Unit validation (STRICT)
    if (!formData.unitId || formData.unitId === 0) {
      newErrors.unitId = 'Please select a unit';
    }

    // 4. Contract Duration validation (STRICT)
    if (!formData.contractDurationType) {
      newErrors.contractDurationType = 'Contract duration is required';
    }

    // 5. Start Date validation (STRICT)
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    // 6. End Date validation (STRICT)
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    // 7. Rental Fee validation (STRICT)
    if (!formData.rentalFee || formData.rentalFee < VALIDATION_RULES.minRentalFee) {
      newErrors.rentalFee = `Rental fee must be at least ${VALIDATION_RULES.minRentalFee.toLocaleString()} MMK`;
    } else if (formData.rentalFee > VALIDATION_RULES.maxRentalFee) {
      newErrors.rentalFee = `Rental fee cannot exceed ${VALIDATION_RULES.maxRentalFee.toLocaleString()} MMK`;
    }

    // 8. Security Deposit validation
    if (formData.securityDeposit && formData.securityDeposit < VALIDATION_RULES.minSecurityDeposit) {
      newErrors.securityDeposit = 'Security deposit cannot be negative';
    } else if (formData.securityDeposit && formData.securityDeposit > VALIDATION_RULES.maxSecurityDeposit) {
      newErrors.securityDeposit = `Security deposit cannot exceed ${VALIDATION_RULES.maxSecurityDeposit.toLocaleString()} MMK`;
    }

    // 9. Grace Period validation - REQUIRED
    if (formData.gracePeriodDays < VALIDATION_RULES.minGracePeriodDays || 
        formData.gracePeriodDays > VALIDATION_RULES.maxGracePeriodDays) {
      newErrors.gracePeriodDays = `Grace period must be between ${VALIDATION_RULES.minGracePeriodDays} and ${VALIDATION_RULES.maxGracePeriodDays} days`;
    }

    // 10. Notice Period validation - REQUIRED
    if (formData.noticePeriodDays < VALIDATION_RULES.minNoticePeriodDays || 
        formData.noticePeriodDays > VALIDATION_RULES.maxNoticePeriodDays) {
      newErrors.noticePeriodDays = `Notice period must be between ${VALIDATION_RULES.minNoticePeriodDays} and ${VALIDATION_RULES.maxNoticePeriodDays} days`;
    }

    // 11. Renewal Notice validation - REQUIRED
    if (formData.renewalNoticeDays < VALIDATION_RULES.minRenewalNoticeDays || 
        formData.renewalNoticeDays > VALIDATION_RULES.maxRenewalNoticeDays) {
      newErrors.renewalNoticeDays = `Renewal notice must be between ${VALIDATION_RULES.minRenewalNoticeDays} and ${VALIDATION_RULES.maxRenewalNoticeDays} days`;
    }

    // 12. Contract Terms validation with character limit (STRICT)
    if (formData.contractTerms && formData.contractTerms.length > VALIDATION_RULES.maxContractTermsLength) {
      newErrors.contractTerms = `Contract terms cannot exceed ${VALIDATION_RULES.maxContractTermsLength} characters`;
    }

    // 13. Utilities validation - AT LEAST 3 REQUIRED
    if (selectedUtilityIds.length < VALIDATION_RULES.minUtilitiesCount) {
      newErrors.utilities = `Please select at least ${VALIDATION_RULES.minUtilitiesCount} utilities`;
    }

    // 14. Terms agreement validation (STRICT - MOST IMPORTANT FIX)
    if (!agreedToTerms && !isEdit) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    // Set errors
    setErrors(newErrors);
    
    // Return true if NO errors
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear all errors first
    setErrors({});
    setFileError('');
    setUtilitiesError('');
    
    // FIRST: Check terms agreement - this is the MOST IMPORTANT validation
    if (!agreedToTerms && !isEdit) {
      setErrors(prev => ({ ...prev, terms: 'You must agree to the terms and conditions' }));
      showError('You must agree to the terms and conditions before submitting.');
      return; // STOP HERE - don't proceed with submission
    }

    // SECOND: Validate the form
    const isValid = validateForm();
    if (!isValid) {
      showError('Please fix the validation errors before submitting.');
      
      // Scroll to first error
      setTimeout(() => {
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
          const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || 
                              document.querySelector(`[id="${firstErrorKey}"]`) ||
                              document.querySelector(`[data-field="${firstErrorKey}"]`);
          errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return; // STOP HERE - don't proceed with submission
    }

    // THIRD: If all validations pass, prepare form data
    const formDataToSend = new FormData();
    
    // Trim all string values and apply character limits
    formDataToSend.append('contractNumber', formData.contractNumber.trim().substring(0, VALIDATION_RULES.maxContractNumberLength));
    formDataToSend.append('tenantId', formData.tenantId.toString());
    formDataToSend.append('unitId', formData.unitId.toString());
    formDataToSend.append('startDate', formData.startDate);
    formDataToSend.append('endDate', formData.endDate);
    formDataToSend.append('rentalFee', formData.rentalFee.toString());
    
    if (formData.securityDeposit && formData.securityDeposit > 0) {
      formDataToSend.append('securityDeposit', formData.securityDeposit.toString());
    }
    
    formDataToSend.append('contractDurationType', formData.contractDurationType);
    formDataToSend.append('gracePeriodDays', formData.gracePeriodDays.toString());
    formDataToSend.append('noticePeriodDays', formData.noticePeriodDays.toString());
    formDataToSend.append('renewalNoticeDays', formData.renewalNoticeDays.toString());
    
    if (formData.contractTerms) {
      formDataToSend.append('contractTerms', formData.contractTerms.trim().substring(0, VALIDATION_RULES.maxContractTermsLength));
    }
    
    formDataToSend.append('agreedToTerms', agreedToTerms.toString());
    formDataToSend.append('termsAgreementVersion', formData.termsAgreementVersion || '1.0');

    if (selectedUtilityIds.length > 0) {
      selectedUtilityIds.forEach(id => {
        formDataToSend.append('utilityTypeIds', id.toString());
      });
    }

    if (selectedFile) {
      formDataToSend.append('contractFile', selectedFile);
    }

    setLoading(true);
    
    try {
      await onSubmit(formDataToSend);
      onClose();
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // SPECIFIC HANDLING FOR DUPLICATE CONTRACT NUMBER
      if (error.response?.data?.error?.includes('already exists') || 
          error.response?.data?.contractNumber?.includes('already exists') ||
          error.message?.includes('already exists')) {
        showError('Contract number already exists. Please use a different contract number.');
        setErrors(prev => ({ 
          ...prev, 
          contractNumber: 'Contract number already exists. Please use a different number.' 
        }));
        
        // Focus on contract number field
        setTimeout(() => {
          contractNumberInputRef.current?.focus();
          contractNumberInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        return; // DON'T CLOSE THE MODAL
      }
      
      // Handle other backend errors
      if (error.response?.data) {
        const backendErrors = error.response.data;
        
        if (typeof backendErrors === 'object') {
          const newErrors: Record<string, string> = {};
          
          Object.entries(backendErrors).forEach(([field, message]) => {
            if (Array.isArray(message)) {
              newErrors[field] = message[0] as string;
            } else {
              newErrors[field] = message as string;
            }
          });
          
          setErrors(newErrors);
        } else if (backendErrors.error) {
          showError(backendErrors.error);
          setErrors(prev => ({ ...prev, submit: backendErrors.error }));
        }
      } else {
        showError(error.message || 'Failed to submit contract. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // STRICT: Input change handler with character limits
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // STRICT: Enforce character limits for ALL text fields
    if (type !== 'number' && type !== 'date' && type !== 'checkbox') {
      let maxLength = 0;
      
      // Set max length based on field name
      switch (name) {
        case 'contractNumber':
          maxLength = VALIDATION_RULES.maxContractNumberLength;
          break;
        case 'contractTerms':
          maxLength = VALIDATION_RULES.maxContractTermsLength;
          break;
        case 'tenantSearch':
          maxLength = VALIDATION_RULES.maxTenantNameLength;
          break;
        case 'unitSearch':
          maxLength = VALIDATION_RULES.maxUnitNumberLength;
          break;
        default:
          maxLength = 255; // Default max length
      }
      
      // STRICT: Prevent typing beyond limit
      if (value.length > maxLength) {
        // Show error under the field
        setErrors(prev => ({ 
          ...prev, 
          [name]: `Maximum ${maxLength} characters allowed` 
        }));
        showWarning(`${name} cannot exceed ${maxLength} characters`);
        return; // Don't update the value
      }
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Handle different input types
    if (type === 'number') {
      const numericValue = value.replace(/^0+/, '') || '0';
      const numValue = parseFloat(numericValue) || 0;
      
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));

      if (name === 'rentalFee') {
        setCalculatedRentalFee(numValue);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (name === 'endDate') {
      setManualEndDate(true);
    }
  };

  // STRICT: Contract number change handler
  const handleContractNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    
    if (!value.startsWith('SGH-')) {
      value = `SGH-${currentYear}-`;
    }
    
    if (value.startsWith('SGH-') && value.length <= 8) {
      const prefix = `SGH-${currentYear}-`;
      if (!value.includes(currentYear.toString())) {
        value = `SGH-${currentYear}-`;
      }
    }
    
    const match = value.match(/^(SGH-\d{4}-)(\d*)$/);
    if (match) {
      const prefix = match[1];
      let numbers = match[2].replace(/\D/g, '');
      
      numbers = numbers.slice(0, 4);
      
      value = prefix + numbers;
    }
    
    // STRICT: Enforce character limit
    if (value.length > VALIDATION_RULES.contractNumberMaxLength) {
      setErrors(prev => ({ 
        ...prev, 
        contractNumber: `Maximum ${VALIDATION_RULES.contractNumberMaxLength} characters allowed` 
      }));
      showWarning(`Contract number cannot exceed ${VALIDATION_RULES.contractNumberMaxLength} characters`);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      contractNumber: value
    }));

    // Clear contract number error when user types
    if (errors.contractNumber) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contractNumber;
        return newErrors;
      });
    }
  };

  const handleContractNumberFocus = () => {
    if (contractNumberInputRef.current) {
      const value = contractNumberInputRef.current.value;
      const prefixLength = `SGH-${currentYear}-`.length;
      if (value.length > prefixLength) {
        contractNumberInputRef.current.setSelectionRange(prefixLength, value.length);
      }
    }
  };

  const handleRentalFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/^0+/, '') || '0';
    const numValue = parseFloat(value) || 0;
    
    // STRICT: Enforce rental fee limits
    if (numValue > VALIDATION_RULES.maxRentalFee) {
      setErrors(prev => ({ 
        ...prev, 
        rentalFee: `Maximum ${VALIDATION_RULES.maxRentalFee.toLocaleString()} MMK allowed` 
      }));
      showWarning(`Rental fee cannot exceed ${VALIDATION_RULES.maxRentalFee.toLocaleString()} MMK`);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      rentalFee: numValue
    }));
    setCalculatedRentalFee(numValue);
    setRentalFeeEditable(true);

    // Clear rental fee error
    if (errors.rentalFee) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.rentalFee;
        return newErrors;
      });
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrors(prev => ({ ...prev, startDate: 'Start date cannot be in the past' }));
      showError('Start date cannot be in the past');
      return;
    }

    setFormData(prev => ({ ...prev, startDate: value }));
    
    // Only calculate end date if duration is selected
    if (value && formData.contractDurationType && !manualEndDate) {
      const calculatedEndDate = calculateEndDate(value, formData.contractDurationType);
      setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
    }

    // Clear start date error
    if (errors.startDate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.startDate;
        return newErrors;
      });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const selectedDate = new Date(value);
    const startDate = new Date(formData.startDate);
    
    if (selectedDate <= startDate) {
      setErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }));
      showError('End date must be after start date');
      return;
    }

    setFormData(prev => ({ ...prev, endDate: value }));
    setManualEndDate(true);

    // Clear end date error
    if (errors.endDate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }
  };

  const handleContractDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    
    const durationType = value as ContractDurationType;
    
    setFormData(prev => ({ 
      ...prev, 
      contractDurationType: durationType 
    }));
    
    // Clear duration error
    if (errors.contractDurationType) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contractDurationType;
        return newErrors;
      });
    }
    
    // Calculate end date if start date is selected
    if (formData.startDate && durationType && !manualEndDate) {
      const calculatedEndDate = calculateEndDate(formData.startDate, durationType);
      setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
    }
    
    // Calculate rental fee if unit is selected
    if (selectedUnit && !rentalFeeEditable) {
      const unitRentalFee = selectedUnit.rentalFee || 0;
      const calculatedFee = calculateRentalFee(unitRentalFee, durationType);
      setCalculatedRentalFee(calculatedFee);
      setFormData(prev => ({
        ...prev,
        rentalFee: calculatedFee
      }));
    }
  };

  const clearTenantSelection = () => {
    setSelectedTenant(null);
    setFormData(prev => ({ ...prev, tenantId: 0 }));
    setSearchTerm(prev => ({ ...prev, tenant: '' }));
    setFilteredTenants([]);
    
    // Clear tenant error
    if (errors.tenantId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tenantId;
        return newErrors;
      });
    }
  };

  const clearUnitSelection = () => {
    setSelectedUnit(null);
    setFormData(prev => ({ ...prev, unitId: 0 }));
    setSearchTerm(prev => ({ ...prev, unit: '' }));
    setFilteredUnits([]);
    
    // Clear unit error
    if (errors.unitId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.unitId;
        return newErrors;
      });
    }
  };

  const closeDropdown = (type: 'tenant' | 'unit') => {
    setShowDropdown(prev => ({ ...prev, [type]: false }));
  };

  const resetEndDateCalculation = () => {
    setManualEndDate(false);
    if (formData.startDate && formData.contractDurationType) {
      const calculatedEndDate = calculateEndDate(formData.startDate, formData.contractDurationType);
      setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
    }
  };

  const getMinEndDate = () => {
    if (!formData.startDate) return '';
    const minDate = new Date(formData.startDate);
    minDate.setDate(minDate.getDate() + 1);
    return minDate.toISOString().split('T')[0];
  };

  const getMinStartDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const TermsAndConditionsModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
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
              onChange={(e) => {
                const checked = e.target.checked;
                setAgreedToTerms(checked);
                setFormData(prev => ({ ...prev, agreedToTerms: checked }));
                
                // Clear terms error when user checks the box
                if (checked && errors.terms) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.terms;
                    return newErrors;
                  });
                }
              }}
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
                // Don't uncheck if already checked
                if (!agreedToTerms) {
                  setFormData(prev => ({ ...prev, agreedToTerms: false }));
                }
              }}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (agreedToTerms) {
                  setShowTermsModal(false);
                  // Clear terms error
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.terms;
                    return newErrors;
                  });
                  showSuccess('Terms and conditions accepted');
                } else {
                  // Show error if not agreed - THIS IS IMPORTANT
                  setErrors(prev => ({ ...prev, terms: 'You must agree to the terms and conditions' }));
                  showError('You must agree to the terms and conditions');
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

  const allLoading = tenantsLoading || unitsLoading || utilitiesLoading;

  if (!isOpen) return null;

  const getFormTitle = () => {
    if (isRenewal) return 'Renew Contract';
    if (isEdit) return 'Edit Contract';
    return 'Create New Contract';
  };

  const getSubmitButtonText = () => {
    if (isRenewal) return 'Renew Contract';
    if (isEdit) return 'Update Contract';
    return 'Create Contract';
  };

  // Check if there are any errors
  const hasErrors = Object.keys(errors).filter(key => key !== 'submit').length > 0;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{getFormTitle()}</h2>
                <p className="text-gray-600 mt-1">
                  {isRenewal ? 'Renew contract with new terms' : 
                   isEdit ? 'Update contract details' : 
                   'Fill in the details to create a new rental contract'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Global Error Message - Only show when there are errors */}
            {hasErrors && (
              <div id="form-error" className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 font-medium">
                    Please fix the following errors:
                  </span>
                </div>
                
                {errors.submit && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                    <p className="text-red-800 font-medium">{errors.submit}</p>
                  </div>
                )}
                
                {Object.keys(errors).filter(key => key !== 'submit').length > 0 && (
                  <ul className="mt-2 ml-7 list-disc text-red-700">
                    {Object.entries(errors)
                      .filter(([key]) => key !== 'submit')
                      .map(([key, value]) => (
                        <li key={key} className="text-sm">{value}</li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto">
            {allLoading ? (
              <div className="flex justify-center items-center py-12 flex-col">
                <LoadingSpinner size="lg" />
                <span className="ml-2 text-gray-600 mt-2">Loading form data...</span>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
                {(isRenewal || isEdit) && initialData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-blue-800 font-medium">
                        {isRenewal 
                          ? `Renewing contract ${initialData.contractNumber}. Original contract ends on ${new Date(initialData.endDate).toLocaleDateString()}.`
                          : `Editing contract ${initialData.contractNumber}. Current status: ${initialData.contractStatus}.`
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Contract Information Section */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contract Number */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contract Number *
                        <span className="text-xs text-gray-500 ml-2">Format: SGH-YYYY-NNNN (e.g., SGH-2025-9999)</span>
                      </label>
                      <input
                        ref={contractNumberInputRef}
                        type="text"
                        name="contractNumber"
                        value={formData.contractNumber}
                        onChange={handleContractNumberChange}
                        onFocus={handleContractNumberFocus}
                        required
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.contractNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={`SGH-${currentYear}-0000`}
                        maxLength={VALIDATION_RULES.contractNumberMaxLength}
                        pattern="^SGH-\d{4}-\d{4}$"
                        title="Format: SGH-YYYY-NNNN (e.g., SGH-2025-9999)"
                      />
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {errors.contractNumber && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.contractNumber}
                        </p>
                      )}
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Enter 4 digits after SGH-YYYY- (e.g., 0001, 9999)
                        </p>
                        <p className="text-xs text-gray-500">
                          {formData.contractNumber.length}/{VALIDATION_RULES.contractNumberMaxLength} characters
                        </p>
                      </div>
                    </div>

                    {/* Current Document (Edit/Renewal only) */}
                    {(isEdit || isRenewal) && initialData?.fileUrl && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Contract Document
                        </label>
                        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <p className="font-medium text-gray-900">
                                {initialData.fileOriginalName?.substring(0, VALIDATION_RULES.maxFileNameLength) || initialData.fileName?.substring(0, VALIDATION_RULES.maxFileNameLength) || 'Contract Document'}
                              </p>
                              {initialData.fileSize && (
                                <p className="text-sm text-gray-600">
                                  {(initialData.fileSize / (1024 * 1024)).toFixed(2)} MB • {initialData.fileType}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* File Upload */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isEdit || isRenewal ? 'Upload New Contract Document' : 'Contract Document'}
                        <span className="text-xs text-gray-500 ml-2">Optional - you can upload later</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:border-blue-500 transition-colors">
                        {!selectedFile ? (
                          <div className="text-center">
                            <input
                              ref={fileInputRef}
                              type="file"
                              id="contractFile"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                              className="hidden"
                            />
                            <label 
                              htmlFor="contractFile" 
                              className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="font-medium">Choose Contract File</span>
                              <span className="text-sm mt-1">or drag and drop</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                              Supported formats: PDF, DOC, DOCX, XLS, XLSX (Max 10MB, filename max {VALIDATION_RULES.maxFileNameLength} chars)
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="font-medium text-blue-900">
                                  {selectedFile.name.substring(0, VALIDATION_RULES.maxFileNameLength)}
                                  {selectedFile.name.length > VALIDATION_RULES.maxFileNameLength && '...'}
                                </p>
                                <p className="text-sm text-blue-700">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={removeFile}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              disabled={loading}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {/* FILE ERROR MESSAGE - RED TEXT */}
                        {fileError && (
                          <div className="text-red-500 text-sm mt-2 text-center flex items-center justify-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {fileError}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contract Duration */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contract Duration *
                      </label>
                      <select
                        name="contractDurationType"
                        value={formData.contractDurationType}
                        onChange={handleContractDurationChange}
                        required
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.contractDurationType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select duration...</option>
                        {contractDurationOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {/* ERROR MESSAGE - RED TEXT UNDER SELECT */}
                      {errors.contractDurationType && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.contractDurationType}
                        </p>
                      )}
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                        <span className="text-xs text-gray-500 ml-2">Cannot be in the past</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleStartDateChange}
                        required
                        min={getMinStartDate()}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.startDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={!formData.contractDurationType}
                      />
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {errors.startDate && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.startDate}
                        </p>
                      )}
                      {!formData.contractDurationType && (
                        <p className="text-xs text-yellow-600 mt-1">Please select contract duration first</p>
                      )}
                    </div>

                    {/* End Date */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          End Date *
                        </label>
                        {manualEndDate && formData.startDate && formData.contractDurationType && (
                          <button
                            type="button"
                            onClick={resetEndDateCalculation}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            disabled={loading}
                          >
                            Auto-calculate
                          </button>
                        )}
                      </div>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleEndDateChange}
                        required
                        min={getMinEndDate()}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.endDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={!formData.startDate || !formData.contractDurationType}
                      />
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {errors.endDate && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.endDate}
                        </p>
                      )}
                      {!manualEndDate && formData.endDate && formData.contractDurationType && (
                        <p className="text-xs text-gray-500 mt-1">
                          Calculated based on {contractDurationOptions.find(opt => opt.value === formData.contractDurationType)?.label}
                        </p>
                      )}
                      {(!formData.startDate || !formData.contractDurationType) && (
                        <p className="text-xs text-yellow-600 mt-1">Please select start date and duration first</p>
                      )}
                    </div>

                    {/* Tenant Selection */}
                    <div data-field="tenantId">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tenant *
                      </label>
                      <div className="relative">
                        {selectedTenant ? (
                          <div className="flex items-center justify-between p-3 border border-green-500 rounded-md bg-green-50">
                            <div>
                              <p className="font-medium text-green-900">
                                {selectedTenant.tenantName?.substring(0, VALIDATION_RULES.maxTenantNameLength) || 'N/A'}
                                {selectedTenant.tenantName && selectedTenant.tenantName.length > VALIDATION_RULES.maxTenantNameLength && '...'}
                              </p>
                              <p className="text-sm text-green-700">
                                {selectedTenant.email?.substring(0, VALIDATION_RULES.maxEmailLength) || 'N/A'} | 
                                {selectedTenant.phone?.substring(0, VALIDATION_RULES.maxPhoneLength) || 'N/A'}
                              </p>
                              {selectedTenant.businessType && (
                                <p className="text-xs text-green-600 mt-1">Business: {selectedTenant.businessType}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={clearTenantSelection}
                              className="text-red-500 hover:text-red-700 ml-2 text-lg font-bold"
                              disabled={loading}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              ref={tenantInputRef}
                              type="text"
                              name="tenantSearch"
                              value={searchTerm.tenant}
                              onChange={(e) => handleTenantSearch(e.target.value)}
                              onFocus={handleTenantInputFocus}
                              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.tenantId || errors.tenantSearch ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Search tenant by name..."
                              maxLength={VALIDATION_RULES.maxTenantNameLength}
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
                                    <p className="font-medium text-gray-900">
                                      {tenant.tenantName?.substring(0, VALIDATION_RULES.maxTenantNameLength) || 'N/A'}
                                      {tenant.tenantName && tenant.tenantName.length > VALIDATION_RULES.maxTenantNameLength && '...'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {tenant.email?.substring(0, VALIDATION_RULES.maxEmailLength) || 'N/A'} | 
                                      {tenant.phone?.substring(0, VALIDATION_RULES.maxPhoneLength) || 'N/A'}
                                    </p>
                                    {tenant.businessType && (
                                      <p className="text-xs text-green-600 mt-1">Business: {tenant.businessType}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {(errors.tenantId || errors.tenantSearch) && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.tenantId || errors.tenantSearch}
                        </p>
                      )}
                    </div>

                    {/* Unit Selection */}
                    <div data-field="unitId">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <div className="relative">
                        {selectedUnit ? (
                          <div className="flex items-center justify-between p-3 border border-green-500 rounded-md bg-green-50">
                            <div>
                              <p className="font-medium text-green-900">
                                {selectedUnit.unitNumber?.substring(0, VALIDATION_RULES.maxUnitNumberLength) || 'N/A'}
                                {selectedUnit.unitNumber && selectedUnit.unitNumber.length > VALIDATION_RULES.maxUnitNumberLength && '...'}
                              </p>
                              <p className="text-sm text-green-700">
                                {selectedUnit.level?.levelName?.substring(0, VALIDATION_RULES.maxLevelNameLength) || 'N/A'} - {selectedUnit.unitType}
                                <br/>
                                {selectedUnit.level?.building?.buildingName?.substring(0, VALIDATION_RULES.maxBuildingNameLength) || 'N/A'} - {selectedUnit.level?.building?.branch?.branchName}
                              </p>
                              <p className="text-sm text-green-700">
                                Unit Fee: {selectedUnit.rentalFee?.toLocaleString()} MMK/month
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={clearUnitSelection}
                              className="text-red-500 hover:text-red-700 ml-2 text-lg font-bold"
                              disabled={loading}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              ref={unitInputRef}
                              type="text"
                              name="unitSearch"
                              value={searchTerm.unit}
                              onChange={(e) => handleUnitSearch(e.target.value)}
                              onFocus={handleUnitInputFocus}
                              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.unitId || errors.unitSearch ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Search unit by number..."
                              maxLength={VALIDATION_RULES.maxUnitNumberLength}
                            />
                            {showDropdown.unit && filteredUnits.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
                                  <span className="text-sm text-gray-600">{filteredUnits.length} units found</span>
                                  <button
                                    type="button"
                                    onClick={() => closeDropdown('unit')}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                  >
                                    Close
                                  </button>
                                </div>
                                {filteredUnits.map(unit => (
                                  <div
                                    key={unit.id}
                                    onClick={() => selectUnit(unit)}
                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {unit.unitNumber?.substring(0, VALIDATION_RULES.maxUnitNumberLength) || 'N/A'}
                                          {unit.unitNumber && unit.unitNumber.length > VALIDATION_RULES.maxUnitNumberLength && '...'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {unit.level?.levelName?.substring(0, VALIDATION_RULES.maxLevelNameLength) || 'N/A'} • {unit.unitType} 
                                          <br/>
                                          {unit.level?.building?.buildingName?.substring(0, VALIDATION_RULES.maxBuildingNameLength) || 'N/A'}
                                        </p>
                                      </div>
                                      <p className="font-semibold text-green-600">
                                        {unit.rentalFee?.toLocaleString()} MMK/month
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {(errors.unitId || errors.unitSearch) && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.unitId || errors.unitSearch}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Details Section */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Rental Fee */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Rental Fee (MMK) *
                        <span className="text-xs text-gray-500 ml-2">Unit fee × Duration (editable)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="rentalFee"
                          value={formData.rentalFee || ''}
                          onChange={handleRentalFeeChange}
                          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.rentalFee ? 'border-red-500' : 'border-gray-300'
                          }`}
                          min={VALIDATION_RULES.minRentalFee}
                          // max={VALIDATION_RULES.maxRentalFee}
                          disabled={!formData.contractDurationType}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500">MMK</span>
                        </div>
                      </div>
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {errors.rentalFee && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.rentalFee}
                        </p>
                      )}
                      {selectedUnit && !rentalFeeEditable && formData.contractDurationType && (
                        <p className="text-xs text-gray-500 mt-1">
                          Based on: {selectedUnit.rentalFee?.toLocaleString()} MMK/month × {
                            contractDurationOptions.find(opt => opt.value === formData.contractDurationType)?.months || 0
                          } months
                        </p>
                      )}
                      {!formData.contractDurationType && (
                        <p className="text-xs text-yellow-600 mt-1">Please select contract duration first</p>
                      )}
                    </div>

                    {/* Security Deposit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Security Deposit (MMK)
                        <span className="text-xs text-gray-500 ml-2">Optional, max 999,999,999 MMK</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="securityDeposit"
                          value={formData.securityDeposit || ''}
                          onChange={handleInputChange}
                          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.securityDeposit ? 'border-red-500' : 'border-gray-300'
                          }`}
                          min={VALIDATION_RULES.minSecurityDeposit}
                          // step="1000"
                          placeholder="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500">MMK</span>
                        </div>
                      </div>
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {errors.securityDeposit && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.securityDeposit}
                        </p>
                      )}
                    </div>

                    {/* Grace Period */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grace Period (Days) *
                        <span className="text-xs text-gray-500 ml-2">{VALIDATION_RULES.minGracePeriodDays}-{VALIDATION_RULES.maxGracePeriodDays} days (required)</span>
                      </label>
                      <input
                        type="number"
                        name="gracePeriodDays"
                        value={formData.gracePeriodDays || ''}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.gracePeriodDays ? 'border-red-500' : 'border-gray-300'
                        }`}
                        // min={VALIDATION_RULES.minGracePeriodDays}
                        // max={VALIDATION_RULES.maxGracePeriodDays}
                      />
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {errors.gracePeriodDays && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.gracePeriodDays}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contract Terms Section */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Terms</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Notice Period */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notice Period (Days) *
                        <span className="text-xs text-gray-500 ml-2">{VALIDATION_RULES.minNoticePeriodDays}-{VALIDATION_RULES.maxNoticePeriodDays} days (required)</span>
                      </label>
                      <input
                        type="number"
                        name="noticePeriodDays"
                        value={formData.noticePeriodDays || ''}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.noticePeriodDays ? 'border-red-500' : 'border-gray-300'
                        }`}
                        //min={VALIDATION_RULES.minNoticePeriodDays}
                        // max={VALIDATION_RULES.maxNoticePeriodDays}
                      />
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {errors.noticePeriodDays && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.noticePeriodDays}
                        </p>
                      )}
                    </div>

                    {/* Renewal Notice */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Renewal Notice (Days) *
                        <span className="text-xs text-gray-500 ml-2">{VALIDATION_RULES.minRenewalNoticeDays}-{VALIDATION_RULES.maxRenewalNoticeDays} days (required)</span>
                      </label>
                      <input
                        type="number"
                        name="renewalNoticeDays"
                        value={formData.renewalNoticeDays || ''}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.renewalNoticeDays ? 'border-red-500' : 'border-gray-300'
                        }`}
                        //min={VALIDATION_RULES.minRenewalNoticeDays}
                        // max={VALIDATION_RULES.maxRenewalNoticeDays}
                      />
                      {/* ERROR MESSAGE - RED TEXT UNDER INPUT */}
                      {errors.renewalNoticeDays && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.renewalNoticeDays}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contract Terms Textarea */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Additional Contract Terms
                        <span className="text-xs text-gray-500 ml-2">Optional</span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {formData.contractTerms?.length || 0} / {VALIDATION_RULES.maxContractTermsLength} characters
                      </span>
                    </div>
                    <textarea
                      name="contractTerms"
                      value={formData.contractTerms}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.contractTerms ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter any additional terms and conditions here..."
                      maxLength={VALIDATION_RULES.maxContractTermsLength}
                    />
                    {/* ERROR MESSAGE - RED TEXT UNDER TEXTAREA */}
                    {errors.contractTerms && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.contractTerms}
                      </p>
                    )}
                  </div>

                  {/* Utilities Section */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Included Utilities * (Select at least {VALIDATION_RULES.minUtilitiesCount})
                      </h4>
                      <div className="flex items-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          selectedUtilityIds.length >= VALIDATION_RULES.minUtilitiesCount
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Selected: {selectedUtilityIds.length} / Minimum: {VALIDATION_RULES.minUtilitiesCount}
                        </span>
                      </div>
                    </div>
                    
                    {/* Utilities Error Message */}
                    {(errors.utilities || utilitiesError) && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-800 font-medium">
                            {errors.utilities || utilitiesError}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {utilitiesLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-gray-600">Loading utilities...</span>
                      </div>
                    ) : utilities.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {utilities.map(utility => (
                          <div key={utility.id} className="flex items-start">
                            <input
                              type="checkbox"
                              id={`utility-${utility.id}`}
                              checked={selectedUtilityIds.includes(utility.id)}
                              onChange={() => handleUtilityToggle(utility.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                            />
                            <label 
                              htmlFor={`utility-${utility.id}`} 
                              className="ml-2 text-sm text-gray-900 cursor-pointer flex-1"
                            >
                              <div className="font-medium">
                                {utility.utilityName?.substring(0, VALIDATION_RULES.maxUtilityNameLength) || 'Utility'}
                                {utility.utilityName && utility.utilityName.length > VALIDATION_RULES.maxUtilityNameLength && '...'}
                              </div>
                              {/* {utility.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {utility.description.substring(0, VALIDATION_RULES.maxUtilityDescriptionLength)}
                                  {utility.description.length > VALIDATION_RULES.maxUtilityDescriptionLength && '...'}
                                </p>
                              )} */}
                              {utility.ratePerUnit && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {utility.ratePerUnit} Per Unit
                                </p>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-gray-600">No utilities available</p>
                        <p className="text-sm text-gray-500 mt-1">Add utilities in the management section</p>
                      </div>
                    )}
                    
                    {/* Utilities Selection Status */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm text-blue-800 font-medium">
                            {selectedUtilityIds.length >= VALIDATION_RULES.minUtilitiesCount 
                              ? `✓ You have selected ${selectedUtilityIds.length} utilities (minimum requirement met)`
                              : `Please select ${VALIDATION_RULES.minUtilitiesCount - selectedUtilityIds.length} more utility/utilities`
                            }
                          </p>
                          {selectedUtilityIds.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Selected utilities: {utilities
                                .filter(u => selectedUtilityIds.includes(u.id))
                                .map(u => u.utilityName)
                                .join(', ')
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions Agreement - MOST IMPORTANT FIX */}
                  {!isEdit && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="agree-terms-checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAgreedToTerms(checked);
                            setFormData(prev => ({ ...prev, agreedToTerms: checked }));
                            
                            // Clear terms error when user checks the box
                            if (checked && errors.terms) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.terms;
                                return newErrors;
                              });
                            }
                          }}
                          className={`h-4 w-4 focus:ring-blue-500 rounded mt-1 ${
                            errors.terms ? 'text-red-600 border-red-500' : 'text-blue-600 border-gray-300'
                          }`}
                          required={!isEdit}
                        />
                        <div className="ml-3">
                          <label htmlFor="agree-terms-checkbox" className="text-sm text-gray-900">
                            I agree to the Terms and Conditions *
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            By checking this box, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions of this contract.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                            disabled={loading}
                          >
                            Read Terms and Conditions
                          </button>
                          {/* ERROR MESSAGE - RED TEXT UNDER TERMS CHECKBOX */}
                          {errors.terms && (
                            <p className="text-red-500 text-sm mt-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.terms}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row-reverse justify-between items-center gap-4 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      type="submit"
                      disabled={loading || isLoading || (!agreedToTerms && !isEdit) || selectedUtilityIds.length < VALIDATION_RULES.minUtilitiesCount}
                      className="w-full sm:w-auto"
                    >
                      {loading || isLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          {loading ? 'Processing...' : 'Submitting...'}
                        </>
                      ) : (
                        getSubmitButtonText()
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onClose}
                      disabled={loading || isLoading}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-500 w-full sm:w-auto text-center sm:text-left">
                    <p className="mb-1">* Required fields</p>
                    <p className="text-xs">Make sure all information is correct before submitting.</p>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && <TermsAndConditionsModal />}
    </>
  );
};