// context/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification, type NotificationType } from '../components/common/ui/Notification';

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((
    type: NotificationType,
    message: string,
    title?: string,
    duration = 5000
  ) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message, title, duration }]);
  }, []);

  const showSuccess = useCallback((message: string, title = 'Success') => {
    showNotification('success', message, title);
  }, [showNotification]);

  const showError = useCallback((message: string, title = 'Error') => {
    showNotification('error', message, title);
  }, [showNotification]);

  const showInfo = useCallback((message: string, title = 'Info') => {
    showNotification('info', message, title);
  }, [showNotification]);

  const showWarning = useCallback((message: string, title = 'Warning') => {
    showNotification('warning', message, title);
  }, [showNotification]);

  return (
    <NotificationContext.Provider 
      value={{ showNotification, showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            title={notification.title}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};