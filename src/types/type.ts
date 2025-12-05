/** @format */

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roleName: string;
  isActive: boolean;
  lastLogin?: string;
  branchId?: number;
  buildingId?: number;
  branchName?: string;
  buildingName?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

export interface UserRequest {
  username: string;
  email: string;
  fullName: string;
  roleName: string;
  password: string;
  branchId?: number | null;
  buildingId?: number | null;
}
