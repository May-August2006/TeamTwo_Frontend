/** @format */

export interface MaintenanceRequest {
  id: number;
  tenantId: number;
  tenantName: string;
  roomId: number;
  roomNumber: string;
  requestTitle: string;
  requestDescription: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedTo: number | null;
  assignedToName: string | null;
  completionDate: string | null;
  tenantFeedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceRequest {
  requestTitle: string;
  requestDescription: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  tenantId: number;
  roomId: number;
}

export interface UpdateMaintenanceRequestStatus {
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  feedback?: string;
}

export interface AssignMaintenanceRequest {
  assignedTo: number;
}

export interface MaintenanceStats {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}
export interface Unit {
  id: number;
  unitNumber: string;
  unitType?: string;
  buildingName?: string;
  buildingId?: number;
  rentalFee?: number;
  unitSpace?: number;
  isAvailable?: boolean;
}