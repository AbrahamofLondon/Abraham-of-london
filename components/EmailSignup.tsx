// components/EmailSignup.tsx
import React, { useState } from "react";

const EmailSignup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"initial" | "submitting" | "success" | "error">("initial");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Subscription failed");

      setStatus("success");
      setMessage("Thank you for subscribing!");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "There was an error. Please try again.");
    }
