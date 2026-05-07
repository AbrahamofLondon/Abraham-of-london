import Layout from "@/components/Layout";

export default function RefundPolicyPage() {
  return (
    <Layout title="Refund Policy">
      <main className="min-h-screen bg-[#060609] text-white px-6 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <header className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-amber-500">Commercial Terms</p>
            <h1 className="text-4xl md:text-5xl font-serif italic">Refund Policy</h1>
            <p className="text-zinc-300 leading-7">
              Abraham of London sells digital diagnostic and advisory services. Because access is often granted
              immediately after purchase, refund handling depends on whether delivery has started and whether advisory
              work has already been performed.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Digital diagnostics and reports</h2>
            <p className="text-zinc-300 leading-7">
              If a purchase fails to provision access, contact support with the checkout confirmation and we will
              either restore access or issue a refund. If delivery has already been completed, refunds are assessed on
              a case-by-case basis against the actual service failure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Strategy Room and advisory work</h2>
            <p className="text-zinc-300 leading-7">
              Once advisory execution has begun, refunds are not automatic. If the booked service cannot be delivered,
              we will offer rescheduling, an alternative delivery path, or a refund where non-delivery is our fault.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Support</h2>
            <p className="text-zinc-300 leading-7">
              Contact <a className="text-amber-400 hover:text-amber-300" href="mailto:info@abrahamoflondon.org">info@abrahamoflondon.org</a> with
              your checkout reference, the product purchased, and the issue encountered.
            </p>
          </section>
        </div>
      </main>
    </Layout>
  );
}
