// src/db/client.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // ⚠️ ce message remontera dans les logs Vercel
  throw new Error("DATABASE_URL is not defined. Configure it in Vercel env vars.");
}

const sql = neon(connectionString);
export const db = drizzle(sql);
