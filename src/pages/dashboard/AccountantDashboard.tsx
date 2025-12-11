/** @format */

import React, { useState } from "react";
import AppBar from "../../components/accountant/AppBar";
import Sidebar from "../../components/accountant/Sidebar";
import OverviewSection from "../../components/accountant/OverviewSection";
import SectionPlaceholder from "../../components/accountant/SectionPlaceholder";
import PaymentListPage from "../../components/accountant/PaymentListPage";
import PaymentForm from "../../components/accountant/PaymentForm";
import PaymentAuditLog from "../../components/accountant/PaymentAuditLog";
import DailyCollectionReport from "../../components/accountant/DailyCollectionReport";

// Import Billing & Utilities components

import UsageEntryPage from "../../components/accountant/UsageEntryPage";
import BulkMeterReadingPage from "../../components/accountant/BulkMeterReadingPage";
import BuildingUtilityInvoicePage from "../../components/accountant/BuildingUtilityInvoicePage";
import { LateFeeManagementPage } from "../../components/accountant/LateFeeManagementPage";
import { OverdueOrOutstandingPage } from "../../components/accountant/OverdueOrOustandingPage";
import InvoicesPage from "../../components/accountant/InvoicesPage";

const AccountantDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderContent = () => {
    if (showPaymentForm) {
      return (
        <PaymentForm
          onPaymentRecorded={() => {
            setShowPaymentForm(false);
          }}
          onCancel={() => setShowPaymentForm(false)}
        />
      );
    }

    switch (activeSection) {
      case "overview":
        return (
          <div>
            <OverviewSection />
            {!showPaymentForm && (
              <div className="mt-6">
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
                >
                  + Record New Payment
                </button>
              </div>
            )}
          </div>
        );
      case "payment":
        return <PaymentListPage />;
      case "invoices":
        return <SectionPlaceholder title="Invoices & Receipts" />;
      case "reports":
        return <DailyCollectionReport />;
      case "audit":
        return <PaymentAuditLog />;

      // Billing & Utilities Sections

      case "usage-entry":
        return <UsageEntryPage />;
      case "bulk-readings":
        return <BulkMeterReadingPage />;
      case "building-invoices":
        return <BuildingUtilityInvoicePage />;
      case "payments":
        return <PaymentListPage />;
      case "invoices-management":
        return <InvoicesPage />;
      case "late-fee":
        return <LateFeeManagementPage />;
      case "overdue-outstanding":
        return <OverdueOrOutstandingPage />;

      default:
        return <OverviewSection />;
    }
  };

  // Get section title
  const getSectionTitle = () => {
    if (showPaymentForm) return "Record Payment";

    switch (activeSection) {
      case "overview":
        return "Overview";
      case "payment":
        return "Payments";
      case "invoices":
        return "Invoices & Receipts";
      case "reports":
        return "Reports";
      case "audit":
        return "Audit Log";

      // Billing & Utilities titles
      case "billing":
        return "Billing";
      case "utility-types":
        return "Utility Types";
      case "billing-fees":
        return "Billing Fees";
      case "usage-entry":
        return "Usage Entry";
      case "bulk-readings":
        return "Bulk Meter Readings";
      case "building-invoices":
        return "Building Utility Invoices";
      case "payments":
        return "Payment Management";
      case "invoices-management":
        return "Invoice Management";
      case "late-fee":
        return "Late Fee Management";
      case "overdue-outstanding":
        return "Overdue & Outstanding";

      default:
        return "Dashboard";
    }
  };

  // Check if current section is a billing section
  const isBillingSection = () => {
    return [
      "billing",
      "utility-types",
      "billing-fees",
      "usage-entry",
      "bulk-readings",
      "building-invoices",
      "payments",
      "invoices-management",
      "late-fee",
      "overdue-outstanding",
    ].includes(activeSection);
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <style>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #fafaf9;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>

      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <main
        className={`flex-grow transition-all duration-300 ${
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <AppBar />
        <div className="h-16"></div>

        <div className="p-6">
          {/* ---- FIXED TITLE SECTION ---- */}
          <div className="flex justify-between items-center mb-6">
            {/* Page Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {getSectionTitle()}
            </h1>

            {/* Action Buttons */}
            {!showPaymentForm &&
              (activeSection === "overview" || activeSection === "payment") && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
                >
                  + Record New Payment
                </button>
              )}

            {/* Billing Section Actions */}
            {!showPaymentForm && activeSection === "billing" && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveSection("usage-entry")}
                  className="bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-900 transition duration-150"
                >
                  Usage Entry
                </button>
                <button
                  onClick={() => setActiveSection("bulk-readings")}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-150"
                >
                  Bulk Readings
                </button>
              </div>
            )}

            {!showPaymentForm && activeSection === "utility-types" && (
              <button
                onClick={() => {
                  /* Add utility type modal */
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
              >
                + Add Utility Type
              </button>
            )}

            {!showPaymentForm && activeSection === "billing-fees" && (
              <button
                onClick={() => {
                  /* Add billing fee modal */
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
              >
                + Add Billing Fee
              </button>
            )}

            {!showPaymentForm && activeSection === "usage-entry" && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveSection("bulk-readings")}
                  className="bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-900 transition duration-150"
                >
                  Bulk Readings
                </button>
                <button
                  onClick={() => {
                    /* Manual entry modal */
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-150"
                >
                  + Manual Entry
                </button>
              </div>
            )}

            {!showPaymentForm && activeSection === "bulk-readings" && (
              <button
                onClick={() => {
                  /* Open bulk reading modal */
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
              >
                + Add Bulk Reading
              </button>
            )}

            {!showPaymentForm && activeSection === "building-invoices" && (
              <button
                onClick={() => {
                  /* Generate building invoice */
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
              >
                + Generate Invoice
              </button>
            )}

            {!showPaymentForm && activeSection === "late-fee" && (
              <button
                onClick={() => {
                  /* Add late fee rule */
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
              >
                + Add Late Fee Rule
              </button>
            )}
          </div>
          {/* ---- END FIX ---- */}

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AccountantDashboard;
