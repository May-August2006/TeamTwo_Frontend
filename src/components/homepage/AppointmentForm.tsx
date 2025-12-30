/** @format */

// src/components/homepage/AppointmentForm.tsx
import React, { useState, useEffect } from "react";
import { Modal } from "../common/ui/Modal";
import type { Unit } from "../../types/unit";
import { Button } from "../common/ui/Button";
import { useTranslation } from "react-i18next";

interface AppointmentFormProps {
  unit: Unit;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    roomId: number;
    appointmentDate: string;
    appointmentTime: string;
    purpose: string;
    notes: string;
    guestPhone: string;
  }) => void;
  isLoading?: boolean;
  isLoggedIn: boolean;
}

interface FormErrors {
  guestPhone?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  purpose?: string;
  notes?: string;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  unit,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  isLoggedIn,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    guestPhone: "",
    appointmentDate: "",
    appointmentTime: "",
    purpose: "",
    notes: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Reset form and errors when modal opens/closes
    if (!isOpen) {
      setFormData({
        guestPhone: "",
        appointmentDate: "",
        appointmentTime: "",
        purpose: "",
        notes: "",
      });
      setErrors({});
      setTouched({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Phone validation
    if (!formData.guestPhone.trim()) {
      newErrors.guestPhone = t('validation.phoneRequired');
    } else if (!/^\d+$/.test(formData.guestPhone)) {
      newErrors.guestPhone = t('validation.phoneNumbersOnly');
    } else if (formData.guestPhone.length < 6) {
      newErrors.guestPhone = t('validation.phoneMinLength', { min: 6 });
    } else if (formData.guestPhone.length > 11) {
      newErrors.guestPhone = t('validation.phoneMaxLength', { max: 11 });
    }
    
    // Date validation
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = t('validation.dateRequired');
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.appointmentDate = t('validation.dateNotPast');
      }
    }
    
    // Time validation
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = t('validation.timeRequired');
    } else {
      const [hours, minutes] = formData.appointmentTime.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      // Myanmar time: 9:00 AM to 4:59 PM (9:00 to 16:59)
      if (timeInMinutes < 9 * 60 || timeInMinutes >= 17 * 60) {
        newErrors.appointmentTime = t('validation.timeRange');
      }
    }
    
    // Purpose validation
    if (!formData.purpose.trim()) {
      newErrors.purpose = t('validation.purposeRequired');
    } else if (formData.purpose.length > 100) {
      newErrors.purpose = t('validation.purposeMaxLength', { max: 100 });
    }
    
    // Notes validation (optional but has max length)
    if (formData.notes.length > 500) {
      newErrors.notes = t('validation.notesMaxLength', { max: 500 });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      return;
    }
    
