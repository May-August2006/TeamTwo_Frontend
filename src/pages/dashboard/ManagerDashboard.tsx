/** @format */

import { Routes, Route, Navigate } from "react-router-dom";
import { OverviewPage } from "../manager/OverviewPage";
import { BillingUtilitiesPage } from "../manager/BillingUtilitiesPage";
import { PaymentManagementPage } from "../manager/PaymentManagementPage";
import { ReportsPage } from "../manager/ReportsPage";
import { ManagerDashboardLayout } from "../../components/manager/ManagerDashboardLayout";
import TenantManagement from "../manager/TenantManagement";
import AppointmentManagementPage from "../manager/AppointmentManagementPage";
import AppointmentDetailPage from "../manager/AppointmentDetailPage";
import SendAnnouncementPage from "../manager/SendAnnouncementPage";
import { UtilityTypePage } from "../manager/UtilityTypePage";
import { BillingFeePage } from "../manager/BillingFeePage";
import { InvoiceListPage } from "../manager/InvoiceListPage";
import ManagerMaintenancePage from "../manager/MaintenancePage"; // Add this import
import { UsageEntryPage } from "../manager/UsageEntryPage";
import ManagerMaintenancePage from "../manager/MaintenancePage";
import LeaseManagement from "../manager/LeaseManagement";
import InvoicesPage from "../manager/InvoicesPage";
import { OverdueOrOutstandingPage } from "../manager/OverdueOrOustandingPage";
import { LateFeeManagementPage } from "../manager/LateFeeManagementPage";
import UsageEntryPage from "../manager/UsageEntryPage";

export default function ManagerDashboard() {
  return (
    <ManagerDashboardLayout>
      <Routes>
        <Route path="overview" element={<OverviewPage />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="leases" element={<LeaseManagement />} />
        <Route path="billing" element={<BillingUtilitiesPage />} />
        <Route path="billing/utility-types" element={<UtilityTypePage />} />
        <Route path="billing/fees" element={<BillingFeePage />} />
        <Route path="billing/invoices" element={<InvoiceListPage />} />
        <Route path="billing/usage" element={<UsageEntryPage />} />
        <Route path="payments" element={<PaymentManagementPage />} />
        <Route path="appointments" element={<AppointmentManagementPage />} />
        <Route path="appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="announcements" element={<SendAnnouncementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="lateFee" element={<LateFeeManagementPage />} />
        <Route
          path="overdueOrOustanding"
          element={<OverdueOrOutstandingPage />}
        />

        {/* Add the Maintenance route */}
        <Route path="maintenance" element={<ManagerMaintenancePage />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </ManagerDashboardLayout>
  );
}