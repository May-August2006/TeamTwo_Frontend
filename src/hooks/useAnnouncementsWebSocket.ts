/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import type { Announcement } from "../types";

export function useAnnouncementsWebSocket(
  jwtToken: string,
  buildingId?: number
) {
  const stompClient = useRef<Client | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jwtToken || !buildingId) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (msg) => console.log("[Announcements STOMP]", msg),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },

      onConnect: () => {
        console.log("Connected to announcements WS");
        setConnected(true);

        const destination = `/topic/announcements/building/${buildingId}`;

        client.subscribe(destination, (msg: Message) => {
          const ann: Announcement = JSON.parse(msg.body);

          setAnnouncements((prev) => {
            if (prev.some((p) => p.id === ann.id)) return prev;
            return [ann, ...prev];
          });
        });
      },

      onStompError: (frame) => {
        console.error("Announcements WS error:", frame.body);
      },

      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
      stompClient.current = null;
    };
  }, [jwtToken, buildingId]);

  return { announcements, setAnnouncements, connected };
}
