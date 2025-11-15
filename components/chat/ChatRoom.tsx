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

    const { type, data } = lastMessage as any;

    if (type === "chat_message") {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: data?.user ?? "User",
          text: data?.text ?? "",
          timestamp: new Date(),
          type: "user",
        },
      ]);
    } else if (type === "user_joined") {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: "System",
          text: `${data?.user ?? "Someone"} joined the chat`,
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
    if (!inputText.trim()) return;

    sendMessage({
      type: "chat_message",
      data: {
        user: "You", // Replace with actual user
        text: inputText,
        timestamp: new Date().toISOString(),
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
        {messages.map((message) => (
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
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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