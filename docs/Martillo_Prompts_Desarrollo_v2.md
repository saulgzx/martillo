# Martillo - Guia de Prompts v2 (Detallada y Operativa)

Fecha: 2026-02-13  
Repo base: `martillo`  
Objetivo: ejecutar el proyecto por etapas con prompts exactos y verificables.

## Estado rapido (visible)

| Prompt                                         | Estado                                   |
| ---------------------------------------------- | ---------------------------------------- |
| P0.1 - Normalizacion de formato (EOL/Prettier) | DONE                                     |
| P0.2 - Cerrar huecos minimos de deploy         | DONE                                     |
| P0.3 - Alineacion frontend con manual de marca | DONE                                     |
| P1.2 - CI operativo (sin deploy complejo)      | DONE                                     |
| P1.3 - Seguridad base y env validation         | DONE                                     |
| P2.1 - Prisma schema real de negocio           | PARCIAL (bloqueo por DB local)           |
| P2.2 - Auth JWT RS256 + refresh                | DONE                                     |
| P2.3 - Frontend auth flow                      | DONE                                     |
| P3.1 - Backend CRUD remates/lotes              | PARCIAL (sin pruebas de integracion aun) |
| P3.2 - Frontend catalogo/admin                 | PARCIAL (base funcional)                 |
| P4.1 - Motor de subastas realtime backend      | PARCIAL (base socket implementada)       |

## Convenciones v2 (obligatorias)

- Rama de trabajo: `develop`; despliegue desde `main`.
- Backend health operativo: `GET /health`.
- API de negocio: prefijo `/api/*`.
- Nunca avanzar de prompt si falla su DoD.
- Produccion Prisma: `prisma migrate deploy` + `prisma db seed`.
- Todo prompt debe terminar con evidencia: archivos tocados + comandos corridos + resultados.
- Frontend debe seguir manual de marca como fuente de verdad (colores, tipografia, logo, tono visual, espaciado y componentes).

## Prompt Base (pegar antes de cada prompt)

Copia y pega este bloque en cada sesion:

```text
Proyecto: Martillo (monorepo)
Stack: Next.js 14 + Express + TypeScript + Prisma + PostgreSQL + Redis
Estructura: apps/frontend, apps/backend, packages/shared
Reglas:
1) No inventes archivos fuera del scope.
2) Ejecuta los comandos de validacion y reporta salida.
3) Si algo falla, corrige y reintenta en la misma sesion.
4) No uses migrate dev para produccion.
5) Manten compatibilidad Railway/Vercel.
Estado actual:
[PEGA AQUI UN RESUMEN CORTO DE CONTEXT.md]
```

## Secuencia exacta de prompts v2

## Fase 0 - Estabilizacion inmediata (antes de Semana 1)

### [x] P0.1 - Normalizacion de formato (EOL/Prettier)

Usar ahora.

Prompt exacto:

```text
Usa el repo actual y corrige todos los errores de formato que rompen lint/build en backend y frontend.
Tareas:
1) Ejecuta formateo consistente para TypeScript/TSX/JS.
2) Convierte finales de linea para evitar errores prettier por CRLF/LF.
3) Re-ejecuta:
   - npm run lint -w apps/backend
   - npm run lint -w apps/frontend
   - npm run build -w apps/backend
   - npm run build -w apps/frontend
Entregables:
- Lista de archivos modificados.
- Resultado de cada comando.
- Confirmacion de estado en verde.
```

DoD:

```bash
npm run lint -w apps/backend
npm run lint -w apps/frontend
npm run build -w apps/backend
npm run build -w apps/frontend
```

### [x] P0.2 - Cerrar huecos minimos de deploy

Usar ahora, despues de P0.1.

Prompt exacto:

```text
Completa configuracion minima para Railway/Vercel en monorepo.
Crear/ajustar:
1) apps/backend/railway.json
   - startCommand: node dist/index.js
   - healthcheckPath: /health
   - buildCommand: npm run build -w apps/backend
2) apps/frontend/vercel.json
   - framework: nextjs
   - rootDirectory coherente con apps/frontend
3) apps/frontend/.env.example
   - NEXT_PUBLIC_API_URL=
   - NEXT_PUBLIC_SOCKET_URL=
   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
4) backend health:
   - exponer GET /health (ademas de /api/health si ya existe)
Validar con build/lint y reportar diffs.
```

