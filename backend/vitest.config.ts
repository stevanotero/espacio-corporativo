import { defineConfig } from "vitest/config";

// En los tests no se usa el .env real: se ponen valores de prueba
// y la base de datos se simula (mock), así los tests corren sin PostgreSQL.
export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      LOG_LEVEL: "error",
    },
  },
});
