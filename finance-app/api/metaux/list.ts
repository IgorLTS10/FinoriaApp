// api/metaux/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/client"; // ✅ on réintroduit juste cet import

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    message: "API /api/metaux/list fonctionne avec import db",
    query: req.query,
  });
}