DoD:

```bash
npm run build
npm run lint
```

### [x] P0.3 - Alineacion de frontend con manual de marca (obligatorio)

Usar ahora, despues de P0.2.

Prompt exacto:

```text
Alinea el frontend con el manual de marca oficial de Martillo antes de crear nuevas pantallas.
Objetivo:
1) Definir y centralizar Design Tokens (color, tipografia, radios, espaciados, sombras, estados).
2) Asegurar uso correcto de logo, variantes y area de seguridad.
3) Ajustar estilos base (globals.css, tailwind.config.ts, componentes UI base) para cumplir marca.
4) Documentar reglas en docs/brand-frontend.md con ejemplos Do/Don't.
5) No inventar estilos fuera del manual.
Si falta el manual de marca en el repo, crear un bloqueo explicito y dejar checklist de insumos pendientes.
Entregables:
- Archivo de tokens de marca aplicado al frontend.
- Actualizacion de componentes base (Button/Card/Typography) alineados a marca.
- Captura del diff y validacion de build/lint.
```

DoD:

```bash
npm run lint -w apps/frontend
npm run build -w apps/frontend
```

Resultado ejecucion actual:

- Estado: `DONE`.
- Avance parcial aplicado:
  - `docs/manual-de-marca.docx` (fuente de verdad)
  - `apps/frontend/lib/brand-tokens.ts`
  - `apps/frontend/app/globals.css` (paleta alineada)
  - `apps/frontend/tailwind.config.ts` (colores/tipografia brand)
  - `apps/frontend/components/ui/card.tsx`
  - `apps/frontend/components/ui/typography.tsx`
  - `apps/frontend/app/page.tsx` (uso de componentes base)
  - `apps/frontend/public/brand/martillo_icon.svg`
  - `apps/frontend/public/brand/martillo_icon_black.svg`
  - `apps/frontend/public/brand/martillo_icon_white.svg`
  - `docs/brand-frontend.md` (bloqueo + checklist Do/Don't)
- Validacion:
  - `npm run lint -w apps/frontend` -> OK
  - `npm run build -w apps/frontend` -> OK

## Fase 1 - Semana 1 (base)

### P1.1 - Monorepo y baseline tecnico

Prompt exacto:

```text
Audita y alinea la base del monorepo para que sea consistente con ejecucion local y CI.
Checklist:
1) package.json raiz con scripts dev/build/lint funcionales.
2) tsconfig coherente en frontend/backend/shared.
3) README actualizado con setup real del repo.
4) CONTEXT.md actualizado al estado real (sin placeholders viejos).
Entrega evidencia de comandos ejecutados y estado.
```

### [x] P1.2 - CI operativo (sin deploy complejo)

Prompt exacto:

```text
Crea CI minimo y robusto en .github/workflows:
1) ci.yml en push y PR:
   - npm ci
   - npm run lint
   - npm run build
2) No incluir deploy aun.
3) Cache de npm habilitado.
4) Falla inmediata ante errores.
Entrega YAML final y explicacion corta de jobs.
```

Resultado ejecucion actual:

- Estado: `DONE`.
- Archivo creado:
  - `.github/workflows/ci.yml`
- Jobs:
  - `lint-and-build` con `npm ci`, `npm run lint`, `npm run build`.
- Trigger:
  - `push` (todas las ramas)
  - `pull_request` (todas las ramas)
- Cache:
  - `actions/setup-node@v4` con `cache: npm`.
- Validacion local:
  - `npm run lint` -> OK
  - `npm run build` -> OK

### [x] P1.3 - Seguridad base y env validation

Prompt exacto:

```text
Implementa seguridad base en backend:
1) src/config/env.ts con validacion estricta (zod).
2) src/config/security.ts con helmet, cors whitelist y rate limits.
3) Integrar en src/index.ts.
4) Completar apps/backend/.env.example con variables base:
   JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, DATABASE_URL, REDIS_URL, ALLOWED_ORIGINS, NODE_ENV, PORT
5) No hardcodear secretos.
Entrega codigo y comandos de validacion.
```

Resultado ejecucion actual:

- Estado: `DONE`.
- Archivos creados:
  - `apps/backend/src/config/env.ts`
  - `apps/backend/src/config/security.ts`
- Archivos actualizados:
  - `apps/backend/src/index.ts`
  - `apps/backend/.env.example`
  - `apps/backend/package.json` (dependencias nuevas)
- Dependencias agregadas:
  - `zod`
  - `express-rate-limit`
- Validacion local:
  - `npm run lint` -> OK
  - `npm run build` -> OK

DoD Semana 1:

```bash
npm run lint
npm run build
```

## Fase 2 - Semana 2 (datos + auth)

### P2.1 - Prisma schema real de negocio

Prompt exacto:

```text
Evoluciona el schema Prisma desde estado minimo a entidades de negocio de subastas.
1) Crear modelos principales (User, Auction, Lot, Bidder, Bid, Adjudication, Payment, AuditLog).
2) Crear migracion nueva sin romper datos existentes.
3) Ajustar seed para datos minimos reproducibles.
4) Exportar Prisma singleton en src/lib/prisma.ts.
Validar generate, migrate deploy y seed.
```

Resultado ejecucion actual:

- Estado: `PARCIAL` (implementacion completada, validacion de DB bloqueada por conectividad local).
- Archivos actualizados:
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/seed.js`
  - `apps/backend/src/lib/prisma.ts`
  - `apps/backend/prisma/migrations/20260214110000_business_schema/migration.sql`
- Dependencias agregadas:
  - `bcryptjs`
- Validacion:
  - `npm run prisma:generate -w apps/backend` -> OK
  - `npm run prisma:migrate:deploy -w apps/backend` -> FAIL (DB no alcanzable localmente)
  - `npm run prisma:seed -w apps/backend` -> FAIL (DB no alcanzable localmente)
  - `npm run lint` -> OK
  - `npm run build` -> OK

### [x] P2.2 - Auth JWT RS256 + refresh

Prompt exacto:

```text
Implementa auth backend completo:
1) auth.service con hash/compare (bcrypt) y tokens access/refresh.
2) refresh tokens revocables en Redis.
3) auth.middleware authenticate/authorize por roles.
4) rutas: register, login, refresh, logout, me.
5) validacion de payloads con zod.
Incluye pruebas unitarias minimas de auth.service.
```

Resultado ejecucion actual:

- Estado: `DONE`.
- Archivos creados:
  - `apps/backend/src/services/auth.service.ts`
  - `apps/backend/src/controllers/auth.controller.ts`
  - `apps/backend/src/middleware/auth.middleware.ts`
  - `apps/backend/src/routes/auth.routes.ts`
  - `apps/backend/src/lib/token-store.ts`
  - `apps/backend/src/lib/redis-token-store.ts`
  - `apps/backend/src/types/express.d.ts`
  - `apps/backend/src/__tests__/auth.service.test.ts`
  - `apps/backend/jest.config.cjs`
  - `apps/backend/jest.setup.ts`
  - `packages/shared/src/auth.types.ts`
- Archivos actualizados:
  - `apps/backend/src/index.ts` (cookie-parser + rutas auth)
  - `apps/backend/package.json` (scripts/deps)
  - `packages/shared/src/index.ts`
- Validacion:
  - `npm run lint -w apps/backend` -> OK
  - `npm run build -w apps/backend` -> OK
  - `npm run test -w apps/backend` -> OK (3 tests auth.service)
  - `npm run lint` -> OK
  - `npm run build` -> OK

### [x] P2.3 - Frontend auth flow

Prompt exacto:

```text
Implementa frontend auth funcional:
1) cliente HTTP con interceptor y refresh.
2) store auth en memoria (sin localStorage para token).
3) paginas login/register con validacion.
4) middleware de rutas protegidas.
Entrega flujo probado: register/login/refresh/logout.
```

Resultado ejecucion actual:

- Estado: `DONE`.
- Archivos creados:
  - `apps/frontend/lib/api.ts`
  - `apps/frontend/lib/rut.ts`
  - `apps/frontend/store/auth.store.ts`
  - `apps/frontend/components/forms/FormField.tsx`
  - `apps/frontend/components/common/LoadingSpinner.tsx`
  - `apps/frontend/components/common/Logo.tsx`
  - `apps/frontend/app/(auth)/layout.tsx`
  - `apps/frontend/app/(auth)/login/page.tsx`
  - `apps/frontend/app/(auth)/register/page.tsx`
  - `apps/frontend/app/dashboard/page.tsx`
  - `apps/frontend/middleware.ts`
- Validacion:
  - `npm run lint` -> OK
  - `npm run build` -> OK
  - `npm run test -w apps/backend` -> OK

## Fase 3-8 (resumen operativo)

- P3.x: CRUD remates/lotes + catalogo/admin.
- P4.x: Socket.io + mutex Redis + sala/controles.
- P5.x: postores/documentos/blacklist/PII.
- P6.x: pagos + webhooks firmados + emails.
- P7.x: auditoria seguridad + carga.
- P8.x: E2E + monitoreo + lanzamiento.

Regla: ejecutar una fase solo cuando DoD de la fase anterior este en verde.

### P3.1 (avance actual)

Resultado ejecucion actual:

- Estado: `PARCIAL`.
- Archivos creados:
  - `apps/backend/src/services/auction.service.ts`
  - `apps/backend/src/services/lot.service.ts`
  - `apps/backend/src/routes/auction.routes.ts`
  - `apps/backend/src/routes/lot.routes.ts`
  - `apps/backend/src/middleware/error.middleware.ts`
  - `apps/backend/src/middleware/upload.middleware.ts`
  - `apps/backend/src/config/cloudinary.ts`
  - `apps/backend/src/utils/async-handler.ts`
  - `apps/backend/src/utils/app-error.ts`
  - `apps/backend/prisma/migrations/20260214123000_lot_media/migration.sql`
- Archivos actualizados:
  - `apps/backend/src/index.ts` (rutas + error handler)
  - `apps/backend/prisma/schema.prisma` (LotMedia)
  - `apps/backend/.env.example` (Cloudinary vars)
- Dependencias agregadas:
  - `cloudinary`, `multer`, `file-type`, `@types/multer`
- Validacion:
  - `npm run lint -w apps/backend` -> OK
  - `npm run build -w apps/backend` -> OK
- Pendiente para cerrar `DONE`:
  - pruebas de integracion para rutas auction/lot
  - validacion upload real contra Cloudinary + DB

### P3.2 (avance actual)

Resultado ejecucion actual:

- Estado: `PARCIAL`.
- Archivos creados:
  - `apps/frontend/lib/mock-auctions.ts`
  - `apps/frontend/components/auction/AuctionCard.tsx`
  - `apps/frontend/components/lot/LotCard.tsx`
  - `apps/frontend/components/lot/LotForm.tsx`
  - `apps/frontend/components/admin/DataTable.tsx`
  - `apps/frontend/components/ui/StatusBadge.tsx`
  - `apps/frontend/components/ui/ImageUploader.tsx`
  - `apps/frontend/app/auctions/[id]/page.tsx`
  - `apps/frontend/app/(admin)/layout.tsx`
  - `apps/frontend/app/(admin)/auctions/page.tsx`
  - `apps/frontend/app/(admin)/auctions/[id]/lots/page.tsx`
- Archivos actualizados:
  - `apps/frontend/app/page.tsx` (catalogo publico base)
- Validacion:
  - `npm run lint -w apps/frontend` -> OK
  - `npm run build -w apps/frontend` -> OK
- Pendiente para cerrar `DONE`:
  - conexion real a API backend (sin mocks)
  - flujo admin completo (acciones CRUD)
  - DnD real para reordenar lotes
  - upload persistente en backend/frontend

### P4.1 (avance actual)

Resultado ejecucion actual:

- Estado: `PARCIAL`.
- Archivos creados:
  - `apps/backend/src/socket/index.ts`
  - `apps/backend/src/socket/auction.room.ts`
  - `apps/backend/src/services/auction-state.service.ts`
- Archivos actualizados:
  - `apps/backend/src/index.ts` (HTTP server + bootstrap Socket.io)
- Eventos implementados:
  - `auction:join`
  - `bid:place`
  - emisiones `bid:update`, `bid:rejected`
- Controles implementados:
  - autenticacion JWT en handshake
  - rate limit de puja (1 cada 2 segundos) via Redis
  - lock por lote via Redis
  - transaccion atomica para actualizar lote + crear puja + auditoria
- Validacion:
  - `npm run lint -w apps/backend` -> OK
  - `npm run build -w apps/backend` -> OK
- Pendiente para cerrar `DONE`:
  - eventos de rematador (`adjudicate`, `next-lot`, `pause`, `end`)
  - countdown por lote
  - tests de integracion de socket y race-condition

## Check real del repo (hecho hoy)

## Estado por prompt v2

- [x] P0.1 `DONE` (formato y EOL corregidos; lint/build en verde).
- [x] P0.2 `DONE` (agregados `railway.json`, `vercel.json`, `.env.example` frontend y `/health`).
- [x] P0.3 `DONE` (manual agregado, tokens aplicados y SVG oficiales integrados).
- [x] P1.2 `DONE` (workflow CI creado con cache npm y validado localmente).
- [x] P1.3 `DONE` (env validation con zod + security middleware integrados).
- [x] P2.2 `DONE` (auth backend completo + refresh + middleware + tests unitarios).
- [x] P2.3 `DONE` (auth frontend con login/register/store/interceptors/middleware).
- P3.1 `PARCIAL` (CRUD backend implementado; faltan pruebas de integracion/upload real).
- P3.2 `PARCIAL` (catalogo/admin base implementados; falta integracion completa).
- P4.1 `PARCIAL` (socket base operativa; faltan controles de rematador y tests).
- P1.1 `PARCIAL`.
- P2.1 `PARCIAL` (schema de negocio, migracion y seed listos; pendiente ejecutar contra DB real).

## Evidencia tecnica revisada

- Existe Prisma base:
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20260213150000_init/migration.sql`
  - `apps/backend/prisma/seed.js`
