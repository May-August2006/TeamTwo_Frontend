/** @format */

// api/ContractAPI.ts
import API from "./api";
import type {
  Contract,
  CreateContractRequest,
  ContractStatus,
  LeaseTerminationRequest,
  TerminationResult,
  TerminationPreview,
  ContractDTO,
} from "../types/contract";

export const contractApi = {
  // Create new contract with file upload
  create: (formData: FormData) =>
    API.post<Contract>("/api/contracts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Get all contracts
  getAll: () => API.get<Contract[]>("/api/contracts"),

  // Get contract by ID
  getById: (id: number) => API.get<Contract>(`/api/contracts/${id}`),

  // Update contract
  update: (id: number, formData: FormData) =>
    API.put<Contract>(`/api/contracts/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Delete contract
  delete: (id: number) => API.delete<void>(`/api/contracts/${id}`),

  // Update contract status
  updateStatus: (id: number, status: ContractStatus) =>
    API.patch<Contract>(`/api/contracts/${id}/status?status=${status}`),

  // Get contracts by status
  getByStatus: (status: ContractStatus) =>
    API.get<Contract[]>(`/api/contracts/status/${status}`),

  // Search contracts
  search: (query: string) =>
    API.get<Contract[]>(`/api/contracts/search?q=${query}`),

  // Check room availability
  checkRoomAvailability: (roomId: number) =>
    API.get<boolean>(`/api/contracts/unit/${roomId}/available`),

  // Terminate contract(old method)
  terminate: (id: number) =>
    API.patch<Contract>(`/api/contracts/${id}/terminate`),

  // Renew contract
  renew: (id: number, formData: FormData) =>
    API.post<Contract>(`/api/contracts/${id}/renew`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Check expired contracts
  checkExpired: () => API.post<string>("/api/contracts/check-expired"),

  // Download file
  // downloadFile: async (id: number) => {
  //   const response = await API.get(`/api/contracts/${id}/download`);

  //   if (response.data?.fileUrl) {
  //     const link = document.createElement('a');
  //     link.href = response.data.fileUrl;
  //     link.target = '_blank';
  //     link.rel = 'noopener noreferrer';

  //     if (response.data.fileName) {
  //       link.download = response.data.fileName;
  //     }

  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   }

  //   return response;
  // },

  // // Preview file
  // previewFile: async (id: number) => {
  //   const response = await API.get(`/api/contracts/${id}/preview`);

  //   if (response.data?.fileUrl) {
  //     window.open(response.data.fileUrl, '_blank', 'noopener,noreferrer');
  //   }

  //   return response;
  // },

  // Download file - SIMPLE WORKING VERSION
  downloadFile: async (id: number) => {
    try {
      // Get the contract to get the file URL
      const contractResponse = await API.get<Contract>(`/api/contracts/${id}`);
      const contract = contractResponse.data;

      if (!contract.fileUrl) {
        throw new Error("No file available for download");
      }

      // Transform Cloudinary URL for download
      let downloadUrl = contract.fileUrl;

      if (downloadUrl.includes("cloudinary.com")) {
        // Add fl_attachment parameter to force download
        if (downloadUrl.includes("?")) {
          downloadUrl = downloadUrl + "&fl_attachment";
        } else {
          downloadUrl = downloadUrl + "?fl_attachment";
        }

        // Optional: Add filename for better download experience
        if (contract.fileName) {
          const cleanFileName = contract.fileName
            .replace(/[^a-zA-Z0-9.-]/g, "_")
            .replace(/\s+/g, "_");
          downloadUrl = downloadUrl + `:${cleanFileName}`;
        }
      }

      console.log("Download URL:", downloadUrl);

      // Open in new tab/window
      window.open(downloadUrl, "_blank");

      return { data: { downloadUrl } };
    } catch (error) {
      console.error("Error downloading file:", error);

      // Try the API endpoint as fallback
      try {
        const response = await API.get(`/api/contracts/${id}/download`);
        if (response.data?.downloadUrl) {
          window.open(response.data.downloadUrl, "_blank");
          return response;
        }
      } catch (apiError) {
        console.error("API endpoint also failed:", apiError);
      }

      throw error;
    }
  },

  // Preview file - SIMPLE WORKING VERSION
  previewFile: async (id: number) => {
    try {
      // Get the contract to get the file URL
      const contractResponse = await API.get<Contract>(`/api/contracts/${id}`);
      const contract = contractResponse.data;

      if (!contract.fileUrl) {
        throw new Error("No file available for preview");
      }

      // For Cloudinary URLs, use as-is for preview
      const previewUrl = contract.fileUrl;

      console.log("Preview URL:", previewUrl);

      // Open in new tab
      window.open(previewUrl, "_blank", "noopener,noreferrer");

      return { data: { previewUrl } };
    } catch (error) {
      console.error("Error previewing file:", error);

      // Try the API endpoint as fallback
      try {
        const response = await API.get(`/api/contracts/${id}/preview`);
        if (response.data?.fileUrl || response.data?.previewUrl) {
          const url = response.data.fileUrl || response.data.previewUrl;
          window.open(url, "_blank", "noopener,noreferrer");
          return response;
        }
      } catch (apiError) {
        console.error("API endpoint also failed:", apiError);
      }

      throw error;
    }
  },

  // Upload file to existing contract
  uploadFile: (id: number, formData: FormData) =>
    API.post<Contract>(`/api/contracts/${id}/upload-file`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Delete file from contract
  deleteFile: (id: number) => API.delete<Contract>(`/api/contracts/${id}/file`),

  terminateWithDetails: (
    id: number,
    terminationData: LeaseTerminationRequest
  ) =>
    API.post<TerminationResult>(
      `/api/contracts/${id}/terminate`,
      terminationData
    ),

  getActiveByUnit: (unitId: number) =>
    API.get<Contract[]>(`/api/contracts/unit/${unitId}/active`),

  getByTenant: (tenantId: number) =>
    API.get<ContractDTO[]>(`/api/contracts/tenant/${tenantId}`),
};
