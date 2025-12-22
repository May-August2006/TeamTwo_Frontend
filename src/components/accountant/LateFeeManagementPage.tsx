/** @format */
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FileText, Loader2, X, Building } from "lucide-react";
import { lateFeeApi } from "../../api/LateFeeAPI";
import { invoiceApi } from "../../api/InvoiceAPI";
import { buildingApi } from "../../api/BuildingAPI";
import type {
  InvoiceDTO,
  LateFeePolicy,
  LateFeePolicyRequest,
} from "../../types";
import { useAuth } from "../../context/AuthContext";
import LateFeePaymentForm from "./LateFeePaymentForm";
import { useRef } from "react";

export function LateFeeManagementPage() {
  // -------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [showLateFeePayment, setShowLateFeePayment] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null
  );
  const hasOverdue = selectedInvoice && (selectedInvoice.daysOverdue ?? 0) > 0;

  const [lateDays, setLateDays] = useState(1);
  const [reason, setReason] = useState("");

  const lateFeePaymentRef = useRef<HTMLDivElement | null>(null);

  const { userId } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Policy state
  const [policy, setPolicy] = useState<LateFeePolicy | null>(null);
  const [newPolicyAmount, setNewPolicyAmount] = useState<number | "">("");
  const [newGracePeriodDays, setNewGracePeriodDays] = useState<number>(0);
  const [newDailyInterestPercent, setNewDailyInterestPercent] =
    useState<string>("");

  // Accountant restrictions
  const [assignedBuilding, setAssignedBuilding] = useState<any>(null);
  const [isAccountant, setIsAccountant] = useState(false);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceDTO[]>([]);

  // -------------------------------------------------------------
  // Check user role and assigned building
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Fetch overdue invoices
  // -------------------------------------------------------------
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getOverdueInvoices(); // returns InvoiceDTO[]

      const invoicesWithLateFees = await Promise.all(
        res.data.map(async (invoice) => {
          try {
            const lateFeeRes = await lateFeeApi.getByInvoiceId(invoice.id);

            console.log("late fee: ", lateFeeRes);
            return { ...invoice, lateFees: lateFeeRes.data };
          } catch {
            return { ...invoice, lateFees: [] };
          }
        })
      );

      // Filter invoices by assigned building if accountant
      let filteredData = invoicesWithLateFees;
      if (isAccountant && assignedBuilding) {
        filteredData = invoicesWithLateFees.filter((invoice: InvoiceDTO) => {
          return invoice.buildingId === assignedBuilding.id;
        });
      }

      setInvoices(filteredData);
      setFilteredInvoices(filteredData);
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
      const res = await lateFeeApi.getPolicy(); // may return null if no policy exists
      if (res) {
        setPolicy(res); // Save full policy including id
      } else {
        setPolicy(null); // No policy exists yet
      }
    } catch {
      toast.error("Failed to load policy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadPolicy();
    toast.success("Test toast is working!");
  }, []);

  // -------------------------------------------------------------
  // Create Manual Late Fee
  // -------------------------------------------------------------
  const createLateFee = async () => {
    if (!selectedInvoice) return toast.error("Please select an invoice");

    // Check if selected invoice belongs to accountant's building
    if (isAccountant && assignedBuilding && selectedInvoice.buildingId !== assignedBuilding.id) {
      return toast.error("You can only apply late fees to invoices from your assigned building");
    }

    const overdueDays = selectedInvoice.daysOverdue ?? 0;

    // NEW VALIDATION — prevents entering lateDays > overdueDays
    if (lateDays > overdueDays) {
      return toast.error(
        `Late days cannot exceed overdue days (${overdueDays} days)`
      );
    }

    if (lateDays <= 0) return toast.error("Late days must be greater than 0");

    const LateFeeRequest = {
      invoiceId: selectedInvoice.id,
      lateDays,
      reason,
      appliedBy: userId!,
    };

    try {
      const res = await lateFeeApi.addManualLateFee(LateFeeRequest);
      toast.success("Late fee added!");

      // Fetch generated PDF
      const pdfRes = await lateFeeApi.downloadLateFeePdf(res.data.id);
      const blobUrl = window.URL.createObjectURL(pdfRes.data);
      setPdfUrl(blobUrl);

      await loadInvoices();
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate late fee");
    }
  };

  // -------------------------------------------------------------
  // Update existing policy
  // -------------------------------------------------------------
  const updatePolicy = async () => {
    if (!policy) return toast.error("No policy loaded");

    // Validation
    if (!policy.amountPerDay || Number(policy.amountPerDay) <= 0) {
      return toast.error("Amount per day must be greater than 0");
    }
    if (policy.gracePeriodDays == null || policy.gracePeriodDays < 0) {
      return toast.error("Grace period must be 0 or greater");
    }
    if (!policy.dailyInterestPercent) {
      return toast.error("Daily interest percent is required");
    }

    try {
      const request: LateFeePolicyRequest = {
        amountPerDay: policy.amountPerDay.toString(),
        gracePeriodDays: policy.gracePeriodDays,
        dailyInterestPercent: policy.dailyInterestPercent.toString(),
      };

      await lateFeeApi.updatePolicy(request);

      toast.success("Policy updated successfully");
      loadPolicy();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update policy");
    }
  };

  // -------------------------------------------------------------
  // Create new policy
  // -------------------------------------------------------------
  const createPolicy = async () => {
    if (!newPolicyAmount || newPolicyAmount <= 0) {
      return toast.error("Please enter a valid amount per day");
    }

    if (newGracePeriodDays < 0) {
      return toast.error("Grace period must be 0 or greater");
    }
    if (!newDailyInterestPercent) {
      return toast.error("Daily interest percent is required");
    }

    const request: LateFeePolicyRequest = {
      amountPerDay: newPolicyAmount.toString(),
      gracePeriodDays: newGracePeriodDays,
      dailyInterestPercent: newDailyInterestPercent.toString(),
    };

    try {
      await lateFeeApi.createPolicy(request);
      toast.success("Late fee policy created successfully");

      // Clear form
      setNewPolicyAmount("");
      setNewGracePeriodDays(0);
      setNewDailyInterestPercent("");

      loadPolicy();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create policy");
    }
  };

  // -------------------------------------------------------------
  // Close PDF
  // -------------------------------------------------------------
  const closePdf = () => setPdfUrl(null);

  const getLateFeeBadge = (invoice: InvoiceDTO) => {
    if (!invoice.lateFees || invoice.lateFees.length === 0) return null;

    console.log("late fee: ", invoice.lateFees);

    if (invoice.lateFees.some((lf) => lf.status === "OVERDUE")) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-semibold">
          OVERDUE
        </span>
      );
    }

    if (invoice.lateFees.some((lf) => lf.status === "PENDING")) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-semibold">
          PENDING
        </span>
      );
    }

    if (invoice.lateFees.every((lf) => lf.status === "PAID")) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-semibold">
          PAID
        </span>
      );
    }

    if (invoice.lateFees.every((lf) => lf.status === "WAIVED")) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-red-700 font-semibold">
          WAIVED
        </span>
      );
    }

    return null;
  };

  // =============================================================
  // RENDER UI
  // =============================================================
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Late Fee Management</h1>
          {isAccountant && assignedBuilding && (
            <div className="flex items-center gap-2 mt-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                {assignedBuilding.buildingName}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            if (!selectedInvoice) {
              toast.error("Please select an invoice first");
              return;
            }

            // Check if selected invoice belongs to accountant's building
            if (isAccountant && assignedBuilding && selectedInvoice.buildingId !== assignedBuilding.id) {
              toast.error("You can only pay late fees for invoices from your assigned building");
              return;
            }

            setShowLateFeePayment(true);

            // scroll AFTER render
            setTimeout(() => {
              lateFeePaymentRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 100);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Record Late Fee Payment
        </button>
      </div>

      {/* Accountant Info */}
      {isAccountant && assignedBuilding && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-800">Accountant View</h3>
              <p className="text-sm text-blue-600">
                Showing late fee management only for your assigned building: <strong>{assignedBuilding.buildingName}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------- POLICY SECTION ------------------------- */}
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="text-xl font-bold mb-4">Late Fee Policy</h2>

        {policy ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Amount per day */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Amount per day (MMK)
              </label>
              <input
                type="number"
                value={policy.amountPerDay ?? ""}
                onChange={(e) =>
                  setPolicy({
                    ...policy!,
                    amountPerDay: Number(e.target.value),
                  })
                }
                className="border p-2 rounded"
              />
            </div>

            {/* Grace period */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Grace period (days)
              </label>
              <input
                type="number"
                value={policy.gracePeriodDays ?? 0}
                onChange={(e) =>
                  setPolicy({
                    ...policy!,
                    gracePeriodDays: Number(e.target.value),
                  })
                }
                className="border p-2 rounded"
              />
            </div>

            {/* Daily interest */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Daily interest (%)
              </label>
              <input
                type="text"
                value={policy.dailyInterestPercent ?? ""}
                onChange={(e) =>
                  setPolicy({
                    ...policy!,
                    dailyInterestPercent: e.target.value,
                  })
                }
                className="border p-2 rounded"
              />
            </div>

            {/* Button */}
            <button
              onClick={updatePolicy}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 h-[42px]"
            >
              Update Policy
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Amount per day (MMK)
              </label>
              <input
                type="number"
                value={newPolicyAmount}
                onChange={(e) =>
                  setNewPolicyAmount(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="border p-2 rounded"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Grace period (days)
              </label>
              <input
                type="number"
                value={newGracePeriodDays}
                onChange={(e) => setNewGracePeriodDays(Number(e.target.value))}
                className="border p-2 rounded"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Daily interest (%)
              </label>
              <input
                type="text"
                value={newDailyInterestPercent}
                onChange={(e) => setNewDailyInterestPercent(e.target.value)}
                className="border p-2 rounded"
              />
            </div>

            <button
              onClick={createPolicy}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 h-[42px]"
            >
              Create Policy
            </button>
          </div>
        )}
      </section>

      {/* ------------------- OVERDUE INVOICE LIST --------------------- */}
      <section className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Overdue Invoices</h2>
          {isAccountant && assignedBuilding && (
            <span className="text-sm text-blue-600">
              Filtered by: {assignedBuilding.buildingName}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <p className="text-gray-500 py-10 text-center">
            {isAccountant && assignedBuilding ? (
              `No overdue invoices found for ${assignedBuilding.buildingName}.`
            ) : (
              "No overdue invoices found."
            )}
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b text-left">
                <th className="p-3">Invoice ID</th>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Unpaid Balance</th>
                <th className="p-3">Tenant</th>
                <th className="p-3">Building</th>
                <th className="p-3">Overdue Days</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Late Fee</th>
                <th className="p-3">Late Fee Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`cursor-pointer hover:bg-blue-100 ${
                    inv.daysOverdue === 0 ? "opacity-60 cursor-not-allowed" : ""
                  } ${selectedInvoice?.id === inv.id ? "bg-blue-200" : ""}`}
                >
                  <td className="p-3">{inv.id}</td>
                  <td className="p-3">{inv.invoiceNumber}</td>
                  <td className="p-3">{inv.unpaidBalance}</td>
                  <td className="p-3">{inv.tenantName}</td>
                  <td className="p-3">{inv.roomNumber}</td>
                  <td className="p-3">
                    {inv.daysOverdue > 0 ? (
                      <span className="font-semibold text-red-600">
                        {inv.daysOverdue}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not overdue</span>
                    )}
                  </td>

                  <td className="p-3">{inv.balanceAmount}</td>

                  <td className="p-3 flex items-center gap-2">
                    {inv.lateFees?.map((lf) => (
                      <button
                        key={lf.id}
                        onClick={() =>
                          window.open(
                            `http://localhost:8080/api/late-fees/download/${lf.id}`,
                            "_blank"
                          )
                        }
                        className="p-2 rounded-lg hover:bg-blue-100 transition"
                        title="Download PDF"
                      >
                        <FileText className="w-5 h-5 text-blue-600" />
                      </button>
                    ))}
                  </td>
                  <td className="p-3">
                    {getLateFeeBadge(inv) ?? (
                      <span className="text-gray-400 italic text-sm">—</span>
                    )}
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

          {!hasOverdue ? (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-lg">
              This invoice is <strong>not overdue</strong>. Late fees can only
              be applied to overdue invoices.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold">Late Days</label>
                  <input
                    type="number"
                    value={lateDays}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const overdueDays = selectedInvoice.daysOverdue ?? 0;

                      if (value > overdueDays) {
                        toast.error(
                          `Late days cannot exceed overdue days (${overdueDays})`
                        );
                        return;
                      }

                      setLateDays(value);
                    }}
                    className="border p-2 rounded w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max: {selectedInvoice.daysOverdue} days
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">
                    Reason (optional)
                  </label>
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
                disabled={!hasOverdue}
                className={`mt-4 px-6 py-2 rounded-lg text-white ${
                  hasOverdue
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Generate Late Fee
              </button>
            </>
          )}
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

      {showLateFeePayment && (
        <div ref={lateFeePaymentRef}>
          <LateFeePaymentForm
            initialInvoiceId={selectedInvoice?.id}
            onPaymentRecorded={() => {
              toast.success("Late Fee Payment Recorded!");
              setShowLateFeePayment(false);
              loadInvoices();
            }}
            onCancel={() => setShowLateFeePayment(false)}
          />
        </div>
      )}
    </div>
  );
}