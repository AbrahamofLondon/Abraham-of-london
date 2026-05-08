import Layout from "@/components/Layout";
import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <Layout title="Refund and Cancellation Policy | Abraham of London">
      <main className="min-h-screen bg-[#060609] text-white px-6 py-16">
        <div className="max-w-3xl mx-auto space-y-10">
          <header className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-amber-500">Commercial Terms</p>
            <h1 className="text-4xl md:text-5xl font-serif italic">Refund and Cancellation Policy</h1>
            <p className="text-zinc-300 leading-7">
              Abraham of London provides digital diagnostic, reporting, and advisory services
              to business leaders and institutions. This policy explains your rights regarding
              refunds and cancellations under UK consumer regulations for digital services.
            </p>
            <p className="text-zinc-400 text-sm leading-6">
              Last updated: May 2026
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Your statutory rights</h2>
            <p className="text-zinc-300 leading-7">
              Under the Consumer Contracts (Information, Cancellation and Additional Charges)
              Regulations 2013 and the Consumer Rights Act 2015, you have the right to cancel
              a purchase of digital content within 14 days of purchase, provided that delivery
              of the digital content has not yet begun with your express consent.
            </p>
            <p className="text-zinc-300 leading-7">
              Nothing in this policy affects your statutory rights. If we have failed to deliver
              the service as described, you are entitled to a remedy under UK consumer law
              regardless of the terms below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Digital diagnostics and reports</h2>
            <p className="text-zinc-300 leading-7">
              Our diagnostic and Executive Reporting products are digital services that begin
              processing immediately upon purchase. By completing checkout, you consent to
              immediate delivery and acknowledge that the 14-day cancellation period ends
              once the digital content has been accessed or processing has begun.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300 leading-7">
              <li>
                <strong>Before access or processing begins:</strong> Full refund available
                within 14 days of purchase.
              </li>
              <li>
                <strong>After access or processing has begun:</strong> Refunds are assessed
                on a case-by-case basis against verified service failure. If the product was
                not delivered as described, you will receive a full refund.
              </li>
              <li>
                <strong>Technical failure:</strong> If a purchase fails to provision access
                or the report cannot be generated, contact support and we will either restore
                access or issue a full refund.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Strategy Room and advisory services</h2>
            <p className="text-zinc-300 leading-7">
              Strategy Room sessions and advisory engagements involve scheduled human analysis
              and preparation. Cancellation terms reflect the nature of this committed work.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300 leading-7">
              <li>
                <strong>Before advisory work begins:</strong> Full refund available if
                cancelled before session preparation has started.
              </li>
              <li>
                <strong>After advisory work has begun:</strong> Refunds are not automatic.
                If the booked service cannot be delivered, we will offer rescheduling, an
                alternative delivery path, or a proportional refund where non-delivery is
                attributable to us.
              </li>
              <li>
                <strong>Non-attendance:</strong> If you do not attend a scheduled session
                without prior notice, refunds are at our discretion.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What is non-refundable</h2>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300 leading-7">
              <li>Digital reports that have been fully delivered and accessed.</li>
              <li>Advisory sessions that have been completed.</li>
              <li>Dissatisfaction with findings or conclusions, where the service was
                delivered as described. Our instruments provide structured analysis, not
                guaranteed outcomes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Cancellation window</h2>
            <p className="text-zinc-300 leading-7">
              You may cancel within 14 days of purchase for any reason, provided digital
              delivery has not begun. To cancel, contact us using the details below with
              your checkout reference. Refunds will be processed to the original payment
              method within 14 business days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">How to request a refund</h2>
            <p className="text-zinc-300 leading-7">
              Contact us at{" "}
              <a
                className="text-amber-400 hover:text-amber-300"
                href="mailto:info@abrahamoflondon.org"
              >
                info@abrahamoflondon.org
              </a>{" "}
              with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300 leading-7">
              <li>Your checkout reference or Stripe receipt number</li>
              <li>The product purchased</li>
              <li>The reason for your request</li>
              <li>Any relevant details about the issue encountered</li>
            </ul>
            <p className="text-zinc-300 leading-7">
              We aim to respond to all refund requests within 3 business days.
            </p>
          </section>

          <section className="space-y-3 border-t border-white/10 pt-8">
            <h2 className="text-xl font-semibold">Business information</h2>
            <p className="text-zinc-300 leading-7">
              Abraham of London provides digital business advisory and diagnostic services.
              All payments are processed securely through Stripe. Prices are quoted in GBP
              and include applicable taxes.
            </p>
          </section>

          <div className="flex flex-wrap gap-4 pt-4 text-sm">
            <Link href="/terms-of-service" className="text-amber-400 hover:text-amber-300">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-amber-400 hover:text-amber-300">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-amber-400 hover:text-amber-300">
              Contact
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
