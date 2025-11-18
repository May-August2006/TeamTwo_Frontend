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

  const renderContent = () => {
    if (showPaymentForm) {
      return (
        <PaymentForm 
          onPaymentRecorded={() => {
            setShowPaymentForm(false);
            // You might want to refresh the payment list here
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
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
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
    <div className="flex min-h-screen">
      <style>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>

      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="flex-grow ml-64">
        <AppBar />
        <div className="h-16"></div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              {showPaymentForm ? 'Record Payment' : 'Accountant Dashboard'}
            </h1>
            {!showPaymentForm && activeSection === 'payment' && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                + Record New Payment
              </button>
            )}
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AccountantDashboard;