import React, { useState, useEffect } from "react";
import { utilityApi } from "../../api/UtilityAPI";
import type { UtilityType, UtilityTypeRequest } from "../../types/unit";
import { Zap, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

// Define validation error types inline
interface FormErrors {
    utilityName?: string;
    calculationMethod?: string;
    ratePerUnit?: string;
    description?: string;
}

// Define backend error response type inline
interface BackendValidationError {
    timestamp?: string;
    status: number;
    error: string;
    message: string;
    fieldErrors?: Record<string, string>;
}

// Helper function to format MMK with thousand separators
const formatMMK = (amount: number): string => {
    if (amount === null || amount === undefined) return "-";
    return `MMK ${amount.toFixed(4).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

// Custom Modal Component for Confirmation and Alerts
const CustomMessageModal: React.FC<{
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  type: 'confirm' | 'alert' | 'success';
}> = ({ message, onClose, onConfirm, type }) => {
  const { t } = useTranslation();
  
  if (!message) return null;

  const getColors = () => {
    switch (type) {
      case 'confirm':
        return { header: 'text-stone-900', border: 'border-stone-400' }; 
      case 'alert':
        return { header: 'text-[#1E40AF]', border: 'border-[#1E40AF]' };
      case 'success':
        return { header: 'text-green-700', border: 'border-green-600' };
      default:
        return { header: 'text-stone-900', border: 'border-stone-400' };
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'confirm':
        return t('utilityType.confirmAction');
      case 'alert':
        return t('utilityType.attention');
      case 'success':
        return t('utilityType.success');
      default:
        return '';
    }
  };

  const { header, border } = getColors();

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-[99]">
      <div className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm ${border} border-t-8`}>
        <h3 className={`text-xl font-bold mb-4 ${header}`}>
          {getTitle()}
        </h3>
        <p className="text-stone-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150"
            >
              {t('utilityType.cancel')}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition duration-150 ${
              type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1E40AF] hover:bg-[#1E3A8A]'
            }`}
          >
            {type === 'confirm' ? t('utilityType.continue') : t('utilityType.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to count words
const getWordCount = (text: string): number => {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
};

// Helper function to sanitize utility name
const sanitizeUtilityName = (value: string): string => {
  // Remove extra spaces and trim
  return value.replace(/\s+/g, ' ').trim();
};

// Validation function
const validateForm = (formData: UtilityTypeRequest): FormErrors => {
    const { t } = useTranslation();
    const errors: FormErrors = {};

    // Utility Name validation - with word limit
    if (!formData.utilityName.trim()) {
        errors.utilityName = t('utilityType.validation.utilityNameRequired');
    } else if (formData.utilityName.length < 2) {
        errors.utilityName = t('utilityType.validation.utilityNameMinLength');
    } else if (formData.utilityName.length > 50) {
        errors.utilityName = t('utilityType.validation.utilityNameMaxLength');
    } else if (!/^[a-zA-Z0-9\s\-\\.]+$/.test(formData.utilityName)) {
        errors.utilityName = t('utilityType.validation.utilityNameInvalidChars');
    } else {
        // Check word count (max 5 words)
        const wordCount = getWordCount(formData.utilityName);
        if (wordCount > 5) {
            errors.utilityName = t('utilityType.validation.utilityNameMaxWords');
        }
        
        // Check for consecutive spaces
        if (/\s{2,}/.test(formData.utilityName)) {
            errors.utilityName = t('utilityType.validation.utilityNameConsecutiveSpaces');
        }
        
        // Check for leading/trailing spaces
        if (formData.utilityName !== formData.utilityName.trim()) {
            errors.utilityName = t('utilityType.validation.utilityNameTrimSpaces');
        }
        
        // Additional: Prevent restricted words (optional)
        const restrictedWords = ['admin', 'root', 'system', 'test'];
        const lowerCaseName = formData.utilityName.toLowerCase();
        const foundRestrictedWord = restrictedWords.find(word => 
            lowerCaseName.includes(word)
        );
        
        if (foundRestrictedWord) {
            errors.utilityName = t('utilityType.validation.utilityNameRestrictedWord', { word: foundRestrictedWord });
        }
    }

    // Calculation Method validation
    if (!formData.calculationMethod) {
        errors.calculationMethod = t('utilityType.validation.calculationMethodRequired');
    }

    // Rate Per Unit validation
    if (formData.ratePerUnit === null || formData.ratePerUnit === undefined) {
        errors.ratePerUnit = t('utilityType.validation.ratePerUnitRequired');
    } else {
        const rate = Number(formData.ratePerUnit);
        if (isNaN(rate)) {
            errors.ratePerUnit = t('utilityType.validation.ratePerUnitInvalid');
        } else if (rate < 0) {
            errors.ratePerUnit = t('utilityType.validation.ratePerUnitNegative');
        } else if (rate > 999999.9999) {
            errors.ratePerUnit = t('utilityType.validation.ratePerUnitMax');
        } else {
            // Check decimal places
            const decimalPlaces = (rate.toString().split('.')[1] || '').length;
            if (decimalPlaces > 4) {
                errors.ratePerUnit = t('utilityType.validation.ratePerUnitMaxDecimals');
            }
        }
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
        errors.description = t('utilityType.validation.descriptionMaxLength');
    }

    return errors;
};

const UtilityTypeManagement: React.FC = () => {
    const { t } = useTranslation();
    const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingUtility, setEditingUtility] = useState<UtilityType | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UtilityTypeRequest>({
        utilityName: "",
        calculationMethod: "FIXED",
        ratePerUnit: 0,
        description: "",
    });
    
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const [message, setMessage] = useState<{
        text: string;
        type: 'confirm' | 'alert' | 'success';
        onConfirm?: () => void;
    } | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchUtilityTypes();
    }, []);

    const fetchUtilityTypes = async () => {
        try {
            setLoading(true);
            const response = await utilityApi.getAll();
            setUtilityTypes(response.data);
        } catch (error) {
            console.error("Error fetching utility types:", error);
            setMessage({ type: 'alert', text: t('utilityType.errors.fetchFailed') });
        } finally {
            setLoading(false);
        }
    };

    const resetFormAndClose = () => {
        setShowForm(false);
        setEditingUtility(null);
        setFormData({ 
            utilityName: "", 
            calculationMethod: "FIXED", 
            ratePerUnit: 0, 
            description: "" 
        });
        setFormErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Sanitize utility name before validation
        const sanitizedFormData = {
            ...formData,
            utilityName: sanitizeUtilityName(formData.utilityName)
        };
        
        // Frontend validation
        const errors = validateForm(sanitizedFormData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        
        setFormErrors({});
        
        try {
            if (editingUtility) {
                await utilityApi.update(editingUtility.id, sanitizedFormData);
            } else {
                await utilityApi.create(sanitizedFormData);
            }
            
            resetFormAndClose();
            fetchUtilityTypes();
            setMessage({ 
                type: 'success', 
                text: editingUtility 
                    ? t('utilityType.success.updated') 
                    : t('utilityType.success.created') 
            });
        } catch (error: any) {
            console.error("Error saving utility type:", error);
            
            // Handle backend validation errors
            if (error.response?.status === 400 && error.response?.data?.fieldErrors) {
                const backendError = error.response.data as BackendValidationError;
                const backendErrors: FormErrors = {};
                
                if (backendError.fieldErrors) {
                    Object.entries(backendError.fieldErrors).forEach(([field, message]) => {
                        // Map backend field names to frontend field names
                        const frontendField = field as keyof FormErrors;
                        backendErrors[frontendField] = message;
                    });
                }
                
                setFormErrors(backendErrors);
                
                const errorMessage = backendError.message || t('utilityType.errors.validationErrors');
                setMessage({ type: 'alert', text: errorMessage });
            } else {
                const errorMessage = error.response?.data?.message || t('utilityType.errors.saveFailed');
                setMessage({ type: 'alert', text: errorMessage });
            }
        }
    };

    const handleEdit = (utility: UtilityType) => {
        setEditingUtility(utility);
        setFormData({
            utilityName: utility.utilityName,
            calculationMethod: utility.calculationMethod || "FIXED",
            ratePerUnit: utility.ratePerUnit || 0,
            description: utility.description || ""
        });
        setFormErrors({});
        setShowForm(true);
    };

    const executeDelete = async (id: number) => {
        try {
            await utilityApi.delete(id);
            fetchUtilityTypes();
            setMessage({ type: 'success', text: t('utilityType.success.deleted') });
        } catch (error: any) {
            console.error("Error deleting utility type:", error);
            const errorMessage = error.response?.data?.message || t('utilityType.errors.deleteFailed');
            setMessage({ type: 'alert', text: errorMessage });
        }
    };

    const handleDelete = (id: number) => {
        setMessage({
            type: 'confirm',
            text: t('utilityType.confirm.delete'),
            onConfirm: () => executeDelete(id)
        });
    };

    const executeToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            const utility = utilityTypes.find(u => u.id === id);
            if (!utility) {
                setMessage({ type: 'alert', text: t('utilityType.errors.notFound') });
                return;
            }

            const updateData: UtilityTypeRequest = {
                utilityName: utility.utilityName,
                calculationMethod: utility.calculationMethod || "FIXED",
                ratePerUnit: utility.ratePerUnit || 0,
                description: utility.description || "",
                isActive: !currentStatus
            };

            await utilityApi.update(id, updateData);
            fetchUtilityTypes();
            setMessage({ 
                type: 'success', 
                text: !currentStatus 
                    ? t('utilityType.success.activated') 
                    : t('utilityType.success.deactivated') 
            });
        } catch (error: any) {
            console.error("Error updating utility type:", error);
            const errorMessage = error.response?.data?.message || t('utilityType.errors.updateFailed');
            setMessage({ type: 'alert', text: errorMessage });
        }
    };

    const handleToggleActive = (id: number, currentStatus: boolean) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        setMessage({
            type: 'confirm',
            text: t('utilityType.confirm.toggleActive', { action }),
            onConfirm: () => executeToggleActive(id, currentStatus)
        });
    };

    const getCalculationMethodDescription = (method: string) => {
        switch (method) {
            case 'FIXED': return t('utilityType.calculationMethods.fixed');
            case 'METERED': return t('utilityType.calculationMethods.metered');
            case 'ALLOCATED': return t('utilityType.calculationMethods.allocated');
            default: return method;
        }
    };

    const handleInputChange = (field: keyof UtilityTypeRequest, value: any) => {
        let sanitizedValue = value;
        
        // Sanitize utility name input
        if (field === 'utilityName') {
            // Remove consecutive spaces (keep single space for word separation)
            sanitizedValue = value.replace(/\s+/g, ' ');
            
            // Don't trim start here to allow user to type normally
            // Trim will be applied on blur and before submit
            
            // Limit to 5 words
            const words = sanitizedValue.split(' ');
            if (words.length > 5) {
                sanitizedValue = words.slice(0, 5).join(' ');
            }
            
            // Limit to 50 characters
            if (sanitizedValue.length > 50) {
                sanitizedValue = sanitizedValue.substring(0, 50);
            }
        }
        
        // Fix for rate input: prevent leading zeros
        if (field === 'ratePerUnit') {
            // Convert string to number, handle empty/NaN cases
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                sanitizedValue = 0;
            } else {
                sanitizedValue = numValue;
            }
        }
        
        setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
        
        // Clear validation error for this field
        if (formErrors[field as keyof FormErrors]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field as keyof FormErrors];
                return newErrors;
            });
        }
    };

    const getInputClassName = (fieldName: keyof FormErrors) => {
        const baseClass = "mt-1 block w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 text-sm sm:text-base transition duration-150 shadow-sm";
        if (formErrors[fieldName]) {
            return `${baseClass} border-[#1E40AF] focus:ring-[#1E40AF] focus:border-[#1E40AF]`;
        }
        return `${baseClass} border-stone-300 focus:ring-[#1E40AF] focus:border-[#1E40AF]`;
    };

    // Pagination logic
    const totalPages = Math.ceil(utilityTypes.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = utilityTypes.slice(indexOfFirstItem, indexOfLastItem);

    const handleFirstPage = () => {
        setCurrentPage(1);
    };

    const handleLastPage = () => {
        setCurrentPage(totalPages);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
                <div className="text-xl font-medium text-stone-700 animate-pulse">{t('utilityType.loading')}</div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
            
            {/* Custom Message Modal */}
            {message && (
                <CustomMessageModal
                    message={message.text}
                    type={message.type}
                    onConfirm={message.onConfirm}
                    onClose={() => setMessage(null)}
                />
            )}

            {/* Header and Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">{t('utilityType.title')}</h1>
                    <p className="text-stone-600 mt-1 text-sm sm:text-base">{t('utilityType.subtitle')}</p>
                </div>
                <button
                    onClick={() => {
                        setFormErrors({});
                        setShowForm(true);
                    }}
                    className="bg-[#1E40AF] text-white px-6 py-3 rounded-xl shadow-lg hover:bg-[#1E3A8A] transition duration-150 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold focus:outline-none focus:ring-4 focus:ring-[#93C5FD] transform active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    {t('utilityType.addButton')}
                </button>
            </div>

            {/* Utility Type Creation/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Sticky Header */}
                        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 pt-6 pb-2 z-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                                {editingUtility ? t('utilityType.editTitle') : t('utilityType.createTitle')}
                            </h2>
                        </div>
                        
                        {/* Scrollable Form Content */}
                        <div className="overflow-y-auto flex-grow p-6 sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                
                                {/* Utility Name Field */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">
                                        {t('utilityType.form.utilityName')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.utilityName}
                                        onChange={(e) => handleInputChange('utilityName', e.target.value)}
                                        onBlur={(e) => {
                                            // Clean up on blur - remove extra spaces and trim
                                            const cleaned = sanitizeUtilityName(e.target.value);
                                            if (cleaned !== formData.utilityName) {
                                                setFormData(prev => ({ ...prev, utilityName: cleaned }));
                                            }
                                        }}
                                        className={getInputClassName('utilityName')}
                                        placeholder={t('utilityType.form.utilityNamePlaceholder')}
                                        maxLength={50}
                                    />
                                    {formErrors.utilityName ? (
                                        <p className="mt-1 text-xs text-[#1E40AF] font-medium">
                                            {formErrors.utilityName}
                                        </p>
                                    ) : (
                                        <div className="flex justify-between items-center mt-1">
                                            <span className={`text-xs ${
                                                formData.utilityName.length > 50 ? 'text-[#1E40AF]' : 'text-stone-500'
                                            }`}>
                                                {formData.utilityName.length}/50 {t('utilityType.characters')}
                                            </span>
                                            <span className={`text-xs ${
                                                getWordCount(formData.utilityName) > 5 ? 'text-[#1E40AF]' : 'text-stone-500'
                                            }`}>
                                                {getWordCount(formData.utilityName)}/5 {t('utilityType.words')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Calculation Method Field */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">
                                        {t('utilityType.form.calculationMethod')} *
                                    </label>
                                    <select
                                        required
                                        value={formData.calculationMethod}
                                        onChange={(e) => handleInputChange('calculationMethod', e.target.value)}
                                        className={getInputClassName('calculationMethod')}
                                    >
                                        <option value="FIXED">{t('utilityType.form.fixedRate')}</option>
                                        <option value="METERED">{t('utilityType.form.metered')}</option>
                                        <option value="ALLOCATED">{t('utilityType.form.allocated')}</option>
                                    </select>
                                    {formErrors.calculationMethod && (
                                        <p className="mt-1 text-xs text-[#1E40AF] font-medium">
                                            {formErrors.calculationMethod}
                                        </p>
                                    )}
                                    <p className="text-xs text-[#1E40AF] mt-1 font-medium">
                                        {getCalculationMethodDescription(formData.calculationMethod)}
                                    </p>
                                </div>
                                
                                {/* Rate Per Unit Field */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">
                                        {t('utilityType.form.ratePerUnit')} *
                                        <span className="text-stone-500 text-xs ml-2">
                                            ({t('utilityType.form.baseRate')})
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={formData.ratePerUnit === 0 ? "" : formData.ratePerUnit}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === "" || value === "0") {
                                                handleInputChange('ratePerUnit', 0);
                                            } else {
                                                // Remove leading zeros
                                                const numValue = parseFloat(value.replace(/^0+/, ''));
                                                handleInputChange('ratePerUnit', isNaN(numValue) ? 0 : numValue);
                                            }
                                        }}
                                        className={getInputClassName('ratePerUnit')}
                                        min={0}
                                        max={999999.9999}
                                        placeholder="0"
                                    />
                                    {formErrors.ratePerUnit && (
                                        <p className="mt-1 text-xs text-[#1E40AF] font-medium">
                                            {formErrors.ratePerUnit}
                                        </p>
                                    )}
                                    <p className="text-xs text-stone-500 mt-1">
                                        {t('utilityType.form.rateDescription')}
                                    </p>
                                </div>
                                
                                {/* Description Field */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">
                                        {t('utilityType.form.description')}
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={3}
                                        className={getInputClassName('description')}
                                        placeholder={t('utilityType.form.descriptionPlaceholder')}
                                        maxLength={500}
                                    />
                                    {formErrors.description && (
                                        <p className="mt-1 text-xs text-[#1E40AF] font-medium">
                                            {formErrors.description}
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center mt-1">
                                        <span className={`text-xs ${
                                            formData.description.length > 500 ? 'text-[#1E40AF]' : 'text-stone-500'
                                        }`}>
                                            {formData.description.length}/500 {t('utilityType.characters')}
                                        </span>
                                        {formData.description.length >= 450 && (
                                            <span className="text-xs text-amber-600 font-medium">
                                                {500 - formData.description.length} {t('utilityType.charactersRemaining')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        {/* Sticky Footer with Actions */}
                        <div className="sticky bottom-0 bg-white border-t border-stone-200 px-6 py-4">
                            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={resetFormAndClose}
                                    className="px-6 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm"
                                >
                                    {t('utilityType.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-[#1E40AF] text-white rounded-lg shadow-lg hover:bg-[#1E3A8A] transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-[#93C5FD] transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={Object.keys(formErrors).length > 0}
                                >
                                    {editingUtility ? t('utilityType.updateButton') : t('utilityType.createButton')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-stone-600">
                    {t('common.showingXofY', 'Showing {{count}} of {{total}} utility types', { 
                        count: Math.min(currentItems.length, itemsPerPage), 
                        total: utilityTypes.length 
                    })}
                    {utilityTypes.length > itemsPerPage && (
                        <span className="ml-2">
                            (Page {currentPage} of {totalPages})
                        </span>
                    )}
                </p>
            </div>

            {/* Responsive Table */}
            <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                        <thead className="bg-stone-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                    {t('utilityType.table.utilityName')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider hidden sm:table-cell">
                                    {t('utilityType.table.calculationMethod')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                    {t('utilityType.table.rate')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                    {t('utilityType.table.status')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider hidden lg:table-cell">
                                    {t('utilityType.table.description')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                    {t('utilityType.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-stone-100">
                            {currentItems.map((utility) => (
                                <tr key={utility.id} className="hover:bg-[#1E40AF]/5 transition duration-100">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                                        <div className="font-semibold">{utility.utilityName}</div>
                                        <div className="text-stone-500 text-xs mt-0.5 sm:hidden">
                                            {getCalculationMethodDescription(utility.calculationMethod || "FIXED")}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-600 hidden sm:table-cell">
                                        <span className="bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                            {utility.calculationMethod?.split('_')[0] || 'FIXED'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-700">
                                        <div className="font-medium">
                                            {utility.ratePerUnit ? formatMMK(utility.ratePerUnit) : '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full transition duration-150 ${
                                            utility.isActive 
                                                ? "bg-green-100 text-green-800" 
                                                : "bg-red-100 text-red-800"
                                        }`}>
                                            {utility.isActive ? t('utilityType.active') : t('utilityType.inactive')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-stone-500 hidden lg:table-cell">
                                        <div className="truncate max-w-xs" title={utility.description || t('utilityType.noDescription')}>
                                            {utility.description || '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button
                                                onClick={() => handleEdit(utility)}
                                                className="text-[#1E40AF] hover:text-[#1E3A8A] text-xs sm:text-sm font-medium"
                                            >
                                                {t('utilityType.edit')}
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(utility.id, utility.isActive)}
                                                className={`text-xs sm:text-sm font-medium ${
                                                    utility.isActive ? 'text-stone-600 hover:text-stone-900' : 'text-green-600 hover:text-green-700'
                                                }`}
                                            >
                                                {utility.isActive ? t('utilityType.deactivate') : t('utilityType.activate')}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(utility.id)}
                                                className="text-[#1E40AF] hover:text-[#1E3A8A] text-xs sm:text-sm font-medium"
                                            >
                                                {t('utilityType.delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {utilityTypes.length === 0 && (
                    <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-b-xl">
                        <div className="text-5xl mb-3">⚡</div>
                        <div className="text-xl font-semibold text-stone-700">{t('utilityType.noUtilityTypes')}</div>
                        <p className="text-sm mt-1">{t('utilityType.startByAdding')}</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-stone-600">
                        {t('common.pageInfo', 'Page {{current}} of {{total}}', {
                            current: currentPage,
                            total: totalPages
                        })}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleFirstPage}
                            disabled={currentPage === 1}
                            className="p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('common.firstPage', 'First page')}
                        >
                            <ChevronsLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('common.previousPage', 'Previous page')}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-150 ${
                                            currentPage === pageNum
                                                ? 'bg-blue-800 text-white'
                                                : 'text-stone-600 hover:bg-blue-50 hover:text-blue-800'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('common.nextPage', 'Next page')}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleLastPage}
                            disabled={currentPage === totalPages}
                            className="p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('common.lastPage', 'Last page')}
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Thematic Configuration Guide */}
            <div className="mt-8 bg-stone-200 border border-stone-300 rounded-xl p-5 sm:p-6 shadow-inner">
                <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-300 pb-2">{t('utilityType.configurationGuide')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    
                    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#1E40AF]">
                        <strong className="text-[#1E40AF]">{t('utilityType.guide.fixedMethod')}</strong><br/>
                        <p className="mt-1 text-stone-700">{t('utilityType.guide.fixedDescription')}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#1E40AF]">
                        <strong className="text-[#1E40AF]">{t('utilityType.guide.meteredMethod')}</strong><br/>
                        <p className="mt-1 text-stone-700">{t('utilityType.guide.meteredDescription')}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#1E40AF]">
                        <strong className="text-[#1E40AF]">{t('utilityType.guide.allocatedMethod')}</strong><br/>
                        <p className="mt-1 text-stone-700">{t('utilityType.guide.allocatedDescription')}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#1E40AF]">
                        <strong className="text-[#1E40AF]">{t('utilityType.guide.ratePerUnit')}</strong><br/>
                        <p className="mt-1 text-stone-700">{t('utilityType.guide.rateDescription')}</p>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default UtilityTypeManagement;