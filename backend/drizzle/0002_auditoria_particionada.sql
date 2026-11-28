-- ─────────────────────────────────────────────────────────────
-- AUDITORÍA PARTIDA POR MES Y PROTEGIDA CONTRA CAMBIOS
--
-- 1. La tabla se parte por mes (auditoria_2026_11, auditoria_2026_12...).
--    Por fuera se usa como una sola tabla "auditoria", pero las consultas
--    del mes actual no recorren los años anteriores y archivar un año
--    completo es mover sus particiones.
-- 2. Un trigger impide UPDATE, DELETE y TRUNCATE: el registro no se puede
--    alterar ni siquiera con un usuario administrador desde la aplicación.
-- 3. La función asegurar_particiones_auditoria() crea las particiones del
--    mes actual y los siguientes. El backend la llama al arrancar.
--    Si algo llega a una fecha sin partición, cae en auditoria_default.
--
-- Requiere PostgreSQL 13 o superior.
-- ─────────────────────────────────────────────────────────────

-- La tabla creada en 0000 todavía no tiene datos reales: se reemplaza por la versión partida
DROP TABLE IF EXISTS "auditoria";
--> statement-breakpoint

CREATE TABLE "auditoria" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid REFERENCES "public"."usuarios"("id"),
	"empresa_id" uuid REFERENCES "public"."empresas"("id"),
	"accion" varchar(60) NOT NULL,
	"entidad" varchar(60) NOT NULL,
	"entidad_id" varchar(60),
	"detalle" jsonb,
	"ip" varchar(64),
	"user_agent" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auditoria_id_created_at_pk" PRIMARY KEY ("id", "created_at")
) PARTITION BY RANGE ("created_at");
--> statement-breakpoint

CREATE INDEX "auditoria_fecha_idx" ON "auditoria" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "auditoria_entidad_idx" ON "auditoria" USING btree ("entidad", "entidad_id");
--> statement-breakpoint
CREATE INDEX "auditoria_usuario_idx" ON "auditoria" USING btree ("usuario_id");
--> statement-breakpoint

-- Partición de respaldo: recibe cualquier fecha que no tenga su mes creado
CREATE TABLE "auditoria_default" PARTITION OF "auditoria" DEFAULT;
--> statement-breakpoint

-- Crea (si no existe) la partición de un mes. Ej: SELECT crear_particion_auditoria('2027-01-01');
CREATE OR REPLACE FUNCTION crear_particion_auditoria(fecha date) RETURNS void AS $$
DECLARE
	inicio date := date_trunc('month', fecha)::date;
	fin date := (date_trunc('month', fecha) + interval '1 month')::date;
	nombre text := 'auditoria_' || to_char(inicio, 'YYYY_MM');
BEGIN
	IF to_regclass(nombre) IS NULL THEN
		EXECUTE format(
			'CREATE TABLE %I PARTITION OF auditoria FOR VALUES FROM (%L) TO (%L)',
			nombre, inicio, fin
		);
	END IF;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Crea las particiones del mes actual y de los próximos 2 meses
CREATE OR REPLACE FUNCTION asegurar_particiones_auditoria() RETURNS void AS $$
BEGIN
	PERFORM crear_particion_auditoria((now() + (n || ' month')::interval)::date)
	FROM generate_series(0, 2) AS n;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

SELECT asegurar_particiones_auditoria();
--> statement-breakpoint

-- Bloquea cualquier cambio sobre registros ya guardados
CREATE OR REPLACE FUNCTION impedir_cambios_auditoria() RETURNS trigger AS $$
BEGIN
	RAISE EXCEPTION 'La auditoría no se puede modificar ni borrar (operación %)', TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER "auditoria_sin_cambios"
	BEFORE UPDATE OR DELETE ON "auditoria"
	FOR EACH ROW EXECUTE FUNCTION impedir_cambios_auditoria();
--> statement-breakpoint

CREATE TRIGGER "auditoria_sin_truncate"
	BEFORE TRUNCATE ON "auditoria"
	FOR EACH STATEMENT EXECUTE FUNCTION impedir_cambios_auditoria();
