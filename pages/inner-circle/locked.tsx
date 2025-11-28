// pages/inner-circle/locked.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import SiteLayout from "@/components/SiteLayout";

export default function LockedPage() {
  const router = useRouter();

  const returnTo =
    typeof router.query.returnTo === "string"
      ? router.query.returnTo
      : "/canon";

  const joinHref = `/inner-circle?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <SiteLayout pageTitle="Access Restricted">
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="mb-4 font-serif text-3xl text-softGold">
          Restricted Canon Volume
        </h1>

        <p className="mb-8 text-gray-300">
          This document is reserved for Inner Circle members.
        </p>

        <Link
          href={joinHref}
          className="inline-flex rounded-xl bg-softGold px-6 py-3 font-semibold text-black hover:bg-softGold/90"
        >
          Join the Inner Circle
        </Link>
      </div>
    </SiteLayout>
  );
}