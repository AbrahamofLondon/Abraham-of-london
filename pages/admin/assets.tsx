/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * INSTITUTIONAL ASSET CONTROL CENTER
 * Restricted to Administrative clearance only.
 * Hosts the PDF Synchronization Dashboard.
 */

import React from "react";
import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import PdfSyncDashboard from "@/components/admin/PdfSyncDashboard";
import { validateAdminAccess } from "@/lib/server/validation";

interface Props {
  admin: {
    userId: string;
    role: string;
  };
}

const AdminAssetsPage: NextPage<Props> = ({ admin }) => {
  return (
    <Layout title="Asset Registry | Control Center" className="bg-black min-h-screen">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="pt-32 pb-40 px-6">
        <header className="max-w-4xl mx-auto mb-16 px-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] w-12 bg-amber-500/50" />
            <span className="font-mono text-[10px] text-amber-500 uppercase tracking-[0.4em]">
              Security Level: Top Secret
            </span>
          </div>
          <h1 className="font-serif text-5xl italic text-white mb-4">
            Sovereign Asset Control
          </h1>
          <p className="text-zinc-500 font-light text-lg max-w-2xl leading-relaxed">
            Manage the integrity and synchronization of the 163 intelligence briefs. 
            Use the interface below to upgrade assets to premium or heal corrupted transmissions.
          </p>
          
          <div className="mt-8 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[9px] text-emerald-500/80 uppercase tracking-widest">
              Operator Authenticated: {admin.userId}
            </span>
          </div>
        </header>

        <section className="relative">
          {/* Dashboard Component */}
          <PdfSyncDashboard />
        </section>

        <footer className="max-w-4xl mx-auto mt-20 px-4 border-t border-zinc-900 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h4 className="text-zinc-400 font-mono text-[10px] uppercase mb-4 tracking-widest">Protocol Notice</h4>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Synchronization utilizes <strong>Atomic Replacement</strong>. Files are never deleted 
                until new assets are verified. Force Refresh should only be utilized during 
                major portfolio upgrades.
              </p>
            </div>
            <div className="text-right">
              <span className="text-zinc-800 font-mono text-[8px] uppercase tracking-[0.5em]">
                Abraham of London // Asset Management v2.026
              </span>
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
};

/**
 * SERVER-SIDE ACCESS CONTROL
 * Strictly enforces admin validation before rendering the page.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = await validateAdminAccess(context.req as any);

  if (!auth.valid) {
    return {
      redirect: {
        destination: "/404", // Obfuscation: Redirect to 404 instead of login
        permanent: false,
      },
    };
  }

  return {
    props: {
      admin: {
        userId: auth.userId || "authorized_operator",
        role: "admin",
      },
    },
  };
};

export default AdminAssetsPage;