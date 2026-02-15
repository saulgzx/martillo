# Martillo — Prompts de Desarrollo para Codex

### Especificaciones Funcionales Completas · v2.0 · 2026

> **Cómo usar este documento:**
> Cada prompt es autocontenido. Pégalo completo a Codex al inicio de cada sesión.
> No omitas ninguna sección. Si Codex genera algo inconsistente con lo especificado, cita la sección exacta de este documento y pide corrección.

---

## CONTEXTO GLOBAL DEL PROYECTO

_(Incluir al inicio de CADA prompt desde la Semana 2 en adelante)_

```
PROYECTO: Martillo
DESCRIPCIÓN: Plataforma SaaS B2B de subastas híbridas (presencial + online en tiempo real).
             El cliente de Martillo es una "Casa de Remates". Los usuarios finales son los postores.

STACK TÉCNICO:
  Frontend:  Next.js 14.2.35+ · App Router · TypeScript strict · TailwindCSS · shadcn/ui
  Backend:   Node.js · Express · TypeScript strict · Prisma ORM · Socket.io
  Base datos: PostgreSQL (Railway) · Redis (Railway, para estado en tiempo real y sesiones)
  Infra:     Vercel (frontend) · Railway (backend + PostgreSQL + Redis)
  Repo:      Monorepo GitHub · /apps/frontend · /apps/backend

DECISIONES DE ARQUITECTURA YA TOMADAS (no cambiar):
  - JWT RS256 con par de claves asimétricas. AccessToken en memoria (no localStorage). RefreshToken en cookie httpOnly.
  - El backend se construye de forma AISLADA en Railway. No depende de paquetes workspace internos.
  - tsconfig.json del backend es autocontenido (no extiende desde raíz).
  - ESLint con prettier en "warn" (no "error") para no bloquear builds en Vercel.
  - Tablas de auditoría y pujas son APPEND-ONLY. Nunca UPDATE ni DELETE sobre Bid ni AuditLog.
  - Los documentos de identidad de postores se almacenan en Cloudinary con signed URLs (TTL 1h).
  - El estado del remate en tiempo real vive en Redis (no en PostgreSQL).

ROLES:
  SUPERADMIN: dueño de la plataforma (GM Studios). Crea ADMINs manualmente.
  ADMIN:      operador de una Casa de Remates. Gestiona su tenant.
  USER:       postor. Se registra solo, pero necesita aprobación por remate para pujar.

ESTADO BIDDER (por remate, no global):
  PENDING → APPROVED (puede pujar) | REJECTED | BANNED

VARIABLES DE ENTORNO REQUERIDAS (backend):
  NODE_ENV, PORT, DATABASE_URL, REDIS_URL
  JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, ENCRYPTION_KEY
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  RESEND_API_KEY, ALLOWED_ORIGINS

DOMINIO: martillo.app
```

---

---

## SEMANA 1 — Setup Base

---

### PROMPT 1.1 — Estructura del Monorepo y Configuración Inicial

**Lo que debe existir al terminar este prompt:**

#### Estructura de carpetas exacta

```
/
├── apps/
│   ├── frontend/          ← Next.js 14
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx   ← landing pública mínima
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   └── ui/        ← componentes shadcn/ui
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── .env.local.example
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json  ← strict mode
│   │   └── package.json
│   │
│   └── backend/           ← Express API
│       ├── src/
│       │   ├── index.ts   ← entry point
│       │   ├── app.ts     ← Express app factory
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   ├── types/
│       │   └── lib/
│       │       ├── prisma.ts   ← singleton PrismaClient
│       │       └── redis.ts    ← singleton Redis client
│       ├── prisma/
│       │   └── schema.prisma
│       ├── scripts/
│       ├── .env.example
│       ├── tsconfig.json  ← AUTOCONTENIDO, NO extiende raíz
│       └── package.json
│
├── CONTEXT.md             ← estado actual del proyecto
├── README.md
├── .gitignore
└── package.json           ← workspaces config
```

#### Requisitos del backend

- `tsconfig.json` debe incluir: `"esModuleInterop": true`, `"strict": true`, `"outDir": "./dist"`, `"rootDir": "./src"`. NO usar `"extends"` apuntando a la raíz.
- El `package.json` del backend NO debe tener dependencias de `@martillo/shared` ni de otros paquetes workspace. Railway construye este directorio de forma aislada.
- Script `dev`: `ts-node-dev --respawn --transpile-only src/index.ts`
- Script `build`: `tsc`
- Script `start`: `node dist/index.js`

#### Endpoint obligatorio: `GET /health`

Debe responder exactamente:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-02-14T00:00:00.000Z"
}
```

#### Requisitos del frontend

- Next.js 14.2.35 mínimo (por CVE-2025-55184).
- `.eslintrc.json` con `"prettier/prettier": "warn"` — nunca "error".
- `tailwind.config.ts` con colores extendidos: `navy: "#1A3C5E"`, `charcoal: "#64748B"`.
- shadcn/ui inicializado con tema slate.

#### CONTEXT.md inicial

Debe contener:

```
# Martillo — Estado del Proyecto

## Stack
- Frontend: Next.js 14 + TailwindCSS + shadcn/ui (Vercel)
- Backend: Express + Prisma + Socket.io (Railway)
- DB: PostgreSQL + Redis (Railway)

## Estado actual
SEMANA 1 — Monorepo creado. CI/CD pendiente.

## Decisiones tomadas
- Backend se construye de forma aislada en Railway
- No usar @martillo/shared como dependencia en backend
- JWT RS256, accessToken en memoria, refreshToken en cookie httpOnly
- Tablas Bid y AuditLog son APPEND-ONLY
```

#### `.gitignore` debe excluir

`node_modules`, `.env`, `.env.local`, `dist`, `.next`, `*.log`, `.DS_Store`

> ⚠️ **Al terminar:** `git init` → crear repo `saulgzx/martillo` en GitHub → primer commit `feat: initial monorepo structure` → push a rama `master`.

---

### PROMPT 1.2 — CI/CD: GitHub Actions + Railway + Vercel

**Lo que debe existir al terminar este prompt:**

#### GitHub Actions — `.github/workflows/ci.yml`

- Trigger: `push` a `master` y `pull_request` a `master`
- Node.js version: 20
- Caché de `node_modules` por hash de `package-lock.json`
- Jobs en paralelo:
  - `lint-frontend`: `cd apps/frontend && npm run lint`
  - `typecheck-frontend`: `cd apps/frontend && npx tsc --noEmit`
  - `build-backend`: `cd apps/backend && npm install && npm run build`
    - Este job SIMULA el build aislado de Railway. No debe depender de nada fuera de `apps/backend`.

#### `railway.json` en `apps/backend/`

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### `vercel.json` en `apps/frontend/`

```json
{
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "npm run build"
}
```

#### `.env.example` del backend

Debe tener TODAS las variables con comentarios:

```
# Servidor
NODE_ENV=development
PORT=3000

# Base de datos (provista por Railway automáticamente)
DATABASE_URL=postgresql://user:password@host:5432/martillo

# Redis (provisto por Railway automáticamente)
REDIS_URL=redis://localhost:6379

# JWT — generar con scripts/generate-keys.ts
JWT_PRIVATE_KEY=      # Clave privada RSA 2048, una línea con \n escapado
JWT_PUBLIC_KEY=       # Clave pública RSA 2048, una línea con \n escapado

