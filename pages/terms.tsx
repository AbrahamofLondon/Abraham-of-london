// pages/terms.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

const TermsPage: NextPage = () => {
  return (
    <Layout title="Terms of Service">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Governance · Terms of Use
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Terms of Service
            </h1>
            <p className="text-sm text-gold/70">
              Last updated: {new Date().toLocaleDateString("en-GB")}
            </p>
            <p className="mt-2 text-sm text-gray-200">
              These Terms of Service govern your use of the Abraham of London
              website, content, downloads, newsletter, and any related services
              (collectively, the “Services”). By accessing or using the Services,
              you agree to these Terms.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              1. About This Platform
            </h2>
            <p className="text-sm text-gray-200">
              Abraham of London is a personal brand and advisory platform focused
              on faith, fatherhood, leadership, and strategic thinking. The site
              provides articles, tools, downloads, events, and channels to explore
              advisory services.
            </p>
            <p className="text-sm text-gray-200">
              The content is intended for adults seeking personal and professional
              development. Use of this site does not create a formal advisory,
              consulting, or fiduciary relationship unless expressly agreed in
              writing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              2. Acceptable Use
            </h2>
            <p className="text-sm text-gray-200">
              You agree to use the Services in a lawful and responsible manner.
              You must not:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Use the site for any unlawful, fraudulent, or malicious purpose.
              </li>
              <li>
                Attempt to gain unauthorised access to the site, its infrastructure
                or other users’ data.
              </li>
              <li>
                Scrape, crawl, or harvest data in a way that breaches our{" "}
                <a
                  href="/privacy"
                  className="text-softGold underline underline-offset-2 hover:text-amber-200"
                >
                  Privacy Policy
                </a>
                .
              </li>
              <li>
                Copy, resell, or redistribute paid or premium content without
                explicit written permission.
              </li>
              <li>
                Interfere with the proper working of the site, including attempting
                denial-of-service attacks, injection, or other abuse.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              3. Intellectual Property
            </h2>
            <p className="text-sm text-gray-200">
              Unless stated otherwise, all content on this site — including
              writing, frameworks, branding, graphics, downloads, and media — is
              owned or controlled by Abraham of London.
            </p>
            <p className="text-sm text-gray-200">
              You may:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Read and share public articles with proper attribution.</li>
              <li>
                Download free resources for your own personal or professional use.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              You may not, without written permission:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Republish, resell, or commercially exploit site content.</li>
              <li>
                Use the Abraham of London brand, logo, or marks in a way that
                implies endorsement.
              </li>
              <li>
                Package our content or tools into your own products, courses, or
                platforms.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              4. Subscriptions & Communications
            </h2>
            <p className="text-sm text-gray-200">
              Newsletter subscriptions are optional and managed through{" "}
              <span className="font-semibold text-cream">Buttondown</span>. You
              can unsubscribe at any time using the link in each email.
            </p>
            <p className="text-sm text-gray-200">
              Transactional emails (such as confirmations, links to downloads, or
              responses to contact forms) are sent via{" "}
              <span className="font-semibold text-cream">Resend</span>. These are
              part of delivering the Services you request and are not “marketing”
              communications in themselves.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              5. No Professional Advice
            </h2>
            <p className="text-sm text-gray-200">
              The content on this site is for general information and personal
              development only. It does not constitute:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Legal advice</li>
              <li>Financial or investment advice</li>
              <li>Clinical counselling or therapy</li>
              <li>Any regulated professional service</li>
            </ul>
            <p className="text-sm text-gray-200">
              Any decisions you make based on content, downloads, or interactions
              with this site are your responsibility. Where appropriate, you
              should seek independent professional advice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              6. Disclaimers
            </h2>
            <p className="text-sm text-gray-200">
              The Services are provided on an{" "}
              <span className="font-semibold text-cream">“as is”</span> and{" "}
              <span className="font-semibold text-cream">“as available”</span>{" "}
              basis. While we take care with what we publish, we do not guarantee:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Continuous availability of the site or any specific feature.</li>
              <li>
                That content will be free from errors, omissions, or outdated
                information.
              </li>
              <li>
                That downloads or resources will be suitable for your precise
                context.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              7. Limitation of Liability
            </h2>
            <p className="text-sm text-gray-200">
              To the fullest extent permitted by law, Abraham of London will not
              be liable for any indirect, incidental, consequential, or punitive
              damages arising out of your use of the Services.
            </p>
            <p className="text-sm text-gray-200">
              Where our liability cannot be excluded, it is limited to the total
              amount you have paid (if any) for the Services giving rise to the
              claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              8. Third-Party Links
            </h2>
            <p className="text-sm text-gray-200">
              The site may contain links to third-party websites or services. We
              are not responsible for their content, terms, or privacy practices.
              You access them at your own risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              9. Changes to the Services
            </h2>
            <p className="text-sm text-gray-200">
              We may update, modify, or discontinue parts of the Services at any
              time, including content, downloads, or features, without prior
              notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              10. Governing Law
            </h2>
            <p className="text-sm text-gray-200">
              These Terms are governed by and construed in accordance with the
              laws of England and Wales. Any disputes arising in connection with
              these Terms will be subject to the exclusive jurisdiction of the
              courts of England and Wales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              11. Contact
            </h2>
            <p className="text-sm text-gray-200">
              If you have questions about these Terms, you can contact:
            </p>
            <p className="text-sm text-gray-200">
              Email:{" "}
              <a
                href="mailto:info@abrahamoflondon.org"
                className="text-softGold underline underline-offset-2 hover:text-amber-200"
              >
                info@abrahamoflondon.org
              </a>
            </p>
          </section>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default TermsPage;