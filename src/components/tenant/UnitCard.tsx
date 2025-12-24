/** @format */

import React from "react";
import { MapPin, Ruler, Tag } from "lucide-react";
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
  /* ---------- Safe Derived Values ---------- */
  const primaryImage =
    unit.imageUrls?.[0] ||
    "https://via.placeholder.com/400x300?text=Retail+Space";

  const unitNumber = unit.unitNumber || "N/A";
  const unitSpace = unit.unitSpace || 0;
  const unitTypeName = unit.roomType?.typeName || "Retail Space";
  const buildingName = unit.level?.building?.buildingName || "Shopping Mall";
  const levelName = unit.level?.levelName || "Ground Floor";

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src =
      "https://via.placeholder.com/400x300?text=Retail+Space";
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="h-44 bg-stone-100 rounded-t-xl overflow-hidden">
        <img
          src={primaryImage}
          alt={`Unit ${unitNumber}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onViewDetails(unit)}
          onError={handleImageError}
        />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-stone-900">
            Unit {unitNumber}
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-semibold">
            Available
          </span>
        </div>

        <div className="space-y-2 text-sm text-stone-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="truncate">
              {buildingName} – {levelName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-red-500" />
            <span>{unitSpace} sq.ft</span>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-red-500" />
            <span>{unitTypeName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => onViewDetails(unit)}
          >
            View Details
          </Button>

          <Button
            size="sm"
            variant="primary"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => onAppointment(unit)}
          >
            Book Visit
          </Button>
        </div>
      </div>
    </div>
  );
};
