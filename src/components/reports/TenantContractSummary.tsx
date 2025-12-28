// components/reports/TenantContractSummary.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isSticky, setIsSticky] = useState(false);
  
  // Create a ref for the header
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  // Add scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add a small threshold to prevent flickering
        setIsSticky(scrollTop > headerHeight + 10);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      
      // Add "Unknown" for contracts without business type
      if (contracts.some(c => !c.tenant?.businessType)) {
        initialFilters['Unknown'] = true;
      }
      
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
      .map(contract => contract.tenant?.businessType || 'Unknown')
      .filter((type, index, array) => array.indexOf(type) === index);
    
    return types.sort();
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
        const tenantName = contract.tenant?.tenantName?.toLowerCase() || '';
        const contractNumber = contract.contractNumber?.toLowerCase() || '';
        const unitNumber = contract.unit?.unitNumber?.toLowerCase() || '';
        const buildingName = contract.unit?.level?.building?.buildingName?.toLowerCase() || '';
        
        return (
          tenantName.includes(searchLower) ||
          contractNumber.includes(searchLower) ||
          unitNumber.includes(searchLower) ||
          buildingName.includes(searchLower) ||
          businessType.toLowerCase().includes(searchLower)
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
    'Unit No.': contract.unit?.unitNumber || '',
    'Building': contract.unit?.level?.building?.buildingName || '',
    'Start Date': contract.startDate ? new Date(contract.startDate) : '',
    'End Date': contract.endDate ? new Date(contract.endDate) : '',
    'Rental Fee (MMK)': contract.rentalFee || 0,
    'Business Type': contract.tenant?.businessType || 'Unknown',
    'Contract Status': contract.contractStatus?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-adjust column widths
  const colWidths = [
    { wch: 25 }, // Tenant Name
    { wch: 15 }, // Contract No.
    { wch: 12 }, // Unit No.
    { wch: 20 }, // Building
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
    ['E', 'F'].forEach((col) => { // E=Start Date, F=End Date
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
  const logoWidth = 40;
  const logoHeight = 20;
  const logoX = 14; // Left aligned like in JRXML
  const logoY = 10;

  // Report title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Contract History Report', doc.internal.pageSize.width / 2, 25, { align: 'center' });
  
  // Filter type (using business type filter status)
  const activeFilters = [];
  if (statusFilter !== 'ALL') {
    activeFilters.push(`Status: ${statusFilter}`);
  }
  
  const activeBusinessTypes = businessTypes.filter(type => businessTypeFilter[type]);
  if (activeBusinessTypes.length > 0 && activeBusinessTypes.length < businessTypes.length) {
    activeFilters.push(`Business Types: ${activeBusinessTypes.join(', ')}`);
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(activeFilters.join(' | ') || 'All Contracts', doc.internal.pageSize.width / 2, 35, { align: 'center' });
  
  // Generated info
  doc.setFontSize(9);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Records: ${filteredContracts.length}`, 14, 45);
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 50, doc.internal.pageSize.width - 14, 50);
  
  // Prepare table data
  const tableData = filteredContracts.map(contract => [
    contract.contractNumber || '-',
    contract.tenant?.tenantName || '-',
    contract.unit?.unitNumber || '-',
    contract.contractStatus?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || '-',
    contract.tenant?.contactPerson || contract.tenant?.tenantName || '-',
    contract.startDate ? new Date(contract.startDate).toLocaleDateString() + ' to ' + (contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '-') : '-',
    formatCurrency(contract.rentalFee),
  ]);

  // Table configuration
  const startY = 60;
  const tableColumns = [
    { header: 'Contract No.', dataKey: 'contractNumber', width: 25 },
    { header: 'Tenant', dataKey: 'tenantName', width: 40 },
    { header: 'Unit No.', dataKey: 'unitNumber', width: 25 },
    { header: 'Status', dataKey: 'status', width: 25 },
    { header: 'Contact Person', dataKey: 'contactPerson', width: 45 },
    { header: 'Contract Period', dataKey: 'period', width: 60 },
    { header: 'Rental Fee', dataKey: 'rentalFee', width: 30 }
  ];

  // Add table to PDF
  autoTable(doc, {
  head: [tableColumns.map(col => col.header)],
  body: tableData,
  startY: startY,
  margin: { left: 14, right: 14 },

  tableWidth: "auto",

  styles: {
    fontSize: 9,
    cellPadding: 3,
    overflow: 'linebreak',
    cellWidth: 'wrap'
  },

  headStyles: {
    fillColor: [102, 153, 255],
    textColor: 255,
    fontStyle: 'bold',
    fontSize: 10,
    halign: 'center'
  },

  // ❗ VERY IMPORTANT — NO FIXED WIDTHS
  columnStyles: {
    0: { halign: 'center' },
    1: { halign: 'left' },
    2: { halign: 'center' },
    3: { halign: 'center' },
    4: { halign: 'left' },
    5: { halign: 'center' }
  },

  didParseCell: (data) => {
    // Let long text wrap
    if (typeof data.cell.raw === "string" && data.cell.raw.length > 20) {
      data.cell.styles.cellWidth = 'wrap';
    }
  },

  didDrawPage: (data) => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${data.pageNumber} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    // logo
    if (data.pageNumber === 1) {
      try {
        doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (e) {}
    }
  }
});


  // Summary section
  const finalY = (doc as any).lastAutoTable?.finalY || startY;
  const summaryY = finalY + 15;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, summaryY - 5, doc.internal.pageSize.width - 14, summaryY - 5);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'End of Contract History Report',
    doc.internal.pageSize.width / 2,
    summaryY + 5,
    { align: 'center' }
  );

  doc.save(`contract-history-${new Date().toISOString().split('T')[0]}.pdf`);
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
      {/* Sticky Header */}
      <div 
        ref={headerRef}
        className={`bg-white p-6 rounded-lg border border-gray-200 transition-all duration-300 ${
          isSticky 
            ? 'fixed top-0 left-0 right-0 z-50 shadow-lg rounded-none border-t-0 border-x-0' 
            : ''
        }`}
      >
        <div className={`flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 ${isSticky ? 'container mx-auto' : ''}`}>
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
              variant="primary"
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

      {/* Add padding when header is sticky to prevent content from jumping under it */}
      {isSticky && <div className="h-24"></div>}

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
              placeholder="Search by tenant, contract, unit, building, or business type..."
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
                  Unit No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Building
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
                      {contract.unit?.unitNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contract.unit?.level?.building?.buildingName || '-'}
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
                      {contract.tenant?.businessType || 'Unknown'}
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