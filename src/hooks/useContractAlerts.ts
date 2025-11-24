/** @format */
import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import { alertApi } from "../api/alertApi";

export const useContractAlerts = (
  jwtToken: string,
  onNewAlert: (alert: any) => void
) => {
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    if (!jwtToken) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => console.log("[Contracts STOMP]", str),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },
      onConnect: () => {
        console.log("Connected to contracts WS");

        client.subscribe("/topic/manager/contracts", (message: Message) => {
          const msg = message.body;

          // Save alert in backend
          alertApi
            .create(msg)
            .then((res) => {
              onNewAlert(res.data); // Component handles toast
            })
            .catch((err) => {
              console.error("Failed to save alert:", err);
            });
        });
      },
      onStompError: (frame) => {
        console.error("Contracts WS error:", frame.body);
      },
      onDisconnect: () => {
        console.log("Disconnected from contracts WS");
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
      stompClient.current = null;
    };
  }, [jwtToken, onNewAlert]);
};
