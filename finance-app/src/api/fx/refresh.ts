// src/api/fx/refresh.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../db/client";
import { fxRates } from "../../db/schema";
import { eq } from "drizzle-orm";

const SUPPORTED = ["EUR", "USD", "PLN", "GBP", "CHF"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const base = "EUR";

    const fakeRates: Record<string, number> = {
      USD: 1.08,
      PLN: 4.25,
      GBP: 0.86,
      CHF: 0.95,
    };

    const rows = Object.entries(fakeRates)
      .filter(([quote]) => SUPPORTED.includes(quote))
      .map(([quote, rate]) => ({
        base,
        quote,
        rate: rate.toString(), // 🔥 string pour numeric()
      }));

    await db.delete(fxRates).where(eq(fxRates.base, base));
    await db.insert(fxRates).values(rows);

    return res.status(200).json({ success: true, count: rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
