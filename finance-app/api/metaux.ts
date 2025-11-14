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

// ---- Table metaux ----
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
    if (req.method === "GET") {
      // LIST
      const userId = req.query.userId as string | undefined;
      if (!userId) {
        return res.status(400).json({ error: "userId est obligatoire" });
      }

      const rows = await db
        .select()
        .from(metaux)
        .where(eq(metaux.userId, userId));

      return res.status(200).json({
        data: rows.map((r) => ({
          ...r,
          poids: Number(r.poids),
          prixAchat: Number(r.prixAchat),
        })),
      });
    }

    if (req.method === "POST") {
      // CREATE
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const {
        userId,
        type,
        poids,
        unite,
        prixAchat,
        deviseAchat,
        dateAchat,
        fournisseur,
        notes,
      } = body;

      if (!userId || !type || !poids || !prixAchat || !deviseAchat || !dateAchat) {
        return res.status(400).json({
          error:
            "Champs manquants : userId, type, poids, prixAchat, deviseAchat, dateAchat sont obligatoires.",
        });
      }

      const [inserted] = await db
        .insert(metaux)
        .values({
          userId,
          type,
          poids: poids.toString(),
          unite,
          prixAchat: prixAchat.toString(),
          deviseAchat,
          dateAchat,
          fournisseur: fournisseur || null,
          notes: notes || null,
        })
        .returning();

      return res.status(200).json({
        success: true,
        row: {
          ...inserted,
          poids: Number(inserted.poids),
          prixAchat: Number(inserted.prixAchat),
        },
      });
    }

    if (req.method === "DELETE") {
      // DELETE
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const { id, userId } = body;

      if (!id || !userId) {
        return res.status(400).json({ error: "id et userId sont obligatoires" });
      }

      await db
        .delete(metaux)
        .where(and(eq(metaux.id, id), eq(metaux.userId, userId)));

      return res.status(200).json({ success: true });
    }

    return res
      .status(405)
      .json({ error: `Method ${req.method} not allowed, use GET/POST/DELETE` });
  } catch (err: any) {
    console.error("Error in /api/metaux:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/metaux",
    });
  }
}
