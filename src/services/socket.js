import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectWebSocket = (role, onMessage) => {
    let wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

    const brokerUrl = wsUrl.replace(/^http/, 'ws');

    console.log("🔌 Attempting Native WebSocket connection to:", brokerUrl);

    stompClient = new Client({
        brokerURL: brokerUrl,
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
