import { pgTable, pgEnum, uuid, varchar, boolean, timestamp, jsonb, integer, index, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
// MODELO DE DATOS (la "M" del MVC a nivel de base de datos).
// Cada pgTable es una tabla de PostgreSQL.
// Si cambias algo aquí, corre:  npm run db:generate  y luego  npm run db:migrate
// ─────────────────────────────────────────────────────────────

// "punto" es para las cuentas de los puntos de venta (fase 2: atención a puntos)
export const rolEnum = pgEnum("rol", ["admin", "gerencia", "jefe_area", "empleado", "punto"]);

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

// Puntos de venta de cada empresa (ej: 315 · La Virgen).
// Sirve tanto si hay una cuenta por punto como una cuenta por asesor: el usuario se vincula con punto_id.
export const puntosVenta = pgTable(
  "puntos_venta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresa_id: uuid("empresa_id").notNull().references(() => empresas.id),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("puntos_venta_empresa_codigo_idx").on(t.empresa_id, t.codigo)]
);

// Usuarios de la plataforma. La contraseña se guarda SIEMPRE como hash (bcrypt), nunca en texto.
// empresa_id es la empresa principal; las empresas a las que tiene acceso están en usuario_empresas.
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
    punto_id: uuid("punto_id").references(() => puntosVenta.id),
    cargo: varchar("cargo", { length: 120 }),
    activo: boolean("activo").notNull().default(true),
    // Bloqueo temporal por intentos fallidos de inicio de sesión
    intentos_fallidos: integer("intentos_fallidos").notNull().default(0),
    bloqueado_hasta: timestamp("bloqueado_hasta", { withTimezone: true }),
    ultimo_acceso: timestamp("ultimo_acceso", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usuarios_empresa_idx").on(t.empresa_id)]
);

// Empresas a las que tiene acceso cada usuario.
// Si una persona trabaja para Servired y Multired, tiene dos filas aquí.
// Si solo pertenece a una, tiene una fila (la misma de usuarios.empresa_id).
export const usuarioEmpresas = pgTable(
  "usuario_empresas",
  {
    usuario_id: uuid("usuario_id").notNull().references(() => usuarios.id),
    empresa_id: uuid("empresa_id").notNull().references(() => empresas.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.usuario_id, t.empresa_id] })]
);

// Sesiones abiertas (una por dispositivo/navegador). Guarda el HASH del token de renovación,
// nunca el token real. Cerrar sesión = marcar revocada_en.
export const sesiones = pgTable(
  "sesiones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuario_id: uuid("usuario_id").notNull().references(() => usuarios.id),
    token_hash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expira_en: timestamp("expira_en", { withTimezone: true }).notNull(),
    revocada_en: timestamp("revocada_en", { withTimezone: true }),
    ip: varchar("ip", { length: 64 }),
    user_agent: varchar("user_agent", { length: 300 }),
    ultimo_uso_en: timestamp("ultimo_uso_en", { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sesiones_usuario_idx").on(t.usuario_id)]
);

// Auditoría: registro de TODO lo que pasa en la plataforma (quién, qué, cuándo, desde dónde).
// Solo se insertan filas: un trigger en la base de datos IMPIDE editarlas o borrarlas.
// En PostgreSQL la tabla está partida por mes (ver drizzle/0002_auditoria_particionada.sql),
// por eso la llave primaria incluye created_at.
export const auditoria = pgTable(
  "auditoria",
  {
    id: uuid("id").notNull().defaultRandom(),
    usuario_id: uuid("usuario_id").references(() => usuarios.id),
    empresa_id: uuid("empresa_id").references(() => empresas.id),
    accion: varchar("accion", { length: 60 }).notNull(), // ej: "comunicado.publicar", "archivo.subir"
    entidad: varchar("entidad", { length: 60 }).notNull(), // ej: "comunicado", "mensaje", "archivo"
    entidad_id: varchar("entidad_id", { length: 60 }),
    detalle: jsonb("detalle"),
    ip: varchar("ip", { length: 64 }),
    user_agent: varchar("user_agent", { length: 300 }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.created_at] }),
    index("auditoria_fecha_idx").on(t.created_at),
    index("auditoria_entidad_idx").on(t.entidad, t.entidad_id),
    index("auditoria_usuario_idx").on(t.usuario_id),
  ]
);