# Cifrado AES-256 para datos sensibles (RUT, cuentas bancarias)
ENCRYPTION_KEY=       # 64 caracteres hex (32 bytes)

# Cloudinary — para imágenes de lotes y documentos de postores
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend — para emails transaccionales
RESEND_API_KEY=

# CORS — URL del frontend en Vercel
ALLOWED_ORIGINS=https://martillo.vercel.app
```

#### `.env.local.example` del frontend

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

> ⚠️ **Verificar antes de continuar:** Pipeline verde en GitHub Actions. `GET /health` responde 200 en Railway.

---

### PROMPT 1.3 — Seguridad Base del Backend

**Lo que debe existir al terminar este prompt:**

#### Script `apps/backend/scripts/generate-keys.ts`

- Genera par RSA 2048 bits usando el módulo nativo `crypto` de Node.js.
- Imprime en consola:
  ```
  JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
  JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBI...\n-----END PUBLIC KEY-----\n
  ```
- Formato de una sola línea con `\n` literal para pegar directamente en Railway.

#### Validación de variables de entorno al arrancar

- Usar `zod` para validar todas las variables definidas en `.env.example`.
- Si falta cualquier variable: imprimir qué variable falta con mensaje claro y terminar el proceso (`process.exit(1)`).
- Esta validación debe ejecutarse ANTES de que Express levante el servidor.

#### Middleware de seguridad — aplicar en este orden exacto

1. `helmet()` — headers de seguridad HTTP
2. `cors()` — solo orígenes en `ALLOWED_ORIGINS` (separados por coma si son varios)
3. `express.json({ limit: '10mb' })`
4. Rate limiter global: 100 requests por 15 minutos por IP
5. Rate limiter específico para auth: 5 requests por 15 minutos por IP (aplicar en `/api/auth/login` y `/api/auth/register`)

#### Funciones de cifrado en `src/lib/crypto.ts`

- `encryptField(plaintext: string): string` — cifra con AES-256-GCM usando `ENCRYPTION_KEY`. Retorna string con formato `iv:authTag:ciphertext` en base64.
- `decryptField(encrypted: string): string` — inverso de lo anterior.
- Estas funciones se usarán para: RUT de usuarios, RUT de consignantes, cuenta bancaria de consignantes.

#### Estructura de respuesta HTTP estándar

Todas las respuestas del API deben usar este formato:

```typescript
// Éxito
{ success: true, data: T, message?: string }

// Error
{ success: false, error: string, code?: string }
```

Crear helper `sendSuccess(res, data, status?)` y `sendError(res, message, status?, code?)`.

> ⚠️ **Guardar las claves generadas en Railway (Variables) y en gestor de contraseñas. NUNCA commitear `.env`.**

---

---

## SEMANA 2 — Base de Datos y Autenticación

---

### PROMPT 2.1 — Schema de Base de Datos con Prisma

**Lo que debe existir al terminar este prompt:**

#### Schema completo — `apps/backend/prisma/schema.prisma`

**Modelo User**

```
id           String    PK, cuid()
email        String    unique
password     String    hash bcrypt
name         String
phone        String?
rutEncrypted String?   — RUT cifrado con AES-256-GCM
role         Role      enum: SUPERADMIN | ADMIN | USER
tenantId     String?   — null para SUPERADMIN, obligatorio para ADMIN
createdAt    DateTime  default now()
updatedAt    DateTime  updatedAt
```

**Modelo Tenant** _(Casa de Remates)_

```
id        String  PK, cuid()
name      String
slug      String  unique — para URLs amigables
logoUrl   String?
plan      Plan    enum: STARTER | PROFESSIONAL | ENTERPRISE
active    Boolean default true
createdAt DateTime
```

**Modelo Auction** _(Remate)_

```
id          String        PK, cuid()
tenantId    String        FK → Tenant
title       String
description String?
status      AuctionStatus enum: DRAFT | PUBLISHED | LIVE | PAUSED | ENDED
startDate   DateTime?
endDate     DateTime?
createdBy   String        FK → User
createdAt   DateTime
updatedAt   DateTime
```

**Modelo Lot** _(Lote)_

```
id           String    PK, cuid()
auctionId    String    FK → Auction
title        String
description  String?
basePrice    Decimal   — precio base en CLP
currentPrice Decimal   — precio actual (se actualiza con cada puja ganadora)
minIncrement Decimal   — incremento mínimo permitido
status       LotStatus enum: PENDING | ACTIVE | ADJUDICATED | PASSED
order        Int       — para ordenamiento drag & drop
createdAt    DateTime
updatedAt    DateTime
```

**Modelo LotMedia**

```
id        String    PK, cuid()
lotId     String    FK → Lot
url       String    — URL pública Cloudinary
publicId  String    — ID en Cloudinary (para eliminar)
type      MediaType enum: IMAGE | DOCUMENT
order     Int
createdAt DateTime
```

**Modelo Bidder** _(Postor por remate)_

```
id             String       PK, cuid()
userId         String       FK → User
auctionId      String       FK → Auction
paddleNumber   Int          — autoincremental POR REMATE, no global
status         BidderStatus enum: PENDING | APPROVED | REJECTED | BANNED
rejectionReason String?
approvedAt     DateTime?
approvedBy     String?      FK → User (el ADMIN que aprobó)
bannedAt       DateTime?
bannedBy       String?      FK → User
createdAt      DateTime
— unique constraint: (userId, auctionId)
```

**Modelo Bid** _(Puja — APPEND-ONLY)_

```
id        String   PK, cuid()
lotId     String   FK → Lot
bidderId  String   FK → Bidder
amount    Decimal
source    BidSource enum: ONLINE | PRESENCIAL
createdAt DateTime default now()
— NUNCA actualizar ni eliminar registros de esta tabla
```

**Modelo Adjudication** _(Adjudicación)_

```
id             String   PK, cuid()
lotId          String   FK → Lot, unique (1 adjudicación por lote)
bidderId       String   FK → Bidder
finalAmount    Decimal
adjudicatedAt  DateTime
adjudicatedBy  String   FK → User (el ADMIN rematador)
```

**Modelo Payment** _(Pago)_

```
id              String        PK, cuid()
adjudicationId  String        FK → Adjudication, unique
amount          Decimal       — monto del lote
commission      Decimal       — comisión de la casa de remates (%)
iva             Decimal       — IVA sobre comisión (19% en Chile)
total           Decimal       — total a pagar
status          PaymentStatus enum: PENDING | PAID | FAILED | OVERDUE
flowToken       String?       — token de Flow para consultas
flowOrderId     String?
dueDate         DateTime?
paidAt          DateTime?
createdAt       DateTime
```

**Modelo Consignor** _(Consignante)_

```
id                 String PK, cuid()
tenantId           String FK → Tenant
name               String
rutEncrypted       String — RUT cifrado AES-256-GCM
email              String
phone              String?
bankAccountEncrypted String — cuenta bancaria cifrada AES-256-GCM
createdAt          DateTime
```

**Modelo LotConsignor** _(Relación lote-consignante con porcentaje)_

```
id           String  PK, cuid()
lotId        String  FK → Lot
consignorId  String  FK → Consignor
percentage   Decimal — porcentaje del producido que le corresponde
```

**Modelo BidderDocument** _(Documentos de identidad del postor)_

```
id          String       PK, cuid()
bidderId    String       FK → Bidder
type        DocumentType enum: CEDULA_FRENTE | CEDULA_REVERSO | OTRO
cloudinaryPublicId String — para generar signed URLs, NUNCA guardar URL pública
uploadedAt  DateTime
```

**Modelo Notification**

```
id        String   PK, cuid()
userId    String   FK → User
type      String   — ej: "BID_WON", "PAYMENT_DUE", "BIDDER_APPROVED"
title     String
body      String
read      Boolean  default false
createdAt DateTime
```

**Modelo AuditLog** _(APPEND-ONLY)_

```
id          String   PK, cuid()
tenantId    String?  FK → Tenant
entityType  String   — ej: "Auction", "Lot", "Bidder"
entityId    String
action      String   — ej: "CREATED", "PUBLISHED", "APPROVED", "BANNED"
userId      String   — quién hizo la acción
metadata    Json     — datos adicionales del contexto
createdAt   DateTime default now()
— NUNCA actualizar ni eliminar registros de esta tabla
```

#### Índices requeridos

- `User.email` — unique
- `Auction.(tenantId, status)` — compuesto
- `Lot.(auctionId, status)` — compuesto
- `Lot.(auctionId, order)` — para ordenamiento
- `Bid.(lotId, createdAt)` — para historial de pujas
- `Bidder.(userId, auctionId)` — unique constraint

#### Seed obligatorio — `prisma/seed.ts`

Crear un SUPERADMIN con credenciales desde variables de entorno:

- `SEED_SUPERADMIN_EMAIL` — email del superadmin
- `SEED_SUPERADMIN_PASSWORD` — contraseña (se hashea con bcrypt cost 12)
- `SEED_SUPERADMIN_NAME` — nombre
- El seed debe ser IDEMPOTENTE: si ya existe, no crear duplicado.

#### Comandos para ejecutar

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
```

