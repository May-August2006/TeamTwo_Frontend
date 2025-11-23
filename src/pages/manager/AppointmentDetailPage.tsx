/** @format */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { appointmentApi } from "../../api/appointmentApi";
import type { AppointmentDTO } from "../../types";

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!id) return;
      try {
        const res = await appointmentApi.getById(Number(id));
        setAppointment(res.data);
      } catch (err) {
        console.error("Failed to load appointment", err);
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!appointment) return <p>Appointment not found</p>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Back
      </button>

      <h2 className="text-2xl font-semibold mb-4">Appointment Details</h2>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <p className="font-medium">Guest Name:</p>
          <p>{appointment.guestName}</p>
        </div>

        <div>
          <p className="font-medium">Email:</p>
          <p>{appointment.guestEmail}</p>
        </div>

        <div>
          <p className="font-medium">Phone:</p>
          <p>{appointment.guestPhone || "N/A"}</p>
        </div>

        <div>
          <p className="font-medium">Date & Time:</p>
          <p>
            {appointment.appointmentDate} at {appointment.appointmentTime}
          </p>
        </div>

        <div>
          <p className="font-medium">Purpose:</p>
          <p>{appointment.purpose}</p>
        </div>

        <div>
          <p className="font-medium">Notes:</p>
          <p>{appointment.notes || "None"}</p>
        </div>

        <div>
          <p className="font-medium">Room ID:</p>
          <p>{appointment.roomId}</p>
        </div>

        <div>
          <p className="font-medium">Status:</p>
          <p>{appointment.status}</p>
        </div>
      </div>
    </div>
  );
}
