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