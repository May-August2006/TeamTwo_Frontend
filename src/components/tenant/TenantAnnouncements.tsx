/** @format */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { announcementApi } from "../../api/announcementApi";
import { useAnnouncementsWebSocket } from "../../hooks/useAnnouncementsWebSocket";
import type { Announcement } from "../../types";
import { toast } from "react-hot-toast";

export function TenantAnnouncements() {
  const { t } = useTranslation();
  const jwtToken = localStorage.getItem("accessToken") || "";

  const [buildingId, setBuildingId] = useState<number | undefined>(undefined);
  const { announcements: wsAnnouncements, connected } =
    useAnnouncementsWebSocket(jwtToken, buildingId ?? undefined);
  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>(
    []
  );

  // 🔹 fetch building id
  const loadBuildingId = async () => {
    try {
      const res = await announcementApi.getBuildingIdForLoggedInUser();
      setBuildingId(Number(res.data));
      console.log("buildingId: ", res.data);
    } catch (err) {
      console.error("Failed to fetch building id", err);
      toast.error("Unable to determine your building");
    }
  };

  useEffect(() => {
    loadBuildingId();
  }, []);

  // initial load
  useEffect(() => {
    if (!buildingId) return;

    (async () => {
      try {
        const res = await announcementApi.getAnnouncementsByBuilding(
          buildingId
        );
        setLocalAnnouncements(res.data);
        console.log("announcements: ", res.data);
      } catch (err) {
        console.error("Failed to load announcements", err);
      }
    })();
  }, [buildingId]);

  // merge WS announcements (no duplicates)
  useEffect(() => {
    if (!wsAnnouncements || wsAnnouncements.length === 0) return;

    setLocalAnnouncements((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const newOnes = wsAnnouncements.filter((a) => !ids.has(a.id));
      if (newOnes.length > 0) {
        // show toast for newest
        toast.success(`📢 New announcement: ${newOnes[0].title}`);
      }
      return [...newOnes, ...prev].slice(0, 50); // cap to 50
    });
  }, [wsAnnouncements]);

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
          {t("tenant.announcementsTitle")}
        </h2>
        <p
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            connected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {connected ? `🟢 ${t("tenant.live")}` : `🔴 ${t("tenant.offline")}`}
        </p>
      </div>

      <div className="space-y-4">
        {localAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 text-center">
            <div className="text-5xl mb-3">📢</div>
            <div className="text-xl font-semibold text-stone-700">
              {t("tenant.noAnnouncements")}
            </div>
            <p className="text-sm text-stone-500 mt-1">
              {t("tenant.checkBackLater")}
            </p>
          </div>
        ) : (
          localAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 hover:shadow-xl transition duration-150"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-stone-900 text-lg">
                  {ann.title}
                </h3>
                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                  {new Date(ann.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-3 text-sm text-stone-700 whitespace-pre-wrap bg-stone-50 p-3 rounded-lg">
                {ann.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
