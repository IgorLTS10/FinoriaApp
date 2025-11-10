import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),          // ex: AAPL, BTC
  quantity: numeric("quantity").notNull(),   // ex: 2.5
  createdAt: timestamp("created_at").defaultNow(),
});
