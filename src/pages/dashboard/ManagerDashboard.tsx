/** @format */

import { Routes, Route, Navigate } from "react-router-dom";
import { OverviewPage } from "../manager/OverviewPage";
import { BillingUtilitiesPage } from "../manager/BillingUtilitiesPage";
import { PaymentManagementPage } from "../manager/PaymentManagementPage";
import { ReportsPage } from "../manager/ReportsPage";
import LeaseManagementPage from "../manager/LeaseManagementPage";
import { ManagerDashboardLayout } from "../../components/manager/ManagerDashboardLayout";
import TenantManagement from "../manager/TenantManagement";
import AppointmentManagementPage from "../manager/AppointmentManagementPage";
import AppointmentDetailPage from "../manager/AppointmentDetailPage";
import SendAnnouncementPage from "../manager/SendAnnouncementPage";

export default function ManagerDashboard() {
  return (
    <ManagerDashboardLayout>
      <Routes>
        <Route path="overview" element={<OverviewPage />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="leases" element={<LeaseManagementPage />} />
        <Route path="billing" element={<BillingUtilitiesPage />} />
        <Route path="payments" element={<PaymentManagementPage />} />
        <Route path="appointments" element={<AppointmentManagementPage />} />
        <Route path="appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="announcements" element={<SendAnnouncementPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Redirect to /overview by default */}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </ManagerDashboardLayout>
  );
}
