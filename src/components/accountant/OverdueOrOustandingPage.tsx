/** @format */
import { useEffect, useState } from "react";
import { invoiceApi } from "../../api/InvoiceAPI";
import type { InvoiceDTO } from "../../types";
import { Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";

type StatusType = "OVERDUE" | "OUTSTANDING";

export function OverdueOrOutstandingPage() {
  const [activeTab, setActiveTab] = useState<StatusType>("OVERDUE");
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null
  );

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.getInvoicesByStatus(activeTab);
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    setPdfUrl(null);
    setSelectedInvoice(null);
  }, [activeTab]);

  const rowColor = (status: string, isSelected: boolean) => {
    if (isSelected) return "bg-blue-100 hover:bg-blue-200";
    if (status === "OVERDUE") return "bg-red-200 hover:bg-red-300";
    if (status === "OUTSTANDING") return "bg-yellow-200 hover:bg-yellow-300";
    return "";
  };

  const viewPdf = async (invoice: InvoiceDTO) => {
    if (!invoice.id) return toast.error("PDF not available");

    try {
      const res = await invoiceApi.downloadPDF(invoice.id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      setPdfUrl(url);
      setSelectedInvoice(invoice);
    } catch (err) {
      console.error("Failed to view PDF:", err);
      toast.error("PDF not available");
    }
  };

  const closePdf = () => {
    setPdfUrl(null);
    setSelectedInvoice(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Unpaid Invoices</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {(["OVERDUE", "OUTSTANDING"] as StatusType[]).map((tab) => (
          <button
            key={tab}
            className={`px-5 py-2 rounded-xl font-semibold transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        {loading ? (
          <div className="flex justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Loading invoices…
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No invoices found.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left bg-gray-100">
                <th className="p-3">Invoice No</th>
                <th className="p-3">Tenant</th>
                <th className="p-3">Room</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <tr
                    key={inv.id}
                    className={`cursor-pointer transition ${rowColor(
                      inv.invoiceStatus,
                      isSelected
                    )}`}
                    onClick={() => viewPdf(inv)}
                  >
                    <td className="p-3">{inv.invoiceNumber}</td>
                    <td className="p-3">{inv.tenantName}</td>
                    <td className="p-3">{inv.roomNumber}</td>
                    <td className="p-3">{inv.dueDate}</td>
                    <td className="p-3">{inv.balanceAmount}</td>
                    <td className="p-3 font-bold">{inv.invoiceStatus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PDF Preview */}
      {pdfUrl && selectedInvoice && (
        <div className="bg-white rounded-xl shadow p-4 relative">
          <button
            onClick={closePdf}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            title="Close PDF"
          >
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold mb-2">
            Preview: {selectedInvoice.invoiceNumber}
          </h2>
          <iframe
            src={pdfUrl}
            title={`Invoice ${selectedInvoice.invoiceNumber}`}
            className="w-full h-[600px] border"
          />
        </div>
      )}
    </div>
  );
}
