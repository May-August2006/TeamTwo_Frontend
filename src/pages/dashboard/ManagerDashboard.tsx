/** @format */
import { Routes, Route, Navigate } from "react-router-dom";
import { OverviewPage } from "../manager/OverviewPage";
import { BillingUtilitiesPage } from "../manager/BillingUtilitiesPage";
import { PaymentManagementPage } from "../manager/PaymentManagementPage";
import { ReportsPage } from "../manager/ReportsPage";
import { ManagerDashboardLayout } from "../../components/manager/ManagerDashboardLayout";
import TenantManagement from "../manager/TenantManagement";
import { UtilityTypePage } from "../manager/UtilityTypePage";
import { BillingFeePage } from "../manager/BillingFeePage";
import { InvoiceListPage } from "../manager/InvoiceListPage";
import { UsageEntryPage } from "../manager/UsageEntryPage";
import ManagerMaintenancePage from "../manager/MaintenancePage"; // Add this import
import LeaseManagement from "../manager/LeaseManagement";

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
        <Route path="reports" element={<ReportsPage />} />
        {/* Add the Maintenance route */}
        <Route path="maintenance" element={<ManagerMaintenancePage />} />

        {/* Redirect to /overview by default */}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </ManagerDashboardLayout>
  );
}