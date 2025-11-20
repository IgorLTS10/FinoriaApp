// api/metaux/portfolio-history.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/client.js";
import { metaux, metalPricesHistory } from "../../src/db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { sql as rawSql } from "drizzle-orm";


const TYPE_TO_METAL_CODE: Record<
  "or" | "argent" | "platine" | "palladium",
  "XAU" | "XAG" | "XPT" | "XPD"
> = {
  or: "XAU",
  argent: "XAG",
  platine: "XPT",
  palladium: "XPD",
};

function normalizeWeightToGrams(poids: number, unite: "g" | "oz") {
  return unite === "oz" ? poids * 31.1035 : poids;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use GET` });
    }

    const userId = req.query.userId as string | undefined;
    const days = Number(req.query.days || 180);

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Paramètre 'userId' obligatoire" });
    }

    // 1) Récupérer les positions de l'utilisateur
    const positions = await db
      .select()
      .from(metaux)
      .where(eq(metaux.userId, userId));

    if (!positions || positions.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // 2) On récupère l'historique des prix des métaux utiles
    const metalsUsed = Array.from(
      new Set(
        positions
          .map((p) => TYPE_TO_METAL_CODE[p.type as "or" | "argent" | "platine" | "palladium"])
          .filter(Boolean)
      )
    );

    if (metalsUsed.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // On prend les N derniers jours
    const historyRows = await db
      .select()
      .from(metalPricesHistory)
      .where(
        sql`${metalPricesHistory.metal} IN (${rawSql.join(
            metalsUsed.map((m) => `'${m}'`),
            ","
            )})`


      )
      .orderBy(sql`${metalPricesHistory.asOf} ASC`);

    if (!historyRows || historyRows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // 3) Construire la valeur du portefeuille par jour
    type DayValue = {
      dateKey: string; // YYYY-MM-DD
      valueEur: number;
    };

    const dayMap: Record<string, number> = {};

    for (const h of historyRows) {
      const dateKey = h.asOf.toISOString().slice(0, 10);
      const metal = h.metal as "XAU" | "XAG" | "XPT" | "XPD";
      const pricePerGramEur = Number(h.pricePerGramEur);

      let totalForDay = dayMap[dateKey] || 0;

      for (const p of positions) {
        const metalCode = TYPE_TO_METAL_CODE[
          p.type as "or" | "argent" | "platine" | "palladium"
        ];

        if (!metalCode || metalCode !== metal) continue;

        // On ne compte la position que si elle existait déjà à cette date
        const buyDate = new Date(p.dateAchat as any);
        const dayDate = new Date(dateKey);

        if (buyDate > dayDate) continue;

        const weightG = normalizeWeightToGrams(
          Number(p.poids),
          p.unite as "g" | "oz"
        );

        totalForDay += weightG * pricePerGramEur;
      }

      dayMap[dateKey] = totalForDay;
    }

    const sortedDates = Object.keys(dayMap).sort();

    const data = sortedDates.map((d) => ({
      date: d,
      valueEur: dayMap[d],
    }));

    return res.status(200).json({ data });
  } catch (err: any) {
    console.error("Error in /api/metaux/portfolio-history:", err);
    return res.status(500).json({
      error:
        err?.message || "Erreur serveur /api/metaux/portfolio-history",
    });
  }
}