> ⚠️ **Verificar con Railway que las 13 tablas se crearon correctamente.**

---

### PROMPT 2.2 — Sistema de Autenticación JWT RS256

**Lo que debe existir al terminar este prompt:**

#### Flujo de tokens

- **AccessToken:** JWT firmado con clave privada RS256. Payload: `{ sub: userId, role, tenantId, iat, exp }`. Expiración: 15 minutos.
- **RefreshToken:** UUID v4 aleatorio. Se almacena en Redis con key `refresh:{token}` y value `userId`. TTL: 7 días. Se envía como cookie `httpOnly`, `secure`, `sameSite: strict`.
- **Rotación:** Al llamar `/auth/refresh`, se invalida el refreshToken anterior y se emite uno nuevo. Implementar detección de reuso (si se usa un token ya invalidado, invalidar TODOS los tokens de ese usuario).

#### Servicio AuthService — `src/services/auth.service.ts`

Método `register(email, password, name)`:

- Verificar que el email no existe. Si existe: error "Email ya registrado" (no revelar si es cuenta de otro rol).
- Hash con bcrypt, cost factor 12.
- Rol asignado automáticamente: `USER`.
- Crear registro en `User`.
- NO crear Bidder en este paso (se crea al solicitar acceso a un remate).
- Retornar `{ accessToken, user: { id, email, name, role } }` y setear cookie refreshToken.

Método `login(email, password)`:

- Buscar usuario por email. Si no existe: esperar mismo tiempo que bcrypt (timing attack prevention) y retornar error genérico "Credenciales inválidas".
- Comparar password con bcrypt.
- Si no coincide: mismo error genérico.
- Si `role === ADMIN` y el tenant está `active: false`: error "Cuenta suspendida".
- Generar accessToken + refreshToken.
- Guardar refreshToken en Redis.
- Retornar `{ accessToken, user: { id, email, name, role, tenantId } }` y setear cookie.

Método `refresh(refreshToken)`:

- Buscar en Redis. Si no existe: error 401 "Sesión inválida".
- Obtener userId del valor en Redis.
- Invalidar el refreshToken actual en Redis.
- Generar nuevo par accessToken + refreshToken.
- Guardar nuevo refreshToken en Redis.
- Retornar nuevo `{ accessToken }` y setear nueva cookie.

Método `logout(refreshToken)`:

- Eliminar refreshToken de Redis.
- Limpiar cookie.

Método `me(userId)`:

- Buscar en DB. Retornar user sin campo `password`.

#### Middleware `authenticate`

- Leer header `Authorization: Bearer <token>`.
- Verificar firma con clave pública RS256.
- Si token expirado: error 401 con `code: "TOKEN_EXPIRED"`.
- Si firma inválida: error 401 con `code: "TOKEN_INVALID"`.
- Adjuntar `req.user = { id, role, tenantId }` al request.

#### Middleware `authorize(...roles: Role[])`

- Verificar que `req.user.role` está en la lista permitida.
- Si no: error 403 `"No tienes permisos para esta acción"`.

#### Middleware `requireTenant`

- Verificar que `req.user.tenantId` no es null.
- Útil para proteger rutas de ADMIN que requieren tenant.

#### Rutas — `src/routes/auth.routes.ts`

```
POST /api/auth/register     — público, rate limit 5/15min
POST /api/auth/login        — público, rate limit 5/15min
POST /api/auth/refresh      — público (usa cookie)
POST /api/auth/logout       — requiere cookie válida
GET  /api/auth/me           — authenticate requerido
```

#### Rutas de SUPERADMIN para gestión de ADMINs

_(El único flujo para crear ADMINs es que el SUPERADMIN los cree manualmente)_

```
POST /api/admin/users       — crear ADMIN (body: email, password, name, tenantId)
                              Solo SUPERADMIN puede acceder
GET  /api/admin/users       — listar todos los ADMINs con su tenant
PATCH /api/admin/users/:id  — activar/desactivar ADMIN
```

> ⚠️ **Verificar:** refreshToken visible en DevTools → Application → Cookies → httpOnly marcado. AccessToken NO debe aparecer en localStorage ni en cookies.

---

### PROMPT 2.3 — Frontend: Auth y Cliente HTTP

**Lo que debe existir al terminar este prompt:**

#### Cliente HTTP — `src/lib/api.ts`

- Instancia de axios con `baseURL: process.env.NEXT_PUBLIC_API_URL`.
- `withCredentials: true` — para que las cookies httpOnly se envíen automáticamente.
- Interceptor de request: adjuntar `Authorization: Bearer <accessToken>` desde el store de Zustand (en memoria, nunca de localStorage).
- Interceptor de response:
  - Si status 401 con `code: "TOKEN_EXPIRED"`: llamar `POST /auth/refresh` automáticamente, actualizar el token en el store, y reintentar la request original UNA sola vez.
  - Si el refresh también falla: limpiar el store y redirigir a `/login`.
  - Cualquier otro 401: limpiar store y redirigir a `/login`.

#### Store de auth — `src/store/auth.store.ts` (Zustand)

```typescript
// Estado
{
  user: { id, email, name, role, tenantId } | null
  accessToken: string | null   // SOLO en memoria, nunca persistir
  isLoading: boolean
}

// Actions
setAuth(user, accessToken): void
clearAuth(): void
fetchMe(): Promise<void>   // llama GET /auth/me y actualiza el store
```

