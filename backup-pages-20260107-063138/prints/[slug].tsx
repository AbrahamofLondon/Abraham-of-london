/* Institutional Print Collection Detail */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getContentlayerData, 
  isDraftContent, 
  normalizeSlug, 
  getDocHref, 
  getAccessLevel 
} from "@/lib/contentlayer-compat";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { ShoppingBag, Ruler, CheckCircle, XCircle } from "lucide-react";

type Props = {
  print: {
    title: string;
    excerpt: string | null;
    description: string | null;
    price: string | null;
    dimensions: string | null;
    coverImage: string | null;
    slug: string;
    available: boolean;
  };
  source: MDXRemoteSerializeResult;
};

// REMOVE ONE OF THESE DUPLICATE FUNCTIONS - KEEP THIS ONE:
export const getStaticPaths: GetStaticPaths = async () => {
  const { allPrints } = await getContentlayerData();

  const paths = (allPrints ?? [])
    .filter((p: any) => p && !isDraftContent(p))
    .map((p: any) => {
      const slug = normalizeSlug(p?.slug ?? p?._raw?.flattenedPath ?? "");
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

function resolvePrintCoverImage(doc: any): string | null {
  return (
    doc?.coverImage ??
    doc?.coverimage ??
    doc?.image ??
    doc?.thumbnail ??
    null
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug(String(params?.slug ?? ""));
  if (!slug) return { notFound: true };

  const { allPrints } = await getContentlayerData();

  const doc =
    (allPrints ?? []).find((p: any) => {
      const s = normalizeSlug(p?.slug ?? p?._raw?.flattenedPath ?? "");
      return s === slug;
    }) ?? null;

  if (!doc || isDraftContent(doc)) return { notFound: true };

  const mdxContent = (doc as any)?.body?.raw ?? (doc as any)?.content ?? " ";

  const print = {
    title: (doc as any).title || "Exclusive Print",
    excerpt: (doc as any).excerpt ?? null,
    description: (doc as any).description ?? (doc as any).excerpt ?? null,
    price: (doc as any).price ?? null,
    dimensions: (doc as any).dimensions ?? null,
    coverImage: resolvePrintCoverImage(doc),
    slug,
    available: (doc as any).available !== false,
  };

  const source = await serialize(mdxContent, {
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
  });

  return { props: { print, source }, revalidate: 3600 };
};

const PrintDetailPage: NextPage<Props> = ({ print, source }) => {
  const [quantity, setQuantity] = React.useState(1);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    // Simulate API call
    setTimeout(() => {
      setIsAddingToCart(false);
      alert(`${quantity} x "${print.title}" added to cart!`);
    }, 500);
  };

  return (
    <Layout
      title={`${print.title} - Institutional Prints`}
      description={print.description || print.excerpt || ""}
      ogImage={print.coverImage || undefined}
    >
      <Head>
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/prints/${print.slug}`} />
      </Head>

      <div className="min-h-screen bg-black py-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-zinc-500">
            <a href="/" className="hover:text-amber-500 transition-colors">
              Home
            </a>
            {" / "}
            <a href="/prints" className="hover:text-amber-500 transition-colors">
              Prints
            </a>
            {" / "}
            <span className="text-amber-500">{print.title}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left Column: Image */}
            <div className="space-y-6">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                {print.coverImage ? (
                  <img
                    src={print.coverImage}
                    alt={print.title}
                    className="h-full w-full object-contain p-4 transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-6xl text-zinc-700">𓃲</div>
                  </div>
                )}
              </div>

              {/* Thumbnails (if available) */}
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 transition-all hover:border-amber-500/50 hover:scale-105"
                  >
                    {print.coverImage ? (
                      <img
                        src={print.coverImage}
                        alt={`${print.title} - View ${i}`}
                        className="h-full w-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-600">
                        <div className="text-xl">𓃲</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="space-y-8">
              <div>
                <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
                  {print.title}
                </h1>
                {print.excerpt && (
                  <p className="mt-4 text-lg text-zinc-400">{print.excerpt}</p>
                )}
              </div>

              {/* Price & Availability */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    {print.price ? (
                      <div className="text-3xl font-bold text-white">
                        {print.price}
                      </div>
                    ) : (
                      <div className="text-lg text-zinc-500">Price on request</div>
                    )}
                    {print.dimensions && (
                      <div className="mt-2 flex items-center gap-2 text-zinc-400">
                        <Ruler size={16} />
                        <span>{print.dimensions}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {print.available ? (
                      <>
                        <CheckCircle className="text-green-500" size={20} />
                        <span className="text-green-500 font-medium">In Stock</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="text-red-500" size={20} />
                        <span className="text-red-500 font-medium">Out of Stock</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quantity & Add to Cart */}
                {print.available && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-zinc-300">Quantity:</label>
                      <div className="flex items-center rounded-lg border border-zinc-700">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className={`w-full rounded-xl py-4 font-bold transition-all ${
                        isAddingToCart
                          ? "bg-amber-600 cursor-not-allowed"
                          : "bg-amber-500 hover:bg-amber-400 hover:scale-[1.02] active:scale-95"
                      } text-black flex items-center justify-center gap-3`}
                    >
                      {isAddingToCart ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={20} />
                          Add to Cart
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-zinc-500">
                      Free worldwide shipping on orders over £100
                    </p>
                  </div>
                )}
              </div>

              {/* Description Content */}
              <div className="prose prose-invert max-w-none">
                <MDXRemote {...source} components={mdxComponents} />
              </div>

              {/* Additional Info */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-6">
                <h3 className="mb-4 font-serif text-xl font-bold text-white">
                  Print Details
                </h3>
                <ul className="space-y-3 text-zinc-400">
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Archival quality print on fine art paper</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Hand-signed by Abraham of London</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Limited edition of 100 pieces worldwide</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Includes certificate of authenticity</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Carefully packaged in a protective tube</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrintDetailPage;