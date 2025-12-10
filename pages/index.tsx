// pages/index.tsx
import type { NextPage } from "next";
import Layout from "@/components/Layout";

const HomePage: NextPage = () => {
  console.log("HomePage render – sanity check");

  return (
  <Layout title={siteTitle} description={siteTagline}>
    {/* --- ENABLE ONLY HERO --- */}
    <section style={{ padding: "100px 0", textAlign: "center" }}>
      <h1 className="text-amber-400 text-3xl">HERO TEST</h1>
    </section>
  </Layout>
);

export default HomePage;