/* pages/inner-circle/unlock.tsx — INSTITUTIONAL LINK REDEMPTION */
import * as React from "react";
import type { GetServerSideProps } from "next";
import { redeemAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { setAccessCookie } from "@/lib/server/auth/cookies";
import Layout from "@/components/Layout";

interface UnlockProps {
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { key } = context.query;

  if (!key || typeof key !== "string") {
    return { props: { error: "Missing or malformed access key." } };
  }

  try {
    // 1. Unified Redemption Logic (HMAC-SHA256 Verification + DB Session Creation)
    const result = await redeemAccessKey(key, {
      ipAddress: String(context.req.headers["x-forwarded-for"] || context.req.socket.remoteAddress),
      userAgent: String(context.req.headers["user-agent"] || ""),
      source: "email_link",
    });

    if (!result.ok) {
      return { props: { error: result.reason || "Invalid or expired key." } };
    }

    // 2. Set Secure Cookie (Institutional Grade)
    setAccessCookie(context.res as any, result.sessionId);

    // 3. Strategic Redirect to Dashboard
    return {
      redirect: {
        destination: "/inner-circle/dashboard",
        permanent: false,
      },
    };
  } catch (error) {
    console.error("[UNLOCK_PAGE_ERROR]:", error);
    return { props: { error: "Institutional infrastructure failure." } };
  }
};

export default function UnlockPage({ error }: UnlockProps) {
  return (
    <Layout title="Authenticating... | Abraham of London">
      <div className="flex min-h-screen items-center justify-center bg-[#020617] p-6">
        <div className="max-w-md w-full bg-[#0f172a] border border-slate-800 p-12 text-center rounded-sm">
          <h1 className="text-[#f8fafc] text-lg font-bold uppercase tracking-widest mb-2">
            Abraham of London
          </h1>
          <h2 className="text-[#64748b] text-[10px] uppercase tracking-[0.3em] mb-12">
            Inner Circle Vault
          </h2>
          
          {error ? (
            <div className="space-y-6">
              <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>
              <a 
                href="/inner-circle/login" 
                className="block w-full py-4 bg-[#f8fafc] text-[#020617] text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-colors"
              >
                Request New Key
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
              <p className="text-[#94a3b8] text-sm italic animate-pulse">
                Authenticating Secure Session...
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}