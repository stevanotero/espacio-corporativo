import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../config/env";
import * as schema from "./schema";

// Conexión a PostgreSQL. Se crea UNA sola vez y se reutiliza en todo el backend.
// En los models se importa así:  import { db } from "../../db";
export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

export const db = drizzle(pool, { schema });
