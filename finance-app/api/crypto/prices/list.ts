// api/crypto/prices/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  pgTable,
  text,
  numeric,
  uuid,
  timestamp,
} from "drizzle-orm/pg-core";
import { and, desc, eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

const cryptoPrices = pgTable("crypto_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: text("symbol").notNull(),
  currency: text("currency").notNull(),
  price: numeric("price", { precision: 30, scale: 10 }).notNull(),
  asOf: timestamp("as_of").defaultNow().notNull(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use GET` });
    }

    const symbolsParam = (req.query.symbols as string | undefined) || "";
    const currency = ((req.query.currency as string | undefined) || "EUR").toUpperCase();

    const symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0) {
      return res.status(400).json({
        error: "Paramètre symbols obligatoire, ex: ?symbols=BTC,ETH,SOL",
      });
    }

    const pricesBySymbol: Record<
      string,
      { price: number; currency: string; asOf: string }
    > = {};

    for (const symbol of symbols) {
      const rows = await db
        .select()
        .from(cryptoPrices)
        .where(
          and(
            eq(cryptoPrices.symbol, symbol),
            eq(cryptoPrices.currency, currency)
          )
        )
        .orderBy(desc(cryptoPrices.asOf))
        .limit(1);

      const row = rows[0];
      if (row) {
        pricesBySymbol[symbol] = {
          price: Number(row.price),
          currency: row.currency,
          asOf: row.asOf.toISOString(),
        };
      }
    }

    return res.status(200).json({ prices: pricesBySymbol });
  } catch (err: any) {
    console.error("Error in /api/crypto/prices/list:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/crypto/prices/list",
    });
  }
}
