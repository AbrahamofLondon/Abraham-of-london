import type { NextApiRequest, NextApiResponse } from "next";
import logoutHandler from "./logout";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return logoutHandler(req, res);
}
