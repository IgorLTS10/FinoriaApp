// src/api/metaux/create.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../db/client";
import { metaux } from "../../db/schema";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).end();
    }

    const body = req.body as any;

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
      return res.status(400).json({ error: "Missing fields" });
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
    return res.status(500).json({ error: err.message });
  }
}
