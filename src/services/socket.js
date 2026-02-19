import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import API_CONFIG from "../config/api.config";

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.subscriptions = new Map();
        this.onConnectCallbacks = new Set();
        this.isConnected = false;
    }

    connect(role) {
        if (this.stompClient?.active) return;

        const wsUrl = API_CONFIG.WS_URL || import.meta.env.VITE_WS_URL || 'http://localhost:8000/ws';
        console.log("🔌 Attempting WebSocket connection to:", wsUrl);

        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("✅ WebSocket connected");
                this.isConnected = true;
                
                // Re-subscribe to all existing topics if reconnecting
                this.subscriptions.forEach((callback, topic) => {
                    this._doSubscribe(topic, callback);
                });

                this.onConnectCallbacks.forEach(cb => cb());
            },
            onDisconnect: () => {
                console.log("❌ WebSocket disconnected");
                this.isConnected = false;
            },
            onStompError: (frame) => {
                console.error("❌ STOMP error", frame);
                this.isConnected = false;
            }
        });

        this.stompClient.activate();
    }

    _doSubscribe(topic, callback) {
        if (!this.stompClient?.connected) return null;
        
        return this.stompClient.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body);
                callback(data);
            } catch (e) {
                console.error("Failed to parse WS message", e);
                callback(message.body);
            }
        });
    }

    subscribe(topic, callback) {
        this.subscriptions.set(topic, callback);
        
        let sub = null;
        if (this.isConnected) {
            sub = this._doSubscribe(topic, callback);
        }

        return () => {
            if (sub) sub.unsubscribe();
            this.subscriptions.delete(topic);
        };
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
            this.isConnected = false;
            this.subscriptions.clear();
        }
    }
}

const socketService = new WebSocketService();
export default socketService;

// Legacy exports for compatibility
export const connectWebSocket = (role, onMessage) => {
    socketService.connect(role);
    if (onMessage) {
        socketService.subscribe(`/topic/approvals/${role}`, onMessage);
    }
};

export const disconnectWebSocket = () => {
    socketService.disconnect();
};
