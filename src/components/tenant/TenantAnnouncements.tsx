/** @format */
import { useEffect, useState } from "react";
import { announcementApi } from "../../api/announcementApi";
import { useAnnouncementsWebSocket } from "../../hooks/useAnnouncementsWebSocket";
import type { Announcement } from "../../types";
import { toast } from "react-hot-toast"; // optional; use your toast lib

export function TenantAnnouncements() {
  const jwtToken = localStorage.getItem("accessToken") || "";
  const { announcements: wsAnnouncements, connected } =
    useAnnouncementsWebSocket(jwtToken);
  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>(
    []
  );

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const res = await announcementApi.getAll();
        setLocalAnnouncements(res.data);
      } catch (err) {
        console.error("Failed to load announcements", err);
      }
    })();
  }, []);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Announcements</h2>
        <p className="text-sm text-gray-500">
          {connected ? "Live" : "Offline"}
        </p>
      </div>

      <div className="space-y-3">
        {localAnnouncements.length === 0 ? (
          <div className="text-sm text-gray-500">No announcements</div>
        ) : (
          localAnnouncements.map((ann) => (
            <div key={ann.id} className="p-3 rounded border bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{ann.title}</h3>
                <span className="text-xs text-gray-400">
                  {new Date(ann.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                {ann.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
