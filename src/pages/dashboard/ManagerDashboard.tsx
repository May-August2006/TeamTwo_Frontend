/** @format */

import { Routes, Route, Navigate } from "react-router-dom";
import { OverviewPage } from "../manager/OverviewPage";
import { BillingUtilitiesPage } from "../manager/BillingUtilitiesPage";
import { PaymentManagementPage } from "../manager/PaymentManagementPage";
import { ReportsPage } from "../manager/ReportsPage";
import LeaseManagementPage from "../manager/LeaseManagementPage";
import { ManagerDashboardLayout } from "../../components/manager/ManagerDashboardLayout";
import TenantManagement from "../manager/TenantManagement";
import LeaseManagement from "../manager/LeaseManagement";

export default function ManagerDashboard() {
  return (
    <ManagerDashboardLayout>
      <Routes>
        <Route path="overview" element={<OverviewPage />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="leases" element={<LeaseManagement />} />
        <Route path="billing" element={<BillingUtilitiesPage />} />
        <Route path="payments" element={<PaymentManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Redirect to /overview by default */}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </ManagerDashboardLayout>
  );
}