    if (validateForm()) {
      onSubmit({
        roomId: unit.id,
        ...formData,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // For phone input, only allow numbers and enforce max length
    if (name === 'guestPhone') {
      // Allow only numbers
      const numericValue = value.replace(/\D/g, '');
      // Enforce max length of 11
      const trimmedValue = numericValue.slice(0, 11);
      setFormData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }));
    } 
    // For notes, enforce max length of 500
    else if (name === 'notes') {
      const trimmedValue = value.slice(0, 500);
      setFormData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }));
    }
    // For purpose, enforce max length of 100
    else if (name === 'purpose') {
      const trimmedValue = value.slice(0, 100);
      setFormData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }));
    }
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    
    // Validate only this field
    const newErrors: FormErrors = { ...errors };
    
    if (name === 'guestPhone') {
      if (!formData.guestPhone.trim()) {
        newErrors.guestPhone = t('validation.phoneRequired');
      } else if (!/^\d+$/.test(formData.guestPhone)) {
        newErrors.guestPhone = t('validation.phoneNumbersOnly');
      } else if (formData.guestPhone.length < 6) {
        newErrors.guestPhone = t('validation.phoneMinLength', { min: 6 });
      } else {
        delete newErrors.guestPhone;
      }
    }
    
    if (name === 'appointmentDate') {
      if (!formData.appointmentDate) {
        newErrors.appointmentDate = t('validation.dateRequired');
      } else {
        const selectedDate = new Date(formData.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          newErrors.appointmentDate = t('validation.dateNotPast');
        } else {
          delete newErrors.appointmentDate;
        }
      }
    }
    
    if (name === 'appointmentTime') {
      if (!formData.appointmentTime) {
        newErrors.appointmentTime = t('validation.timeRequired');
      } else {
        const [hours, minutes] = formData.appointmentTime.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        
        if (timeInMinutes < 9 * 60 || timeInMinutes >= 17 * 60) {
          newErrors.appointmentTime = t('validation.timeRange');
        } else {
          delete newErrors.appointmentTime;
        }
      }
    }
    
    if (name === 'purpose') {
      if (!formData.purpose.trim()) {
        newErrors.purpose = t('validation.purposeRequired');
      } else if (formData.purpose.length > 100) {
        newErrors.purpose = t('validation.purposeMaxLength', { max: 100 });
      } else {
        delete newErrors.purpose;
      }
    }
    
    if (name === 'notes' && formData.notes.length > 500) {
      newErrors.notes = t('validation.notesMaxLength', { max: 500 });
    } else if (name === 'notes') {
      delete newErrors.notes;
    }
    
    setErrors(newErrors);
  };

  const today = new Date().toISOString().split("T")[0];
  
  // Format rental fee with thousand separator
  const formatRentalFee = (amount: number) => {
    return amount.toLocaleString();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('appointmentForm.title')} – ${unit.unitNumber}`}
      size="md"
    >
      {!isLoggedIn && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm">
            {t('appointmentForm.loginMessage')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Room Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            {t('appointmentForm.selectedSpace')}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">{t('appointmentForm.unit')}:</span>
              <span className="ml-2 font-medium">{unit.unitNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">{t('appointmentForm.space')}:</span>
              <span className="ml-2 font-medium">{unit.unitSpace} {t('appointmentForm.sqm')}</span>
            </div>
            <div>
              <span className="text-gray-600">{t('appointmentForm.type')}:</span>
              <span className="ml-2 font-medium">{unit.unitType}</span>
            </div>
            <div>
              <span className="text-gray-600">{t('appointmentForm.rent')}:</span>
              <span className="ml-2 font-medium">
               {formatRentalFee(unit.rentalFee)}  MMK /{t('appointmentForm.month')}
              </span>
            </div>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentForm.phoneNumber')} *
          </label>
          <input
            type="tel"
            name="guestPhone"
            value={formData.guestPhone}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder={t('appointmentForm.phonePlaceholder')}
            maxLength={11}
          />
          {errors.guestPhone && (
            <p className="mt-1 text-sm text-red-600">
              {errors.guestPhone}
            </p>
          )}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {t('validation.minLength', { min: 6 })}
            </span>
            <span className="text-xs text-gray-500">
              {formData.guestPhone.length}/11
            </span>
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointmentForm.preferredDate')} *
            </label>
            <input
              type="date"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleChange}
              onBlur={handleBlur}
              min={today}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.appointmentDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.appointmentDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointmentForm.preferredTime')} *
            </label>
            <input
              type="time"
              name="appointmentTime"
              value={formData.appointmentTime}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              min="09:00"
              max="16:59"
            />
            {errors.appointmentTime && (
              <p className="mt-1 text-sm text-red-600">
                {errors.appointmentTime}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('validation.timeRangeHint')}
            </p>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentForm.purpose')} *
          </label>
          <input
            type="text"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder={t('appointmentForm.purposePlaceholder')}
            maxLength={100}
          />
          {errors.purpose && (
            <p className="mt-1 text-sm text-red-600">
              {errors.purpose}
            </p>
          )}
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-500">
              {formData.purpose.length}/100
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentForm.additionalNotes')}
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder={t('appointmentForm.notesPlaceholder')}
            maxLength={500}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">
              {errors.notes}
            </p>
          )}
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-500">
              {formData.notes.length}/500
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" onClick={onClose} variant="secondary">
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!isLoggedIn || isLoading}
          >
            {isLoggedIn ? t('appointmentForm.bookAppointment') : t('appointmentForm.loginRequired')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};