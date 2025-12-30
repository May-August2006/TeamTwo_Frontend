/** @format */
import React, { useEffect, useState } from "react";
import { Download, Calendar, DollarSign, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import API from "../../api/api";
import type { ContractDTO } from "../../types/contract";
import { Pagination } from "../Pagination"; // ⬅️ adjust path if needed

interface LoginTokenPayload {
  roles: string[];
  tenantId: number;
  sub: string;
  iat: number;
  exp: number;
}

const MyContract: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [contracts, setContracts] = useState<ContractDTO[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractDTO | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // 🔹 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // cards per page

  const getTenantIdFromToken = (): number | null => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const decoded: LoginTokenPayload = jwtDecode(token);
      return decoded.tenantId;
    } catch (err) {
      console.error("Failed to decode JWT", err);
      return null;
    }
  };

  useEffect(() => {
    const tenantId = getTenantIdFromToken();
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const fetchContracts = async () => {
      try {
        const response = await API.get<ContractDTO[]>(
          `/api/contracts/tenant/${tenantId}`
        );
        setContracts(response.data);
        setCurrentPage(1); // reset to first page
      } catch (err) {
        console.error("Failed to fetch contracts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const formatCurrency = (amount: number) => {
    // Always use MMK for currency display, regardless of language
    const currency = "MMK";
    const locale = i18n.language === "mm" ? "my-MM" : "en-US";
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      currencyDisplay: "code", // This will show "MMK" instead of symbol
    })
    .format(amount)
    .replace("MMK", "MMK "); // Add space after MMK for better readability
  };

  if (loading) {
    return <div className="p-6 text-center">{t("contract.loading")}</div>;
  }

  // 🔹 Slice contracts for the current page
  const paginatedContracts = contracts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ---------------------- Self-contained Modal ----------------------
  const Modal: React.FC<{
    onClose: () => void;
    children: React.ReactNode;
  }> = ({ onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 relative">
        <button
          className="absolute top-4 right-4 text-stone-500 hover:text-stone-900 text-2xl font-bold"
          onClick={onClose}
        >
          ×
        </button>

        {children}
      </div>
    </div>
  );

  const getStatusTranslation = (status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: t("contract.status.active"),
      EXPIRED: t("contract.status.expired"),
      TERMINATED: t("contract.status.terminated"),
      PENDING: t("contract.status.pending"),
      DRAFT: t("contract.status.draft"),
    };
    return statusMap[status] || status;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
        {t("contract.title")}
      </h2>

      {/* Contract Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedContracts.map((contract) => (
          <div
            key={contract.id}
            className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 cursor-pointer hover:shadow-xl transition duration-150"
            onClick={() => setSelectedContract(contract)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-stone-900">
                {contract.contractNumber}
              </h3>

              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  contract.contractStatus === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : contract.contractStatus === "EXPIRED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {getStatusTranslation(contract.contractStatus)}
              </div>
            </div>

            <p className="text-stone-600 text-sm">
              <Calendar className="inline w-4 h-4 mr-1" />
              {contract.startDate} - {contract.endDate}
            </p>

            <p className="text-stone-600 text-sm mt-1">
              <DollarSign className="inline w-4 h-4 mr-1" />
              {formatCurrency(contract.rentalFee)} /{" "}
              {i18n.language === "mm" ? "လစဉ်" : "month"}
            </p>

            <p className="text-stone-600 text-sm mt-1">
              <Building2 className="inline w-4 h-4 mr-1" />
              {contract.unit?.unitNumber}
            </p>
          </div>
        ))}
      </div>

      {/* 🔹 ALWAYS visible pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={contracts.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Contract Details Modal */}
      {selectedContract && (
        <Modal onClose={() => setSelectedContract(null)}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {selectedContract.contractNumber}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedContract.contractStatus === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : selectedContract.contractStatus === "EXPIRED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {getStatusTranslation(selectedContract.contractStatus)}
              </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-stone-600">
                  {t("contract.startDate")}
                </p>
                <p className="font-semibold">{selectedContract.startDate}</p>
              </div>

              <div>
                <p className="text-sm text-stone-600">
                  {t("contract.endDate")}
                </p>
                <p className="font-semibold">{selectedContract.endDate}</p>
              </div>

              <div>
                <p className="text-sm text-stone-600">
                  {t("tenant.monthlyRent")}
                </p>
                <p className="font-semibold">
                  {formatCurrency(selectedContract.rentalFee)}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-600">
                  {t("tenant.securityDeposit")}
                </p>
                <p className="font-semibold">
                  {formatCurrency(selectedContract.securityDeposit)}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-600">{t("tenant.space")}</p>
                <p className="font-semibold">
                  {selectedContract.unit?.unitNumber}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-600">
                  {t("tenant.businessType")}
                </p>
                <p className="font-semibold">
                  {selectedContract.unit?.unitTypeDisplay}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-600">
                  {t("contract.contactPerson")}
                </p>
                <p className="font-semibold">
                  {selectedContract.tenant.tenantName}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-600">
                  {t("contract.contactEmail")}
                </p>
                <p>{selectedContract.tenant.email}</p>
              </div>

              <div>
                <p className="text-sm text-stone-600">
                  {t("contract.contactPhone")}
                </p>
                <p>{selectedContract.tenant.phone}</p>
              </div>
            </div>

            {/* Key Terms */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4">
                {t("tenant.keyContractTerms")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between p-3 bg-stone-50 rounded-lg border">
                  <span>{t("tenant.leaseDuration")}</span>
                  <span className="font-semibold">
                    {selectedContract.contractDurationType}
                  </span>
                </div>

                <div className="flex justify-between p-3 bg-stone-50 rounded-lg border">
                  <span>{t("tenant.rentDueDate")}</span>
                  <span className="font-semibold">
                    {t("contract.rentDueDateText")}
                  </span>
                </div>

                <div className="flex justify-between p-3 bg-stone-50 rounded-lg border">
                  <span>{t("tenant.lateFee")}</span>
                  <span className="font-semibold">
                    {selectedContract.gracePeriodDays}{" "}
                    {i18n.language === "mm" ? "ရက်ကြာခွင့်" : "days grace"}
                  </span>
                </div>

                <div className="flex justify-between p-3 bg-stone-50 rounded-lg border">
                  <span>{t("tenant.utilities")}</span>
                  <span className="font-semibold">
                    {selectedContract.includedUtilities
                      ?.map((u) => u.utilityName)
                      .join(", ")}
                  </span>
                </div>

                <div className="flex justify-between p-3 bg-stone-50 rounded-lg border">
                  <span>{t("tenant.renewalOption")}</span>
                  <span className="font-semibold">
                    {selectedContract.renewalNoticeDays}{" "}
                    {i18n.language === "mm"
                      ? "ရက်ကြိုတင်အသိပေးချက်"
                      : "days notice"}
                  </span>
                </div>
              </div>
            </div>

            {/* Download */}
            {selectedContract.fileUrl && (
              <div className="flex justify-end mt-6">
                <a
                  href={selectedContract.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("tenant.downloadFullContract")}
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyContract;