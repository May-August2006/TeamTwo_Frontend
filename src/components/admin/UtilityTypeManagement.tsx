import React, { useState, useEffect } from "react";
import { utilityApi } from "../../api/UtilityAPI";
import type { UtilityType, UtilityTypeRequest } from "../../types/unit";
import { Zap, Plus } from "lucide-react";

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

// Custom Modal Component for Confirmation and Alerts
const CustomMessageModal: React.FC<{
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  type: 'confirm' | 'alert' | 'success';
}> = ({ message, onClose, onConfirm, type }) => {
  if (!message) return null;

  const getColors = () => {
    switch (type) {
      case 'confirm':
        return { header: 'text-stone-900', border: 'border-stone-400' }; 
      case 'alert':
        return { header: 'text-red-700', border: 'border-red-600' };
      case 'success':
        return { header: 'text-green-700', border: 'border-green-600' };
      default:
        return { header: 'text-stone-900', border: 'border-stone-400' };
    }
  };

  const { header, border } = getColors();

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-[99]">
      <div className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm ${border} border-t-8`}>
        <h3 className={`text-xl font-bold mb-4 ${header}`}>
          {type === 'confirm' ? 'Confirm Action' : type === 'success' ? 'Success' : 'Attention'}
        </h3>
        <p className="text-stone-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition duration-150 ${
              type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {type === 'confirm' ? 'Continue' : 'Close'}
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
    const errors: FormErrors = {};

    // Utility Name validation - with word limit
    if (!formData.utilityName.trim()) {
        errors.utilityName = "Utility name is required";
    } else if (formData.utilityName.length < 2) {
        errors.utilityName = "Utility name must be at least 2 characters";
    } else if (formData.utilityName.length > 50) {
        errors.utilityName = "Utility name cannot exceed 50 characters";
    } else if (!/^[a-zA-Z0-9\s\-\\.]+$/.test(formData.utilityName)) {
        errors.utilityName = "Utility name can only contain letters, numbers, spaces, hyphens, and dots";
    } else {
        // Check word count (max 5 words)
        const wordCount = getWordCount(formData.utilityName);
        if (wordCount > 5) {
            errors.utilityName = "Utility name should be maximum 5 words";
        }
        
        // Check for consecutive spaces
        if (/\s{2,}/.test(formData.utilityName)) {
            errors.utilityName = "Utility name should not have consecutive spaces";
        }
        
        // Check for leading/trailing spaces
        if (formData.utilityName !== formData.utilityName.trim()) {
            errors.utilityName = "Utility name should not start or end with spaces";
        }
        
        // Additional: Prevent restricted words (optional)
        const restrictedWords = ['admin', 'root', 'system', 'test'];
        const lowerCaseName = formData.utilityName.toLowerCase();
        const foundRestrictedWord = restrictedWords.find(word => 
            lowerCaseName.includes(word)
        );
        
        if (foundRestrictedWord) {
            errors.utilityName = `Utility name cannot contain "${foundRestrictedWord}"`;
        }
    }

    // Calculation Method validation
    if (!formData.calculationMethod) {
        errors.calculationMethod = "Calculation method is required";
    }

    // Rate Per Unit validation
    if (formData.ratePerUnit === null || formData.ratePerUnit === undefined) {
        errors.ratePerUnit = "Rate per unit is required";
    } else {
        const rate = Number(formData.ratePerUnit);
        if (isNaN(rate)) {
            errors.ratePerUnit = "Rate must be a valid number";
        } else if (rate < 0) {
            errors.ratePerUnit = "Rate cannot be negative";
        } else if (rate > 999999.9999) {
            errors.ratePerUnit = "Rate cannot exceed 999,999.9999";
        } else {
            // Check decimal places
            const decimalPlaces = (rate.toString().split('.')[1] || '').length;
            if (decimalPlaces > 4) {
                errors.ratePerUnit = "Rate can have maximum 4 decimal places";
            }
        }
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
        errors.description = "Description cannot exceed 500 characters";
    }

    return errors;
};

const UtilityTypeManagement: React.FC = () => {
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
            setMessage({ type: 'alert', text: "Failed to fetch utility types" });
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
            setMessage({ type: 'success', text: `Utility type ${editingUtility ? 'updated' : 'created'} successfully!` });
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
                
                const errorMessage = backendError.message || "Please fix the validation errors above";
                setMessage({ type: 'alert', text: errorMessage });
            } else {
                const errorMessage = error.response?.data?.message || "Failed to save utility type";
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
            setMessage({ type: 'success', text: "Utility type deleted successfully!" });
        } catch (error: any) {
            console.error("Error deleting utility type:", error);
            const errorMessage = error.response?.data?.message || "Failed to delete utility type";
            setMessage({ type: 'alert', text: errorMessage });
        }
    };

    const handleDelete = (id: number) => {
        setMessage({
            type: 'confirm',
            text: "Are you sure you want to delete this utility type? This action cannot be undone.",
            onConfirm: () => executeDelete(id)
        });
    };

    const executeToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            const utility = utilityTypes.find(u => u.id === id);
            if (!utility) {
                setMessage({ type: 'alert', text: "Utility type not found." });
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
            setMessage({ type: 'success', text: `Utility type ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
        } catch (error: any) {
            console.error("Error updating utility type:", error);
            const errorMessage = error.response?.data?.message || "Failed to update utility type";
            setMessage({ type: 'alert', text: errorMessage });
        }
    };

    const handleToggleActive = (id: number, currentStatus: boolean) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        setMessage({
            type: 'confirm',
            text: `Are you sure you want to ${action} this utility type?`,
            onConfirm: () => executeToggleActive(id, currentStatus)
        });
    };

    const getCalculationMethodDescription = (method: string) => {
        switch (method) {
            case 'FIXED': return 'Fixed rate per billing period';
            case 'METERED': return 'Based on actual consumption (meter reading)';
            case 'ALLOCATED': return 'Allocated based on usage or area';
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
            return `${baseClass} border-red-500 focus:ring-red-500 focus:border-red-500`;
        }
        return `${baseClass} border-stone-300 focus:ring-red-500 focus:border-red-500`;
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
                <div className="text-xl font-medium text-stone-700 animate-pulse">Loading Utility Types...</div>
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
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Utility Type Management</h1>
                    <p className="text-stone-600 mt-1 text-sm sm:text-base">Manage utility types and calculation methods for billing configuration.</p>
                </div>
                <button
                    onClick={() => {
                        setFormErrors({});
                        setShowForm(true);
                    }}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Add Utility Type
                </button>
            </div>

            {/* Utility Type Creation/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-stone-900 border-b border-stone-200 pb-2">
                            {editingUtility ? "Edit Utility Type" : "Add New Utility Type"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            {/* Utility Name Field */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700">
                                    Utility Name *
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
                                    placeholder="e.g., Electricity, Water, CAM"
                                    maxLength={50}
                                />
                                {formErrors.utilityName ? (
                                    <p className="mt-1 text-xs text-red-600 font-medium">
                                        {formErrors.utilityName}
                                    </p>
                                ) : (
                                    <div className="flex justify-between items-center mt-1">
                                        <span className={`text-xs ${
                                            formData.utilityName.length > 50 ? 'text-red-600' : 'text-stone-500'
                                        }`}>
                                            {formData.utilityName.length}/50 characters
                                        </span>
                                        <span className={`text-xs ${
                                            getWordCount(formData.utilityName) > 5 ? 'text-red-600' : 'text-stone-500'
                                        }`}>
                                            {getWordCount(formData.utilityName)}/5 words
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Calculation Method Field */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700">
                                    Calculation Method *
                                </label>
                                <select
                                    required
                                    value={formData.calculationMethod}
                                    onChange={(e) => handleInputChange('calculationMethod', e.target.value)}
                                    className={getInputClassName('calculationMethod')}
                                >
                                    <option value="FIXED">Fixed Rate</option>
                                    <option value="METERED">Metered (Consumption-based)</option>
                                    <option value="ALLOCATED">Allocated</option>
                                </select>
                                {formErrors.calculationMethod && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">
                                        {formErrors.calculationMethod}
                                    </p>
                                )}
                                <p className="text-xs text-red-700 mt-1 font-medium">
                                    {getCalculationMethodDescription(formData.calculationMethod)}
                                </p>
                            </div>
                            
                            {/* Rate Per Unit Field */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700">
                                    Rate Per Unit *
                                    <span className="text-stone-500 text-xs ml-2">
                                        (base rate for calculations)
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={formData.ratePerUnit}
                                    onChange={(e) => handleInputChange('ratePerUnit', parseFloat(e.target.value) || 0)}
                                    className={getInputClassName('ratePerUnit')}
                                    min={0}
                                    max={999999.9999}
                                />
                                {formErrors.ratePerUnit && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">
                                        {formErrors.ratePerUnit}
                                    </p>
                                )}
                                <p className="text-xs text-stone-500 mt-1">
                                    Enter a value between 0 and 999,999.9999 with up to 4 decimal places
                                </p>
                            </div>
                            
                            {/* Description Field */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={3}
                                    className={getInputClassName('description')}
                                    placeholder="Describe this utility type and how it should be calculated..."
                                    maxLength={500}
                                />
                                {formErrors.description && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">
                                        {formErrors.description}
                                    </p>
                                )}
                                <div className="flex justify-between items-center mt-1">
                                    <span className={`text-xs ${
                                        formData.description.length > 500 ? 'text-red-600' : 'text-stone-500'
                                    }`}>
                                        {formData.description.length}/500 characters
                                    </span>
                                    {formData.description.length >= 450 && (
                                        <span className="text-xs text-amber-600 font-medium">
                                            {500 - formData.description.length} characters remaining
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Form Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-stone-200">
                                <button
                                    type="button"
                                    onClick={resetFormAndClose}
                                    className="px-6 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={Object.keys(formErrors).length > 0}
                                >
                                    {editingUtility ? "Update Utility" : "Create Utility"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Responsive Table */}
            <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                        <thead className="bg-stone-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                    Utility Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider hidden sm:table-cell">
                                    Calculation Method
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                    Rate
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider hidden lg:table-cell">
                                    Description
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-stone-100">
                            {utilityTypes.map((utility) => (
                                <tr key={utility.id} className="hover:bg-red-50/50 transition duration-100">
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
                                            {utility.ratePerUnit ? `$${utility.ratePerUnit.toFixed(4)}` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full transition duration-150 ${
                                            utility.isActive 
                                                ? "bg-green-100 text-green-800" 
                                                : "bg-red-100 text-red-800"
                                        }`}>
                                            {utility.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-stone-500 hidden lg:table-cell">
                                        <div className="truncate max-w-xs" title={utility.description || 'No description provided.'}>
                                            {utility.description || '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button
                                                onClick={() => handleEdit(utility)}
                                                className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(utility.id, utility.isActive)}
                                                className={`text-xs sm:text-sm font-medium ${
                                                    utility.isActive ? 'text-stone-600 hover:text-stone-900' : 'text-green-600 hover:text-green-700'
                                                }`}
                                            >
                                                {utility.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(utility.id)}
                                                className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
                                            >
                                                Delete
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
                        <div className="text-xl font-semibold text-stone-700">No Utility Types Found</div>
                        <p className="text-sm mt-1">Start by clicking "Add Utility Type" to define your first utility configuration.</p>
                    </div>
                )}
            </div>

            {/* Thematic Configuration Guide */}
            <div className="mt-8 bg-stone-200 border border-stone-300 rounded-xl p-5 sm:p-6 shadow-inner">
                <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-300 pb-2">Utility Type Configuration Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    
                    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
                        <strong className="text-red-700">FIXED Method</strong><br/>
                        <p className="mt-1 text-stone-700">Use for utilities with consistent monthly charges like internet, cable TV, or basic service fees that don't vary with usage.</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
                        <strong className="text-red-700">METERED Method</strong><br/>
                        <p className="mt-1 text-stone-700">Use for consumption-based utilities like electricity, water, or gas that are measured by meters and vary monthly.</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
                        <strong className="text-red-700">ALLOCATED Method</strong><br/>
                        <p className="mt-1 text-stone-700">Use for shared expenses like Common Area Maintenance (CAM), trash collection, or security that are divided among tenants.</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
                        <strong className="text-red-700">Rate Per Unit</strong><br/>
                        <p className="mt-1 text-stone-700">Set the base rate that will be used in billing fee calculations. This serves as the default rate for this utility type.</p>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default UtilityTypeManagement;