/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import { jwtDecode } from "jwt-decode";
import type { ReminderDTO } from "../types";

export function useTenantRemindersWebSocket(jwtToken: string) {
  const stompClient = useRef<Client | null>(null);
  const [reminders, setReminders] = useState<ReminderDTO[]>([]);
  const [connected, setConnected] = useState(false);

  // ⬅️ Extract tenantId from JWT
  let tenantId: number | null = null;
  try {
    const decoded: any = jwtDecode(jwtToken);
    tenantId = decoded.tenantId; // MUST exist in JWT
  } catch (err) {
    console.error("Failed to decode JWT", err);
  }

  useEffect(() => {
    console.log(jwtDecode(localStorage.getItem("accessToken")!));

    if (!jwtToken || !tenantId) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => console.log("[Announcements STOMP]", str),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },

      onConnect: () => {
        console.log("Tenant Reminders WS Connected");
        setConnected(true);

        // 🔥 Subscribe to tenant-specific reminders
        client.subscribe(
          `/topic/tenant/${tenantId}/reminders`,
          (msg: Message) => {
            const reminder: ReminderDTO = JSON.parse(msg.body);

            setReminders((prev) => {
              // Prevent duplicates
              if (prev.find((r) => r.id === reminder.id)) return prev;
              return [reminder, ...prev]; // newest first
            });
          }
        );
      },

      onStompError: (frame) => console.error("Reminders WS Error:", frame.body),
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
      stompClient.current = null;
    };
  }, [jwtToken, tenantId]);

  return { reminders, setReminders, connected };
}