- **CRÍTICO:** NO usar `persist` de Zustand. El estado se restaura al cargar la app llamando `/auth/refresh` (si hay cookie) y luego `/auth/me`.
- Al cargar la app: intentar refresh silencioso → si funciona, llamar `fetchMe()` → si falla, estado null (usuario no autenticado).

#### Inicialización de sesión — `src/components/AuthProvider.tsx`

- Client Component que envuelve la app en el layout raíz.
- Al montar: intentar refresh silencioso como se describe arriba.
- Mientras se verifica: mostrar spinner de pantalla completa (no flash de contenido incorrecto).

#### Páginas de autenticación

`/login`:

- Formulario con campos: email, password.
- Validación client-side con react-hook-form + zod.
- Email: formato válido.
- Password: mínimo 8 caracteres.
- Al submit: llamar `POST /auth/login`. Si éxito: guardar en store y redirigir a `/dashboard`.
- Errores del servidor mostrar bajo el formulario (no en alert).
- Diseño: centrado, logo Martillo arriba, fondo blanco, card con sombra sutil.

`/register`:

- Campos: nombre completo, email, password, confirmar password.
- Validación: passwords deben coincidir. RUT chileno con validación de dígito verificador (implementar función `validarRut(rut: string): boolean`).
- Al submit: llamar `POST /auth/register`. Si éxito: redirigir a `/login` con mensaje "Cuenta creada. Inicia sesión."
- El RUT se valida en cliente pero se envía al backend para cifrado (no almacenar en frontend).

#### Middleware Next.js — `src/middleware.ts`

Rutas protegidas y redirecciones:

```
/dashboard/*     → requiere autenticación → redirect /login si no autenticado
/admin/*         → requiere role ADMIN o SUPERADMIN → redirect /login
/superadmin/*    → requiere role SUPERADMIN → redirect /login
/auction/*/live  → requiere autenticación → redirect /login
/login           → si autenticado, redirect /dashboard
/register        → si autenticado, redirect /dashboard
```

El middleware lee el accessToken del header de la request (Next.js middleware no tiene acceso al store de Zustand, usar una cookie adicional `is_authenticated=true` NO httpOnly solo para que el middleware sepa si hay sesión activa, sin exponer el token).

---

---

## SEMANA 3 — Gestión de Remates y Catálogo

---

### PROMPT 3.1 — Backend: CRUD de Remates y Lotes

**Lo que debe existir al terminar este prompt:**

#### Reglas de negocio de Auctions

Estados y transiciones válidas:

```
DRAFT → PUBLISHED (requiere ≥1 lote con ≥1 imagen)
PUBLISHED → LIVE (el ADMIN abre el remate manualmente)
PUBLISHED → DRAFT (el ADMIN despublica antes de que haya postores)
LIVE → PAUSED (el ADMIN pausa temporalmente)
LIVE → ENDED (el ADMIN cierra el remate)
PAUSED → LIVE (el ADMIN reanuda)
— Cualquier otra transición es inválida → error 400
```

`publishAuction(auctionId, adminId)`:

- Verificar que el remate pertenece al tenant del ADMIN.
- Verificar que tiene al menos 1 lote.
- Verificar que cada lote tiene al menos 1 imagen (type: IMAGE en LotMedia).
- Si alguna verificación falla: error descriptivo indicando qué falta.
- Cambiar status a PUBLISHED.
- Registrar AuditLog: `{ entityType: "Auction", action: "PUBLISHED", userId: adminId }`.

`openAuction(auctionId, adminId)`:

- Verificar estado PUBLISHED.
- Cambiar status a LIVE.
- Inicializar estado en Redis: `auction:{auctionId}:state` con `{ status: "LIVE", activeLotId: null, activeLotIndex: 0 }`.
- TTL Redis: 48 horas.
- Registrar AuditLog.
- (El evento Socket.io se emite desde el controller, no desde el service.)

`deleteAuction(auctionId, adminId)`:

- Solo permitido si status es DRAFT.
- Si tiene lotes: eliminar LotMedia de Cloudinary antes de eliminar de DB.
- Eliminar en cascada: LotMedia → Lots → Auction.

#### Reglas de negocio de Lots

`createLot(auctionId, data, adminId)`:

- Verificar que el remate está en DRAFT o PUBLISHED (no en LIVE ni ENDED).
- `order` se asigna automáticamente como (max order actual + 1).
- `currentPrice` se inicializa igual a `basePrice`.

`reorderLots(auctionId, lotIds: string[], adminId)`:

- `lotIds` es el array de IDs en el nuevo orden.
- Actualizar todos los `order` en una sola transacción Prisma.
- Verificar que todos los lotIds pertenecen al auctionId.

`deleteLot(lotId, adminId)`:

- Solo si status es PENDING (no ACTIVE, ADJUDICATED ni PASSED).
- Eliminar imágenes y documentos de Cloudinary.
- Eliminar LotMedia → Lot.

#### Upload de imágenes/documentos — `src/middleware/upload.middleware.ts`

Configuración Multer (memoria, no disco):

- Límite: 5MB por archivo.
- Máximo 10 archivos por request.
- Validar MIME real con la librería `file-type` (no confiar en extensión ni en Content-Type del cliente).
- MIME tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

Al subir a Cloudinary:

- Folder: `martillo/{tenantId}/lots/{lotId}`.
- Para imágenes: transformación `{ width: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }`.
- Para documentos PDF: subir sin transformación, resource_type: "raw".
- Guardar en LotMedia: `url` (URL pública para imágenes), `publicId` (para eliminar y para signed URLs de documentos).

#### Rutas

```
— Auctions
GET    /api/auctions                    público, filtros: status, tenantId, page, limit
GET    /api/auctions/:id                público
POST   /api/auctions                    ADMIN
PATCH  /api/auctions/:id                ADMIN (solo campos editables: title, description, dates)
DELETE /api/auctions/:id                ADMIN (solo DRAFT)
POST   /api/auctions/:id/publish        ADMIN
POST   /api/auctions/:id/open           ADMIN
POST   /api/auctions/:id/pause          ADMIN
POST   /api/auctions/:id/end            ADMIN

— Lots
GET    /api/auctions/:id/lots           público si PUBLISHED/LIVE
POST   /api/auctions/:id/lots           ADMIN
PATCH  /api/auctions/:id/lots/reorder   ADMIN
GET    /api/lots/:id                    público si lote en PUBLISHED/LIVE auction
PATCH  /api/lots/:id                    ADMIN (solo PENDING)
DELETE /api/lots/:id                    ADMIN (solo PENDING)

— Media
POST   /api/lots/:id/media              ADMIN, multipart/form-data, máx 10 archivos
DELETE /api/lots/:id/media/:mediaId     ADMIN
```

Todas las rutas de ADMIN verifican que el `tenantId` del recurso coincide con el del usuario autenticado. Un ADMIN no puede ver ni modificar recursos de otro tenant (excepto SUPERADMIN que ve todo).

---

### PROMPT 3.2 — Frontend: Catálogo Público y Panel Admin

**Lo que debe existir al terminar este prompt:**

#### Catálogo público (Server Components, sin autenticación requerida)

`/` — Homepage:

- Lista de remates con status PUBLISHED o LIVE del tenant.
- ISR con `revalidate: 60` segundos.
- Cards con: imagen principal del primer lote, título del remate, fecha, cantidad de lotes, badge de estado ("En vivo" animado si LIVE, "Próximo" si PUBLISHED).

