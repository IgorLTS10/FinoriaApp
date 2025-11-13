// api/metaux/list.ts
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

// ---- Table metaux ----
const metaux = pgTable("metaux", {
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

// ---- Handler ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = req.query.userId as string | undefined;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const rows = await db
      .select()
      .from(metaux)
      .where(eq(metaux.userId, userId));

    const data = rows.map((r: any) => ({
      ...r,
      poids: r.poids ? Number(r.poids) : 0,
      prixAchat: r.prixAchat ? Number(r.prixAchat) : 0,
    }));

    return res.status(200).json({ data });
  } catch (err: any) {
    console.error("Error in /api/metaux/list:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/metaux/list",
    });
  }
}
