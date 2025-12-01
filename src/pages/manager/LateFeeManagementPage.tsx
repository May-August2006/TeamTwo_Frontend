/** @format */
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, X } from "lucide-react";
import { lateFeeApi } from "../../api/LateFeeAPI";
import { invoiceApi } from "../../api/InvoiceAPI";
import type { InvoiceDTO, LateFeePolicy } from "../../types";
import { useAuth } from "../../context/AuthContext";

export function LateFeeManagementPage() {
  // -------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null
  );

  const [lateDays, setLateDays] = useState(1);
  const [reason, setReason] = useState("");

  const { userId } = useAuth();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Policy state
  const [policy, setPolicy] = useState<LateFeePolicy | null>(null);

  // -------------------------------------------------------------
  // Fetch overdue invoices
  // -------------------------------------------------------------
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getOverdueInvoices(); // returns InvoiceDTO[]

      // Fetch late fees for each invoice
      const invoicesWithLateFees = await Promise.all(
        res.data.map(async (invoice) => {
          try {
            const lateFeeRes = await lateFeeApi.getByInvoiceId(invoice.id);
            return { ...invoice, lateFees: lateFeeRes.data };
          } catch {
            return { ...invoice, lateFees: [] };
          }
        })
      );

      setInvoices(invoicesWithLateFees);
    } catch {
      toast.error("Failed to load overdue invoices");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Load Policy Amount
  // -------------------------------------------------------------
  const loadPolicy = async () => {
    try {
      setLoading(true);
      const res = await lateFeeApi.getPolicy();
      setPolicy(res.data); // Save full policy including id
    } catch {
      toast.error("Failed to load policy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadPolicy();

    // const interval = setInterval(() => {
    //   loadInvoices();
    // }, 10000); // refresh every 10 seconds

    // return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------
  // Create Manual Late Fee
  // -------------------------------------------------------------
  const createLateFee = async () => {
    if (!selectedInvoice) return toast.error("Please select an invoice");
    if (lateDays <= 0) return toast.error("Late days must be greater than 0");

    const LateFeeRequest = {
      invoiceId: selectedInvoice.id,
      lateDays,
      reason,
      appliedBy: userId!, // TODO replace with real user ID
    };

    try {
      const res = await lateFeeApi.addManualLateFee(LateFeeRequest);
      toast.success("Late fee added!");

      // Fetch generated PDF
      const pdfRes = await lateFeeApi.downloadLateFeePdf(res.data.id);
      const blobUrl = window.URL.createObjectURL(pdfRes.data);
      setPdfUrl(blobUrl);

      // Refresh invoices list to include new late fee
      await loadInvoices();
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate late fee");
    }
  };

  // -------------------------------------------------------------
  // Update policy
  // -------------------------------------------------------------
  const updatePolicy = async () => {
    if (!policy?.id) return toast.error("No policy loaded");
    try {
      await lateFeeApi.updatePolicy(policy.id, {
        ...policy,
        amountPerDay: Number(policy.amountPerDay),
      });

      toast.success("Policy updated successfully");
      loadPolicy();
    } catch {
      toast.error("Failed to update policy");
    }
  };

  // -------------------------------------------------------------
  // Close PDF
  // -------------------------------------------------------------
  const closePdf = () => setPdfUrl(null);

  // =============================================================
  // RENDER UI
  // =============================================================
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Late Fee Management</h1>

      {/* ---------------------- POLICY SECTION ------------------------- */}
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="text-xl font-bold mb-3">Late Fee Policy</h2>

        <div className="flex items-center gap-4">
          <input
            type="number"
            value={policy?.amountPerDay ?? ""}
            onChange={(e) =>
              setPolicy({ ...policy!, amountPerDay: e.target.value })
            }
            className="border p-2 rounded w-40"
            placeholder="Amount per day"
          />

          <button
            onClick={updatePolicy}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Update Policy
          </button>
        </div>
      </section>

      {/* ------------------- OVERDUE INVOICE LIST --------------------- */}
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="text-xl font-bold mb-3">Overdue Invoices</h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-gray-500 py-10 text-center">
            No overdue invoices found.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b text-left">
                <th className="p-3">Invoice ID</th>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tenant</th>
                <th className="p-3">Room</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Balance</th>
                <th className="p-3">PDF File</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`cursor-pointer hover:bg-blue-100 ${
                    selectedInvoice?.id === inv.id ? "bg-blue-200" : ""
                  }`}
                >
                  <td className="p-3">{inv.id}</td>
                  <td className="p-3">{inv.invoiceNumber}</td>
                  <td className="p-3">{inv.invoiceStatus}</td>
                  <td className="p-3">{inv.tenantName}</td>
                  <td className="p-3">{inv.roomNumber}</td>
                  <td className="p-3">{inv.dueDate}</td>
                  <td className="p-3">{inv.balanceAmount}</td>

                  <td className="p-3 flex items-center gap-2">
                    {inv.lateFees?.map((lf) => (
                      <div key={lf.id} className="flex items-center gap-1">
                        {/* Open PDF in new tab using your download endpoint */}
                        <button
                          onClick={() =>
                            window.open(
                              `http://localhost:8080/api/late-fees/download/${lf.id}`,
                              "_blank"
                            )
                          }
                          className="text-blue-600 hover:underline text-sm"
                          title="View Late Fee PDF"
                        >
                          PDF
                        </button>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ----------------------- APPLY LATE FEE ------------------------- */}
      {selectedInvoice && (
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="text-xl font-bold mb-3">Apply Late Fee</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold">Late Days</label>
              <input
                type="number"
                value={lateDays}
                onChange={(e) =>
                  setLateDays(e.target.value ? parseInt(e.target.value) : 0)
                }
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>

          <button
            onClick={createLateFee}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Generate Late Fee
          </button>
        </section>
      )}

      {/* ------------------------- PDF VIEWER --------------------------- */}
      {pdfUrl && (
        <section className="bg-white rounded-xl shadow p-5 relative">
          <button
            onClick={closePdf}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          >
            <X size={22} />
          </button>

          <h2 className="text-lg font-semibold mb-3">Late Fee Invoice PDF</h2>

          <iframe src={pdfUrl} className="w-full h-[600px] border" />
        </section>
      )}
    </div>
  );
}
