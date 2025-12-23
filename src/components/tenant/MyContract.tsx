/** @format */
import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import API from "../../api/api";
import type { ContractDTO } from "../../types/contract";

interface LoginTokenPayload {
  roles: string[];
  tenantId: number;
  sub: string;
  iat: number;
  exp: number;
}

const MyContract: React.FC = () => {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<ContractDTO[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractDTO | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Extract tenantId from JWT stored in localStorage
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
      } catch (err) {
        console.error("Failed to fetch contracts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">{t("loading")}...</div>;
  }

  // ---------------------- Self-contained Modal ----------------------
  const Modal: React.FC<{
    onClose: () => void;
    children: React.ReactNode;
  }> = ({ onClose, children }) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 relative">
          {/* Close button inside modal */}
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
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
        Contracts
      </h2>

      {/* Contract Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((contract) => (
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
                {contract.contractStatus}
              </div>
            </div>
            <p className="text-stone-600 text-sm">
              <Calendar className="inline w-4 h-4 mr-1" />
              {contract.startDate} - {contract.endDate}
            </p>
            <p className="text-stone-600 text-sm mt-1">
              <DollarSign className="inline w-4 h-4 mr-1" />
              {contract.rentalFee} / month
            </p>
            <p className="text-stone-600 text-sm mt-1">
              <Building2 className="inline w-4 h-4 mr-1" />
              {contract.unit?.unitNumber}
            </p>
          </div>
        ))}
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
        <Modal onClose={() => setSelectedContract(null)}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {selectedContract.contractNumber}
              </h3>
            </div>

            {/* Contract Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-stone-600">Start Date</p>
                <p className="font-semibold">{selectedContract.startDate}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">End Date</p>
                <p className="font-semibold">{selectedContract.endDate}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">
                  {t("tenant.monthlyRent")}
                </p>
                <p className="font-semibold">{selectedContract.rentalFee}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">
                  {t("tenant.securityDeposit")}
                </p>
                <p className="font-semibold">
                  {selectedContract.securityDeposit}
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
                <p className="text-sm text-stone-600">Contact Person</p>
                <p className="font-semibold">
                  {selectedContract.tenant.tenantName}
                </p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Contact Email</p>
                <p>{selectedContract.tenant.email}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Contact Phone</p>
                <p>{selectedContract.tenant.phone}</p>
              </div>
            </div>

            {/* Key Contract Terms */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4">
                {t("tenant.keyContractTerms")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span>{t("tenant.leaseDuration")}</span>
                  <span className="font-semibold">
                    {selectedContract.contractDurationType}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span>{t("tenant.rentDueDate")}</span>
                  <span className="font-semibold">15th of each month</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span>{t("tenant.lateFee")}</span>
                  <span className="font-semibold">
                    {selectedContract.gracePeriodDays} days grace
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span>{t("tenant.utilities")}</span>
                  <span className="font-semibold">
                    {selectedContract.includedUtilities
                      ?.map((u) => u.utilityName)
                      .join(", ")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span>{t("tenant.renewalOption")}</span>
                  <span className="font-semibold">
                    {selectedContract.renewalNoticeDays} days notice
                  </span>
                </div>
              </div>
            </div>

            {/* Download Button */}
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
