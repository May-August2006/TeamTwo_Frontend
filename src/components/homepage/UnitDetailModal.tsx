/** @format */

// src/components/homepage/UnitDetailModal.tsx
import React, { useState } from "react";
import { Modal } from "../common/ui/Modal";
import type { Unit } from "../../types/unit";
import { Button } from "../common/ui/Button";
import { useAuth } from "../../context/AuthContext";
// NEW: Added imports for appointment controls
import { LoginPromptModal } from '../common/ui/LoginPromptModal';
import { ToastNotification } from '../common/ui/ToastNotification';
import { appointmentApi } from '../../api/appointmentApi';
import { userApi } from '../../api/UserAPI';
import { useTranslation } from 'react-i18next';

interface UnitDetailModalProps {
  unit: Unit;
  isOpen: boolean;
  onClose: () => void;
  onAppointment: (unit: Unit) => void;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  isOpen,
  onClose,
  onAppointment,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated, userId } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);

  // NEW: State for appointment controls
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "view" | "appointment";
    unit: Unit;
  } | null>(null);

  // NEW: Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "warning" | "error" | "info";
    message: string;
  }>({ show: false, type: "info", message: "" });

  // Simple "Coming Soon" placeholder image
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f1f5f9'/%3E%3Cstop offset='100%25' stop-color='%23e2e8f0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad)'/%3E%3Crect x='80' y='80' width='240' height='140' rx='8' fill='white' stroke='%23cbd5e1' stroke-width='1'/%3E%3Ctext x='200' y='150' font-family='Arial, sans-serif' font-size='20' text-anchor='middle' fill='%23474f7a' font-weight='bold'%3EComing Soon%3C/text%3E%3Ctext x='200' y='180' font-family='Arial, sans-serif' font-size='14' text-anchor='middle' fill='%236b7280'%3EImage Not Available%3C/text%3E%3C/svg%3E";

  const imageUrls = unit.imageUrls || [];
  // Use placeholder if no images, otherwise use selected image or placeholder as fallback
  const currentImage =
    imageUrls.length > 0
      ? imageUrls[selectedImage] || placeholderImage
      : placeholderImage;

  // NEW: Show toast function
  const showToast = (
    type: "success" | "warning" | "error" | "info",
    message: string
  ) => {
    setToast({ show: true, type, message });
  };

  // NEW: Close toast function
  const closeToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  // NEW: Check user eligibility function (same as AvailableUnitsSection)
  const checkUserEligibility = async (unitId: number, actionType: 'view' | 'appointment') => {
    if (!userId) return { canProceed: false, message: t('common.toast.loginFirst') };

    try {
      const userRes = await userApi.getById(userId);
      const user = userRes.data;

      console.log("user: ", user);

      const isApproved = user.approvalStatus === "APPROVED";
      const isTenant = user.roles?.some(
        (role: any) => role.name === "ROLE_TENANT"
      );

      if (actionType === "view") {
        if (!isApproved && !isTenant) {
          return { 
            canProceed: false, 
            message: t('common.toast.accountPending')
          };
        }
        return { canProceed: true, message: "" };
      }

      if (actionType === "appointment") {
        if (!isApproved && !isTenant) {
          return { 
            canProceed: false, 
            message: t('common.toast.accountPendingAppointment')
          };
        }

        try {
          const appointmentsRes = await appointmentApi.getByUser(userId);
          const userAppointments = appointmentsRes.data || [];

          const existingAppointment = userAppointments.find(
            (appt: any) => appt.roomId === unitId
          );

          if (existingAppointment) {
            const status = existingAppointment.status;
            
            if (status === 'SCHEDULED' || status === 'CONFIRMED') {
              return { 
                canProceed: false, 
                message: t('common.toast.existingAppointment', { status: status.toLowerCase() })
              };
            }

            if (status === "CANCELLED") {
              const cancelledDate = new Date(
                existingAppointment.updatedAt || existingAppointment.createdAt
              );
              const now = new Date();
              const daysDiff = Math.floor(
                (now.getTime() - cancelledDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              if (daysDiff < 3) {
                const daysLeft = 3 - daysDiff;
                return { 
                  canProceed: false, 
                  message: t('common.toast.cancelledWait', { days: daysLeft, s: daysLeft !== 1 ? 's' : '' })
                };
              }
            }
          }

          return { canProceed: true, message: "" };
        } catch (err) {
          console.error("Error checking appointments:", err);
          return { 
            canProceed: true, 
            message: t('common.toast.verifyError')
          };
        }
      }

      return { canProceed: false, message: "Invalid action type" };
    } catch (err) {
      console.error("Error checking user eligibility:", err);
      return { 
        canProceed: false, 
        message: t('common.toast.failedToVerify')
      };
    }
  };

  // NEW: Updated appointment handler with eligibility check
  const handleAppointment = async () => {
    console.log("📅 Opening appointment for unit:", unit.unitNumber);

    if (!isAuthenticated) {
      console.log("🔒 User not authenticated, showing login prompt");
      setPendingAction({ type: "appointment", unit });
      setIsLoginPromptOpen(true);
      return;
    }

    const eligibility = await checkUserEligibility(unit.id, "appointment");
    if (!eligibility.canProceed) {
      showToast("warning", eligibility.message);
      return;
    }

    if (eligibility.message && eligibility.canProceed) {
      showToast("info", eligibility.message);
    }

    onAppointment(unit);
    onClose();
  };

  // NEW: Login confirm handler
  const handleLoginConfirm = async () => {
    console.log("✅ Login confirmed");
    setIsLoginPromptOpen(false);

    if (pendingAction) {
      sessionStorage.setItem("pendingAction", JSON.stringify(pendingAction));
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      showToast('info', t('common.toast.redirecting'));
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
  };

  // NEW: Login cancel handler
  const handleLoginCancel = () => {
    console.log("❌ Login cancelled");
    setIsLoginPromptOpen(false);
    setPendingAction(null);
  };

  // ALL EXISTING CODE BELOW - UNCHANGED
  const nextImage = () => {
    if (imageUrls.length > 1) {
      setSelectedImage((prev) => (prev + 1) % imageUrls.length);
    }
  };

  const prevImage = () => {
    if (imageUrls.length > 1) {
      setSelectedImage(
        (prev) => (prev - 1 + imageUrls.length) % imageUrls.length
      );
    }
  };

  const getBusinessSuggestion = (space: number, unitType: string) => {
    if (space < 20) return "kiosks, small retail, or service businesses";
    if (space < 50) return "boutiques, small cafes, or specialty stores";
    if (space < 100) return "restaurants, medium retail, or showrooms";
    return "large retail stores, supermarkets, or entertainment venues";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${unit.unitNumber}`}
      size="lg"
    >
      {/* NEW: Toast Notification */}
      {toast.show && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={closeToast}
          duration={toast.type === "error" ? 7000 : 5000}
        />
      )}

      <div className="space-y-6">
        {/* Image Gallery - UNCHANGED */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={currentImage}
            alt={`${unit.unitNumber} - Image ${selectedImage + 1}`}
            className="w-full h-64 object-cover"
          />

          {/* Navigation Arrows - UNCHANGED */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Image Counter - UNCHANGED */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm">
              {selectedImage + 1} / {imageUrls.length}
            </div>
          )}
        </div>

        {/* Thumbnail Gallery - UNCHANGED */}
        {imageUrls.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                  index === selectedImage
                    ? "border-blue-500"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Unit Details - UNCHANGED */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-700">{t('homepage.unitDetail.space')}</span>
              <span className="ml-2 text-gray-600">{unit.unitSpace} {t('homepage.units.sqm')}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">{t('homepage.unitDetail.rentalFee')}</span>
              {isAuthenticated ? (
                <span className="ml-2 text-gray-600">
                  {unit.rentalFee?.toLocaleString() || "N/A"} MMK/month
                </span>
              ) : (
                <span className="ml-2 text-gray-500 italic">{t('homepage.unitDetail.loginToSeePrice')}</span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-700">{t('homepage.unitDetail.building')}</span>
              <span className="ml-2 text-gray-600">{unit.level?.building?.buildingName || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">{t('homepage.unitDetail.floor')}</span>
              <span className="ml-2 text-gray-600">{unit.level?.levelName || 'N/A'} ({t('homepage.unitDetail.level', { levelNumber: unit.level?.levelNumber || 'N/A' })})</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">{t('homepage.unitDetail.branch')}</span>
              <span className="ml-2 text-gray-600">
                {unit.level?.building?.branch?.branchName ||
                  unit.level?.building?.branchName ||
                  "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Utilities Section - UNCHANGED */}
        {unit.utilities && unit.utilities.filter(util => util.isActive).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">{t('homepage.unitDetail.availableUtilities')}</h4>
            <div className="grid grid-cols-2 gap-2">
              {unit.utilities
                .filter(utility => utility.isActive)
                .map((utility) => (
                  <div 
                    key={utility.id}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{utility.utilityName}</span>
                  </div>
                ))
              }
            </div>
          )}

        {/* Description - UNCHANGED */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">{t('homepage.unitDetail.description')}</h4>
          <p className="text-gray-600 text-sm">
            This {unit.unitSpace} sqm space is perfect for{" "}
            {getBusinessSuggestion(unit.unitSpace, unit.unitType)}. Located in{" "}
            {unit.level?.building?.buildingName || "the building"} on{" "}
            {unit.level?.levelName || "this floor"}, this space offers excellent
            visibility and accessibility for your business.
          </p>
        </div>

        {/* Action Buttons - ONLY CHANGED THE BUTTON HANDLER */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            {t('homepage.unitDetail.close')}
          </Button>
          <Button
            onClick={handleAppointment}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAuthenticated ? t('homepage.unitDetail.bookAppointment') : t('homepage.unitDetail.loginToBook')}
          </Button>
        </div>
      </div>

      {/* NEW: Login Prompt Modal */}
      {pendingAction && (
        <LoginPromptModal
          isOpen={isLoginPromptOpen}
          onClose={handleLoginCancel}
          onConfirm={handleLoginConfirm}
          title={
            pendingAction.type === "view"
              ? t('homepage.unitDetail.viewDetails')
              : t('homepage.unitDetail.bookAppointment')
          }
          message={
            pendingAction.type === "view"
              ? t('homepage.unitDetail.loginRequired')
              : t('homepage.unitDetail.appointmentRequired')
          }
          confirmText={t('homepage.unitDetail.loginNow')}
          cancelText={t('homepage.unitDetail.maybeLater')}
        />
      )}
    </Modal>
  );
};
