import { Shield } from "lucide-react";

export default function ChathamBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium tracking-wide">
      <Shield className="size-3.5" aria-hidden />
      Chatham Presentation
    </span>
  );
}
