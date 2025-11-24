/** @format */
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type Message } from "@stomp/stompjs";
import type { Announcement } from "../types";

export function useAnnouncementsWebSocket(jwtToken: string) {
  const stompClient = useRef<Client | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jwtToken) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => console.log("[Announcements STOMP]", str),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },
      onConnect: () => {
        console.log("Connected to announcements WS");
        setConnected(true);

        client.subscribe("/topic/announcements", (msg: Message) => {
          const ann: Announcement = JSON.parse(msg.body);
          // Only add truly new announcements (dedupe by id)
          setAnnouncements((prev) => {
            if (prev.find((p) => p.id === ann.id)) return prev;
            return [ann, ...prev]; // newest first
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
  }, [jwtToken]);

  return { announcements, setAnnouncements, connected };
}
