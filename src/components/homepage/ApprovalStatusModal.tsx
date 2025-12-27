/** @format */

import React from "react";
import {
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  LogOut,
} from "lucide-react";
import { Button } from "../common/ui/Button";

interface ApprovalStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: "viewDashboard" | "contactSupport" | "logout") => void;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  userName: string;
}

export const ApprovalStatusModal: React.FC<ApprovalStatusModalProps> = ({
  isOpen,
  onClose,
  onAction,
  approvalStatus,
  userName,
}) => {
  if (!isOpen) return null;

  const getStatusConfig = () => {
    switch (approvalStatus) {
      case "PENDING":
        return {
          icon: <Clock className="w-12 h-12 text-amber-500" />,
          title: "Account Pending Approval",
          description: `Thank you for registering, ${
            userName || "User"
          }! Your account is currently under review by our administration team.`,
          instructions:
            "You'll be able to access all features once your account is approved. This usually takes 1-2 business days.",
          primaryAction: "viewDashboard",
          secondaryAction: "contactSupport",
          primaryButtonText: "Go to Dashboard",
          secondaryButtonText: "Contact Support",
          color: "border-amber-200 bg-amber-50",
        };
      case "REJECTED":
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          title: "Account Not Approved",
          description:
            "Your account registration was not approved at this time.",
          instructions:
            "If you believe this is an error or would like more information, please contact our support team.",
          primaryAction: "contactSupport",
          secondaryAction: "logout",
          primaryButtonText: "Contact Support",
          secondaryButtonText: "Logout",
          color: "border-red-200 bg-red-50",
        };
      default:
        return {
          icon: <Clock className="w-12 h-12 text-amber-500" />,
          title: "Account Status Check",
          description:
            "We need to verify your account status before proceeding.",
          instructions:
            "Please check your account status or contact support for assistance.",
          primaryAction: "viewDashboard",
          secondaryAction: "contactSupport",
          primaryButtonText: "Check Status",
          secondaryButtonText: "Contact Support",
          color: "border-amber-200 bg-amber-50",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-xl max-w-md w-full border ${config.color}`}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">{config.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {config.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Account Verification Required
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-3">{config.description}</p>
            <p className="text-sm text-gray-600">{config.instructions}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Account Status
                </p>
                <p className="text-xs text-gray-500">
                  {approvalStatus === "PENDING" &&
                    "Pending administrative review"}
                  {approvalStatus === "REJECTED" && "Registration not approved"}
                </p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">Next Steps</p>
                <p className="text-xs text-gray-500">
                  {approvalStatus === "PENDING" &&
                    "You'll receive an email notification once approved"}
                  {approvalStatus === "REJECTED" &&
                    "Contact support for clarification"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => onAction(config.primaryAction as any)}
              variant="primary"
              className="flex-1"
            >
              {config.primaryButtonText}
            </Button>

            <Button
              onClick={() => onAction(config.secondaryAction as any)}
              variant="primary"
              className="flex-1"
            >
              {config.secondaryButtonText}
            </Button>
          </div>

          {approvalStatus === "PENDING" && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              You can still browse available spaces, but detailed pricing
              requires approval.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
