// components/// components/ContactForm.tsx
import React from 'react';

export default function ContactForm() {
  const [state, setState] = React.useState<{loading:boolean; ok:boolean; error:string|null}>({
    loading: false, ok: false, error: null
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ loading: true, ok: false, error: null });

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch('/.netlify/functions/send-contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      setState({ loading: false, ok: true, error: null });
      form.reset();
    } catch (err: any) {
      setState({ loading: false, ok: false, error: err?.message || 'Failed to send' });
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
      <input name="name" placeholder="Your name" required className="border p-3 rounded" />
      <input name="email" type="email" placeholder="you@example.com" required className="border p-3 rounded" />
      <textarea name="message" placeholder="Message" rows={5} required className="border p-3 rounded" />
      <button disabled={state.loading} className="bg-forest text-cream px-4 py-2 rounded">
        {state.loading ? 'Sending…' : 'Send'}
      </button>
      {state.ok && <p className="text-green-700">Sent. We’ll be in touch.</p>}
      {state.error && <p className="text-red-700">Error: {state.error}</p>}
    </form>
  );
}
import React from 'react';

export default function ContactForm() {
  const [state, setState] = React.useState<{loading:boolean; ok:boolean; error:string|null}>({
    loading: false, ok: false, error: null
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ loading: true, ok: false, error: null });

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch('/.netlify/functions/send-contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      setState({ loading: false, ok: true, error: null });
      form.reset();
    } catch (err: any) {
      setState({ loading: false, ok: false, error: err?.message || 'Failed to send' });
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
      <input name="name" placeholder="Your name" required className="border p-3 rounded" />
      <input name="email" type="email" placeholder="info@abrahamoflondon.org" required className="border p-3 rounded" />
      <textarea name="message" placeholder="Message" rows={5} required className="border p-3 rounded" />
      <button disabled={state.loading} className="bg-forest text-cream px-4 py-2 rounded">
        {state.loading ? 'Sending…' : 'Send'}
      </button>
      {state.ok && <p className="text-green-700">Sent. We’ll be in touch.</p>}
      {state.error && <p className="text-red-700">Error: {state.error}</p>}
    </form>
  );
}