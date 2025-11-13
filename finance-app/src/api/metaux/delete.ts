import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../db/client";
import { metaux } from "../../db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "DELETE") return res.status(405).end();

    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: "Missing id" });

    await db.delete(metaux).where(eq(metaux.id, id));

    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
