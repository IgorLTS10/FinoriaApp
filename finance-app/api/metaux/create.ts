// api/metaux/create.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/client";
import { metaux } from "../../src/db/schema";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // ✅ pour debug, on log la méthode
    console.log("METHOD /api/metaux/create:", req.method);

    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use POST` });
    }

    // Vercel gère déjà JSON, mais on sécurise au cas où
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

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
  } catch (err: any) {
    console.error("Error in /api/metaux/create:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
