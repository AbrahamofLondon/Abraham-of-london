// pages/test-readers.tsx
// Test page for Reader System implementation

import * as React from "react";
import Head from "next/head";

import ReaderFrame from "@/components/reader/ReaderFrame";
import ReaderHeader from "@/components/reader/ReaderHeader";
import ReaderBody from "@/components/reader/ReaderBody";

export default function TestReadersPage() {
  return (
    <>
      <Head>
        <title>Reader System Test - Abraham of London</title>
        <meta
          name="description"
          content="Test implementation of Canon and Vault Reader systems"
        />
      </Head>

      <div className="min-h-screen bg-[#030305] px-6 py-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 font-serif text-3xl text-white">
            Reader System Implementation Test
          </h1>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Canon Reader Test */}
            <section>
              <div className="mb-6 rounded border border-white/10 bg-white/5 p-4">
                <h2 className="mb-2 font-serif text-xl text-white">Canon Reader</h2>
                <p className="text-sm text-white/70">
                  Editorial authority. Warm, spacious, serif-forward, and built for
                  sustained reading.
                </p>
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                  Detected as: EDITORIAL
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-white/10">
                <ReaderFrame surface="canon">
                  <ReaderHeader
                    surface="canon"
                    title="The Architecture of Decision"
                    subtitle="How institutional memory shapes strategic choice"
                    meta={
                      <>
                        <span>Abraham of London</span>
                        <span>•</span>
                        <span>24 March 2025</span>
                        <span>•</span>
                        <span>28 minute read</span>
                      </>
                    }
                  />

                  <ReaderBody surface="canon">
                    <p>
                      Institutional memory is not merely a record of past decisions;
                      it is the architecture within which future choices are framed.
                      Every organization builds its own cognitive scaffolding —
                      sometimes intentionally, often by accretion.
                    </p>

                    <h2>The Weight of Precedent</h2>

                    <p>
                      Consider the boardroom where a billion-dollar acquisition is
                      debated. The arguments presented are not born in that moment;
                      they are echoes of decisions made five, ten, twenty years
                      prior.
                    </p>

                    <div className="reader-callout reader-callout-canon">
                      <strong>Structural Insight.</strong> Organizations do not make
                      decisions in vacuums. They make them within architectures built
                      by their own history.
                    </div>

                    <h3>Three Layers of Institutional Memory</h3>

                    <ul>
                      <li>
                        <strong>Explicit:</strong> Documented policies, minutes,
                        reports
                      </li>
                      <li>
                        <strong>Tacit:</strong> Unwritten rules, cultural norms, “how
                        we do things here”
                      </li>
                      <li>
                        <strong>Structural:</strong> Physical and digital systems that
                        enforce certain behaviors
                      </li>
                    </ul>

                    <blockquote>
                      The most dangerous precedent is the one you don&apos;t know
                      you&apos;re setting.
                    </blockquote>

                    <p>
                      To change an organization&apos;s decision-making architecture
                      requires more than new policies. It requires excavating the
                      tacit and structural layers that silently guide choice.
                    </p>
                  </ReaderBody>
                </ReaderFrame>
              </div>
            </section>

            {/* Vault Reader Test */}
            <section>
              <div className="mb-6 rounded border border-white/10 bg-white/5 p-4">
                <h2 className="mb-2 font-sans text-xl font-semibold text-white">
                  Vault Reader
                </h2>
                <p className="text-sm text-white/70">
                  Technical precision. Dense, structured, and engineered for scan
                  clarity without visual noise.
                </p>
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                  Detected as: TECHNICAL
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-white/10">
                <ReaderFrame surface="vault">
                  <ReaderHeader
                    surface="vault"
                    title="API Rate Limit Implementation v3.2"
                    subtitle="Distributed token-bucket controls with operational safeguards and migration notes."
                    meta={
                      <>
                        <span>TECHNICAL SPECIFICATION</span>
                        <span>•</span>
                        <span>VERSION 3.2</span>
                        <span>•</span>
                        <span>LAST UPDATED: 2025-03-24</span>
                      </>
                    }
                  />

                  <ReaderBody surface="vault">
                    <p>
                      The rate limiting system uses a token bucket algorithm with
                      distributed Redis storage for horizontal scaling.
                    </p>

                    <div className="reader-callout reader-callout-vault">
                      <strong>Bucket Configuration</strong>
                      <ul>
                        <li>Tokens per minute: 1200</li>
                        <li>Bucket size: 2400</li>
                        <li>Refill rate: 20 tokens/sec</li>
                      </ul>
                    </div>

                    <pre>
                      <code>{`interface RateLimitConfig {
  tokensPerMinute: number;
  bucketSize: number;
  refillRate: number;
  namespace: string;
}

const config: RateLimitConfig = {
  tokensPerMinute: 1200,
  bucketSize: 2400,
  refillRate: 20,
  namespace: "api:v3",
};`}</code>
                    </pre>

                    <h2>Error Handling</h2>

                    <p>
                      When rate limits are exceeded, the system returns HTTP 429 with
                      appropriate headers.
                    </p>

                    <div className="reader-callout reader-callout-vault">
                      <strong>Deprecation Notice.</strong> The legacy X-RateLimit
                      headers will be removed in v4.0. Migrate to RateLimit-* headers
                      immediately.
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th>Header</th>
                          <th>Description</th>
                          <th>Example</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <code>RateLimit-Limit</code>
                          </td>
                          <td>Requests per minute</td>
                          <td>
                            <code>1200</code>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <code>RateLimit-Remaining</code>
                          </td>
                          <td>Remaining requests</td>
                          <td>
                            <code>843</code>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <code>RateLimit-Reset</code>
                          </td>
                          <td>Seconds until reset</td>
                          <td>
                            <code>42</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </ReaderBody>
                </ReaderFrame>
              </div>
            </section>
          </div>

          {/* Implementation Notes */}
          <div className="mt-12 rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 font-sans text-xl font-semibold text-white">
              Implementation Notes
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-serif text-lg text-white">
                  Canon Reader Spec
                </h3>
                <ul className="space-y-2 text-sm text-white/75">
                  <li>✅ Serif typography (Cormorant Garamond)</li>
                  <li>✅ 18px body, 1.78 line height</li>
                  <li>✅ Max width: 68ch</li>
                  <li>✅ Warm panel inside dark scaffold</li>
                  <li>✅ No gradients under text</li>
                  <li>✅ Editorial spacing rhythm preserved</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-sans text-lg font-semibold text-white">
                  Vault Reader Spec
                </h3>
                <ul className="space-y-2 text-sm text-white/75">
                  <li>✅ Sans typography (Inter)</li>
                  <li>✅ 15px body, 1.68 line height</li>
                  <li>✅ Labels: Mono, uppercase</li>
                  <li>✅ Max width: 75ch</li>
                  <li>✅ High-contrast dark scaffold</li>
                  <li>✅ Technical density without clutter</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}