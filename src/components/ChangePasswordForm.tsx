// frontend/src/components/ChangePasswordForm.tsx
import React, { useState } from 'react';
import API from '../api/api'; // Use your existing API instance
import { getAccessToken } from '../Auth'; // Import from your Auth file
import { useNavigate } from 'react-router-dom';

interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface ChangePasswordFormProps {
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
    onClose?: () => void;
    showCloseButton?: boolean;
    title?: string;
    subtitle?: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
    onSuccess,
    onError,
    onClose,
    showCloseButton = true,
    title = "Change Password",
    subtitle = "Update your account password"
}) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<PasswordChangeData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState<string>('');
    const [passwordStrength, setPasswordStrength] = useState<string>('');
    
    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (value.length > 20) return;
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        if (success) setSuccess('');
        
        if (name === 'newPassword') {
            calculatePasswordStrength(value);
        }
        
        if (name === 'confirmPassword') {
            if (value && value !== formData.newPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            } else if (errors.confirmPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
            }
        }
    };
    
    // Calculate password strength
    const calculatePasswordStrength = (password: string) => {
        if (!password) {
            setPasswordStrength('');
            return;
        }
        
        const hasLength = password.length >= 6 && password.length <= 20;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[@#$%^&+=]/.test(password);
        const noSpace = !/\s/.test(password);
        
        const requirementsMet = [hasLength, hasLower, hasUpper, hasNumber, hasSpecial, noSpace].filter(Boolean).length;
        
        if (requirementsMet === 6) {
            setPasswordStrength('Strong ✓');
        } else if (requirementsMet >= 4) {
            setPasswordStrength('Good');
        } else if (requirementsMet >= 2) {
            setPasswordStrength('Weak');
        } else {
            setPasswordStrength('Very Weak');
        }
    };
    
    // Check password against backend regex
    const isValidPassword = (password: string): boolean => {
        const backendRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{6,20}$/;
        return backendRegex.test(password);
    };
    
    // Toggle password visibility
    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };
    
    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.currentPassword.trim()) {
            newErrors.currentPassword = 'Current password is required';
        }
        
        if (!formData.newPassword.trim()) {
            newErrors.newPassword = 'New password is required';
        } else if (!isValidPassword(formData.newPassword)) {
            newErrors.newPassword = 'Password must contain uppercase, lowercase, number, and special character (@#$%^&+=)';
        }
        
        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (formData.currentPassword && formData.newPassword && 
            formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Clear all auth data
    const clearAuthData = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('roles');
        localStorage.removeItem('token'); // Clear old token key too
        sessionStorage.clear();
    };
    
    // Handle form submission - USING API INSTANCE
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setErrors({});
        setSuccess('');
        
        try {
            // First, check if user is authenticated
            const token = getAccessToken();
            if (!token) {
                throw new Error('Please login to change your password');
            }
            
            console.log('🔐 User is authenticated, making password change request...');
            
            // Use API instance which automatically handles token refresh
            const response = await API.post(
                '/api/users/change-password',
                formData
            );
            
            console.log('✅ Password change response:', response.data);
            
            // Handle success - backend returns {success: true, message: "..."}
            if (response.data.success || response.data.message) {
                const successMessage = response.data.message || 'Password changed successfully!';
                setSuccess(successMessage);
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordStrength('');
                
                if (onSuccess) onSuccess(successMessage);
                
                if (onClose) {
                    setTimeout(() => onClose(), 2000);
                }
            } else {
                const errorMessage = response.data.error || 'Failed to change password';
                setErrors({ general: errorMessage });
                if (onError) onError(errorMessage);
            }
            
        } catch (err: any) {
            console.error('❌ Password change error:', err);
            
            let errorMessage = 'Failed to change password';
            
            if (err.response) {
                const status = err.response.status;
                const data = err.response.data;
                
                if (status === 401) {
                    errorMessage = 'Session expired. Please login again.';
                    clearAuthData();
                    
                    // Redirect to login
                    setTimeout(() => navigate('/login'), 1500);
                } else if (status === 400) {
                    // Handle validation errors from backend
                    if (data.error) {
                        errorMessage = data.error;
                    } else if (data.errors) {
                        // Extract first validation error
                        const firstError = Object.values(data.errors)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
                    } else if (data.message) {
                        errorMessage = data.message;
                    }
                } else if (status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
            } else if (err.request) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setErrors({ general: errorMessage });
            if (onError) onError(errorMessage);
            
        } finally {
            setLoading(false);
        }
    };
    
    // Get password strength color
    const getStrengthColor = () => {
        if (passwordStrength.includes('Strong')) return 'text-green-600';
        if (passwordStrength.includes('Good')) return 'text-blue-600';
        if (passwordStrength.includes('Weak')) return 'text-yellow-600';
        if (passwordStrength.includes('Very Weak')) return 'text-red-600';
        return 'text-gray-600';
    };
    
    return (
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
            </div>
            
            {/* Success Message */}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{success}</span>
                    </div>
                </div>
            )}
            
            {/* General Error */}
            {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{errors.general}</span>
                    </div>
                </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.current ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            disabled={loading}
                            maxLength={20}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                            } ${loading ? 'bg-gray-50' : ''}`}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                        >
                            {showPasswords.current ? (
                                <span className="text-xs">Hide</span>
                            ) : (
                                <span className="text-xs">Show</span>
                            )}
                        </button>
                    </div>
                    {errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                    )}
                </div>
                
                {/* New Password */}
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.new ? "text" : "password"}
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            disabled={loading}
                            maxLength={20}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.newPassword ? 'border-red-300' : 'border-gray-300'
                            } ${loading ? 'bg-gray-50' : ''}`}
                            placeholder="6-20 characters"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                        >
                            {showPasswords.new ? (
                                <span className="text-xs">Hide</span>
                            ) : (
                                <span className="text-xs">Show</span>
                            )}
                        </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                        {/* Password Strength */}
                        {formData.newPassword && passwordStrength && (
                            <span className={`text-sm font-medium ${getStrengthColor()}`}>
                                Strength: {passwordStrength}
                            </span>
                        )}
                        
                        {/* Character counter */}
                        {formData.newPassword && (
                            <span className="text-xs text-gray-500">
                                {formData.newPassword.length}/20
                            </span>
                        )}
                    </div>
                    
                    {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                    )}
                </div>
                
                {/* Password Requirements Hint */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                    <p className="font-medium">Password must contain:</p>
                    <p className="mt-1">• 6-20 characters • Uppercase letter • Lowercase letter • Number • Special character (@#$%^&+=) • No spaces</p>
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.confirm ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={loading}
                            maxLength={20}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                            } ${loading ? 'bg-gray-50' : ''}`}
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                        >
                            {showPasswords.confirm ? (
                                <span className="text-xs">Hide</span>
                            ) : (
                                <span className="text-xs">Show</span>
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                </div>
                
                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Changing Password...
                            </>
                        ) : 'Change Password'}
                    </button>
                </div>
                
                {/* Info Note */}
                <div className="pt-2">
                    <p className="text-xs text-gray-500 text-center">
                        You will remain logged in after changing your password.
                    </p>
                </div>
            </form>
            
            {/* Close button */}
            {showCloseButton && onClose && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChangePasswordForm;