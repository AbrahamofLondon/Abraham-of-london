// pages/index.tsx
import type { NextPage } from "next";
import Layout from "@/components/Layout";

const HomePage: NextPage = () => {
  console.log("HomePage render – sanity check");

  return (
    <Layout title="AofL – Sanity Check" fullWidth>
      <div className="min-h-[60vh] flex items-center justify-center">
        <h1 className="text-3xl font-bold text-amber-400">
          If you can see this, the page pipeline works.
        </h1>
      </div>
    </Layout>
  );
};

export default HomePage;