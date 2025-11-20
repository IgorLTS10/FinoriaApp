// api/stocks.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../src/db/client.js";
import { stockPositions } from "../src/db/schema.js";
import { eq, and, desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // ============ LIST ============
    if (req.method === "GET") {
      const userId = req.query.userId as string | undefined;
      if (!userId) {
        return res
          .status(400)
          .json({ error: "Paramètre userId obligatoire dans la query string." });
      }

      const rows = await db
        .select()
        .from(stockPositions)
        .where(eq(stockPositions.userId, userId))
        .orderBy(desc(stockPositions.buyDate), desc(stockPositions.createdAt));

      const mapped = rows.map((r) => ({
        ...r,
        quantity: Number(r.quantity),
        buyPrice: Number(r.buyPrice),
        buyTotal: Number(r.buyTotal),
      }));

      return res.status(200).json({ data: mapped });
    }

    // ============ CREATE ============
    if (req.method === "POST") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const {
        userId,
        symbol,
        name,
        exchange,
        logoUrl,
        quantity,
        buyPrice,
        buyCurrency,
        buyDate,
        notes,
      } = body;

      if (
        !userId ||
        !symbol ||
        !quantity ||
        !buyPrice ||
        !buyCurrency ||
        !buyDate
      ) {
        return res.status(400).json({
          error:
            "Champs manquants : userId, symbol, quantity, buyPrice, buyCurrency, buyDate sont obligatoires.",
        });
      }

      const qty = Number(quantity);
      const priceUnit = Number(buyPrice);
      const total = qty * priceUnit;

      const [inserted] = await db
        .insert(stockPositions)
        .values({
          userId,
          symbol: String(symbol).toUpperCase(),
          name: name || null,
          exchange: exchange || null,
          logoUrl: logoUrl || null,
          quantity: qty.toString(),
          buyPrice: priceUnit.toString(),
          buyTotal: total.toString(),
          buyCurrency,
          buyDate,
          notes: notes || null,
        })
        .returning();

      return res.status(200).json({
        success: true,
        row: {
          ...inserted,
          quantity: Number(inserted.quantity),
          buyPrice: Number(inserted.buyPrice),
          buyTotal: Number(inserted.buyTotal),
        },
      });
    }

    // ============ DELETE ============
    if (req.method === "DELETE") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const { id, userId } = body;

      if (!id || !userId) {
        return res
          .status(400)
          .json({ error: "Champs id et userId obligatoires pour DELETE." });
      }

      await db
        .delete(stockPositions)
        .where(
          and(eq(stockPositions.id, id), eq(stockPositions.userId, userId))
        );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({
      error: `Method ${req.method} not allowed, use GET/POST/DELETE`,
    });
  } catch (err: any) {
    console.error("Error in /api/stocks:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/stocks",
    });
  }
}