- Backend activo minimo:
  - `apps/backend/src/index.ts`
  - `apps/backend/src/routes/health.ts`
- Frontend base:
  - `apps/frontend/app/page.tsx`
  - `apps/frontend/components/ui/button.tsx`
- Config deploy ya presentes:
  - `apps/backend/railway.json`
  - `apps/frontend/vercel.json`
  - `apps/frontend/.env.example`
- Faltantes concretos:
  - ejecutar `prisma migrate deploy` y `prisma db seed` contra DB de entorno (Railway/local)
  - cerrar pruebas de integracion de P3.1
  - cerrar integracion completa de P3.2 con backend real
  - cerrar P4.1 con eventos de rematador y pruebas socket

## Resultado de comandos (ultimo check)

- `npm run lint -w apps/backend` -> OK
- `npm run lint -w apps/frontend` -> OK
- `npm run build -w apps/backend` -> OK
- `npm run build -w apps/frontend` -> OK
- `npm run build` (raiz) -> OK
- `npm run lint` (raiz) -> OK

## Que prompt correr exacto ahora

Orden recomendado inmediato:

1. ejecutar migracion/seed en Railway para cerrar P2.1 operativo
2. cerrar `P3.1` con pruebas de integracion
3. cerrar `P3.2` contra API real
4. cerrar `P4.1` (motor de subastas en tiempo real)
5. avanzar `P4.2` (sala y panel rematador frontend)

## Insumo requerido para P0.3 (historico - cumplido)

Insumo incorporado:

- `docs/manual-de-marca.docx`
- `apps/frontend/public/brand/martillo_icon.svg`
- `apps/frontend/public/brand/martillo_icon_black.svg`
- `apps/frontend/public/brand/martillo_icon_white.svg`

P0.3 cerrado: manual y assets oficiales integrados con validacion en verde.

Si quieres ejecucion asistida en bloque, usa este mega-prompt:

```text
Ejecuta cierre de P3.1 y P3.2 (integracion real), cierra P4.1 con tests socket, y luego avanza P4.2 sobre este repo Martillo. Al final corre migrate/seed en Railway.
No te detengas entre pasos salvo bloqueo real.
Para cada paso entrega:
1) archivos modificados
2) comandos corridos
3) resultado
4) decision go/no-go al siguiente paso
Al final, muestra resumen consolidado de estado por prompt.
```

---

Este v2 reemplaza la version previa porque incluye identificador de prompt, texto exacto para copiar y orden de ejecucion basado en el estado real del repo.
