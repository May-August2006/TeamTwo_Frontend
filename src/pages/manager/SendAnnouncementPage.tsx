/** @format */

import { useState, useEffect } from "react";
import { announcementApi } from "../../api/announcementApi";
import type { Announcement } from "../../types";

// Toast component
const Toast = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in z-[9999]">
      {message}
    </div>
  );
};

export default function SendAnnouncementPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Load announcements
  const loadAnnouncements = async () => {
    try {
      const res = await announcementApi.getAll();
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to load announcements", err);
      setToast("Failed to load announcements");
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Send announcement
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setToast("Please provide title and message");
      return;
    }

    try {
      setLoading(true);
      await announcementApi.send({
        title,
        message,
        scheduledAt: scheduledAt || undefined,
      });

      // Clear fields
      setTitle("");
      setMessage("");
      setScheduledAt("");
      setPreviewOpen(false);

      setToast("Announcement sent successfully");
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      setToast("Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-white rounded-xl border border-stone-200 shadow-sm space-y-8 min-h-screen bg-stone-50">
      {/* ==================== Composer ==================== */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Create Announcement</h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-stone-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150"
          />

          <textarea
            rows={6}
            placeholder="Announcement message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-stone-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setPreviewOpen(true)}
              disabled={loading}
              className="px-4 py-2 bg-stone-500 hover:bg-stone-600 text-white rounded-lg transition duration-150 disabled:opacity-50"
            >
              Preview
            </button>

            <button
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-150 disabled:opacity-50 font-semibold"
            >
              {loading ? "Sending..." : "Send Announcement"}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== Preview Modal ==================== */}
      {previewOpen && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Preview Announcement</h2>
            <p className="text-stone-700">
              <strong>Title:</strong> {title}
            </p>
            <p className="text-stone-700">
              <strong>Message:</strong> {message}
            </p>
            {scheduledAt && (
              <p className="text-stone-700">
                <strong>Scheduled:</strong>{" "}
                {new Date(scheduledAt).toLocaleString()}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 bg-stone-500 hover:bg-stone-600 text-white rounded-lg transition duration-150"
              >
                Close
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-150 font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Announcement List ==================== */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Announcement History</h2>

        <div className="divide-y border border-stone-200 rounded-lg bg-white">
          {announcements.length === 0 && (
            <p className="p-8 text-stone-500 text-center bg-stone-50 rounded-lg">
              No announcements yet.
            </p>
          )}

          {announcements.map((a) => (
            <div key={a.id} className="p-6 hover:bg-stone-50 transition duration-150">
              <h3 className="font-medium text-stone-900">{a.title}</h3>
              <p className="text-stone-700 mt-2">{a.message}</p>
              <p className="text-sm text-stone-500 mt-3">
                Posted: {new Date(a.createdAt).toLocaleString()}
              </p>
              {a.scheduledAt && (
                <p className="text-sm text-stone-500">
                  Scheduled: {new Date(a.scheduledAt).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ==================== Toast ==================== */}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}