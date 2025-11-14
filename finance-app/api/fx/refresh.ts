// api/fx/refresh.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, numeric, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql as rawSql } from "drizzle-orm";

// ---- DB client ----
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

// ---- Table fx_rates ----
const fxRates = pgTable("fx_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  base: text("base").notNull(),
  quote: text("quote").notNull(),
  rate: numeric("rate", { precision: 14, scale: 6 }).notNull(),
  asOf: timestamp("as_of").defaultNow().notNull(),
});

// API FX externe simple (exchangerate.host, pas besoin de clé)
const FX_API_URL = "https://api.exchangerate.host/latest";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use POST` });
    }

    const base = ((req.body?.base as string) || "EUR").toUpperCase();

    const url = `${FX_API_URL}?base=${encodeURIComponent(base)}`;
    const fxRes = await fetch(url);

    if (!fxRes.ok) {
      throw new Error(`Erreur provider FX: HTTP ${fxRes.status} ${fxRes.statusText}`);
    }

    const json = (await fxRes.json()) as {
      base: string;
      date: string;
      rates: Record<string, number>;
    };

    const asOf = new Date(json.date || Date.now());

    const values = Object.entries(json.rates).map(([quote, rate]) => ({
      base: json.base.toUpperCase(),
      quote: quote.toUpperCase(),
      rate: rate.toString(),
      asOf,
    }));

    if (values.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Aucun taux à insérer.",
      });
    }

    await db.insert(fxRates).values(values);

    return res.status(200).json({
      success: true,
      inserted: values.length,
      base: json.base,
    });
  } catch (err: any) {
    console.error("Error in /api/fx/refresh:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/fx/refresh",
    });
  }
}
