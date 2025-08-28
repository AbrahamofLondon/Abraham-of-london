// components/Newsletter.tsx
export default function Newsletter() {
  return (
    <section id="newsletter" className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Subscribe</h2>
        <p className="mt-1 text-sm text-slate-600">
          Get essays and project updates. No spam.
        </p>

        <form
          name="newsletter"
          method="POST"
          data-netlify="true"
          className="mt-4 flex gap-3"
        >
          <input type="hidden" name="form-name" value="newsletter" />
          <input
            type="email"
            name="email"
            required
            placeholder="info@abrahamoflondon.org"
            className="min-w-0 flex-1 rounded-lg border px-3 py-2"
          />
          <button className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
            Join
          </button>
        </form>
      </div>
    </section>
  );
}
