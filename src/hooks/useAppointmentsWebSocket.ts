/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import type { AppointmentDTO } from "../types";

export function useAppointmentsWebSocket(jwtToken: string, managerId: number) {
  const stompClient = useRef<Client | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [connected, setConnected] = useState(false);
  const seenIds = useRef<Set<number>>(new Set()); // Track already added appointment IDs

  useEffect(() => {
    if (!jwtToken || !managerId) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => console.log("[STOMP]", str),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },
      onConnect: () => {
        console.log("Connected to WebSocket!");
        setConnected(true);

        // Subscribe to manager-specific topic
        client.subscribe(`/topic/appointments/${managerId}`, (msg: Message) => {
          const updatedAppointment: AppointmentDTO = JSON.parse(msg.body);
          console.log("Received WebSocket appointment:", updatedAppointment);

          setAppointments((prev) => {
            // Only add if we haven't seen this appointment ID yet
            if (seenIds.current.has(updatedAppointment.id)) {
              // Update existing appointment
              return prev.map((a) =>
                a.id === updatedAppointment.id ? updatedAppointment : a
              );
            } else {
              // New appointment
              seenIds.current.add(updatedAppointment.id);
              return [...prev, updatedAppointment];
            }
          });
        });
      },
      onStompError: (frame) => {
        console.error("WebSocket error: ", frame.body);
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
        setConnected(false);
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
      stompClient.current = null;
    };
  }, [jwtToken, managerId]);

  // Send status update to server
  const sendStatusUpdate = (appointmentId: number, status: string) => {
    if (stompClient.current && connected) {
      stompClient.current.publish({
        destination: `/app/appointments/${appointmentId}/status`,
        body: JSON.stringify({ status }),
      });
    }
  };

  return { appointments, setAppointments, sendStatusUpdate, connected };
}
