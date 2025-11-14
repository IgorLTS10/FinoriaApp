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

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

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
    if (req.method === "GET") {
      const userId = req.query.userId as string | undefined;
      if (!userId) {
        return res.status(400).json({ error: "userId est obligatoire" });
      }

      const rows = await db
        .select()
        .from(cryptoPositions)
        .where(eq(cryptoPositions.userId, userId));

      return res.status(200).json({
        data: rows.map((r) => ({
          ...r,
          quantity: Number(r.quantity),
          buyPriceUnit: Number(r.buyPriceUnit),
          buyTotal: Number(r.buyTotal),
        })),
      });
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const {
        userId,
        symbol,
        name,
        logoUrl,
        quantity,
        buyPriceUnit,
        buyTotal,
        buyCurrency,
        buyDate,
        notes,
      } = body;

      if (!userId || !symbol || !quantity || !buyCurrency || !buyDate) {
        return res.status(400).json({
          error:
            "Champs manquants : userId, symbol, quantity, buyCurrency, buyDate sont obligatoires.",
        });
      }

      const qty = Number(quantity);
      const unit = buyPriceUnit ? Number(buyPriceUnit) : undefined;
      const total = buyTotal ? Number(buyTotal) : undefined;

      let computedUnit = unit;
      let computedTotal = total;

      if (computedUnit == null && computedTotal != null && qty > 0) {
        computedUnit = computedTotal / qty;
      } else if (computedTotal == null && computedUnit != null && qty > 0) {
        computedTotal = computedUnit * qty;
      }

      if (computedUnit == null || computedTotal == null) {
        return res.status(400).json({
          error:
            "Merci de renseigner soit le prix unitaire, soit le montant total (ou les deux).",
        });
      }

      const [inserted] = await db
        .insert(cryptoPositions)
        .values({
          userId,
          symbol,
          name: name || null,
          logoUrl: logoUrl || null,
          quantity: qty.toString(),
          buyPriceUnit: computedUnit.toString(),
          buyTotal: computedTotal.toString(),
          buyCurrency,
          buyDate,
          notes: notes || null,
        })
        .returning();

      return res.status(200).json({
        success: true,
        row: {
          ...inserted,
          quantity: Number(inserted.quantity),
          buyPriceUnit: Number(inserted.buyPriceUnit),
          buyTotal: Number(inserted.buyTotal),
        },
      });
    }

    if (req.method === "DELETE") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const { id, userId } = body;

      if (!id || !userId) {
        return res.status(400).json({ error: "id et userId sont obligatoires" });
      }

      await db
        .delete(cryptoPositions)
        .where(and(eq(cryptoPositions.id, id), eq(cryptoPositions.userId, userId)));

      return res.status(200).json({ success: true });
    }

    return res
      .status(405)
      .json({ error: `Method ${req.method} not allowed, use GET/POST/DELETE` });
  } catch (err: any) {
    console.error("Error in /api/crypto/positions:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/crypto/positions",
    });
  }
}
