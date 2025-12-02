/** @format */

// src/components/homepage/AppointmentForm.tsx
import React, { useState } from "react";
import { Modal } from "../common/ui/Modal";
import type { Unit } from "../../types/unit";
import { Button } from "../common/ui/Button";

interface AppointmentFormProps {
  room: Unit;
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

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  room,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  isLoggedIn,
}) => {
  const [formData, setFormData] = useState({
    guestPhone: "",
    appointmentDate: "",
    appointmentTime: "",
    purpose: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      roomId: room.id,
      ...formData,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Book Appointment – ${room.unitNumber}`}
      size="md"
    >
      {!isLoggedIn && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm">
            Please login to book an appointment.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Selected Space</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Room:</span>
              <span className="ml-2 font-medium">{room.unitNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">Space:</span>
              <span className="ml-2 font-medium">{room.unitSpace} sqm</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{room.unitType}</span>
            </div>
            <div>
              <span className="text-gray-600">Rent:</span>
              <span className="ml-2 font-medium">${room.rentalFee}/month</span>
            </div>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            name="guestPhone"
            value={formData.guestPhone}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter your phone number"
          />
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleChange}
              required
              min={today}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Time *
            </label>
            <input
              type="time"
              name="appointmentTime"
              value={formData.appointmentTime}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose of Appointment *
          </label>
          <input
            type="text"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Ex: Business inquiry, room viewing..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Any extra details..."
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!isLoggedIn || isLoading}
          >
            {isLoggedIn ? "Book Appointment" : "Login Required"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
