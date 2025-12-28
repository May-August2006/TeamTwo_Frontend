/** @format */

import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  LogOut,
  Bell,
  Receipt,
  Wrench,
  AlertCircle,
  File,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../common/ui/LanguageSwitcher";
import Logo from "../../assets/SeinGayHarLogo.png";
import ChangePasswordButton from "../ChangePasswordButton";
import { useTenantRemindersWebSocket } from "../../hooks/useTenantRemindersWebSocket";
import { tenantReminderApi } from "../../api/tenantReminderApi";

interface TenantHeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
  pageTitle?: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({
  onMenuToggle,
  onLogout,
}) => {
  const { t } = useTranslation();
  const jwtToken = localStorage.getItem("accessToken") || "";
  const { reminders, setReminders, unreadCount } =
    useTenantRemindersWebSocket(jwtToken);

  const [open, setOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchReminders = async () => {
    try {
      const res = await tenantReminderApi.getAll();
      setReminders(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, []);

  const markRead = async (id: number) => {
    await tenantReminderApi.markAsRead(id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isRead: true } : r))
    );
  };

  const hideReminder = (id: number) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, hidden: true } : r))
    );
  };

  const restoreReminder = (id: number) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, hidden: false } : r))
    );
  };

  const visibleReminders = reminders.filter((r) => !r.hidden || showHidden);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-stone-200">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <img src={Logo} alt="Sein Gay Har Logo" className="h-16 w-auto" />
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />

          {/* Notifications */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150 relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl border border-stone-200 rounded-xl z-50">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-2 border-b">
                  <span className="font-semibold text-stone-800">
                    Notifications
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs text-stone-500 hover:underline"
                      onClick={() => setShowHidden((prev) => !prev)}
                    >
                      {showHidden ? "Hide hidden" : "Show hidden"}
                    </button>
                  </div>
                </div>

                {/* Reminders */}
                <div className="max-h-80 overflow-y-auto">
                  {visibleReminders.length === 0 && (
                    <div className="px-4 py-6 text-center text-stone-500">
                      🎉 You have no notifications yet
                    </div>
                  )}

                  {visibleReminders.map((r) => {
                    // Map reminder type to display title, icon, and icon color
                    let headerText = "";
                    let IconComponent = Receipt; // default icon
                    let iconColor = "text-red-500";

                    switch (r.type) {
                      case "PAYMENT":
                        headerText = "Payment Reminder";
                        IconComponent = Receipt;
                        iconColor = "text-red-500";
                        break;
                      case "MAINTENANCE":
                        headerText = "Maintenance Reminder";
                        IconComponent = Wrench;
                        iconColor = "text-blue-500";
                        break;
                      case "NOTICE":
                        headerText = "Notice";
                        IconComponent = AlertCircle;
                        iconColor = "text-yellow-500";
                        break;
                      case "INVOICE_CREATION":
                        headerText = "New Invoice";
                        IconComponent = File;
                        iconColor = "text-green-500";
                        break;
                      case "RENEWAL_NOTICE":
                        headerText = "Contract RENEWAL NOTICE";
                        IconComponent = File;
                        iconColor = "text-green-500";
                        break;
                      default:
                        headerText = "Reminder";
                        IconComponent = Receipt;
                        iconColor = "text-stone-500";
                    }

                    return (
                      <div
                        key={r.id}
                        className={`px-4 py-3 border-b hover:bg-stone-50 ${
                          !r.isRead ? "bg-red-50/40" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <IconComponent
                            className={`w-5 h-5 mt-0.5 ${iconColor}`}
                          />
                          <div>
                            <p className="text-sm font-semibold text-stone-800">
                              {headerText}
                            </p>

                            {/* Show invoice info only for PAYMENT or INVOICE_CREATION */}
                            {(r.type === "PAYMENT" ||
                              r.type === "INVOICE_CREATION") && (
                              <p className="text-xs text-stone-600 mt-1">
                                Invoice {r.invoiceNumber} — {r.amount} MMK due
                                on {r.dueDate}
                              </p>
                            )}

                            <p className="text-xs text-stone-500 mt-1">
                              {r.message}
                            </p>

                            <div className="mt-2 flex gap-3">
                              {!r.isRead && (
                                <button
                                  onClick={() => markRead(r.id)}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition"
                                >
                                  <Check className="w-3 h-3" />
                                  Mark as read
                                </button>
                              )}

                              {r.hidden ? (
                                <button
                                  className="text-xs text-green-600 hover:underline"
                                  onClick={() => restoreReminder(r.id)}
                                >
                                  Restore
                                </button>
                              ) : r.isRead ? (
                                <button
                                  className="text-xs text-stone-500 hover:underline"
                                  onClick={() => hideReminder(r.id)}
                                >
                                  Hide
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150 border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">{t("header.logout")}</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <ChangePasswordButton
            buttonStyle="primary"
            buttonSize="md"
            buttonText="Change Password"
          />
        </div>
      </div>
    </header>
  );
};

export default TenantHeader;
