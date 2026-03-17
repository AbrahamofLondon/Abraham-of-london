// pages/api/og/short.tsx
import type { NextApiRequest } from "next";
import { ImageResponse } from "next/og";

export const config = {
  runtime: "edge",
};

function safeParam(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) return value[0] ? String(value[0]) : fallback;
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

export default function handler(req: NextApiRequest) {
  try {
    const title = safeParam(req.query.title, "Field Note");
    const category = safeParam(req.query.category, "INTEL");
    const readTime = safeParam(req.query.readTime, "2 MIN");

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            backgroundColor: "#000000",
            padding: "80px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.05,
              backgroundImage:
                "radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "40px",
              left: "40px",
              right: "40px",
              bottom: "40px",
              border: "1px solid rgba(212, 175, 55, 0.10)",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              zIndex: 10,
              width: "100%",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "40px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "1px",
                  backgroundColor: "#D4AF37",
                }}
              />
              <span
                style={{
                  color: "#D4AF37",
                  fontSize: "18px",
                  fontWeight: 900,
                  letterSpacing: "0.5em",
                  textTransform: "uppercase",
                }}
              >
                {category} {"//"} BRIEFING
              </span>
            </div>

            <h1
              style={{
                fontSize: "100px",
                fontFamily: "serif",
                fontStyle: "italic",
                color: "#ffffff",
                lineHeight: 1.1,
                margin: 0,
                marginBottom: "60px",
                maxWidth: "900px",
              }}
            >
              {title}.
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                width: "100%",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "14px",
                    letterSpacing: "0.2em",
                  }}
                >
                  ABRAHAM OF LONDON
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.1)",
                    fontSize: "12px",
                    marginTop: "5px",
                  }}
                >
                  SECURE PROTOCOL v2.026
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    color: "rgba(212, 175, 55, 0.4)",
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  {readTime} ANALYSIS
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (_error) {
    return new Response("Failed to generate image", { status: 500 });
  }
}