// components/strategy-room/Form.tsx
"use client";

import * as React from "react";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

export default function StrategyRoomForm() {
  // Form state here (client-only)
  const [loading, setLoading] = React.useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = await getRecaptchaTokenSafe("strategy_room_intake");
      // Submit logic
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}