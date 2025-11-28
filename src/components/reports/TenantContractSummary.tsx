// components/reports/TenantContractSummary.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { contractApi } from '../../api/ContractAPI';
import type { Contract, ContractStatus } from '../../types/contract';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TenantContractSummaryProps {
  onBack?: () => void;
}

interface BusinessTypeFilter {
  [key: string]: boolean;
}

export const TenantContractSummary: React.FC<TenantContractSummaryProps> = ({ onBack }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<BusinessTypeFilter>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    // Initialize business type filters when contracts are loaded
    if (contracts.length > 0) {
      const businessTypes = Array.from(new Set(contracts
        .map(contract => contract.tenant?.businessType)
        .filter(Boolean) as string[]
      ));
      
      const initialFilters: BusinessTypeFilter = {};
      businessTypes.forEach(type => {
        initialFilters[type] = true;
      });
      setBusinessTypeFilter(initialFilters);
    }
  }, [contracts]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractApi.getAll();
      
      let contractsData: Contract[];
      if (Array.isArray(response.data)) {
        contractsData = response.data;
      } else if (Array.isArray(response)) {
        contractsData = response;
      } else {
        throw new Error('Invalid contracts data structure');
      }
      
      setContracts(contractsData);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = useMemo(() => {
    const types = contracts
      .map(contract => contract.tenant?.businessType || 'Unknown Business Type')
      .filter(type => type !== 'Unknown Business Type');
    
    return Array.from(new Set(types)).sort();
  }, [contracts]);

  // Filter contracts based on selected filters and search
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Status filter
      if (statusFilter !== 'ALL' && contract.contractStatus !== statusFilter) {
        return false;
      }

      // Business type filter
      const businessType = contract.tenant?.businessType || 'Unknown';
      if (businessTypeFilter[businessType] === false) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          contract.tenant?.tenantName?.toLowerCase().includes(searchLower) ||
          contract.contractNumber?.toLowerCase().includes(searchLower) ||
          contract.room?.roomNumber?.toLowerCase().includes(searchLower) ||
          (businessType && businessType.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [contracts, statusFilter, businessTypeFilter, searchTerm]);

  // Toggle business type filter
  const toggleBusinessType = (businessType: string) => {
    setBusinessTypeFilter(prev => ({
      ...prev,
      [businessType]: !prev[businessType]
    }));
  };

  // Select all business types
  const selectAllBusinessTypes = () => {
    const allSelected: BusinessTypeFilter = {};
    businessTypes.forEach(type => {
      allSelected[type] = true;
    });
    setBusinessTypeFilter(allSelected);
  };

  // Clear all business types
  const clearAllBusinessTypes = () => {
    const noneSelected: BusinessTypeFilter = {};
    businessTypes.forEach(type => {
      noneSelected[type] = false;
    });
    setBusinessTypeFilter(noneSelected);
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' MMK';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      EXPIRING: { color: 'bg-orange-100 text-orange-800', label: 'Expiring Soon' },
      TERMINATED: { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status || 'Unknown' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const exportToExcel = () => {
    const data = filteredContracts.map(contract => ({
      'Tenant Name': contract.tenant?.tenantName || '',
      'Contract No.': contract.contractNumber || '',
      'Room No.': contract.room?.roomNumber || '',
      'Size (sqm)': contract.room?.roomSpace || '',
      'Start Date': contract.startDate ? new Date(contract.startDate) : '',
      'End Date': contract.endDate ? new Date(contract.endDate) : '',
      'Rental Fee (MMK)': contract.rentalFee || 0,
      'Business Type': contract.tenant?.businessType || '',
      'Contract Status': contract.contractStatus?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-adjust column widths
    const colWidths = [
      { wch: 25 }, // Tenant Name
      { wch: 15 }, // Contract No.
      { wch: 10 }, // Room No.
      { wch: 12 }, // Size
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 15 }, // Rental Fee
      { wch: 20 }, // Business Type
      { wch: 15 }  // Contract Status
    ];
    worksheet['!cols'] = colWidths;

    // Set date formatting
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      ['E', 'F'].forEach(col => { // E=Start Date, F=End Date
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col.charCodeAt(0) - 65 });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = 'yyyy-mm-dd';
        }
      });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tenant Contracts');
    
    XLSX.writeFile(workbook, `tenant-contract-summary-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    
    // Logo configuration
    const logoUrl = '/src/assets/SeinGayHarLogo.png';
    const logoWidth = 30;
    const logoHeight = 15;
    const logoX = doc.internal.pageSize.width - logoWidth - 14;
    const logoY = 10;

    try {
      if (logoUrl) {
        doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
      }
    } catch (error) {
      console.warn('Could not load logo:', error);
    }

    // Title
    const titleX = 14;
    
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Tenant Contract Summary Report', titleX, 20);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Records: ${filteredContracts.length}`, titleX, 27);
    
    // Prepare table data
    const tableData = filteredContracts.map(contract => [
      contract.tenant?.tenantName || '-',
      contract.contractNumber || '-',
      contract.room?.roomNumber || '-',
      contract.room?.roomSpace ? `${contract.room.roomSpace}` : '-',
      contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '-',
      contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '-',
      contract.rentalFee ? contract.rentalFee.toLocaleString() + ' MMK' : '-',
      contract.tenant?.businessType || '-',
      contract.contractStatus?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || '-'
    ]);

    // Define table columns
    const tableColumns = [
      { header: 'Tenant Name', dataKey: 'tenantName' },
      { header: 'Contract No.', dataKey: 'contractNumber' },
      { header: 'Room No.', dataKey: 'roomNumber' },
      { header: 'Size (sqm)', dataKey: 'size' },
      { header: 'Start Date', dataKey: 'startDate' },
      { header: 'End Date', dataKey: 'endDate' },
      { header: 'Rental Fee', dataKey: 'rentalFee' },
      { header: 'Business Type', dataKey: 'businessType' },
      { header: 'Status', dataKey: 'status' }
    ];

    // Add table to PDF
    const startY = 35;
    
    autoTable(doc, {
      head: [tableColumns.map(col => col.header)],
      body: tableData,
      startY: startY,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 14 },
        3: { cellWidth: 18 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
        8: { cellWidth: 18 },
      },
      margin: { top: startY },
    });

    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      if (i > 1 && logoUrl) {
        try {
          const pageLogoX = doc.internal.pageSize.width - logoWidth - 14;
          doc.addImage(logoUrl, 'PNG', pageLogoX, logoY, logoWidth, logoHeight);
        } catch (error) {
          // Continue without logo
        }
      }
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`tenant-contract-summary-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading contract summary...</span>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Reports
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tenant Contract Summary</h1>
                <p className="text-gray-600 mt-1">
                  Overview of all tenant contracts with filtering capabilities
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={exportToExcel}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Export Excel
            </Button>

            <Button
              variant="danger"
              onClick={exportToPDF}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </Button>

            <Button
              variant="secondary"
              onClick={loadContracts}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by tenant, contract, room, or business type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING">Expiring Soon</option>
              <option value="TERMINATED">Terminated</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Business Type Filter Header */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Types
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={selectAllBusinessTypes}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <button
                onClick={clearAllBusinessTypes}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Business Type Checkboxes */}
        {businessTypes.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-4">
              {businessTypes.map(businessType => (
                <label key={businessType} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={businessTypeFilter[businessType] || false}
                    onChange={() => toggleBusinessType(businessType)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{businessType}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredContracts.length} of {contracts.length} contracts
          </p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rental Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your filters or search terms.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contract.tenant?.tenantName || '-'}
                      </div>
                      {contract.tenant?.contactPerson && (
                        <div className="text-sm text-gray-500">
                          {contract.tenant.contactPerson}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {contract.contractNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.room?.roomNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.room?.roomSpace ? `${contract.room.roomSpace} sqm` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(contract.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(contract.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(contract.rentalFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.tenant?.businessType || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract.contractStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {filteredContracts.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{filteredContracts.length}</div>
              <div className="text-sm text-blue-600">Total Contracts</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {filteredContracts.filter(c => c.contractStatus === 'ACTIVE').length}
              </div>
              <div className="text-sm text-green-600">Active</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">
                {filteredContracts.filter(c => c.contractStatus === 'EXPIRING').length}
              </div>
              <div className="text-sm text-orange-600">Expiring Soon</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {businessTypes.length}
              </div>
              <div className="text-sm text-gray-600">Business Types</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};