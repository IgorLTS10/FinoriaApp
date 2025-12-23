import { pgTable, serial, text, numeric, timestamp, uuid, date, integer } from "drizzle-orm/pg-core";

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


export const stockPositions = pgTable("stock_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),

  symbol: text("symbol").notNull(),    // ex: AAPL
  name: text("name"),                  // ex: Apple Inc.
  exchange: text("exchange"),          // ex: NASDAQ
  logoUrl: text("logo_url"),           // Clearbit

  quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
  buyPrice: numeric("buy_price", { precision: 20, scale: 8 }).notNull(), // prix unitaire
  buyTotal: numeric("buy_total", { precision: 20, scale: 8 }).notNull(), // quantité * prix unitaire
  buyCurrency: text("buy_currency").notNull(), // USD/EUR etc.
  buyDate: date("buy_date").notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stockPrices = pgTable("stock_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: text("symbol").notNull(),
  price: numeric("price", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(), // USD
  asOf: timestamp("as_of").defaultNow().notNull(),
});

export const crowdfundingProjects = pgTable("crowdfunding_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  platform: text("platform"), // Legacy field - nullable for backward compatibility
  platformId: uuid("platform_id").references(() => crowdfundingPlatforms.id).notNull(),
  amountInvested: numeric("amount_invested", { precision: 12, scale: 2 }).notNull(),
  yieldPercent: numeric("yield_percent", { precision: 5, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  durationMonths: integer("duration_months").notNull(),
  status: text("status").default("active"), // active, finished
  imageUrl: text("image_url"),
  contractUrl: text("contract_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crowdfundingTransactions = pgTable("crowdfunding_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => crowdfundingProjects.id, { onDelete: 'cascade' }).notNull(),
  type: text("type").notNull(), // dividend, refund
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Crowdfunding platforms (shared across all users)
export const crowdfundingPlatforms = pgTable("crowdfunding_platforms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(), // Hex color code
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by"), // Optional: track who created it
});

// User platform favorites
export const userPlatformFavorites = pgTable("user_platform_favorites", {
  userId: uuid("user_id").notNull(),
  platformId: uuid("platform_id").references(() => crowdfundingPlatforms.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});