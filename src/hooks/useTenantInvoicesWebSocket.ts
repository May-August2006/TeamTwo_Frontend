/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import { jwtDecode } from "jwt-decode";
import type { InvoiceDTO } from "../types";

export function useTenantInvoicesWebSocket(jwtToken: string) {
  const stompClient = useRef<Client | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [connected, setConnected] = useState(false);

  // ⬅️ Extract tenantId from JWT
  let tenantId: number | null = null;

  console.log(jwtDecode(localStorage.getItem("accessToken")!));

  try {
    const decoded: any = jwtDecode(jwtToken);
    tenantId = decoded.tenantId; // MUST exist in JWT
  } catch (_) {}

  useEffect(() => {
    if (!jwtToken || !tenantId) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },

      onConnect: () => {
        console.log("Tenant WS Connected");
        setConnected(true);

        // 🔥 Subscribe to tenant-specific topic
        client.subscribe(
          `/topic/tenant/${tenantId}/invoices`,
          (msg: Message) => {
            const invoice: InvoiceDTO = JSON.parse(msg.body);

            setInvoices((prev) => {
              if (prev.find((p) => p.id === invoice.id)) return prev;
              return [invoice, ...prev];
            });
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

  return { invoices, setInvoices, connected };
}
