/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import { jwtDecode } from "jwt-decode";
import type { ContractAlert } from "../types";

export function useContractAlerts(jwtToken: string) {
  const stompClient = useRef<Client | null>(null);
  const [alerts, setAlerts] = useState<ContractAlert[]>([]);
  const [connected, setConnected] = useState(false);

  let managerId: number | null = null;
  try {
    const decoded: any = jwtDecode(jwtToken);
    managerId = decoded.managerId;
  } catch (err) {
    console.error("Failed to decode managerId from JWT", err);
  }

  useEffect(() => {
    if (!jwtToken || !managerId) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (msg) => console.log("[Contracts WS]", msg),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },

      onConnect: () => {
        console.log("Contracts WS Connected");
        setConnected(true);

        client.subscribe(
          `/topic/manager/${managerId}/contracts`,
          (msg: Message) => {
            try {
              const payload: ContractAlert = JSON.parse(msg.body);
              setAlerts((prev) => [payload, ...prev]);
            } catch {
              console.error("Invalid alert payload:", msg.body);
            }
          }
        );
      },

      onStompError: (frame) => console.error("Contracts WS error:", frame.body),
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
      stompClient.current = null;
    };
  }, [jwtToken, managerId]);

  return { alerts, setAlerts, connected };
}
