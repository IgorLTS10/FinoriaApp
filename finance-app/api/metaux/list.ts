// api/metaux/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    message: "API /api/metaux/list fonctionne sans DB",
    query: req.query,
  });
}
