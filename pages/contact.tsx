// app/contact/page.tsx (Server Component)

import { Metadata } from 'next';
import Link from "next/link";
import ContactForm from './ContactForm'; // Import the client component
import Layout from "@/components/Layout";
import { siteConfig, absUrl } from "@/lib/siteConfig";

// --- METADATA & SCHEMA (Server Side) ---

const pageTitle = `Contact | ${siteConfig.author}`;
const pageDescription = "Get in touch with Abraham of London for speaking engagements, book signings, media inquiries, and collaborations.";
const canonicalUrl = absUrl("/contact");
const SITE_URL = siteConfig.siteUrl;

const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    description: pageDescription,
    url: canonicalUrl,
    potentialAction: { "@type": "CommunicateAction", target: { "@type": "EntryPoint", inLanguage: "en" } },
    contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer service",
        areaServed: "Global",
        email: siteConfig.email,
    },
};
const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Contact", item: canonicalUrl },
    ],
};
const structuredData = [contactPageSchema, breadcrumbSchema];


// Exporting metadata is a server-only function
export const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
        title: pageTitle,
        description: pageDescription,
        url: canonicalUrl,
        images: [
            { url: absUrl(siteConfig.ogImage || "/assets/images/social/og-image.jpg") },
        ],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        images: [absUrl(siteConfig.twitterImage || "/assets/images/social/twitter-image.webp")],
    },
};

// Component to handle Structured Data injection
function SchemaMarkup() {
    return (
        <>
            {structuredData.map((schema, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}

// Default export for the page renders the layout and client component
export default function ContactPage() {
    return (
        <Layout hideCTA>
            <SchemaMarkup /> 
            <ContactForm />
        </Layout>
    );
}