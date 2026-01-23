// components/dashboard/ConnectionStatus.tsx
import React from "react";
import type { ConnectionState } from "./types";

export interface ConnectionStatusProps {
  state: ConnectionState;
  label?: string;
  detail?: string;
}

function badgeTone(state: ConnectionState): string {
  switch (state) {
    case "open":
      return "bg-green-900/20 border-green-700/40 text-green-200";
    case "connecting":
      return "bg-blue-900/20 border-blue-700/40 text-blue-200";
    case "closed":
      return "bg-gray-900/30 border-gray-700/50 text-gray-200";
    case "error":
      return "bg-red-900/20 border-red-700/40 text-red-200";
    default:
      return "bg-gray-900/30 border-gray-700/50 text-gray-200";
  }
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  state,
  label = "Connection",
  detail,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs px-2 py-1 rounded-lg border ${badgeTone(state)}`}>
        {state.toUpperCase()}
      </span>
      {detail ? <span className="text-xs text-gray-500 truncate max-w-[40ch]">{detail}</span> : null}
    </div>
  );
};

ConnectionStatus.displayName = "ConnectionStatus";