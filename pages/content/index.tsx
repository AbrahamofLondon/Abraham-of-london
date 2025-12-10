// pages/index.tsx – Minimal diagnostic homepage

import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";

const HomeTest: NextPage = () => {
  return (
    <Layout title="Homepage Diagnostics">
      <main className="min-h-screen bg-red-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">HOMEPAGE DIAGNOSTIC</h1>
          <p className="text-sm">
            If you can read this, the index.tsx wiring is fine and the issue is
            inside the big homepage layout.
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default HomeTest;