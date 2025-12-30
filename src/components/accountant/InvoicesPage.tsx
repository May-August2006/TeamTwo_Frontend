/** @format */

import { useEffect, useState, useRef, useMemo } from "react";
import { useInvoicesWebSocket } from "../../hooks/useInvoicesWebSocket";
import toast, { Toaster } from "react-hot-toast";
import { invoiceApi, type InvoiceSummaryDTO } from "../../api/InvoiceAPI";
import { buildingApi } from "../../api/BuildingAPI";
import { Building, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function InvoicesPage() {
  const jwtToken = localStorage.getItem("accessToken") || "";
  const { invoices, setInvoices, connected } = useInvoicesWebSocket(jwtToken);
  const [loading, setLoading] = useState(true);

  // Accountant restrictions
  const [assignedBuilding, setAssignedBuilding] = useState<any>(null);
  const [isAccountant, setIsAccountant] = useState(false);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceSummaryDTO[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable

  // Year filter state
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Track which invoices have already shown a toast
  const seenInvoiceIds = useRef<Set<number>>(new Set());

  // Check user role and assigned building
  useEffect(() => {
    const checkUserRoleAndBuilding = async () => {
      try {
        const userRole = localStorage.getItem('userRole') || '';
        
        if (userRole === 'ACCOUNTANT' || userRole === 'accountant') {
          setIsAccountant(true);
          
          // Get accountant's assigned building
          try {
            const buildingResponse = await buildingApi.getMyAssignedBuilding();
            if (buildingResponse.data) {
              setAssignedBuilding(buildingResponse.data);
            }
          } catch (error) {
            console.error('Error loading assigned building:', error);
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserRoleAndBuilding();
  }, []);

  /** Fetch all invoices from API */
  const fetchInvoices = async () => {
    try {
      const res = await invoiceApi.getAll();
      let invoicesData = res.data || [];
      
      // Filter invoices by assigned building if accountant
      if (isAccountant && assignedBuilding) {
        invoicesData = invoicesData.filter((invoice: InvoiceSummaryDTO) => {
          return invoice.buildingId === assignedBuilding.id;
        });
      }
      
      setInvoices(invoicesData);
      applyFilters(invoicesData);
      
      // Extract unique years from invoices
      extractYearsFromInvoices(invoicesData);
      
      // Mark all existing invoices as seen (no toast for old ones)
      invoicesData.forEach((inv: InvoiceSummaryDTO) => seenInvoiceIds.current.add(inv.id));
    } catch (err) {
      console.error("Failed to load invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique years from invoices
  const extractYearsFromInvoices = (invoicesData: InvoiceSummaryDTO[]) => {
    const years = new Set<string>();
    
    invoicesData.forEach((invoice) => {
      if (invoice.issueDate) {
        // Extract year from issueDate (assuming format like "2024-03-15" or similar)
        const year = invoice.issueDate.substring(0, 4);
        if (year && /^\d{4}$/.test(year)) {
          years.add(year);
        }
      }
    });
    
    // Convert to array and sort descending (most recent first)
    const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    setAvailableYears(['all', ...sortedYears]);
    
    // Set default to current year or most recent year
    if (sortedYears.length > 0 && selectedYear === 'all') {
      const currentYear = new Date().getFullYear().toString();
      if (sortedYears.includes(currentYear)) {
        setSelectedYear(currentYear);
      } else {
        setSelectedYear(sortedYears[0]);
      }
    }
  };

  // Apply filters to invoices
  const applyFilters = (invoicesData: InvoiceSummaryDTO[]) => {
    let filtered = [...invoicesData];
    
    // Apply year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter((invoice) => {
        if (!invoice.issueDate) return false;
        return invoice.issueDate.startsWith(selectedYear);
      });
    }
    
    setFilteredInvoices(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  // Calculate paginated data
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredInvoices.length / itemsPerPage);
  }, [filteredInvoices.length, itemsPerPage]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Apply filters when selectedYear changes
  useEffect(() => {
    if (invoices.length > 0) {
      applyFilters(invoices);
    }
  }, [selectedYear, isAccountant, assignedBuilding]);

  /** Show toast only for new invoices arriving via WebSocket */
  useEffect(() => {
    invoices.forEach((inv) => {
      if (!seenInvoiceIds.current.has(inv.id)) {
        toast.success(`New Invoice Generated: ${inv.invoiceNumber}`, {
          duration: 5000,
        });
        seenInvoiceIds.current.add(inv.id);
      }
    });
  }, [invoices]);

  /** View PDF in a new window using API */
  const viewPdf = async (invoice: InvoiceSummaryDTO) => {
    if (!invoice.id) return toast.error("PDF not available");

    // Check if invoice belongs to accountant's building
    if (isAccountant && assignedBuilding && invoice.buildingId !== assignedBuilding.id) {
      return toast.error("You can only view invoices from your assigned building");
    }

    const apiUrl = `/api/invoices/download/${invoice.id}`;

    try {
      const res = await invoiceApi.downloadPDF(invoice.id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const newWindow = window.open(url, "_blank");
      if (!newWindow) toast.error("Popup blocked by browser");
      else
        console.log(
          `Successfully opened PDF for invoice ${invoice.invoiceNumber}.  API URL: ${apiUrl}`
        );
    } catch (err) {
      console.error("Failed to view PDF:", err);
      toast.error("PDF not available");
    }
  };

  /** Download PDF using API */
  const downloadPdf = async (invoice: InvoiceSummaryDTO) => {
    if (!invoice.id) return toast.error("PDF not available");

    // Check if invoice belongs to accountant's building
    if (isAccountant && assignedBuilding && invoice.buildingId !== assignedBuilding.id) {
      return toast.error("You can only download invoices from your assigned building");
    }

    const apiUrl = `/api/invoices/download/${invoice.id}`;

    try {
      const res = await invoiceApi.downloadPDF(invoice.id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      console.log(
        `Successfully downloaded PDF for invoice ${invoice.invoiceNumber}. API URL: ${apiUrl}`
      );
    } catch (err) {
      console.error("Failed to download PDF:", err);
      toast.error("Download failed");
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      
      let start = Math.max(currentPage - halfVisible, 1);
      let end = Math.min(start + maxVisiblePages - 1, totalPages);
      
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(end - maxVisiblePages + 1, 1);
      }
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">
          Loading invoices...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Invoices
          </h2>
          {isAccountant && assignedBuilding && (
            <div className="flex items-center gap-2 mt-2">
              <Building className="w-4 h-4 text-[#1E40AF]" />
              <span className="text-sm text-[#1E40AF] font-medium">
                {assignedBuilding.buildingName}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end">
          <p className="text-sm text-stone-500">
            WebSocket: {connected ? "🟢 Connected" : "🔴 Disconnected"}
          </p>
          {isAccountant && assignedBuilding && (
            <p className="text-xs text-[#1E40AF] mt-1">
              Filtered by assigned building
            </p>
          )}
        </div>
      </div>

      {/* Accountant Info */}
      {isAccountant && assignedBuilding && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#1E40AF]" />
            <div>
              <h3 className="font-medium text-[#1E40AF]">Accountant View</h3>
              <p className="text-sm text-[#1E40AF]">
                Showing invoices only from your assigned building: <strong>{assignedBuilding.buildingName}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Filter by Year:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition duration-150 ${
                    selectedYear === year
                      ? 'bg-[#1E40AF] text-white font-medium'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {year === 'all' ? 'All Years' : year}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-stone-600">
            Showing {paginatedInvoices.length} of {filteredInvoices.length} invoices
            {selectedYear !== 'all' && ` for ${selectedYear}`}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white shadow-xl rounded-xl border border-stone-200 divide-y divide-stone-200 mb-6">
        {paginatedInvoices.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-blue-50/50 cursor-pointer transition duration-150"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-900 truncate">
                {inv.invoiceNumber}
              </p>
              <p className="text-sm text-stone-500">
                Tenant: {inv.tenantName} — Room: {inv.roomNumber}
                {!isAccountant && inv.buildingName && (
                  <span className="ml-2">— Building: {inv.buildingName}</span>
                )}
              </p>
              <p className="text-sm text-stone-500">
                Issue Date: {inv.issueDate} — Due Date: {inv.dueDate}
              </p>
              <p className="text-sm text-stone-500">
                Amount: {inv.totalAmount} MMK — Status: {inv.invoiceStatus}
              </p>
            </div>

            <div className="flex gap-2 ml-4 flex-shrink-0">
              <button
                onClick={() => viewPdf(inv)}
                className="px-3 py-2 rounded-lg bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-sm font-medium transition duration-150"
              >
                View
              </button>
              <button
                onClick={() => downloadPdf(inv)}
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition duration-150"
              >
                Download
              </button>
            </div>
          </div>
        ))}
        {paginatedInvoices.length === 0 && (
          <div className="p-12 text-center text-stone-500 bg-stone-50 rounded-b-xl">
            <div className="text-5xl mb-3">📄</div>
            <div className="text-xl font-semibold text-stone-700">
              {isAccountant && assignedBuilding ? (
                `No Invoices Found for ${assignedBuilding.buildingName}`
              ) : (
                "No Invoices Found"
              )}
              {selectedYear !== 'all' && ` in ${selectedYear}`}
            </div>
            <p className="text-sm mt-1">
              Generated invoices will appear here automatically.
              {isAccountant && assignedBuilding && " (Filtered by your assigned building)"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="text-sm text-stone-600">
            Page {currentPage} of {totalPages} • {filteredInvoices.length} total invoices
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition duration-150 ${
                  currentPage === pageNum
                    ? 'bg-[#1E40AF] text-white'
                    : 'border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-stone-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} items
          </div>
        </div>
      )}
    </div>
  );
}