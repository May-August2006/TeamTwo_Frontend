/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import type { AppointmentDTO } from "../types";

export function useAppointmentsWebSocket(jwtToken: string, managerId: number) {
  const clientRef = useRef<Client | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [connected, setConnected] = useState(false);
  const [newAppointment, setNewAppointment] = useState<AppointmentDTO | null>(
    null
  );

  useEffect(() => {
    if (!jwtToken || !managerId) return;

    const socket = new SockJS("http://localhost:8080/ws");

    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (msg) => console.log("[STOMP]", msg),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },

      onConnect: () => {
        console.log("WebSocket Connected");
        setConnected(true);

        client.subscribe(`/topic/appointments/${managerId}`, (msg: Message) => {
          const incoming = JSON.parse(msg.body) as AppointmentDTO;
          console.log("Received WebSocket Appointment:", incoming);

          // MERGE LOGIC (no duplicates + real update)
          setAppointments((prev) => {
            const exists = prev.some((a) => a.id === incoming.id);

            if (exists) {
              return prev.map((a) => (a.id === incoming.id ? incoming : a));
            }
            return [...prev, incoming];
          });

          // Mark this as a REAL WebSocket event
          setNewAppointment(incoming);
        });
      },

      onDisconnect: () => {
        console.log("WebSocket Disconnected");
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error("STOMP ERROR:", frame.body);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [jwtToken, managerId]);

  // --- SEND STATUS UPDATE ---
  const sendStatusUpdate = (appointmentId: number, status: string) => {
    if (!clientRef.current || !connected) return;

    clientRef.current.publish({
      destination: `/app/appointments/${appointmentId}/status`,
      body: JSON.stringify({ status }),
    });
  };

  return {
    appointments,
    setAppointments,
    sendStatusUpdate,
    connected,
    newAppointment,
  };
}
