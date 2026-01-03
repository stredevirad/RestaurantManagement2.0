import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(client, { schema });

export async function connectDb() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database successfully");
  } catch (error: any) {
    console.error("Failed to connect to PostgreSQL database:", error.message);
    if (error.message.includes("helium")) {
      console.error("Detected 'helium' connection error. Ensuring DATABASE_URL is used correctly.");
    }
    // Don't rethrow, let the app handle it or log it
  }
}
