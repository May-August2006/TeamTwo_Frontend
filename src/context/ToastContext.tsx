/** @format */

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import ReactDOM from "react-dom";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <>
      {children}
      {ReactDOM.createPortal(
        <div className="fixed top-4 right-4 flex flex-col gap-2 z-[9999]">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-2 rounded shadow-lg text-white animate-fade-in ${
                t.type === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
