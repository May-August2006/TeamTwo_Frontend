/** @format */

import React, { useState, useEffect } from "react";
import AppBar from "../../components/accountant/AppBar";
import Sidebar from "../../components/accountant/Sidebar";
import OverviewSection from "../../components/accountant/OverviewSection";
import SectionPlaceholder from "../../components/accountant/SectionPlaceholder";
import PaymentListPage from "../../components/accountant/PaymentListPage";
import PaymentForm from "../../components/accountant/PaymentForm";
import PaymentAuditLog from "../../components/accountant/PaymentAuditLog";
import { ReportsPage } from "../../components/accountant/ReportsPage";
import UsageEntryPage from "../../components/accountant/UsageEntryPage";
import BulkMeterReadingPage from "../../components/accountant/BulkMeterReadingPage";
import BuildingUtilityInvoicePage from "../../components/accountant/BuildingUtilityInvoicePage";
import { LateFeeManagementPage } from "../../components/accountant/LateFeeManagementPage";
import { OverdueOrOutstandingPage } from "../../components/accountant/OverdueOrOustandingPage";
import InvoicesPage from "../../components/accountant/InvoicesPage";

const PRIMARY_COLOR = "#1E40AF";

const AccountantDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggleCollapse = () => {
    if (!isMobile) {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    if (showPaymentForm)
      return (
        <PaymentForm
          onPaymentRecorded={() => setShowPaymentForm(false)}
          onCancel={() => setShowPaymentForm(false)}
        />
      );

    switch (activeSection) {
      case "overview":
        return (
          <div className="w-full">
            <OverviewSection />
          </div>
        );
      case "payment":
        return <PaymentListPage />;
      case "invoices":
        return <SectionPlaceholder title="Invoices & Receipts" />;
      case "reports":
        return <ReportsPage />;
      case "audit":
        return <PaymentAuditLog />;
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

  // const getSectionTitle = () => {
  //   if (showPaymentForm) return "Record Payment";
  //   const titles: Record<string, string> = {
  //     overview: "Overview",
  //     payment: "Payments",
  //     invoices: "Invoices & Receipts",
  //     reports: "Reports",
  //     audit: "Audit Log",
  //     "usage-entry": "Usage Entry",
  //     "bulk-readings": "Bulk Meter Readings",
  //     "building-invoices": "Building Utility Invoices",
  //     payments: "Payment Management",
  //     "invoices-management": "Invoice Management",
  //     "late-fee": "Late Fee Management",
  //     "overdue-outstanding": "Overdue & Outstanding",
  //   };
  //   return titles[activeSection] || "Dashboard";
  // };

  const renderActionButtons = () => {
    if (showPaymentForm) return null;

    switch (activeSection) {
      // case "payment":
      //   return (
      //     <button
      //       onClick={() => setShowPaymentForm(true)}
      //       className="w-full sm:w-auto bg-blue-800 text-white px-4 py-3 rounded-xl shadow-lg hover:bg-blue-900 transition duration-150 font-semibold transform active:scale-95"
      //       style={{ backgroundColor: PRIMARY_COLOR }}
      //     >
      //       + Record New Payment
      //     </button>
      //   );
      case "usage-entry":
        return (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveSection("bulk-readings")}
              className="bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-900 transition duration-150 text-sm sm:text-base"
            >
              Bulk Readings
            </button>
            <button
              onClick={() => {}}
              className="px-4 py-2 rounded-lg text-white font-semibold transition duration-150 text-sm sm:text-base"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              + Manual Entry
            </button>
          </div>
        );
      
      case "building-invoices":
        return (
          <button
            onClick={() => {}}
            className="w-full sm:w-auto px-4 py-3 rounded-xl shadow-lg text-white font-semibold transform active:scale-95 transition duration-150 text-sm sm:text-base"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            + Generate Invoice
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <style>{`
        body { 
          margin:0; 
          padding:0; 
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif; 
          -webkit-font-smoothing:antialiased; 
          -moz-osx-font-smoothing:grayscale; 
          background-color:#fafaf9; 
        }
        * { box-sizing:border-box; }
        @media (max-width: 640px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>

      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isMobile ? false : isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <main
        className={`flex-grow transition-all duration-300 w-full
          ${isMobile ? "ml-0" : isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <AppBar onMenuClick={toggleSidebar} showMenuButton={isMobile} />
        <div className="h-16"></div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900">
              {/* {getSectionTitle()} */}
            </h1>

            <div className="w-full sm:w-auto">{renderActionButtons()}</div>
          </div>

          <div className="w-full overflow-x-auto">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
};

export default AccountantDashboard;
