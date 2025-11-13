// api/metaux/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { metaux } from "../../src/db/schema";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const rows = await db
      .select()
      .from(metaux)
      .where(eq(metaux.userId, userId));

    const data = rows.map((r: any) => ({
      ...r,
      poids: r.poids ? Number(r.poids) : 0,
      prixAchat: r.prixAchat ? Number(r.prixAchat) : 0,
    }));

    return res.status(200).json({ data });
  } catch (err: any) {
    console.error("Error in /api/metaux/list:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/metaux/list",
    });
  }
}
