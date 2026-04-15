import type { NextApiHandler } from "next";

// MOVED: this route is now served by
// /.netlify/functions/diagnostic-report
//
// The rewrite was required to pull @react-pdf/renderer + fontkit +
// pdfkit out of the main `___netlify-server-handler` bundle, which was
// exceeding Netlify's per-file function upload limit.
//
// Keeping this stub to prevent 404 during transition.
const handler: NextApiHandler = async (req, res) => {
  if (req.method === "POST") {
    // Forward POST bodies by redirecting with 307 (preserves method + body).
    return res.redirect(307, "/.netlify/functions/diagnostic-report");
  }
  return res.redirect(308, "/.netlify/functions/diagnostic-report");
};

export default handler;
