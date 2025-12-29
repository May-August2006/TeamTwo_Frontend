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
  ChevronDown,
  User,
  Settings,
  Key,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../common/ui/LanguageSwitcher";
import Logo from "../../assets/SeinGayHarLogo.png";
import { useTenantRemindersWebSocket } from "../../hooks/useTenantRemindersWebSocket";
import { tenantReminderApi } from "../../api/tenantReminderApi";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import type { AxiosError } from "axios";

// Import ChangePasswordForm
import ChangePasswordForm from "../ChangePasswordForm"; // Adjust path as needed

interface TenantHeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
  pageTitle?: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({
  onMenuToggle,
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { username, roles } = useAuth();
  const { t } = useTranslation();
  const jwtToken = localStorage.getItem("accessToken") || "";
  const { reminders, setReminders, unreadCount } =
    useTenantRemindersWebSocket(jwtToken);

  const [open, setOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchReminders = async () => {
    try {
      const res = await tenantReminderApi.getAll();
      setReminders(res.data);
    } catch (error) {
      const err = error as AxiosError<any>;
      console.error(err);

      const message =
        err.response?.data?.message ??
        "Failed to load reminders. Please try again.";

      toast.error(message);
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

  const handleLogout = () => {
    onLogout();
    setUserMenuOpen(false);
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    console.log("Navigate to profile");
  };

  const handleSettings = () => {
    setUserMenuOpen(false);
    console.log("Navigate to settings");
  };

  const handleChangePassword = () => {
    setUserMenuOpen(false);
    setShowChangePassword(true);
  };

  const handlePasswordChangeSuccess = (message: string) => {
    console.log("Password changed successfully:", message);
    setShowChangePassword(false);
  };

  const handlePasswordChangeError = (error: string) => {
    console.error("Password change error:", error);
  };

  const handleClosePasswordForm = () => {
    setShowChangePassword(false);
  };

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
    <>
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

            {/* Username Display */}
            <div className="hidden md:flex items-center space-x-1">
              <div className="text-right">
                <p className="text-sm font-medium text-stone-800 truncate max-w-[150px]">
                  {username || t("common.manager", "Manager")}
                </p>
                <p className="text-xs text-stone-500 truncate max-w-[150px]">
                  {roles[0] || t("common.manager", "Manager")}
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-100 transition-colors duration-150 group"
                aria-label="User menu"
              >
                {/* Mobile username badge */}
                <div className="md:hidden flex flex-col items-end">
                  <span className="text-xs font-medium text-stone-700">
                    {username?.split(" ")[0] || t("common.manager", "Manager")}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {t("common.manager", "Manager")}
                  </span>
                </div>

                {/* User Avatar/Icon */}
                <div className="relative">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold text-sm">
                    {username?.charAt(0).toUpperCase() || "M"}
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-stone-500 absolute -bottom-1 -right-1 transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-fadeIn">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-stone-100 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold">
                        {username?.charAt(0).toUpperCase() || "M"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {username || t("common.managerUser", "Manager User")}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          {roles[0] || t("common.manager", "Manager")}
                        </p>
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          Sein Gay Har
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={handleProfile}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors duration-150 group"
                    >
                      <User className="w-4 h-4 mr-3 text-stone-400 group-hover:text-blue-600" />
                      <span>{t("common.myProfile", "My Profile")}</span>
                    </button>

                    <button
                      onClick={handleSettings}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors duration-150 group"
                    >
                      <Settings className="w-4 h-4 mr-3 text-stone-400 group-hover:text-blue-600" />
                      <span>{t("common.settings", "Settings")}</span>
                    </button>

                    {/* Change Password Button */}
                    <button
                      onClick={handleChangePassword}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors duration-150 group"
                    >
                      <Key className="w-4 h-4 mr-3 text-stone-400 group-hover:text-blue-600" />
                      <span>{t("common.changePassword", "Change Password")}</span>
                    </button>

                    <div className="h-px bg-stone-100 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 group"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span>{t("common.logout", "Logout")}</span>
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-stone-100 bg-stone-50">
                    <p className="text-xs text-stone-500">
                      Version 1.0.0 • © 2024
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {userMenuOpen && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setUserMenuOpen(false)}
          />
        )}
      </header>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative">
            <button
              onClick={handleClosePasswordForm}
              className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ChangePasswordForm
              onSuccess={handlePasswordChangeSuccess}
              onError={handlePasswordChangeError}
              onClose={handleClosePasswordForm}
              showCloseButton={false}
              title={t("changePassword.title", "Change Password")}
              subtitle={t("changePassword.subtitle", "Update your account password")}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TenantHeader;