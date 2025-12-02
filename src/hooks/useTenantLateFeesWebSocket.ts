/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import { jwtDecode } from "jwt-decode";
import type { LateFeeResponseDTO } from "../types";

export function useTenantLateFeesWebSocket(jwtToken: string) {
  const stompClient = useRef<Client | null>(null);
  const [lateFees, setLateFees] = useState<LateFeeResponseDTO[]>([]);
  const [connected, setConnected] = useState(false);

  // ⬅️ extract tenantId from JWT
  let tenantId: number | null = null;

  try {
    const decoded: any = jwtDecode(jwtToken);
    tenantId = decoded.tenantId;
  } catch (_) {}

  useEffect(() => {
    if (!jwtToken || !tenantId) return;

    const socket = new SockJS("http://localhost:8080/ws");

    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (msg) => console.log("[STOMP]", msg),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },

      onConnect: () => {
        console.log("Tenant LateFee WS Connected");
        setConnected(true);

        // 🔥 SUBSCRIBE TO tenant late fee topic
        client.subscribe(
          `/topic/tenant/${tenantId}/lateFees`,
          (msg: Message) => {
            const newLateFee: LateFeeResponseDTO = JSON.parse(msg.body);

            setLateFees((prev) => [newLateFee, ...prev]);
          }
        );
      },

      onStompError: (frame) => console.error("WS Error:", frame.body),

      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
      stompClient.current = null;
    };
  }, [jwtToken, tenantId]);

  return { lateFees, setLateFees, connected };
}
