import { pgTable, pgEnum, uuid, varchar, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
// MODELO DE DATOS (la "M" del MVC a nivel de base de datos).
// Cada pgTable es una tabla de PostgreSQL.
// Si cambias algo aquí, corre:  npm run db:generate  y luego  npm run db:migrate
// ─────────────────────────────────────────────────────────────

export const rolEnum = pgEnum("rol", ["admin", "gerencia", "jefe_area", "empleado"]);

// Empresas: Servired y Multired comparten la plataforma.
// Todo lo demás cuelga de una empresa (empresa_id) para separar su información.
export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: varchar("codigo", { length: 30 }).notNull().unique(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  activa: boolean("activa").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Áreas de cada empresa (Sistemas, Contabilidad, Recursos Humanos...).
export const areas = pgTable(
  "areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresa_id: uuid("empresa_id").notNull().references(() => empresas.id),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("areas_empresa_nombre_idx").on(t.empresa_id, t.nombre)]
);

// Usuarios de la plataforma. La contraseña se guarda SIEMPRE como hash (bcrypt), nunca en texto.
export const usuarios = pgTable(
  "usuarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documento: varchar("documento", { length: 20 }).notNull().unique(),
    nombre: varchar("nombre", { length: 150 }).notNull(),
    email: varchar("email", { length: 150 }).notNull().unique(),
    contrasena: varchar("contrasena", { length: 255 }).notNull(),
    rol: rolEnum("rol").notNull().default("empleado"),
    empresa_id: uuid("empresa_id").notNull().references(() => empresas.id),
    area_id: uuid("area_id").references(() => areas.id),
    activo: boolean("activo").notNull().default(true),
    ultimo_acceso: timestamp("ultimo_acceso", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usuarios_empresa_idx").on(t.empresa_id)]
);

// Auditoría: registro de TODO lo que pasa en la plataforma (quién, qué, cuándo, desde dónde).
// Solo se insertan filas: nunca se editan ni se borran.
export const auditoria = pgTable(
  "auditoria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuario_id: uuid("usuario_id").references(() => usuarios.id),
    accion: varchar("accion", { length: 60 }).notNull(), // ej: "comunicado.publicar", "archivo.subir"
    entidad: varchar("entidad", { length: 60 }).notNull(), // ej: "comunicado", "mensaje", "archivo"
    entidad_id: varchar("entidad_id", { length: 60 }),
    detalle: jsonb("detalle"),
    ip: varchar("ip", { length: 64 }),
    user_agent: varchar("user_agent", { length: 300 }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("auditoria_fecha_idx").on(t.created_at),
    index("auditoria_entidad_idx").on(t.entidad, t.entidad_id),
    index("auditoria_usuario_idx").on(t.usuario_id),
  ]
);