`/auctions/[id]` — Detalle de remate:

- Información del remate.
- Grid de lotes con imagen, título, precio base.
- Si el remate está LIVE: botón "Acceder a la sala" (requiere login y aprobación).
- Si está PUBLISHED: botón "Solicitar acceso" (requiere login).
- `generateStaticParams` para pre-rendering.
- Metadata dinámica para SEO.

`/auctions/[id]/lots/[lotId]` — Detalle de lote:

- Galería de imágenes con miniatura lateral.
- Ficha técnica del lote.
- Precio base y precio actual.

**Regla:** Todo el catálogo debe renderizar correctamente con JavaScript deshabilitado (SSR puro, sin `useEffect` para contenido principal).

#### Panel Admin — Layout base

`/admin` — Layout con sidebar:

- Sidebar izquierdo fijo con navegación: Dashboard, Remates, Postores, Pagos, Consignantes, Configuración.
- Header con nombre del tenant y avatar/nombre del ADMIN.
- Protegido: solo ADMIN y SUPERADMIN.

`/admin/auctions` — Lista de remates:

- Tabla con columnas: Título, Estado (badge color), Lotes, Fecha, Acciones.
- Filtros por estado.
- Botón "Nuevo remate".
- Acciones por fila: Editar, Ver lotes, Publicar/Despublicar, Eliminar (con confirmación).

`/admin/auctions/new` y `/admin/auctions/[id]/edit` — Formulario de remate:

- Campos: título, descripción (textarea), fecha inicio, fecha fin.
- Validación con react-hook-form + zod.

`/admin/auctions/[id]/lots` — Gestión de lotes:

- Lista de lotes con drag & drop para reordenar (usar `@dnd-kit/core` y `@dnd-kit/sortable`).
- Al soltar: llamar `PATCH /api/auctions/:id/lots/reorder`.
- Botón "Agregar lote".
- Acciones por lote: Editar, Eliminar.

`/admin/auctions/[id]/lots/[lotId]` — Formulario de lote:

- Campos: título, descripción, precio base, incremento mínimo.
- Componente `ImageUploader`:
  - Drag & drop de archivos.
  - Preview de imágenes antes de subir.
  - Progress bar por archivo durante upload.
  - Botón eliminar en cada imagen subida.
  - Subir directamente a `POST /api/lots/:id/media`.

---

---

## SEMANA 4 — Sistema de Pujas en Tiempo Real

---

### PROMPT 4.1 — Backend: Motor de Subastas con Socket.io

**Lo que debe existir al terminar este prompt:**

#### Configuración de Socket.io

- Adjuntar Socket.io al servidor HTTP de Express (no crear servidor separado).
- Namespace: `/auction`.
- CORS: mismos orígenes que el API REST.
- Autenticación en handshake: el cliente envía el accessToken como `auth.token`. El servidor lo verifica con la clave pública RS256. Si inválido: desconectar con error "unauthorized".
- Al conectar: el cliente hace join a la room `auction:{auctionId}` enviando el auctionId.

#### Arquitectura del estado en Redis

```
auction:{auctionId}:state    → JSON: { status, activeLotId, activeLotOrder }
auction:{auctionId}:lot:{lotId}:price  → Decimal como string: precio actual
auction:{auctionId}:lot:{lotId}:bids   → sorted set: puntuados por timestamp
```

#### Evento `bid:place` — flujo de validación (en este orden exacto)

1. **Verificar remate LIVE:** consultar Redis `auction:{auctionId}:state`. Si status != "LIVE": rechazar con `"El remate no está activo"`.
2. **Verificar lote ACTIVE:** el `lotId` enviado debe coincidir con `activeLotId` en Redis. Si no: rechazar con `"Este lote no está activo"`.
3. **Verificar Bidder APPROVED:** consultar DB `Bidder` donde `userId = socket.user.id` y `auctionId`. Si no existe o status != APPROVED: rechazar con `"No estás habilitado para pujar en este remate"`.
4. **Verificar monto:** `amount` debe ser `> currentPrice + minIncrement`. Leer `currentPrice` desde Redis. Si no cumple: rechazar con `"El monto debe ser mayor a ${currentPrice + minIncrement}"`.
5. **Rate limit personal:** en Redis, key `ratelimit:bid:{bidderId}` con TTL 2 segundos. Si existe: rechazar con `"Debes esperar antes de volver a pujar"`.
6. **Mutex por lote:** intentar `SET mutex:lot:{lotId} {bidderId} NX EX 5`. Si falla (ya existe): rechazar con `"Puja en proceso, intenta nuevamente"`.
7. **Transacción atómica en PostgreSQL:**
   - Crear registro `Bid` (APPEND-ONLY, nunca modificar existentes).
   - Actualizar `Lot.currentPrice = amount`.
   - Ambas operaciones en `prisma.$transaction`.
8. **Actualizar Redis:** `auction:{auctionId}:lot:{lotId}:price = amount`.
9. **Liberar mutex:** eliminar key del mutex en Redis.
10. **Broadcast:** emitir `bid:update` a toda la room.

Si cualquier paso falla: liberar mutex (si se adquirió) y emitir `bid:rejected` solo al socket emisor.

#### Evento `bid:update` — payload al hacer broadcast

```json
{
  "lotId": "...",
  "currentPrice": 150000,
  "paddleNumber": 42, // número de paleta, NO el userId ni nombre
  "source": "ONLINE",
  "bidId": "...", // para auditoría
  "timestamp": "2026-02-14T..."
}
```

#### Eventos del rematador (solo ADMIN autenticado en el socket)

`lot:activate` — activar un lote:

- Verificar que el emisor es ADMIN del tenant.
- Cambiar `Lot.status = ACTIVE` en DB.
- Actualizar Redis `activeLotId`.
- Broadcast `lot:activated { lotId, lotData }` a toda la room.

`lot:adjudicate` — adjudicar al mejor postor:

- Verificar ADMIN.
- Obtener el Bid más alto del lote activo.
- Crear `Adjudication` en DB.
- Cambiar `Lot.status = ADJUDICATED`.
- Cambiar `Bidder.status` del ganador a... (no cambia, sigue APPROVED para otros lotes).
- Broadcast `lot:adjudicated { lotId, winnerId enmascarado, finalAmount, paddleNumber }`.
- Emitir `notification:personal` al socket del ganador (si está conectado).

`lot:pass` — lote sin adjudicar:

- Cambiar `Lot.status = PASSED`.
- Broadcast `lot:passed { lotId }`.

`auction:pause` y `auction:resume`:

- Actualizar Redis y DB.
- Broadcast del nuevo estado.

`auction:end`:

- Cambiar `Auction.status = ENDED` en DB.
- Limpiar estado de Redis (o dejar expirar).
- Broadcast `auction:ended`.
- Disparar creación de `Payment` para cada adjudicación del remate (proceso asíncrono, no bloquear el evento).

#### Test de race condition obligatorio

Antes de continuar a 4.2, escribir un script de test que:

- Simule 20 conexiones WebSocket simultáneas al mismo lote.
- Todas intentan pujar al mismo tiempo con el mismo monto.
- Verificar que solo 1 Bid se crea y el precio nunca decrece.
- Verificar que el mutex Redis funciona correctamente.

> ⚠️ **CRÍTICO: No continuar a 4.2 hasta que el test de race condition pase. Un mutex que falla en producción puede corromper precios y es un error grave de negocio.**

