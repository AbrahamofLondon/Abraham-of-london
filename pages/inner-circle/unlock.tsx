/* pages/inner-circle/unlock.tsx — INSTITUTIONAL LINK REDEMPTION */
import { GetServerSideProps } from "next";
import { redeemAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { setAccessCookie } from "@/lib/server/auth/cookies";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { key } = context.query;

  if (!key || typeof key !== "string") {
    return { props: { error: "Missing or malformed access key." } };
  }

  try {
    // 1. Unified Redemption Logic (HMAC-SHA256 + DB Transaction)
    const result = await redeemAccessKey(key, {
      ipAddress: String(context.req.headers["x-forwarded-for"] || context.req.socket.remoteAddress),
      userAgent: String(context.req.headers["user-agent"] || ""),
      source: "email_link",
    });

    if (!result.ok) {
      return { props: { error: result.reason || "Invalid or expired key." } };
    }

    // 2. Set Secure Cookie via your existing utility
    // We pass context.res to allow the utility to set headers
    setAccessCookie(context.res as any, result.sessionId);

    // 3. Strategic Redirect
    return {
      redirect: {
        destination: "/inner-circle/briefings",
        permanent: false,
      },
    };
  } catch (error) {
    console.error("[UNLOCK_PAGE_ERROR]:", error);
    return { props: { error: "Institutional infrastructure failure." } };
  }
};

export default function UnlockPage({ error }: { error?: string }) {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Abraham of London</h1>
        <h2 style={subtitleStyle}>Inner Circle Vault</h2>
        {error ? (
          <div style={errorContainer}>
            <p style={errorStyle}>⚠️ {error}</p>
            <a href="/inner-circle/login" style={buttonStyle}>Request New Key</a>
          </div>
        ) : (
          <p style={loadingStyle}>Authenticating Secure Session...</p>
        )}
      </div>
    </div>
  );
}

// Minimalist High-End Styles (Matches your Aesthetic)
const containerStyle = { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' };
const cardStyle = { padding: '48px', borderRadius: '1px', border: '1px solid #1e293b', backgroundColor: '#0f172a', textAlign: 'center' as const, maxWidth: '400px' };
const titleStyle = { color: '#f8fafc', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' };
const subtitleStyle = { color: '#64748b', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '32px' };
const errorContainer = { marginTop: '20px' };
const errorStyle = { color: '#f87171', fontSize: '14px', marginBottom: '24px' };
const loadingStyle = { color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' };
const buttonStyle = { display: 'block', padding: '12px', backgroundColor: '#f8fafc', color: '#020617', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' as const };