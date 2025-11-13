// api/metaux/delete.ts
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

// ---- DB client ----
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

// ---- Table metaux (même définition que list/create) ----
const metaux = pgTable("metaux", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),

  type: text("type").notNull(),
  poids: numeric("poids", { precision: 10, scale: 2 }).notNull(),
  unite: text("unite").notNull(),

  prixAchat: numeric("prix_achat", { precision: 12, scale: 2 }).notNull(),
  deviseAchat: text("devise_achat").notNull(),

  dateAchat: date("date_achat").notNull(),

  fournisseur: text("fournisseur"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST" && req.method !== "DELETE") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use POST or DELETE` });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const { id, userId } = body as { id?: string; userId?: string };

    if (!id || !userId) {
      return res
        .status(400)
        .json({ error: "id et userId sont obligatoires pour la suppression." });
    }

    const deleted = await db
      .delete(metaux)
      .where(and(eq(metaux.id, id), eq(metaux.userId, userId)))
      .returning({ id: metaux.id });

    if (!deleted.length) {
      return res
        .status(404)
        .json({ error: "Aucune ligne trouvée pour cet id / userId." });
    }

    return res.status(200).json({ success: true, deleted: deleted[0].id });
  } catch (err: any) {
    console.error("Error in /api/metaux/delete:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/metaux/delete",
    });
  }
}