---

### PROMPT 4.2 — Frontend: Sala de Subasta y Panel del Rematador

**Lo que debe existir al terminar este prompt:**

#### Hook `useAuctionSocket` — `src/hooks/useAuctionSocket.ts`

- Conectar al namespace `/auction` con `auth: { token: accessToken }`.
- Reconexión automática con backoff exponencial (máx 5 intentos).
- Indicador de estado de conexión: `"connected" | "reconnecting" | "disconnected"`.
- Al reconectar: sincronizar estado desde el API REST (el estado en tiempo real vive en Redis, el cliente debe poder reconstruirlo).
- Exponer: `connectionStatus`, `currentPrice`, `activeLot`, `bidHistory`, `placeBid(amount)`.

#### Página Sala del Postor — `/auction/[id]/live`

- Protegida: requiere autenticación Y que el Bidder tenga status APPROVED para ese remate. Si PENDING: mostrar pantalla "Tu solicitud está pendiente de aprobación". Si REJECTED/BANNED: pantalla de error con mensaje.
- Layout:
  - 60% izquierda: imagen del lote activo (grande).
  - 40% derecha: panel de pujas.
- Panel de pujas contiene:
  - Precio actual con animación de pulso en cada actualización.
  - Incremento mínimo indicado.
  - Input de monto con botón "PUJAR" (verde, prominente).
  - El botón se deshabilita por 2 segundos después de cada puja (feedback de rate limit).
  - Historial de últimas 10 pujas: paddle `***42`, monto, fuente (ONLINE/PRESENCIAL), tiempo relativo.
  - Indicador de conexión en esquina: punto verde/amarillo/rojo.
- Footer: lista horizontal de próximos lotes (miniaturas).
- Si no hay lote activo: pantalla "Esperando al rematador..." con animación de espera.
- Si el remate termina: pantalla "Remate finalizado" con botón a mis adjudicaciones.

#### Página Panel del Rematador — `/admin/auction/[id]/live`

- Solo ADMIN del tenant.
- Layout de 3 columnas:
  - Izquierda: lista de todos los lotes (scroll vertical) con estado visual por color. Click → activa lote.
  - Centro: lote activo en grande con precio en tiempo real y últimas pujas (con paddle completo visible para el rematador).
  - Derecha: postores conectados y historial de la sesión.
- Controles del rematador (solo cuando hay lote activo):
  - Botón "ADJUDICAR" (verde grande) → abre modal de confirmación con paddle del ganador.
  - Botón "PASAR" (gris) → marcar lote como PASSED sin adjudicar.
  - Botón "PAUSAR REMATE" / "REANUDAR" según estado.
  - Botón "FINALIZAR REMATE" → confirmación con texto "Esta acción no se puede deshacer".
- Pujas presenciales: formulario para ingresar paddle number y monto → emite `bid:place` con `source: "PRESENCIAL"`.

> ⚠️ **Probar con 2 ventanas: una como postor, otra como rematador. Verificar que al adjudicar aparece el resultado en ambas ventanas simultáneamente.**

---

---

## SEMANA 5 — Registro y Verificación de Postores

---

### PROMPT 5.1 — Backend: Gestión de Postores

**Lo que debe existir al terminar este prompt:**

#### Flujo completo de Bidder

`requestAccess(userId, auctionId)`:

- Verificar que el remate está PUBLISHED o LIVE (no DRAFT ni ENDED).
- Verificar que no existe ya un Bidder para (userId, auctionId).
- Crear Bidder con status PENDING.
- Asignar `paddleNumber = null` (se asigna al aprobar).
- Registrar AuditLog.
- Disparar email "Solicitud recibida" al postor (async, no bloquear).

`approveBidder(bidderId, adminId)`:

- Verificar que el ADMIN pertenece al tenant del remate.
- Verificar que el Bidder está PENDING.
- Asignar `paddleNumber`: obtener el MAX paddleNumber del remate y sumar 1. Usar transacción para evitar duplicados.
- Cambiar status a APPROVED.
- Registrar AuditLog con `metadata: { paddleNumber }`.
- Email "Aprobado - Tu número de paleta es #42" al postor.

`rejectBidder(bidderId, adminId, reason)`:

- Solo desde PENDING.
- Guardar `rejectionReason`.
- Email de rechazo con motivo.

`banBidder(bidderId, adminId, reason)`:

- Desde APPROVED.
- Desconectar el socket del postor si está en la sala (emitir evento `user:banned` a su socket).
- Email de baneo.

#### Documentos de identidad

`uploadDocument(bidderId, file, type, adminId_o_userId)`:

- El propio USER puede subir sus documentos al registrarse.
- El ADMIN puede ver los documentos de sus postores.
- Subir a Cloudinary: folder `martillo/{tenantId}/bidders/{bidderId}/docs/`, resource_type: "raw" (para PDFs) o "image".
- Guardar SOLO el `cloudinaryPublicId` en `BidderDocument`. NUNCA la URL pública.
- Las URLs son signed con TTL 1 hora y se generan bajo demanda.

`getDocumentUrl(documentId, requestingUserId)`:

- Verificar que el solicitante es el propio USER o un ADMIN del tenant.
- Generar signed URL de Cloudinary con TTL 3600 segundos.
- NO cachear estas URLs (se generan frescas cada vez).

#### Rutas

```
POST /api/auctions/:id/bidders/request     — USER autenticado
GET  /api/auctions/:id/bidders             — ADMIN del tenant
GET  /api/auctions/:id/bidders/:bidderId   — ADMIN o el propio USER
POST /api/auctions/:id/bidders/:bidderId/approve  — ADMIN
POST /api/auctions/:id/bidders/:bidderId/reject   — ADMIN (body: reason)
POST /api/auctions/:id/bidders/:bidderId/ban      — ADMIN (body: reason)

POST /api/bidders/:bidderId/documents      — USER (sube sus propios docs)
GET  /api/bidders/:bidderId/documents      — ADMIN o el propio USER
GET  /api/bidders/:bidderId/documents/:docId/url  — genera signed URL
```

---

### PROMPT 5.2 — Frontend: Flujo de Postores

**Lo que debe existir al terminar este prompt:**

#### Flujo del postor (USER)

`/auctions/[id]` — Botón "Solicitar acceso":

- Si no autenticado: redirigir a `/login?redirect=/auctions/[id]`.
- Si autenticado y ya tiene Bidder: mostrar estado actual (badge).
- Si autenticado y no tiene Bidder: modal de confirmación → llamar `POST /api/auctions/:id/bidders/request`.

`/dashboard/my-auctions` — Panel del postor:

- Lista de todos los remates donde el usuario tiene un Bidder.
- Por cada uno: título del remate, estado del Bidder (badge con color), número de paleta si APPROVED.
- Si PENDING: indicador "En revisión" con fecha de solicitud.
- Si APPROVED: botón "Acceder a la sala" (si el remate está LIVE).

`/dashboard/my-auctions/[auctionId]/documents` — Subida de documentos:

- Upload de Cédula de Identidad (frente y reverso): obligatorio.
- Upload de documentos adicionales: opcional.
- Drag & drop con preview.
- Estado de cada documento: "Subido ✓" / "Error ✗".
- Aviso visible: "Tus documentos son privados y solo los verá el organizador del remate."

#### Panel Admin de postores

