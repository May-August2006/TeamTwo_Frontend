import React from 'react';
import WelcomeCard from './WelcomeCard';
import KPICard from './KPICard';
import RecentPaymentsTable from './RecentPaymentsTable';
import OverdueInvoicesCard from './OverdueInvoicesCard';
import QuickActionsCard from './QuickActionsCard';

// Mock data (can be moved to separate file later)
const kpiData = [
  { 
    title: 'Total Rent Collected (Today)', 
    value: '₹45,820', 
    subtitle: '+12% from yesterday',
    trend: 'up' as const,
    trendValue: '12%'
  },
  { 
    title: 'Total Outstanding Invoices', 
    value: '24', 
    subtitle: '₹1,84,500 total',
    trend: 'down' as const,
    trendValue: '5%'
  },
  { 
    title: 'Payments Recorded (Today)', 
    value: '18', 
    subtitle: '15 successful, 3 pending',
    trend: 'up' as const,
    trendValue: '8%'
  },
  { 
    title: 'Collection Efficiency', 
    value: '92%', 
    subtitle: 'This month average',
    trend: 'up' as const,
    trendValue: '3%'
  },
  { 
    title: 'Average Payment Time', 
    value: '2.3 days', 
    subtitle: 'From due date',
    trend: 'down' as const,
    trendValue: '0.5 days'
  },
  { 
    title: 'Disputed Payments', 
    value: '3', 
    subtitle: 'Requiring attention',
    trend: 'down' as const,
    trendValue: '2'
  },
];

const recentPayments = [
  { id: '1', tenant: 'Fashion Store A', amount: 25000, type: 'Bank Transfer', dateTime: '2024-01-15 14:30', status: 'completed' as const },
  { id: '2', tenant: 'Electronics World', amount: 32000, type: 'Cash', dateTime: '2024-01-15 11:15', status: 'completed' as const },
  { id: '3', tenant: 'Food Court Stall 5', amount: 15000, type: 'UPI', dateTime: '2024-01-15 10:45', status: 'pending' as const },
  { id: '4', tenant: 'Book Store Plus', amount: 18000, type: 'Bank Transfer', dateTime: '2024-01-15 09:20', status: 'completed' as const },
  { id: '5', tenant: 'Jewelry Gallery', amount: 42000, type: 'Bank Transfer', dateTime: '2024-01-15 08:15', status: 'completed' as const },
];

const overdueInvoices = [
  { id: 'INV-001', tenant: 'Sports Gear Hub', amount: 28500, dueDate: '2024-01-10', status: 'overdue' as const },
  { id: 'INV-002', tenant: 'Beauty Salon Spa', amount: 16700, dueDate: '2024-01-12', status: 'overdue' as const },
  { id: 'INV-003', tenant: 'Coffee Corner', amount: 12300, dueDate: '2024-01-14', status: 'overdue' as const },
];

const OverviewSection: React.FC = () => {
  function onRecordPayment(): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div>
      <WelcomeCard paymentsCount={recentPayments.length} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <KPICard kpi={kpi} key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentPaymentsTable payments={recentPayments} />
        </div>

        <div className="space-y-6">
          <OverdueInvoicesCard invoices={overdueInvoices} />
          <QuickActionsCard onRecordPayment={onRecordPayment} />

        </div>
      </div>
    </div>
  );
};

export default OverviewSection;