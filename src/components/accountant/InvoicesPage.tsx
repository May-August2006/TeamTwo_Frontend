/** @format */

import { useEffect, useState, useRef } from "react";
import { useInvoicesWebSocket } from "../../hooks/useInvoicesWebSocket";
import toast, { Toaster } from "react-hot-toast";
import { invoiceApi, type InvoiceSummaryDTO } from "../../api/InvoiceAPI";
import { buildingApi } from "../../api/BuildingAPI";
import { Building } from "lucide-react";

export default function InvoicesPage() {
  const jwtToken = localStorage.getItem("accessToken") || "";
  const { invoices, setInvoices, connected } = useInvoicesWebSocket(jwtToken);
  const [loading, setLoading] = useState(true);

  // Accountant restrictions
  const [assignedBuilding, setAssignedBuilding] = useState<any>(null);
  const [isAccountant, setIsAccountant] = useState(false);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceSummaryDTO[]>([]);

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
      setFilteredInvoices(invoicesData);
      
      // Mark all existing invoices as seen (no toast for old ones)
      invoicesData.forEach((inv: InvoiceSummaryDTO) => seenInvoiceIds.current.add(inv.id));
    } catch (err) {
      console.error("Failed to load invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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
              <Building className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
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
            <p className="text-xs text-blue-600 mt-1">
              Filtered by assigned building
            </p>
          )}
        </div>
      </div>

      {/* Accountant Info */}
      {isAccountant && assignedBuilding && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-800">Accountant View</h3>
              <p className="text-sm text-blue-600">
                Showing invoices only from your assigned building: <strong>{assignedBuilding.buildingName}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-xl border border-stone-200 divide-y divide-stone-200">
        {filteredInvoices.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-red-50/50 cursor-pointer transition duration-150"
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
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition duration-150"
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
        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center text-stone-500 bg-stone-50 rounded-b-xl">
            <div className="text-5xl mb-3">📄</div>
            <div className="text-xl font-semibold text-stone-700">
              {isAccountant && assignedBuilding ? (
                `No Invoices Found for ${assignedBuilding.buildingName}`
              ) : (
                "No Invoices Found"
              )}
            </div>
            <p className="text-sm mt-1">
              Generated invoices will appear here automatically.
              {isAccountant && assignedBuilding && " (Filtered by your assigned building)"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}