`/admin/auctions/[id]/bidders` — Lista de postores:

- Tabla: nombre, email, estado (badge), paleta, fecha solicitud, documentos, acciones.
- Filtros por estado: PENDING | APPROVED | REJECTED | BANNED.
- Acciones rápidas: Aprobar / Rechazar / Banear (con modal de confirmación y campo de motivo).
- Al hacer click en nombre: panel lateral con documentos del postor.
- Documentos: al hacer click → llamar endpoint de signed URL → abrir en nueva pestaña. No mostrar URLs directas.

---

---

## SEMANA 6 — Pagos y Notificaciones

---

### PROMPT 6.1 — Sistema de Pagos

**Lo que debe existir al terminar este prompt:**

#### Lógica de cálculo de pago

Al adjudicar un lote, crear automáticamente un `Payment`:

```
amount     = Adjudication.finalAmount
commission = amount * tenant.commissionRate  (% configurado por tenant)
iva        = commission * 0.19               (IVA chileno 19% sobre comisión)
total      = amount + commission + iva
```

Agregar campo `commissionRate: Decimal` al modelo `Tenant`.

#### Integración Flow (pasarela de pago chilena)

_(Si Flow no está disponible, implementar con Stripe como fallback con la misma interfaz de servicio)_

`PaymentService.createPaymentOrder(paymentId)`:

- Llamar API Flow: `POST /api/payment/create`.
- Parámetros: `commerceOrder: paymentId`, `subject: "Adjudicación lote: {lotTitle}"`, `amount: total`, `email: user.email`, `urlConfirmation: {API_URL}/api/webhooks/flow`, `urlReturn: {FRONTEND_URL}/payment/{paymentId}/result`.
- Guardar `flowToken` y `flowOrderId` en `Payment`.
- Retornar URL de pago para redirigir al usuario.

`PaymentService.handleWebhook(flowToken, status)`:

- Verificar firma HMAC del webhook con secret de Flow.
- Si firma inválida: rechazar con 401 (log del intento).
- Si `status = 1` (pagado): actualizar `Payment.status = PAID`, guardar `paidAt`.
- Si `status = 2` (rechazado): `Payment.status = FAILED`.
- Registrar AuditLog.
- Enviar email de confirmación o de fallo.
- Esta función debe ser IDEMPOTENTE: si el webhook se recibe dos veces, no duplicar acciones.

#### Rutas

```
GET  /api/payments/my                      — USER: lista sus pagos pendientes/pagados
GET  /api/payments/:id                     — USER dueño o ADMIN del tenant
POST /api/payments/:id/initiate            — USER: inicia el pago → retorna URL de Flow
GET  /api/payments/:id/status              — USER: consulta estado (SIEMPRE desde DB, no desde URL params)
POST /api/webhooks/flow                    — público, verificar HMAC
GET  /api/admin/payments                   — ADMIN: lista pagos de su tenant con filtros
```

---

### PROMPT 6.2 — Notificaciones por Email con Resend

**Lo que debe existir al terminar este prompt:**

#### Servicio de email — `src/services/email.service.ts`

Implementar con Resend. Cada función recibe los datos necesarios y construye el email.

Emails a implementar (con HTML básico responsivo, colores de marca Martillo):

| Función                     | Trigger                | Destinatario               |
| --------------------------- | ---------------------- | -------------------------- |
| `sendBidderRequestReceived` | Postor solicita acceso | Postor                     |
| `sendBidderApproved`        | ADMIN aprueba          | Postor                     |
| `sendBidderRejected`        | ADMIN rechaza          | Postor                     |
| `sendBidderBanned`          | ADMIN banea            | Postor                     |
| `sendLotAdjudicated`        | ADMIN adjudica         | Postor ganador             |
| `sendPaymentDue`            | Se crea Payment        | Postor adjudicatario       |
| `sendPaymentConfirmed`      | Webhook Flow éxito     | Postor                     |
| `sendPaymentFailed`         | Webhook Flow fallo     | Postor                     |
| `sendAuctionReminder`       | 24h antes del remate   | Todos los Bidders APPROVED |

Todos los emails deben:

- Incluir logo de Martillo en el header (URL pública de Cloudinary).
- Incluir nombre del postor en el saludo.
- Incluir nombre de la casa de remates (tenant).
- Footer con enlace a martillo.app y texto legal mínimo.
- El dominio remitente es `noreply@martillo.app`.

---

### PROMPT 6.3 — Frontend: Flujo de Pagos

**Lo que debe existir al terminar este prompt:**

#### Páginas de pago

`/dashboard/payments` — Mis pagos:

- Lista de adjudicaciones con su estado de pago.
- Columnas: lote, remate, monto adjudicado, comisión, IVA, total, estado, acciones.
- Si PENDING: botón "Pagar ahora".
- Si PAID: botón "Descargar comprobante".

`/dashboard/payments/[paymentId]` — Detalle de pago:

- Resumen del lote adjudicado (imagen, título).
- Desglose: monto base, comisión, IVA, total.
- Botón "Pagar con Flow" → llama `POST /api/payments/:id/initiate` → redirige a URL de Flow.

`/payment/[paymentId]/result` — Página de retorno desde Flow:

- **IMPORTANTE:** NO leer el estado del pago desde los query params de la URL (Flow puede incluir params pero son informativos, no definitivos).
- Siempre llamar `GET /api/payments/:id/status` para obtener el estado real desde la DB.
- Si PAID: pantalla de éxito con resumen y botón descargar comprobante.
- Si PENDING/FAILED: pantalla de error con botón reintentar.
- Mostrar spinner mientras se consulta el estado.

`Comprobante de pago`:

- Generar PDF en el cliente con `jsPDF` o llamar a un endpoint del backend.
- Contenido: logo tenant, datos del postor, lote, precio final, comisión, IVA, total, fecha, número de orden.

---

---

## SEMANA 7 — Seguridad y Pruebas de Carga

---

### PROMPT 7.1 — Auditoría de Seguridad Backend

**Lo que debe existir al terminar este prompt:**

#### Checklist de auditoría a revisar y corregir

**Autenticación y autorización:**

- [ ] Todos los endpoints protegidos tienen middleware `authenticate` aplicado.
- [ ] Todos los endpoints de ADMIN verifican que el recurso pertenece al tenant del usuario.
- [ ] No existe ningún endpoint que retorne datos de otro tenant a un ADMIN.
- [ ] El SUPERADMIN tiene acceso correcto a todos los tenants.
- [ ] Los mensajes de error no revelan si un email existe o no.
- [ ] Los tokens JWT no se logean en ningún lugar.

**Validación de inputs:**

- [ ] Todos los request bodies están validados con zod antes de llegar al controller.
- [ ] Los IDs en params son validados (formato cuid, no cadenas arbitrarias).
- [ ] Los filtros de paginación tienen valores máximos (ej: `limit` máximo 100).
- [ ] Los campos de texto tienen longitud máxima definida.

**Base de datos:**

- [ ] No existe ningún `findMany` sin paginación en endpoints públicos.
- [ ] Las queries incluyen el `tenantId` como filtro donde corresponde.
- [ ] No se usa `SELECT *` en ningún lugar — siempre `select` explícito para excluir `password` y datos cifrados innecesarios.

**Cloudinary y archivos:**

