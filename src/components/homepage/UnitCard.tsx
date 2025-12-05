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
  const primaryImage =
    unit.imageUrls?.[0] ||
    "https://via.placeholder.com/400x300?text=Retail+Space";
  const unitNumber = unit.unitNumber || "N/A";
  const unitSpace = unit.unitSpace || 0;
  const unitTypeName = unit.roomType?.typeName || "Retail Space";
  const buildingName = unit.level?.building?.buildingName || "Shopping Mall";
  const levelName = unit.level?.levelName || "Ground Floor";

  const getBusinessSuggestion = (space: number) => {
    if (space < 20) return "kiosks, small retail, or service businesses";
    if (space < 50) return "boutiques, small cafes, or specialty stores";
    if (space < 100) return "restaurants, medium retail, or showrooms";
    return "large retail stores, supermarkets, or entertainment venues";
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src =
      "https://via.placeholder.com/400x300?text=Retail+Space";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#0D1B2A]/10 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-[#0D1B2A]/20">
      <div className="relative">
        <img
          src={primaryImage}
          alt={`Unit ${unitNumber}`}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => onViewDetails(unit)}
          onError={handleImageError}
        />
        <div className="absolute top-4 right-4">
          <span className="bg-[#D32F2F] text-white px-3 py-1 rounded-full text-xs font-medium">
            Available
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-[#0D1B2A] mb-3">
          {unitNumber}
        </h3>
        <div className="flex items-center text-[#0D1B2A] opacity-80 mb-3">
          <span className="text-sm truncate">
            {buildingName} - {levelName}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-[#0D1B2A] opacity-80">
            <span>{unitSpace} sqm</span>
          </div>
          <div className="flex items-center text-[#0D1B2A] opacity-80">
            <span>{unitTypeName}</span>
          </div>
        </div>

        <p className="text-[#0D1B2A] opacity-80 text-sm mb-4 line-clamp-2">
          Perfect for {getBusinessSuggestion(unitSpace)}
        </p>

        <div className="flex space-x-3">
          <Button
            onClick={() => onViewDetails(unit)}
            variant="secondary"
            className="flex-1 border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
          >
            View Details
          </Button>
          <Button
            onClick={() => onAppointment(unit)}
            className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};
