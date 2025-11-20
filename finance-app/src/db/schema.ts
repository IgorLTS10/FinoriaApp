import { pgTable, serial, text, numeric, timestamp, uuid, date } from "drizzle-orm/pg-core";

export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),          // ex: AAPL, BTC
  quantity: numeric("quantity").notNull(),   // ex: 2.5
  createdAt: timestamp("created_at").defaultNow(),
});

export const metaux = pgTable("metaux", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),            // "or" | "argent" | "platine" | "palladium"
  poids: numeric("poids", { precision: 10, scale: 2 }).notNull(),
  unite: text("unite").default("g").notNull(), // "g" | "oz"
  prixAchat: numeric("prix_achat", { precision: 12, scale: 2 }).notNull(),
  deviseAchat: text("devise_achat").notNull(), // EUR, USD, PLN...
  dateAchat: date("date_achat").notNull(),
  fournisseur: text("fournisseur"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fxRates = pgTable("fx_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  base: text("base").notNull(),   // ex: "EUR"
  quote: text("quote").notNull(), // ex: "USD"
  rate: numeric("rate", { precision: 14, scale: 6 }).notNull(), // ex: 1.07895
  asOf: timestamp("as_of").defaultNow().notNull(),
});

export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),              // id du user (Stack)
  content: text("content").notNull(),             // texte saisi par l'utilisateur
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** ✅ Positions crypto saisies par l’utilisateur */
export const cryptoPositions = pgTable("crypto_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),

  // Identité de la crypto
  symbol: text("symbol").notNull(),      // ex: "BTC"
  name: text("name"),                    // ex: "Bitcoin" (optionnel)
  logoUrl: text("logo_url"),             // URL du logo (si tu veux stocker ce qu’on récupère d’une API)

  // Détail de l’achat
  quantity: numeric("quantity", { precision: 30, scale: 10 }).notNull(),      // ex: 0.123456789
  buyPriceUnit: numeric("buy_price_unit", { precision: 18, scale: 8 }).notNull(), // prix unitaire dans la devise d’achat
  buyTotal: numeric("buy_total", { precision: 18, scale: 8 }).notNull(),      // montant total payé
  buyCurrency: text("buy_currency").notNull(),                                // ex: "EUR"
  buyDate: date("buy_date").notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** ✅ Prix journaliers / snapshots pour les cryptos */
export const cryptoPrices = pgTable("crypto_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: text("symbol").notNull(),                  // ex: "BTC"
  currency: text("currency").notNull(),              // ex: "EUR"
  price: numeric("price", { precision: 30, scale: 10 }).notNull(), // prix actuel
  asOf: timestamp("as_of").defaultNow().notNull(),   // timestamp du prix
});

export const metalPricesHistory = pgTable("metal_prices_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  metal: text("metal").notNull(), // XAU, XAG, XPT, XPD
  pricePerOunceEur: numeric("price_per_ounce_eur", { precision: 30, scale: 10 }).notNull(),
  pricePerGramEur: numeric("price_per_gram_eur", { precision: 30, scale: 10 }).notNull(),
  asOf: timestamp("as_of").defaultNow().notNull(),
});
