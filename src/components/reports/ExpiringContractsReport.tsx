// components/reports/ExpiringContractsReport.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { contractApi } from '../../api/ContractAPI';
import type { Contract } from '../../types/contract';
import type { ExpiringContract } from '../../types/expiring-contracts';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExpiringContractsReportProps {
  onBack?: () => void;
}

export const ExpiringContractsReport: React.FC<ExpiringContractsReportProps> = ({ onBack }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contractApi.getAll();
      const contractsData = Array.isArray(response.data) ? response.data : [];

      console.log('🔍 CONTRACTS DATA:', contractsData);
      if (contractsData.length > 0) {
        console.log('🔍 FIRST CONTRACT:', contractsData[0]);
        console.log('🔍 CONTRACT TENANT:', contractsData[0].tenant);
        console.log('🔍 BUSINESS TYPE:', contractsData[0].tenant?.businessType);
      }

      setContracts(contractsData);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract business type
  const getBusinessType = (contract: Contract): string => {
    // Try multiple possible fields for business type
    const possibleFields = [
      contract.tenant?.businessType,
      contract.tenant?.tenantCategoryName,
    ];

    for (const field of possibleFields) {
      if (field && typeof field === 'string' && field.trim() !== '') {
        return field;
      }
    }

    // If no business type found, try to infer from tenant name or other data
    if (contract.tenant?.tenantName) {
      const tenantName = contract.tenant.tenantName.toLowerCase();
      
      // Common business type patterns (you can expand this)
      if (tenantName.includes('restaurant') || tenantName.includes('cafe') || tenantName.includes('food')) {
        return 'Food & Beverage';
      } else if (tenantName.includes('retail') || tenantName.includes('shop') || tenantName.includes('store')) {
        return 'Retail';
      } else if (tenantName.includes('office') || tenantName.includes('service')) {
        return 'Office/Service';
      } else if (tenantName.includes('beauty') || tenantName.includes('salon') || tenantName.includes('spa')) {
        return 'Beauty & Wellness';
      } else if (tenantName.includes('clinic') || tenantName.includes('medical') || tenantName.includes('health')) {
        return 'Medical';
      } else if (tenantName.includes('bank') || tenantName.includes('finance') || tenantName.includes('money')) {
        return 'Financial';
      }
    }

    return 'Not Specified';
  };

  // Calculate days until expiry and filter contracts
  const expiringContracts = useMemo((): ExpiringContract[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return contracts
      .map(contract => {
        const endDate = new Date(contract.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: ExpiringContract['status'] = 'NEEDS_RENEWAL';
if (daysUntilExpiry <= 0) {
  status = 'EXPIRED';
} else if (daysUntilExpiry <= 30) {
  status = 'EXPIRING_SOON';
} else if (daysUntilExpiry <= 60) {
  status = 'NEEDS_RENEWAL';
} else {
  status = 'ACTIVE'; // Let's add this new status for contracts with more than 60 days
}

        return {
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          tenantName: contract.tenant?.tenantName || 'Unknown Tenant',
          roomNumber: contract.room?.roomNumber || 'Unknown Room',
          buildingName: contract.room?.level?.building?.buildingName || 'Unknown Building',
          branchName: contract.room?.level?.building?.branch?.branchName || 'Main Branch',
          startDate: contract.startDate,
          endDate: contract.endDate,
          daysUntilExpiry,
          rentalFee: contract.rentalFee,
          businessType: getBusinessType(contract),
          contactPerson: contract.tenant?.contactPerson || 'N/A',
          phone: contract.tenant?.phone || 'N/A',
          email: contract.tenant?.email || 'N/A',
          status
        };
      })
      .filter(contract => {
        // Filter by days
        if (daysFilter > 0 && contract.daysUntilExpiry > daysFilter) {
          return false;
        }
        
        // Filter by status
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'EXPIRING_SOON' && contract.status !== 'EXPIRING_SOON') {
            return false;
          }
          if (statusFilter === 'EXPIRED' && contract.status !== 'EXPIRED') {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [contracts, daysFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = expiringContracts.length;
    const expiringSoon = expiringContracts.filter(c => c.status === 'EXPIRING_SOON').length;
    const expired = expiringContracts.filter(c => c.status === 'EXPIRED').length;
    const needsRenewal = expiringContracts.filter(c => c.status === 'NEEDS_RENEWAL').length;

    return { total, expiringSoon, expired, needsRenewal };
  }, [expiringContracts]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US').format(amount) + ' MMK';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status: ExpiringContract['status']) => {
  const config = {
    EXPIRING_SOON: { color: 'bg-orange-100 text-orange-800', label: 'Expiring Soon', icon: '⏰' },
    EXPIRED: { color: 'bg-red-100 text-red-800', label: 'Expired', icon: '❌' },
    NEEDS_RENEWAL: { color: 'bg-yellow-100 text-yellow-800', label: 'Needs Renewal', icon: '📝' },
    ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active', icon: '✅' }
  }[status];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

 const getDaysBadge = (days: number) => {
  if (days <= 0) {
    return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Expired</span>;
  } else if (days <= 7) {
    return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">{days} days</span>;
  } else if (days <= 14) {
    return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">{days} days</span>;
  } else if (days <= 30) {
    return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">{days} days</span>;
  } else if (days <= 60) {
    return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">{days} days</span>;
  } else {
    return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">{days} days</span>;
  }
};

  // Export to Excel function
  const exportToExcel = () => {
    const data = expiringContracts.map(contract => ({
      'Contract Number': contract.contractNumber,
      'Tenant Name': contract.tenantName,
      'Contact Person': contract.contactPerson,
      'Phone': contract.phone,
      'Email': contract.email,
      'Room Number': contract.roomNumber,
      'Building': contract.buildingName,
      'Branch': contract.branchName,
      'Business Type': contract.businessType,
      'Start Date': contract.startDate ? new Date(contract.startDate) : '',
      'End Date': contract.endDate ? new Date(contract.endDate) : '',
      'Days Until Expiry': contract.daysUntilExpiry,
      'Rental Fee (MMK)': contract.rentalFee,
      'Status': contract.status === 'EXPIRING_SOON' ? 'Expiring Soon' : 
          contract.status === 'EXPIRED' ? 'Expired' : 
          contract.status === 'NEEDS_RENEWAL' ? 'Needs Renewal' : 'Active'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-adjust column widths
    const colWidths = [
      { wch: 18 }, // Contract Number
      { wch: 20 }, // Tenant Name
      { wch: 15 }, // Contact Person
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 12 }, // Room Number
      { wch: 15 }, // Building
      { wch: 15 }, // Branch
      { wch: 15 }, // Business Type
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 15 }, // Days Until Expiry
      { wch: 15 }, // Rental Fee
      { wch: 15 }  // Status
    ];
    worksheet['!cols'] = colWidths;

    // Set date formatting
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      ['J', 'K'].forEach(col => { // J=Start Date, K=End Date
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col.charCodeAt(0) - 65 });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = 'yyyy-mm-dd';
        }
      });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expiring Contracts');
    
    XLSX.writeFile(workbook, `expiring-contracts-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF function
  const exportToPDF = () => {
    // Create new PDF document
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape, millimeters, A4 size
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175); // Blue-800
    doc.setFont('helvetica', 'bold');
    doc.text('EXPIRING CONTRACTS REPORT', 14, 20);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })}`, 14, 28);
    
    doc.text(`Total Contracts: ${expiringContracts.length} | Filter: ${daysFilter} days | Status: ${statusFilter}`, 14, 34);

    // Summary stats box
    doc.setFillColor(239, 246, 255); // Light blue background
    doc.rect(14, 38, 260, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(`EXPIRING SOON: ${stats.expiringSoon} | EXPIRED: ${stats.expired} | NEEDS RENEWAL: ${stats.needsRenewal} | TOTAL: ${stats.total}`, 16, 43);

    // Prepare table data
    const tableData = expiringContracts.map(contract => [
      contract.contractNumber,
      contract.tenantName,
      contract.roomNumber,
      contract.buildingName,
      contract.branchName,
      contract.businessType,
      contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }) : '-',
      contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }) : '-',
      contract.daysUntilExpiry <= 0 ? 'EXPIRED' : `${contract.daysUntilExpiry} days`,
      `${contract.rentalFee.toLocaleString()} MMK`,
      contract.status === 'EXPIRING_SOON' ? 'Expiring Soon' : 
      contract.status === 'EXPIRED' ? 'Expired' : 
contract.status === 'NEEDS_RENEWAL' ? 'Needs Renewal' : 'Active'
    ]);

    // Define table columns
    const tableColumns = [
      'Contract No.',
      'Tenant Name',
      'Room No.',
      'Building',
      'Branch',
      'Business Type',
      'Start Date',
      'End Date',
      'Days Left',
      'Rental Fee',
      'Status'
    ];

    // Add table to PDF with enhanced styling
    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: 50,
      styles: {
        fontSize: 7,
        cellPadding: 3,
        lineColor: [209, 213, 219], // Gray-300
        lineWidth: 0.3,
        font: 'helvetica',
        textColor: [31, 41, 55], // Gray-800
      },
      headStyles: {
        fillColor: [239, 68, 68], // Red-500 for urgency
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 4,
        lineWidth: 0.3,
        lineColor: [255, 255, 255],
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Gray-50
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' }, // Contract No.
        1: { cellWidth: 22 }, // Tenant Name
        2: { cellWidth: 17, halign: 'center' }, // Room No.
        3: { cellWidth: 19 }, // Building
        4: { cellWidth: 18 }, // Branch
        5: { cellWidth: 24 }, // Business Type
        6: { cellWidth: 15, halign: 'center' }, // Start Date
        7: { cellWidth: 15, halign: 'center' }, // End Date
        8: { cellWidth: 17, halign: 'center', fontStyle: 'bold' }, // Days Left
        9: { cellWidth: 18, halign: 'right' }, // Rental Fee
        10: { cellWidth: 17, halign: 'center', fontStyle: 'bold' }, // Status
      },
      margin: { top: 50 },
      tableLineColor: [209, 213, 219], // Gray-300
      tableLineWidth: 0.3,
      didDrawCell: (data) => {
        // Color code status and days columns
        if (data.section === 'body') {
          if (data.column.index === 8) { // Days Left column
            const days = parseInt(data.cell.raw.toString()) || 0;
            let color: number[] = [100, 100, 100]; // Default gray
            
            if (data.cell.raw === 'EXPIRED') {
              color = [239, 68, 68]; // Red
            } else if (days <= 7) {
              color = [239, 68, 68]; // Red
            } else if (days <= 14) {
              color = [249, 115, 22]; // Orange
            } else if (days <= 30) {
              color = [245, 158, 11]; // Yellow
            } else {
              color = [34, 197, 94]; // Green
            }
            
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, {
              align: 'center',
              baseline: 'middle'
            });
            doc.setTextColor(31, 41, 55);
            return false;
          }
          
          if (data.column.index === 10) { // Status column
            const status = data.cell.raw as string;
            let color: number[] = [100, 100, 100]; // Default gray
            
            if (status === 'Expired') color = [239, 68, 68]; // Red
            else if (status === 'Expiring Soon') color = [249, 115, 22]; // Orange
            else if (status === 'Needs Renewal') color = [245, 158, 11]; // Yellow
            
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, {
              align: 'center',
              baseline: 'middle'
            });
            doc.setTextColor(31, 41, 55);
            return false;
          }
        }
      },
    });

    // Add professional footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.5);
      doc.line(14, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 20);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.text(
        `Page ${i} of ${pageCount} • Urgent Action Required • Generated on ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 15,
        { align: 'center' }
      );
      
      // Urgent watermark on first page
      if (i === 1 && (stats.expiringSoon > 0 || stats.expired > 0)) {
        doc.setFontSize(40);
        doc.setTextColor(254, 226, 226); // Light red
        doc.setFont('helvetica', 'bold');
        
        doc.setTextColor(31, 41, 55);
      }
    }

    // Save the PDF
    doc.save(`expiring-contracts-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading expiring contracts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadContracts} variant="primary">
          Try Again
        </Button>
        {onBack && (
          <Button onClick={onBack} variant="secondary" className="ml-2">
            Back to Reports
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              {onBack && (
                <Button variant="secondary" size="sm" onClick={onBack} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Reports
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expiring Contracts Report</h1>
                <p className="text-gray-600 mt-1">
                  Monitor contracts nearing expiration and take proactive action
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={exportToExcel} className="flex items-center gap-2">
              Export Excel
            </Button>
            <Button variant="danger" onClick={exportToPDF} className="flex items-center gap-2">
              Export PDF
            </Button>
            <Button variant="secondary" onClick={loadContracts}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Summary */}
      {stats.expiringSoon > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-orange-800 font-medium">
              {stats.expiringSoon} contract(s) expiring within 30 days require attention
            </span>
          </div>
        </div>
      )}

      {stats.expired > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">
              {stats.expired} contract(s) have expired and need immediate action
            </span>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total in Filter</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.expiringSoon}</div>
          <div className="text-sm text-gray-600 mt-1">Expiring Soon</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-gray-600 mt-1">Expired</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.needsRenewal}</div>
          <div className="text-sm text-gray-600 mt-1">Needs Renewal</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Show Contracts Expiring Within
            </label>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={0}>All upcoming</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="EXPIRING_SOON">Expiring Soon Only</option>
              <option value="EXPIRED">Expired Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Actions
            </label>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  setDaysFilter(7);
                  setStatusFilter('EXPIRING_SOON');
                }}
              >
                Urgent (7 days)
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  setDaysFilter(0);
                  setStatusFilter('EXPIRED');
                }}
              >
                Show Expired
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {expiringContracts.length} contract(s) matching your criteria
          </p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expiringContracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No expiring contracts found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your filters or check back later.
                    </p>
                  </td>
                </tr>
              ) : (
                expiringContracts.map(contract => (
                  <tr key={contract.contractId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{contract.contractNumber}</div>
                      <div className="text-sm text-gray-500">Rental: {formatCurrency(contract.rentalFee)}</div>
                      <div className="text-sm text-gray-500">{contract.businessType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{contract.tenantName}</div>
                      <div className="text-sm text-gray-500">
                        {contract.roomNumber} • {contract.buildingName}
                      </div>
                      <div className="text-xs text-gray-400">{contract.branchName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-500">Start:</span>
                          <span className="font-medium">{formatDate(contract.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-500">End:</span>
                          <span className="font-medium">{formatDate(contract.endDate)}</span>
                        </div>
                        <div className="mt-2">
                          {getDaysBadge(contract.daysUntilExpiry)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">{contract.contactPerson}</div>
                        <div className="text-gray-500">{contract.phone}</div>
                        <div className="text-gray-500">{contract.email}</div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Recommendations */}
      {expiringContracts.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Recommended Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">For Expiring Soon Contracts:</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Contact tenant for renewal discussion</li>
                <li>• Send renewal notice email</li>
                <li>• Prepare renewal documentation</li>
                <li>• Schedule renewal meeting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">For Expired Contracts:</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Immediate tenant contact required</li>
                <li>• Send formal expiration notice</li>
                <li>• Initiate termination process if no renewal</li>
                <li>• Update room availability status</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};