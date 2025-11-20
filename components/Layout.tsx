// components/Layout.tsx
type LayoutProps = {
  children: React.ReactNode;
  /** canonical title prop */
  title?: string;
  /** legacy alias, supported for compatibility */
  pageTitle?: string;
  /** whether header should be transparent */
  transparentHeader?: boolean;
};

export default function Layout({
  children,
  title,
  pageTitle,
  transparentHeader = false, // default value
}: LayoutProps): JSX.Element {
  const effectiveTitle = getPageTitle(title ?? pageTitle);

  return (
    <div className="min-h-screen flex flex-col bg-white text-deepCharcoal">
      <Head>
        <title>{effectiveTitle}</title>
        <meta
          name="description"
          content="Abraham of London — faithful strategy for fathers, founders, and board-level leaders."
        />
      </Head>

      {/* Pass transparent prop to Header if needed */}
      <Header transparent={transparentHeader} />

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Global footer */}
      <Footer />
    </div>
  );
}