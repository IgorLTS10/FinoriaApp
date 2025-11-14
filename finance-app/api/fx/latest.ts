// src/api/fx/latest.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../db/client.js";
import { fxRates } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const base = (req.query.base as string) || "EUR";

    const rows = await db
      .select()
      .from(fxRates)
      .where(eq(fxRates.base, base));

    let map: Record<string, number> = {};
    for (const r of rows) {
      map[r.quote] = Number(r.rate);
    }

    // 🔥 fallback pour le dev si aucun taux en base
    if (!rows.length && base === "EUR") {
      map = {
        USD: 1.08,
        PLN: 4.25,
        GBP: 0.86,
        CHF: 0.95,
      };
    }

    return res.status(200).json({ base, rates: map });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
