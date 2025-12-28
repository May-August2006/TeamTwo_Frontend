/** @format */

import React, { useState, useEffect } from "react";
import {
  FileText,
  CreditCard,
  Calendar,
  Wrench,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { tenantApi } from "../../api/TenantAPI"; // your API module
import { jwtDecode } from "jwt-decode";

const TenantHome: React.FC = () => {
  const { t } = useTranslation();

  const [leaseInfo, setLeaseInfo] = useState<any>(null);
  const [quickStats, setQuickStats] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingDates, setUpcomingDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const jwtToken = localStorage.getItem("accessToken") || "";

  let tenantId: number | null = null;

  console.log(jwtDecode(localStorage.getItem("accessToken")!));

  try {
    const decoded: any = jwtDecode(jwtToken);
    tenantId = decoded.tenantId; // MUST exist in JWT
  } catch (_) {}

  useEffect(() => {
    if (!tenantId) return;

    const loadTenantData = async () => {
      try {
        setLoading(true);
        const res = await tenantApi.getTenantHome(tenantId); // backend endpoint
        const data = res.data;

        setLeaseInfo(data.leaseInfo);
        setQuickStats(data.quickStats);
        setRecentActivity(data.recentActivity);
        setUpcomingDates(data.upcomingDates);
      } catch (err) {
        console.error("Failed to load tenant home data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <span className="text-stone-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {t("tenant.welcome")}, {leaseInfo?.tenantName || "Tenant"}!
        </h2>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 hover:shadow-xl transition duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-stone-600">
                  {t(`tenant.${stat.title}`)}
                </p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-500">{stat.status}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Lease Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2">
              {t("tenant.currentLeaseInformation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaseInfo &&
                Object.entries(leaseInfo).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-stone-600">
                      {t(`tenant.${key}`)}
                    </p>
                    <p className="font-semibold text-stone-900">
                      {" "}
                      {String(value)}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2">
              {t("tenant.recentActivity")}
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.contractNumber} // or another unique field
                  className="flex items-start space-x-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition duration-150"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "payment"
                        ? "bg-green-100 text-green-600"
                        : activity.type === "invoice"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {activity.type === "payment" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : activity.type === "invoice" ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-900">
                      {/* Use contractNumber and status for now */}
                      {activity.contractNumber} ({activity.status})
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-stone-500">
                        {activity.updatedAt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Dates */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2">
              {t("tenant.upcomingDates")}
            </h3>
            <div className="space-y-3">
              {upcomingDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    date.important
                      ? "bg-red-50 border border-red-200"
                      : "bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        date.important ? "text-red-900" : "text-stone-900"
                      }`}
                    >
                      {date.event}
                    </span>
                    <Calendar
                      className={`w-4 h-4 ${
                        date.important ? "text-red-600" : "text-stone-600"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-sm ${
                      date.important ? "text-red-700" : "text-stone-600"
                    }`}
                  >
                    {date.date}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2">
              {t("tenant.quickActions")}
            </h3>
            <div className="space-y-3">
              {[
                {
                  icon: <FileText className="w-5 h-5" />,
                  label: t("tenant.viewCurrentInvoice"),
                  color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
                },
                {
                  icon: <CreditCard className="w-5 h-5" />,
                  label: t("tenant.makePayment"),
                  color: "bg-green-50 text-green-700 hover:bg-green-100",
                },
                {
                  icon: <Wrench className="w-5 h-5" />,
                  label: t("tenant.submitMaintenanceRequest"),
                  color: "bg-orange-50 text-orange-700 hover:bg-orange-100",
                },
              ].map((action, idx) => (
                <button
                  key={idx}
                  className={`w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-colors duration-150 ${action.color}`}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantHome;
