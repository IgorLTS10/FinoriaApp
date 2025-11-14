// api/crypto/prices/refresh.ts
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
import { sql as rawSql } from "drizzle-orm";
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

// ---- Tables locales ----
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

const cryptoPrices = pgTable("crypto_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: text("symbol").notNull(),
  currency: text("currency").notNull(),
  price: numeric("price", { precision: 30, scale: 10 }).notNull(),
  asOf: timestamp("as_of").defaultNow().notNull(),
});

// Mapping symbole → id provider (à enrichir petit à petit)
const SYMBOL_TO_PROVIDER_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  BNB: "binancecoin",
  XRP: "ripple",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  DOGE: "dogecoin",
  // ajoute ici celles que tu utilises
};

const PROVIDER_MARKETS_URL = "https://api.coingecko.com/api/v3/coins/markets";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use POST` });
    }

    // 1) Récupérer les symboles distincts présents dans crypto_positions
    const distinctSymbols = await db.execute(
      rawSql`SELECT DISTINCT UPPER(symbol) as symbol FROM crypto_positions`
    );

    const symbols: string[] = (distinctSymbols.rows as any[]).map(
      (r) => r.symbol as string
    );

    if (symbols.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Aucune position crypto, rien à rafraîchir.",
      });
    }

    // 2) Construire la liste d'IDs provider
    const mapped: { symbol: string; providerId: string }[] = [];
    for (const symbol of symbols) {
      const providerId = SYMBOL_TO_PROVIDER_ID[symbol];
      if (providerId) {
        mapped.push({ symbol, providerId });
      }
    }

    if (mapped.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "Aucun symbole n'a de mapping vers un provider. Complète SYMBOL_TO_PROVIDER_ID.",
      });
    }

    const idsParam = mapped.map((m) => m.providerId).join(",");
    const vsCurrency = "eur";

    // 3) Appel à l'API marché (prix + nom + logo) type CoinGecko
    const url = `${PROVIDER_MARKETS_URL}?vs_currency=${encodeURIComponent(
      vsCurrency
    )}&ids=${encodeURIComponent(
      idsParam
    )}&order=market_cap_desc&per_page=250&page=1&sparkline=false`;

    const priceRes = await fetch(url);
    if (!priceRes.ok) {
      throw new Error(
        `Erreur provider prix: HTTP ${priceRes.status} ${priceRes.statusText}`
      );
    }

    type MarketItem = {
      id: string;
      symbol: string;
      name: string;
      image: string;
      current_price: number;
    };

    const data = (await priceRes.json()) as MarketItem[];

    const now = new Date();

    // 4) Construire les inserts dans crypto_prices + update noms/logos
    const valuesToInsert: {
      symbol: string;
      currency: string;
      price: string;
      asOf: Date;
    }[] = [];

    for (const m of mapped) {
      const market = data.find((d) => d.id === m.providerId);
      if (!market || !market.current_price || !Number.isFinite(market.current_price)) continue;

      // Insert pour les prix
      valuesToInsert.push({
        symbol: m.symbol,
        currency: vsCurrency.toUpperCase(),
        price: market.current_price.toString(),
        asOf: now,
      });

      // Update name + logoUrl sur crypto_positions
      const displayName = market.name;
      const logoUrl = market.image;

      // On ne met pas de where sur name/logo null pour simplifier :
      await db
        .update(cryptoPositions)
        .set({
          name: displayName,
          logoUrl: logoUrl,
          updatedAt: now,
        })
        .where(eq(cryptoPositions.symbol, m.symbol));
    }

    if (valuesToInsert.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "Aucun prix valide reçu du provider pour les symboles demandés.",
      });
    }

    await db.insert(cryptoPrices).values(valuesToInsert);

    return res.status(200).json({
      success: true,
      inserted: valuesToInsert.length,
      symbols: valuesToInsert.map((v) => v.symbol),
    });
  } catch (err: any) {
    console.error("Error in /api/crypto/prices/refresh:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/crypto/prices/refresh",
    });
  }
}
