import React, { useState } from 'react';
import AppBar from '../../components/accountant/AppBar';
import Sidebar from '../../components/accountant/Sidebar';
import OverviewSection from '../../components/accountant/OverviewSection';
import SectionPlaceholder from '../../components/accountant/SectionPlaceholder';
import PaymentListPage from '../../components/accountant/PaymentListPage';
import PaymentForm from '../../components/accountant/PaymentForm';
import PaymentAuditLog from '../../components/accountant/PaymentAuditLog';

const AccountantDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
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
      case 'overview':
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
      case 'payment':
        return <PaymentListPage />;
      case 'invoices':
        return <SectionPlaceholder title="Invoices & Receipts" />;
      case 'reports':
        return <SectionPlaceholder title="Reports" />;
      case 'audit':
        return <PaymentAuditLog />;
      default:
        return <OverviewSection />;
    }
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

      <main className={`flex-grow transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <AppBar />
        <div className="h-16"></div>

        <div className="p-6">

          {/* ---- FIXED TITLE SECTION ---- */}
          <div className="flex justify-between items-center mb-6">

            {/* Only show title when record payment form is open */}
            {showPaymentForm && (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                Record Payment
              </h1>
            )}

            {/* Button only for payment section */}
            {!showPaymentForm && activeSection === 'payment' && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
              >
                + Record New Payment
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
