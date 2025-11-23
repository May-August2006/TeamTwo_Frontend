/** @format */
import API from "./api";
import type { Announcement, AnnouncementRequest } from "../types";

export const announcementApi = {
  send: (data: AnnouncementRequest) =>
    API.post<Announcement>("/api/announcements/send", data),
  getAll: () => API.get<Announcement[]>("/api/announcements"),
  getRecent: (limit = 10) =>
    API.get<Announcement[]>("/api/announcements/recent", { params: { limit } }),
};
