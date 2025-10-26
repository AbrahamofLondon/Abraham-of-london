import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";

/*----Types----*/
type Brand = {
    name: string;
    desc: string;
    logo: string; // local/public path
    href: string; // internal or external URL
    badge?: string; // optional badge
};

/*----Data----*/
const brands: Brand[] = [
    {
        name: "Abraham of London",
        desc: "Strategic stewardship, thought leadership, and the standards that hold the family together.",
        logo: "/assets/images/abraham-logo.jpg",
        href: "/about",
    },
    {
        name: "Alomarada",
        desc: "Business advisory for investors & entrepreneurs developing African markets through ethical, practical playbooks.",
        logo: "/assets/images/alomarada-ltd.webp",
        href: "https://alomarada.com",
    },
    {
        name: "Endure Luxe",
        desc: "Premium, sustainable fitness partnerships that promote wellbeing through community and thoughtful tech.",
        logo: "/assets/images/endureluxe-ltd.webp",
        href: "https://endureluxe.com",
    },
    {
        name: "Innovate Hub",
        desc: "Strategy, playbooks, and hands-on product support to ship durable products rooted in ethics and excellent craft.",
        logo: "/assets/images/innovatehub.svg",
        href: process.env.NEXT_PUBLIC_INNOVATEHUB_URL || process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL || "https://innovatehub-abrahamoflondon.netlify.app",
        badge: "Early access open",
    },
];

const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const item = {
    hidden: { y: 18, opacity: 0 },
    visible: { y: 0, opacity: 1 },
} as const;

export default function VenturesPage() {
    return (
        <Layout pageTitle="Ventures">
            <Head>
                <meta name="robots" content="index, follow" />
            </Head>
            <section className="px-4 py-10 md:py-14">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-8 md:mb-10 text-center">
                        <h1 className="text-3xl md:text-5xl font-serif font-bold">Ventures & Brands</h1>
                        <p className="mt-3 text-[color:var(--color-on-secondary)/0.8]">A portfolio at the intersection of strategy, sustainability, and impact.</p>
                    </header>
                    <motion.div initial="hidden" animate="visible" variants={container} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {brands.map((b) => {
                            const internal = !/^https?:\/\//.test(b.href);
                            const Card = (
                                <motion.article key={b.name} variants={item} className="flex flex-col rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/10 hover:shadow-lg transition-shadow">
                                    <div className="relative mx-auto mb-5 h-[120px] w-[160px]">
                                        <Image src={b.logo} alt={`${b.name} logo`} fill sizes="160px" className="object-contain" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900 text-center">{b.name}</h2>
                                    {b.badge ? (<span className="mt-2 self-center rounded-full border border-black/10 bg-cream px-2.5 py-1 text-xs text-[color:var(--color-on-secondary)/0.8]">{b.badge}</span>) : null}
                                    <p className="mt-3 text-center text-[color:var(--color-on-secondary)/0.8]">{b.desc}</p>
                                    <span className="mt-5 inline-flex justify-center">
                                        <span className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream">Learn more</span>
                                    </span>
                                </motion.article>
                            );
                            return internal ? (
                                <Link key={b.name} href={b.href} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-opacity-40">{Card}</Link>
                            ) : (
                                <a key={b.name} href={b.href} target="_blank" rel="noopener noreferrer" className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-opacity-40">{Card}</a>
                            );
                        })}
                    </motion.div>
                </div>
            </section>
        </Layout>
    );
}