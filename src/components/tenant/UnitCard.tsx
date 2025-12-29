/** @format */

import React from "react";
import { MapPin, Ruler, Tag } from "lucide-react";
import type { Unit } from "../../types/unit";
import { Button } from "../common/ui/Button";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
  /* ---------- Safe Derived Values ---------- */
  const primaryImage =
    unit.imageUrls?.[0] ||
    "https://via.placeholder.com/400x300?text=Retail+Space";

  const unitNumber = unit.unitNumber || "N/A";
  const unitSpace = unit.unitSpace || 0;
  const unitTypeName = unit.roomType?.typeName || "Retail Space";
  const buildingName = unit.level?.building?.buildingName || "Shopping Mall";
  const levelName = unit.level?.levelName || "Ground Floor";
  const branchName = unit.level?.building?.branch?.branchName || "";

  const getBusinessSuggestion = (space: number) => {
    if (space < 20) return t('homepage.units.perfectFor') + " kiosks, small retail, or service businesses";
    if (space < 50) return t('homepage.units.perfectFor') + " boutiques, small cafes, or specialty stores";
    if (space < 100) return t('homepage.units.perfectFor') + " restaurants, medium retail, or showrooms";
    return t('homepage.units.perfectFor') + " large retail stores, supermarkets, or entertainment venues";
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src =
      "https://via.placeholder.com/400x300?text=Retail+Space";
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="h-44 bg-stone-100 rounded-t-xl overflow-hidden relative">
        <img
          src={primaryImage}
          alt={`Unit ${unitNumber}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onViewDetails(unit)}
          onError={handleImageError}
        />
        <div className="absolute top-3 right-3">
          <span className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white px-2 py-1 rounded-full text-xs font-semibold">
            {t('homepage.units.available')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-stone-900">
            Unit {unitNumber}
          </h3>
        </div>

        {/* Location with branch */}
        <div className="flex items-center text-stone-500 text-xs mb-3">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="truncate">
            {branchName ? `${branchName} • ` : ""}{buildingName} • {levelName}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-stone-500 text-sm">
            {getBusinessSuggestion(unitSpace)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-stone-50 rounded">
            <div className="text-xs text-stone-500">{t('homepage.units.space')}</div>
            <div className="font-bold text-[#1E40AF]">{unitSpace} {t('homepage.units.sqm')}</div>
          </div>
          <div className="text-center p-2 bg-stone-50 rounded">
            <div className="text-xs text-stone-500">{t('homepage.units.type')}</div>
            <div className="font-bold text-[#1E40AF]">{unitTypeName}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white"
            onClick={() => onViewDetails(unit)}
          >
            {t('homepage.units.viewDetails')}
          </Button>

          <Button
            size="sm"
            variant="primary"
            className="flex-1 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white"
            onClick={() => onAppointment(unit)}
          >
            {t('homepage.units.bookNow')}
          </Button>
        </div>
      </div>
    </div>
  );
};