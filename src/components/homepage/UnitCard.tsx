/** @format */

import React from "react";
import type { Unit } from "../../types/unit";
import { Button } from "../common/ui/Button";

interface UnitCardProps {
  unit: Unit;
  onViewDetails: (unit: Unit) => void;
  onAppointment: (unit: Unit) => void | Promise<void>;
}

export const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  onViewDetails,
  onAppointment,
}) => {
  // Replace the broken placeholder URL with this self-contained SVG
 const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f1f5f9'/%3E%3Cstop offset='100%25' stop-color='%23e2e8f0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad)'/%3E%3Crect x='80' y='80' width='240' height='140' rx='8' fill='white' stroke='%23cbd5e1' stroke-width='1'/%3E%3Ctext x='200' y='150' font-family='Arial, sans-serif' font-size='20' text-anchor='middle' fill='%23474f7a' font-weight='bold'%3EComing Soon%3C/text%3E%3Ctext x='200' y='180' font-family='Arial, sans-serif' font-size='14' text-anchor='middle' fill='%236b7280'%3EImage Not Available%3C/text%3E%3C/svg%3E";
  const primaryImage =
    unit.imageUrls?.[0] || placeholderImage; // Use the new placeholder
  const unitNumber = unit.unitNumber || "N/A";
  const unitSpace = unit.unitSpace || 0;
  const unitTypeName = unit.roomType?.typeName || "Retail Space";
  const buildingName = unit.level?.building?.buildingName || "Shopping Mall";
  const levelName = unit.level?.levelName || "Ground Floor";
  const branchName = unit.level?.building?.branch?.branchName || ""; // Get branch name

  const getBusinessSuggestion = (space: number) => {
    if (space < 20) return "kiosks, small retail, or service businesses";
    if (space < 50) return "boutiques, small cafes, or specialty stores";
    if (space < 100) return "restaurants, medium retail, or showrooms";
    return "large retail stores, supermarkets, or entertainment venues";
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = placeholderImage; // Also update the error handler
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#1E40AF] transition-all duration-300">
      <div className="relative">
        <img
          src={primaryImage}
          alt={`Unit ${unitNumber}`}
          className="w-full h-48 object-cover"
          onClick={() => onViewDetails(unit)}
          onError={handleImageError}
        />
        <div className="absolute top-3 right-3">
          <span className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white px-2 py-1 rounded-full text-xs font-semibold">
            Available
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center text-gray-500 text-xs mb-3">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>
            {branchName ? `${branchName} • ` : ""}{buildingName} • {levelName}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{unitNumber}</h3>
          <p className="text-gray-500 text-sm mb-3">
            Perfect for {getBusinessSuggestion(unitSpace)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Space</div>
            <div className="font-bold text-[#1E40AF]">{unitSpace} sqm</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Type</div>
            <div className="font-bold text-[#1E40AF]">{unitTypeName}</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => onViewDetails(unit)}
            variant="secondary"
            className="flex-1 border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white text-sm"
          >
            View Details
          </Button>
          <Button
            onClick={() => onAppointment(unit)}
            className="flex-1 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white text-sm"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};