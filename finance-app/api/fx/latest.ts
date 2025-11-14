// api/fx/latest.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, numeric, uuid, timestamp } from "drizzle-orm/pg-core";
import { desc, and, eq } from "drizzle-orm";

// ---- DB client local à la fonction ----
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

// ---- Table fx_rates (copiée depuis ton schema.ts) ----
const fxRates = pgTable("fx_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  base: text("base").notNull(),
  quote: text("quote").notNull(),
  rate: numeric("rate", { precision: 14, scale: 6 }).notNull(),
  asOf: timestamp("as_of").defaultNow().notNull(),
});

// ⬇️ ET JUSTE EN DESSOUS, tu gardes ton handler existant
//    (remplace ce handler si tu veux, c’est juste un exemple)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use GET` });
    }

    const base = ((req.query.base as string) || "EUR").toUpperCase();
    const quote = (req.query.quote as string | undefined)?.toUpperCase();

    if (!quote) {
      // Derniers taux pour toutes les quotes de cette base
      const rows = await db
        .select()
        .from(fxRates)
        .where(eq(fxRates.base, base))
        .orderBy(desc(fxRates.asOf))
        .limit(100);

      return res.status(200).json({ base, rates: rows });
    } else {
      // Dernier taux pour une paire base/quote
      const rows = await db
        .select()
        .from(fxRates)
        .where(and(eq(fxRates.base, base), eq(fxRates.quote, quote)))
        .orderBy(desc(fxRates.asOf))
        .limit(1);

      const row = rows[0];
      if (!row) {
        return res
          .status(404)
          .json({ error: `Aucun taux trouvé pour ${base}/${quote}` });
      }

      return res.status(200).json({
        base: row.base,
        quote: row.quote,
        rate: Number(row.rate),
        asOf: row.asOf,
      });
    }
  } catch (err: any) {
    console.error("Error in /api/fx/latest:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/fx/latest",
    });
  }
}
