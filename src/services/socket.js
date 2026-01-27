import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

export const connectWebSocket = (role, onMessage) => {
    let wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

    console.log("🔌 Attempting SockJS + STOMP connection to:", wsUrl);

    stompClient = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: 5000,
        onConnect: () => {
            console.log("✅ WebSocket connected");

            stompClient.subscribe(
                `/topic/approvals/${role}`,
                (message) => {
                    const notification = JSON.parse(message.body);
                    onMessage(notification);
                }
            );
        },
        onStompError: (frame) => {
            console.error("❌ STOMP error", frame);
        }
    });

    stompClient.activate();
};

export const disconnectWebSocket = () => {
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }
};
