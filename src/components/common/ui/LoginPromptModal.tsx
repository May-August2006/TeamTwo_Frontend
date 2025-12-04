// src/components/common/ui/LoginPromptModal.tsx
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Login Now',
  cancelText = 'Cancel'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};