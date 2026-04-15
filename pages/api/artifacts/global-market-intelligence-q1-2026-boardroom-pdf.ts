import type { NextApiHandler } from "next";

// MOVED: this route is now served by
// /.netlify/functions/gmi-boardroom-pdf
//
// The rewrite was required to pull @react-pdf/renderer + the GMI
// boardroom template out of the main `___netlify-server-handler`
// bundle, which exceeds Netlify's per-file function upload limit.
//
// Keeping this stub to prevent 404 during transition.
const handler: NextApiHandler = async (_req, res) => {
  return res.redirect(308, "/.netlify/functions/gmi-boardroom-pdf");
};

export default handler;
