/** @format */

import API from "./api";
import type { AccountantDashboard } from "../types/accountantDashboard";

export const dashboardApi = {
  // Get Accountant Dashboard Data
  async getAccountantDashboard(): Promise<AccountantDashboard> {
    const response = await API.get<AccountantDashboard>("/api/accountant/dashboard");
    return response.data;
  },

  async getAccountantDashboardByDate(date: string): Promise<AccountantDashboard> {
    const response = await API.get<AccountantDashboard>(`/api/accountant/dashboard/by-date?date=${date}`);
    return response.data;
  },
};