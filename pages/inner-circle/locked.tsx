// pages/inner-circle/locked.tsx
import Link from "next/link";
import SiteLayout from "@/components/SiteLayout";

export default function LockedPage() {
  return (
    <SiteLayout pageTitle="Access Restricted">
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="font-serif text-3xl text-softGold mb-4">
          Restricted Canon Volume
        </h1>

        <p className="text-gray-300 mb-8">
          This document is reserved for Inner Circle members.
        </p>

        <Link
          href="/inner-circle"
          className="inline-flex rounded-xl bg-softGold px-6 py-3 font-semibold text-black hover:bg-softGold/90"
        >
          Join the Inner Circle
        </Link>
      </div>
    </SiteLayout>
  );
}