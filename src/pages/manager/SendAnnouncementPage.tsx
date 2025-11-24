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
    <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in z-[9999]">
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
    <div className="relative p-6 bg-white rounded-lg shadow space-y-8">
      {/* ==================== Composer ==================== */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Create Announcement</h1>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <textarea
            rows={6}
            placeholder="Announcement message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border p-2 rounded"
          />

          {/* <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border p-2 rounded"
          /> */}

          <div className="flex gap-2">
            <button
              onClick={() => setPreviewOpen(true)}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Preview
            </button>

            <button
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {loading ? "Sending..." : "Send Announcement"}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== Preview Modal ==================== */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">Preview Announcement</h2>
            <p>
              <strong>Title:</strong> {title}
            </p>
            <p>
              <strong>Message:</strong> {message}
            </p>
            {scheduledAt && (
              <p>
                <strong>Scheduled:</strong>{" "}
                {new Date(scheduledAt).toLocaleString()}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
              >
                Close
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Announcement List ==================== */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Announcement History</h2>

        <div className="divide-y border rounded-lg">
          {announcements.length === 0 && (
            <p className="p-4 text-gray-500 text-center">
              No announcements yet.
            </p>
          )}

          {announcements.map((a) => (
            <div key={a.id} className="p-4 hover:bg-gray-50 transition">
              <h3 className="font-medium text-gray-900">{a.title}</h3>
              <p className="text-gray-700 mt-1">{a.message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Posted: {new Date(a.createdAt).toLocaleString()}
              </p>
              {a.scheduledAt && (
                <p className="text-sm text-gray-500">
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
