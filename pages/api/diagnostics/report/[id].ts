import type { NextApiHandler } from "next";

// MOVED: this route is now served by
// /.netlify/functions/diagnostic-report-id?id=<recordId>
//
// The rewrite was required to pull @react-pdf/renderer + fontkit +
// pdfkit out of the main `___netlify-server-handler` bundle, which was
// exceeding Netlify's per-file function upload limit.
//
// Keeping this stub to prevent 404 during transition.
const handler: NextApiHandler = async (req, res) => {
  const id = typeof req.query.id === "string" ? req.query.id : "";
  const target = `/.netlify/functions/diagnostic-report-id?id=${encodeURIComponent(id)}`;
  return res.redirect(308, target);
};

export default handler;
