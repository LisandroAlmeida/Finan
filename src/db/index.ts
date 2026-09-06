import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Em build/desenvolvimento sem DATABASE_URL configurada, usamos uma URL
// "placeholder" só para o client conseguir ser instanciado sem quebrar o
// build. postgres.js só conecta de verdade na primeira query, e as páginas
// que usam o banco são `force-dynamic`, então isso nunca é executado durante
// `next build`.
const connectionString =
  process.env.DATABASE_URL ??
  "postgres://placeholder:placeholder@localhost:5432/placeholder";

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
