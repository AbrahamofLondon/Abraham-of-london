"use client";
import * as React from "react";
import Button from "@/components/Button";

type FormState = {
  name: string;
  email: string;
  message: string;
};

const initial: FormState = { name: "", email: "", message: "" };

export default function ContactForm(): JSX.Element {
  const [state, setState] = React.useState<FormState>(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<null | "ok" | "err">(null);

  function onChange<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setState((s) => ({ ...s, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setDone(null);
    try {
      // Optional: post to your API route if/when wired
      await new Promise((r) => setTimeout(r, 400));
      setDone("ok");
      setState(initial);
    } catch {
      setDone("err");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          value={state.name}
          onChange={onChange("name")}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={state.email}
          onChange={onChange("email")}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Message</label>
        <textarea
          value={state.message}
          onChange={onChange("message")}
          required
          rows={5}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="How can we help?"
        />
      </div>
      <div className="pt-2">
        <Button type="submit" loading={submitting}>
          Send
        </Button>
        {done === "ok" && <span className="ml-3 text-sm text-green-600">Sent. We’ll be in touch.</span>}
        {done === "err" && <span className="ml-3 text-sm text-red-600">Something went wrong.</span>}
      </div>
    </form>
  );
}