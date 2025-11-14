// api/crypto/create.ts
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

// ---- Handler ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use POST` });
    }

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

    // Vérifs minimales
    if (!userId || !symbol || !quantity || !buyCurrency || !buyDate) {
      return res.status(400).json({
        error:
          "Champs manquants : userId, symbol, quantity, buyCurrency, buyDate sont obligatoires.",
      });
    }

    const qtyNum = Number(quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({
        error: "quantity doit être un nombre positif.",
      });
    }

    let buyPriceUnitNum =
      buyPriceUnit !== undefined && buyPriceUnit !== null
        ? Number(buyPriceUnit)
        : undefined;
    let buyTotalNum =
      buyTotal !== undefined && buyTotal !== null ? Number(buyTotal) : undefined;

    if (
      buyPriceUnitNum !== undefined &&
      !Number.isFinite(buyPriceUnitNum)
    ) {
      return res.status(400).json({
        error: "buyPriceUnit doit être un nombre valide.",
      });
    }

    if (buyTotalNum !== undefined && !Number.isFinite(buyTotalNum)) {
      return res.status(400).json({
        error: "buyTotal doit être un nombre valide.",
      });
    }

    // Logique : si l'un des deux manque, on le calcule
    if (buyPriceUnitNum == null && buyTotalNum == null) {
      return res.status(400).json({
        error:
          "Tu dois renseigner au moins buyPriceUnit ou buyTotal pour que l’autre puisse être calculé.",
      });
    }

    if (buyPriceUnitNum == null && buyTotalNum != null) {
      buyPriceUnitNum = buyTotalNum / qtyNum;
    }

    if (buyTotalNum == null && buyPriceUnitNum != null) {
      buyTotalNum = qtyNum * buyPriceUnitNum;
    }

    // Petit check final
    if (
      buyPriceUnitNum == null ||
      buyTotalNum == null ||
      !Number.isFinite(buyPriceUnitNum) ||
      !Number.isFinite(buyTotalNum)
    ) {
      return res.status(400).json({
        error: "Impossible de calculer correctement buyPriceUnit / buyTotal.",
      });
    }

    const [inserted] = await db
      .insert(cryptoPositions)
      .values({
        userId,
        symbol,
        name: name || null,
        logoUrl: logoUrl || null,
        quantity: qtyNum.toString(),
        buyPriceUnit: buyPriceUnitNum.toString(),
        buyTotal: buyTotalNum.toString(),
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
  } catch (err: any) {
    console.error("Error in /api/crypto/create:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/crypto/create",
    });
  }
}
