/** @format */

import { Routes, Route, Navigate } from "react-router-dom";
import { OverviewPage } from "../manager/OverviewPage";
import { ReportsPage } from "../manager/ReportsPage";
import { ManagerDashboardLayout } from "../../components/manager/ManagerDashboardLayout";
import TenantManagement from "../manager/TenantManagement";
import AppointmentManagementPage from "../manager/AppointmentManagementPage";
import AppointmentDetailPage from "../manager/AppointmentDetailPage";
import SendAnnouncementPage from "../manager/SendAnnouncementPage";
import ManagerMaintenancePage from "../manager/MaintenancePage";
import LeaseManagement from "../manager/LeaseManagement";
import { OverdueInvoicesPage } from "../manager/OverdueInvoicesPage";

export default function ManagerDashboard() {
  return (
    <ManagerDashboardLayout>
      <Routes>
        <Route path="overview" element={<OverviewPage />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="leases" element={<LeaseManagement />} />
        <Route path="appointments" element={<AppointmentManagementPage />} />
        <Route path="appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="announcements" element={<SendAnnouncementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        {/* Add the Maintenance route */}
        <Route path="overdueInvoices" element={<OverdueInvoicesPage />} />
        <Route path="maintenance" element={<ManagerMaintenancePage />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </ManagerDashboardLayout>
  );
}
