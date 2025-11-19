// api/crypto/prices.ts
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
import { sql as rawSql, and, desc, eq } from "drizzle-orm";

// ---- DB client ----
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

// ---- Tables ----
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

// ---- CoinGecko endpoints ----
const PROVIDER_MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets";
const PROVIDER_SEARCH_URL =
  "https://api.coingecko.com/api/v3/search";

type CoinSearchItem = {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
};

type MarketItem = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // =====================================================
    // GET : retourne les derniers prix
    // - si ?symbols=BTC,ETH → ces symboles
    // - sinon → tous les symboles distincts en base
    // =====================================================
    if (req.method === "GET") {
      const currency = ((req.query.currency as string) || "EUR").toUpperCase();
      const symbolsParam = (req.query.symbols as string | undefined) || "";

      let symbols: string[] = [];

      if (symbolsParam.trim()) {
        symbols = symbolsParam
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
      } else {
        // Pas de paramètre → on regarde toutes les cryptos existantes
        const distinct = await db.execute(
          rawSql`SELECT DISTINCT UPPER(symbol) as symbol FROM crypto_positions`
        );
        symbols = (distinct.rows as any[]).map((r) => r.symbol as string);
      }

      if (symbols.length === 0) {
        return res.status(200).json({ prices: {} });
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
    }

    // =====================================================
    // POST : REFRESH des prix (appelé par GitHub Actions)
    // - récupère symboles distincts depuis crypto_positions
    // - pour chaque symbole → devine l'id CoinGecko via /search
    // - appelle /coins/markets avec tous les ids
    // - supprime les anciens prix pour ces symboles
    // - insère les nouveaux
    // - met à jour name + logoUrl dans crypto_positions
    // =====================================================
    if (req.method === "POST") {
      // 1) symboles distincts
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

      // 2) Pour chaque symbole, on va chercher l'id CoinGecko
      const mapped: { symbol: string; providerId: string }[] = [];
      const unmapped: string[] = [];

      for (const symbol of symbols) {
        const searchUrl = `${PROVIDER_SEARCH_URL}?query=${encodeURIComponent(
          symbol
        )}`;
        const searchRes = await fetch(searchUrl);

        if (!searchRes.ok) {
          console.warn(
            `Search API error for ${symbol}: ${searchRes.status} ${searchRes.statusText}`
          );
          unmapped.push(symbol);
          continue;
        }

        const json = (await searchRes.json()) as { coins: CoinSearchItem[] };
        const coins = json.coins || [];
        if (coins.length === 0) {
          unmapped.push(symbol);
          continue;
        }

        const lowerSymbol = symbol.toLowerCase();
        let best = coins.find(
          (c) => c.symbol.toLowerCase() === lowerSymbol
        );
        if (!best) {
          best = coins[0]; // fallback : premier résultat
        }

        if (!best) {
          unmapped.push(symbol);
          continue;
        }

        mapped.push({ symbol, providerId: best.id });
      }

      if (mapped.length === 0) {
        return res.status(200).json({
          success: true,
          message:
            "Aucun symbole n'a pu être mappé automatiquement. Vérifie les symboles en base.",
          unmapped,
        });
      }

      const idsParam = mapped.map((m) => m.providerId).join(",");
      const vsCurrency = "eur";

      // 3) Appel CoinGecko /coins/markets pour tous les ids
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

      const data = (await priceRes.json()) as MarketItem[];
      const now = new Date();

      const valuesToInsert: {
        symbol: string;
        currency: string;
        price: string;
        asOf: Date;
      }[] = [];

      // 4) Construire les valeurs + préparer les updates de metadata
      for (const m of mapped) {
        const market = data.find((d) => d.id === m.providerId);
        if (
          !market ||
          !market.current_price ||
          !Number.isFinite(market.current_price)
        ) {
          continue;
        }

        valuesToInsert.push({
          symbol: m.symbol,
          currency: vsCurrency.toUpperCase(),
          price: market.current_price.toString(),
          asOf: now,
        });

        // Update name + logoUrl sur crypto_positions
        await db
          .update(cryptoPositions)
          .set({
            name: market.name,
            logoUrl: market.image,
            updatedAt: now,
          })
          .where(eq(cryptoPositions.symbol, m.symbol));
      }

      if (valuesToInsert.length === 0) {
        return res.status(200).json({
          success: true,
          message:
            "Aucun prix valide reçu du provider pour les symboles demandés.",
          unmapped,
        });
      }

      // 5) Éviter les doublons : on supprime les anciens prix pour ces symboles / currency
      const affectedSymbols = Array.from(
        new Set(valuesToInsert.map((v) => v.symbol))
      );

      for (const sym of affectedSymbols) {
        await db
          .delete(cryptoPrices)
          .where(
            and(
              eq(cryptoPrices.symbol, sym),
              eq(cryptoPrices.currency, vsCurrency.toUpperCase())
            )
          );
      }

      // 6) On insère les nouveaux prix
      await db.insert(cryptoPrices).values(valuesToInsert);

      return res.status(200).json({
        success: true,
        inserted: valuesToInsert.length,
        symbols: valuesToInsert.map((v) => v.symbol),
        unmapped,
      });
    }

    // Méthodes non prises en charge
    return res
      .status(405)
      .json({ error: `Method ${req.method} not allowed, use GET/POST` });
  } catch (err: any) {
    console.error("Error in /api/crypto/prices:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/crypto/prices",
    });
  }
}
