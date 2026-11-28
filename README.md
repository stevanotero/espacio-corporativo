# Espacio Corporativo

Plataforma de comunicación interna de **Servired** y **Multired**: comunicados oficiales con registro de lectura, bandeja de mensajes, canales de chat por áreas y auditoría de toda la actividad.

Se construye primero para computador (web) y después como app móvil.

## Tecnologías

| Parte | Tecnología |
| --- | --- |
| Backend (API) | Node.js + Express 5 + TypeScript |
| Base de datos | PostgreSQL + Drizzle ORM |
| Web | Next.js 15 + React 19 + Tailwind CSS 4 |
| Compartido | Paquete `@espacio/shared` con tipos y constantes |
| Pruebas | Vitest + Supertest |

## Estructura

```
espacio-corporativo/
├── backend/                     API REST (puerto 4001)
│   ├── drizzle/                 Migraciones SQL generadas
│   └── src/
│       ├── index.ts             Arranca el servidor
│       ├── app.ts               Arma Express y registra las rutas de cada módulo
│       ├── config/env.ts        Lee y valida el .env
│       ├── db/
│       │   ├── schema.ts        Tablas de la base de datos (modelo de datos)
│       │   ├── index.ts         Conexión a PostgreSQL
│       │   ├── migrate.ts       Aplica migraciones
│       │   └── seed.ts          Datos iniciales (empresas)
│       ├── lib/                 Utilidades (logger, errores)
│       ├── middlewares/         Validación y manejo de errores
│       └── modules/
│           └── empresas/        Un módulo = una carpeta con sus 5 archivos:
│               ├── empresas.routes.ts      URLs del módulo
│               ├── empresas.controller.ts  C: recibe la petición y responde
│               ├── empresas.service.ts     Reglas de negocio
│               ├── empresas.model.ts       M: consultas a la base de datos
│               └── empresas.schema.ts      Validación de lo que llega
├── web/                         Interfaz (puerto 4000)
│   └── src/
│       ├── app/                 V: las páginas (cada carpeta es una URL)
│       │   └── (panel)/         Páginas con menú lateral
│       ├── components/          Piezas reutilizables (menú, encabezado...)
│       └── lib/api.ts           Ayudante para llamar al backend
└── shared/                      Tipos compartidos (roles, empresas, respuestas)
```

## Cómo se conecta todo (MVC)

Una petición recorre las capas siempre en el mismo orden:

```
Navegador  →  web (Vista)  →  /api/...  →  routes  →  controller  →  service  →  model  →  PostgreSQL
```

| Capa | Archivo | Qué hace | En PHP era... |
| --- | --- | --- | --- |
| **Vista** | `web/src/app/**/page.tsx` | Muestra los datos en pantalla | El `.php` con HTML |
| Routes | `*.routes.ts` | Dice qué controller atiende cada URL | El `if ($_GET['accion'] == ...)` |
| **Controller** | `*.controller.ts` | Recibe la petición, llama al service y responde JSON | El controlador |
| Service | `*.service.ts` | Reglas de negocio y permisos | Lógica dentro del controlador |
| **Model** | `*.model.ts` | Consultas a la base de datos | El DAO con las consultas SQL |
| Schema | `*.schema.ts` | Valida lo que llega antes del controller | Las validaciones de `$_POST` |

**`include_once` en PHP = `import` en TypeScript.** Cada archivo importa solo lo que necesita:

```ts
import { empresasService } from "./empresas.service";
```

Y la web habla con el backend por HTTP, siempre con rutas relativas:

```ts
const empresas = await api.get<Empresa[]>("/empresas"); // llama a /api/empresas
```

Next.js reenvía todo lo que empiece por `/api` al backend (`web/next.config.ts`). Por eso la web nunca guarda la dirección del backend en el navegador.

### Agregar un módulo nuevo

1. Crear `backend/src/modules/<modulo>/` con sus 5 archivos, copiando `empresas` como ejemplo.
2. Si necesita tablas, agregarlas en `backend/src/db/schema.ts` y correr `npm run db:generate` y `npm run db:migrate`.
3. Registrar las rutas en `backend/src/app.ts`: `app.use("/api/<modulo>", <modulo>Routes);`
4. Crear la página en `web/src/app/(panel)/<modulo>/page.tsx`.

## Correr el proyecto en local

Requisitos: Node.js 20 o superior y PostgreSQL.

```bash
# 1. Instalar dependencias (una sola vez, desde la raíz)
npm install

# 2. Crear la base de datos vacía en PostgreSQL
#    CREATE DATABASE espacio_corporativo;

# 3. Configurar las variables
#    Copiar backend/.env.example como backend/.env y llenar DATABASE_URL
#    Copiar web/.env.example como web/.env

#    En backend/.env llenar también JWT_SECRET y los datos ADMIN_* del administrador inicial

# 4. Crear las tablas, las empresas y el administrador inicial
npm run db:migrate
npm run db:seed

# 5. Arrancar (cada uno en su terminal)
npm run dev:backend    # http://localhost:4001/api/salud
npm run dev:web        # http://localhost:4000
```

Abre http://localhost:4000, entra con el documento y la contraseña de `ADMIN_DOCUMENTO` y `ADMIN_CONTRASENA`, y en el inicio debe aparecer **"Web, backend y base de datos conectados"**.

## Inicio de sesión y seguridad

- **Login por documento y contraseña.** La contraseña se guarda con hash bcrypt.
- **Sesión en cookies `httpOnly` y `sameSite=strict`:** el JavaScript de la página no puede leerlas y otros sitios no pueden usarlas.
- **Dos tokens:** el de acceso (15 min) va en cada petición; el de sesión (7 días) solo sirve para renovar el acceso y en la base se guarda su hash. Cada renovación cambia el token de sesión.
- **Bloqueo temporal** tras `MAX_INTENTOS_LOGIN` contraseñas incorrectas y límite de 20 intentos por IP cada 15 minutos.
- **Permisos:** en el backend, `autenticar` exige sesión y `requiereRol("admin", ...)` limita por rol. En la web, `src/middleware.ts` manda al login a quien no tenga sesión.

## Auditoría

Todo se registra con `auditoriaService.registrar({ accion, entidad, ... })` (en `backend/src/modules/auditoria`). La tabla `auditoria`:

- **No se puede editar ni borrar:** un trigger de PostgreSQL rechaza `UPDATE`, `DELETE` y `TRUNCATE`.
- **Está partida por mes** (`auditoria_2026_11`, `auditoria_2026_12`...). El backend crea las particiones al arrancar y una vez al día.
- Requiere PostgreSQL 13 o superior.

## Pruebas

```bash
npm test
```

## Ramas

| Rama | Uso |
| --- | --- |
| `main` | Producción. Solo recibe cambios por pull request desde `develop` |
| `develop` | Integración: aquí se unen los cambios de todos |
| `stevan`, `isabella` | Trabajo de cada persona. Se suben por pull request a `develop` |
