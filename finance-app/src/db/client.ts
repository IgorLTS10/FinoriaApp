// src/db/client.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure it dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql);
