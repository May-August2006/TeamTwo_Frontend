/** @format */
import API from "./api";
import type { Announcement, AnnouncementRequest } from "../types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  building?: any;
}
export const announcementApi = {
  send: (data: AnnouncementRequest) =>
    API.post<Announcement>("/api/announcements/send", data),
  getAll: () => API.get<Announcement[]>("/api/announcements"),
  getRecent: (limit = 10) =>
    API.get<Announcement[]>("/api/announcements/recent", { params: { limit } }),
  
  // Manager endpoints
 sendToMyBuilding: (data: AnnouncementRequest) =>
    API.post<ApiResponse<AnnouncementRequest>>("/api/announcements/manager/send", data),
  
  getMyBuildingAnnouncements: () =>
    API.get<ApiResponse<Announcement[]>>("/api/announcements/manager/my-building"),

};
