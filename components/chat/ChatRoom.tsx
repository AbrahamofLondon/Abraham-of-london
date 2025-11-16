// components/chat/ChatRoom.tsx
import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  type: "user" | "system";
}

export const ChatRoom = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/chat",
    { debug: true }
  );

  useEffect(() => {
    if (!lastMessage) return;

    const message = lastMessage as any;

    // Handle different message types based on your WebSocketService
    if (message.type === "message") {
      // Generic message type - check for chat-specific data
      const data = message.data || {};
      
      // Check if this is a chat message by looking for text content
      if (data.text || data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            user: data.user || "User",
            text: data.text || data.message || "",
            timestamp: new Date(data.timestamp || Date.now()),
            type: "user",
          },
        ]);
      }
    } else if (message.type === "connected") {
      // Connection established
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: "System",
          text: "Connected to chat",
          timestamp: new Date(),
          type: "system",
        },
      ]);
    } else if (message.type === "disconnected") {
      // Connection lost
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: "System",
          text: "Disconnected from chat",
          timestamp: new Date(),
          type: "system",
        },
      ]);
    } else if (message.type === "error") {
      // Error message
      const data = message.data || {};
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: "System",
          text: `Error: ${data.error || "Unknown error"}`,
          timestamp: new Date(),
          type: "system",
        },
      ]);
    }
  }, [lastMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isConnected) return;

    // Use "message" type which is allowed by your WebSocketService
    sendMessage({
      type: "message", // This is the allowed type
      data: {
        user: "You", // Replace with actual user
        text: inputText,
        timestamp: new Date().toISOString(),
        // You can add additional fields to differentiate message types
        messageType: "chat", // Custom field to identify chat messages
      },
    });

    setInputText("");
  };

  return (
    <div className="flex h-96 flex-col rounded-lg border">
      {/* Chat Header */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Chat Room</h3>
          <div
            className={`flex items-center gap-2 ${
              isConnected ? "text-green-600" : "text-red-600"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {isConnected 
              ? "No messages yet. Start a conversation!" 
              : "Connecting to chat..."
            }
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-3 ${
                message.type === "system" ? "text-center" : ""
              }`}
            >
              {message.type === "system" ? (
                <span className="text-sm text-gray-500">{message.text}</span>
              ) : (
                <div
                  className={`flex ${
                    message.user === "You" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 ${
                      message.user === "You"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="text-sm font-medium">{message.user}</div>
                    <div>{message.text}</div>
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isConnected 
                ? "Type your message..." 
                : "Connecting..."
            }
            className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !inputText.trim()}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};