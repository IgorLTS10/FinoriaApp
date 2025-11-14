// api/crypto/delete.ts
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
import { and, eq } from "drizzle-orm";

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
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use POST` });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const { id, userId } = body;

    if (!id || !userId) {
      return res
        .status(400)
        .json({ error: "Champs id et userId sont obligatoires." });
    }

    const result = await db
      .delete(cryptoPositions)
      .where(and(eq(cryptoPositions.id, id), eq(cryptoPositions.userId, userId)));

    // drizzle ne renvoie pas forcément le nombre, donc on ne checke pas trop agressivement
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Error in /api/crypto/delete:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/crypto/delete",
    });
  }
}
