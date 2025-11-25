/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import type { InvoiceDTO } from "../types";

export function useInvoicesWebSocket(jwtToken: string) {
  const stompClient = useRef<Client | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jwtToken) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => console.log("[Invoices STOMP]", str),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },

      onConnect: () => {
        console.log("Connected to invoices WS");
        setConnected(true);

        // Subscribe to invoice notifications for managers
        client.subscribe("/topic/manager/invoices", (msg: Message) => {
          const invoice: InvoiceDTO = JSON.parse(msg.body);

          // Avoid duplicates (check by invoice id)
          setInvoices((prev) => {
            if (prev.find((p) => p.id === invoice.id)) return prev;
            return [invoice, ...prev]; // newest first
          });
        });
      },

      onStompError: (frame) => {
        console.error("Invoices WS error:", frame.body);
      },

      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
      stompClient.current = null;
    };
  }, [jwtToken]);

  return { invoices, setInvoices, connected };
}
