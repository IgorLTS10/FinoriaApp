// api/crypto/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  pgTable,
  text,
  numeric,
  uuid,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// ---- DB client ----
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

// ---- Table crypto_positions ----
const cryptoPositions = pgTable("crypto_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),

  symbol: text("symbol").notNull(),
  name: text("name"),
  logoUrl: text("logo_url"),

  quantity: numeric("quantity", { precision: 30, scale: 10 }).notNull(),
  buyPriceUnit: numeric("buy_price_unit", { precision: 18, scale: 8 }).notNull(),
  buyTotal: numeric("buy_total", { precision: 18, scale: 8 }).notNull(),
  buyCurrency: text("buy_currency").notNull(),
  buyDate: date("buy_date").notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use GET` });
    }

    const userId = req.query.userId as string | undefined;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Paramètre userId obligatoire dans la query string." });
    }

    const rows = await db
      .select()
      .from(cryptoPositions)
      .where(eq(cryptoPositions.userId, userId));

    const formatted = rows.map((r) => ({
      ...r,
      quantity: Number(r.quantity),
      buyPriceUnit: Number(r.buyPriceUnit),
      buyTotal: Number(r.buyTotal),
    }));

    return res.status(200).json({ data: formatted });
  } catch (err: any) {
    console.error("Error in /api/crypto/list:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/crypto/list",
    });
  }
}