- [ ] Los documentos de identidad solo se acceden via signed URLs.
- [ ] El MIME type se valida con `file-type` (no con extensión).
- [ ] El tamaño máximo de archivo se valida antes de subir a Cloudinary.

**Webhook de Flow:**

- [ ] La firma HMAC se verifica antes de procesar cualquier dato.
- [ ] El handler es idempotente.

**Pujas:**

- [ ] La tabla `Bid` no tiene ningún endpoint de UPDATE ni DELETE.
- [ ] La tabla `AuditLog` no tiene ningún endpoint de UPDATE ni DELETE.
- [ ] El mutex Redis se libera siempre (incluso si ocurre un error en la transacción).

Generar un reporte en `docs/security-audit.md` con estado de cada punto.

---

### PROMPT 7.2 — Pruebas de Carga y Seguridad Frontend

**Lo que debe existir al terminar este prompt:**

#### Prueba de carga del sistema de pujas

Script con `socket.io-client` que simule:

- 50 clientes WebSocket conectados simultáneamente a la misma sala.
- Cada cliente intenta pujar cada 3 segundos.
- Duración: 5 minutos.
- Métricas a medir y reportar:
  - Latencia promedio de `bid:place` → `bid:update` broadcast.
  - Porcentaje de pujas rechazadas vs aceptadas.
  - Memoria y CPU del proceso Node.js durante la prueba.
  - Número de conexiones activas en Redis.

Umbral de aceptación:

- Latencia promedio < 300ms.
- CPU < 70% sostenido.
- 0 errores de corrupción de precio (el precio nunca debe decrecer).

#### Auditoría de seguridad Frontend

- [ ] El accessToken no aparece en `localStorage`, `sessionStorage` ni cookies no-httpOnly.
- [ ] Al expirar la sesión, el usuario es redirigido a login limpiamente (sin errores en consola).
- [ ] Las páginas protegidas no muestran flash de contenido antes de verificar auth.
- [ ] Los formularios tienen protección CSRF implícita (mismo origen, cookie httpOnly).
- [ ] No se renderizan datos sensibles del usuario en el HTML estático.
- [ ] Los errores del servidor no muestran stack traces al usuario.

---

---

## SEMANA 8 — Testing E2E y Lanzamiento

---

### PROMPT 8.1 — Tests E2E con Playwright y Monitoreo

**Lo que debe existir al terminar este prompt:**

#### Tests E2E con Playwright — `apps/frontend/e2e/`

Test suite 1 — Flujo de autenticación:

- Registro de nuevo usuario.
- Login con credenciales correctas.
- Intento de login con credenciales incorrectas (verificar mensaje genérico).
- Acceso a ruta protegida sin auth → redirect a login.
- Refresh automático de token (simular token expirado).

Test suite 2 — Flujo de postor:

- Postor ve catálogo público.
- Postor solicita acceso a un remate.
- ADMIN aprueba al postor (usando API directamente en el test).
- Postor accede a la sala de subastas.
- Postor realiza una puja.
- Postor ve su adjudicación.

Test suite 3 — Flujo de pago:

- Postor con adjudicación ve el pago pendiente.
- Postor inicia pago (mock de Flow en entorno de test).
- Webhook mock de confirmación.
- Postor ve pago confirmado.

#### Monitoreo — configurar antes del lanzamiento

Sentry:

- Instalar en frontend (`@sentry/nextjs`) y backend (`@sentry/node`).
- Capturar errores no manejados.
- Configurar `SENTRY_DSN` en Railway y Vercel.
- NO enviar a Sentry: passwords, tokens, RUTs, datos bancarios (usar `beforeSend` para filtrar).

UptimeRobot (gratis):

- Monitor HTTP sobre `GET /health` cada 5 minutos.
- Alerta por email si cae.

---

### PROMPT 8.2 — Deploy de Producción y Checklist Final

**Lo que debe existir al terminar este prompt:**

#### Checklist de producción

**Railway (backend):**

- [ ] Todas las variables de entorno configuradas (ver lista en CONTEXTO GLOBAL).
- [ ] `NODE_ENV=production`.
- [ ] PostgreSQL con al menos 1GB de storage.
- [ ] Redis configurado.
- [ ] Migraciones ejecutadas: `npx prisma migrate deploy`.
- [ ] Seed del SUPERADMIN ejecutado.
- [ ] `GET /health` responde `{ status: "ok" }`.

**Vercel (frontend):**

- [ ] `NEXT_PUBLIC_API_URL` apunta a la URL de Railway en producción.
- [ ] `NEXT_PUBLIC_SOCKET_URL` apunta a la URL de Railway.
- [ ] Build pasa sin errores ni warnings críticos.

**CORS:**

- [ ] `ALLOWED_ORIGINS` en Railway incluye la URL exacta de Vercel (con https, sin trailing slash).

**Dominio:**

- [ ] `martillo.app` configurado en Vercel con certificado SSL.
- [ ] Subdominio `api.martillo.app` configurado para Railway (opcional).

**Post-lanzamiento — primeras 48h:**

- Monitorear Sentry activamente.
- Revisar logs de Railway por errores.
- Verificar que los webhooks de Flow llegan correctamente.
- Confirmar que los emails de Resend se están enviando.

---

---

## PROMPTS BONUS — Post-MVP

---

### PROMPT B.1 — Dashboard con Estadísticas y Reportes

**Lo que debe existir al terminar este prompt:**

#### Backend — Endpoints de métricas (solo ADMIN y SUPERADMIN)

```
GET /api/admin/metrics/summary
  → { totalAuctions, liveAuctions, totalBidders, totalRevenue, totalPaid, totalPending }

GET /api/admin/metrics/auctions/:id
  → por remate: { totalLots, adjudicated, passed, totalRevenue, topBidder }

GET /api/admin/reports/auction/:id/excel
  → genera y retorna archivo .xlsx con: lotes, adjudicaciones, postores, pagos

GET /api/admin/reports/auction/:id/pdf
  → genera y retorna PDF con resumen del remate incluyendo logo del tenant
```

#### Frontend — `/admin/dashboard`

- Cards de resumen: remates activos, postores pendientes de aprobación, ingresos del mes, pagos vencidos.
- Gráfico de barras: adjudicaciones por remate (últimos 6 meses) — usar `recharts`.
- Tabla de pagos vencidos con botón de recordatorio.
- Botones de exportación por remate: Excel y PDF.

---

### PROMPT B.2 — Puja Automática (Proxy Bidding)

**Lo que debe existir al terminar este prompt:**

#### Lógica de proxy bidding

El postor define un monto máximo. El sistema puja automáticamente por él con el incremento mínimo hasta ese tope.

`setProxyBid(bidderId, lotId, maxAmount)`:

- Guardar en Redis: `proxy:{lotId}:{bidderId} = maxAmount` (solo válido mientras el lote está activo).
- Cuando entra una puja manual y hay proxies activos: el sistema evalúa si algún proxy puede superar la puja, y si puede, emite la puja automática con `source: "PROXY"`.
- Si dos proxies compiten: el que tiene mayor máximo gana al mínimo necesario.
- El rematador puede ver en su panel qué pujas son PROXY vs ONLINE vs PRESENCIAL.

El proxy se cancela automáticamente cuando:

- El lote se adjudica.
- El postor hace una puja manual superior a su propio proxy.
- El postor cancela explícitamente el proxy.

---

_Martillo — Prompts Codex v2.0 · GM Studios · 2026_
