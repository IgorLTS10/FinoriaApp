// api/metaux/shared.ts
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

// 🔥 Connexion à Neon via DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql);

// 🔥 Schéma minimal pour la table `metaux`
export const metaux = pgTable("metaux", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),

  type: text("type").notNull(), // "or" | "argent" | "platine" | "palladium"
  poids: numeric("poids", { precision: 10, scale: 2 }).notNull(),
  unite: text("unite").notNull(), // "g" | "oz"

  prixAchat: numeric("prix_achat", { precision: 12, scale: 2 }).notNull(),
  deviseAchat: text("devise_achat").notNull(),

  dateAchat: date("date_achat").notNull(),

  fournisseur: text("fournisseur"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
