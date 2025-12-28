/** @format */

// frontend/src/components/ChangePasswordButton.tsx
import React, { useState } from "react";
import ChangePasswordForm from "./ChangePasswordForm";

interface ChangePasswordButtonProps {
  buttonText?: string;
  buttonStyle?: "primary" | "secondary" | "outline" | "ghost";
  buttonSize?: "sm" | "md" | "lg";
  className?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onCloseDropdown?: () => void;
}

const ChangePasswordButton: React.FC<ChangePasswordButtonProps> = ({
  buttonText = "Change Password",
  buttonStyle = "primary",
  buttonSize = "md",
  className = "",
  modalTitle = "Change Password",
  modalSubtitle = "Update your account password (6-20 characters)",
  onSuccess,
  onError,
  onCloseDropdown,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Define button styles based on buttonStyle prop
  const getButtonStyle = () => {
    const baseStyle = "rounded-md font-medium transition-all duration-200";

    const styles = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      secondary:
        "bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
      outline:
        "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      ghost:
        "bg-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    };

    return `${baseStyle} ${styles[buttonStyle]} ${sizes[buttonSize]} ${className}`;
  };

  const handleSuccess = (message: string) => {
    if (onSuccess) {
      onSuccess(message);
    }
    // Auto-close after success
    setTimeout(() => {
      setIsModalOpen(false);
    }, 2000);

    onCloseDropdown?.();
  };

  return (
    <>
      {/* Button */}
      <button onClick={() => setIsModalOpen(true)} className={getButtonStyle()}>
        {buttonText}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <ChangePasswordForm
                title={modalTitle}
                subtitle={modalSubtitle}
                onSuccess={handleSuccess}
                onError={onError}
                onClose={() => setIsModalOpen(false)}
                showCloseButton={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChangePasswordButton;
