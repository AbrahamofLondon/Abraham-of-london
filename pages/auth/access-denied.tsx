import Link from "next/link";
import type { GetServerSideProps } from "next";
import Layout from "@/components/Layout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function AccessDeniedPage() {
  return (
    <Layout title="Access Denied">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-6 text-center">
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
            Access Denied
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 font-sans">
            You do not have permission to view this surface.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 font-mono">
            This may be because your account role does not include access to this area.
            If you believe this is an error, contact your organisation administrator.
          </p>
          <div className="pt-4">
            <Link
              href="/decision-centre"
              className="inline-block px-6 py-2 text-sm font-mono text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded hover:opacity-90 transition-opacity"
            >
              Return to Decision Centre
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
