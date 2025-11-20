// api/metaux/history.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/client.js";
import { metalPricesHistory } from "../../src/db/schema.js";
import { eq, gte, sql } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const metal = (req.query.metal as string)?.toUpperCase(); // XAU/XAG/XPT/XPD
    const days = Number(req.query.days || 180);

    if (!metal) {
      return res.status(400).json({ error: "Paramètre 'metal' obligatoire" });
    }

    // récupérer les X derniers jours
    const rows = await db
      .select()
      .from(metalPricesHistory)
      .where(eq(metalPricesHistory.metal, metal))
      .orderBy(sql`${metalPricesHistory.asOf} ASC`)
      .limit(days);

    return res.status(200).json({ metal, history: rows });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
