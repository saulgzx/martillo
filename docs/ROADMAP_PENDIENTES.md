# Martillo â€” Roadmap de ImplementaciÃ³n Pendiente

> Generado: 2026-02-13 | Progreso actual: ~50% del MVP
> Basado en anÃ¡lisis exhaustivo del cÃ³digo vs guÃ­a de 18 prompts

> ?ltima actualizaci?n: 2026-02-14 - Hotfix deploy Railway (`apps/backend/railway.json`: `buildCommand` -> `npm run build`)
> 2026-02-14 (hotfix runtime): backend arranca con logs de boot, `/health` expuesto antes de middleware y manejo defensivo de errores de arranque/socket en `apps/backend/src/index.ts`.



## Bitacora de ejecucion automatica

- 2026-02-14 (iteracion actual):
  - Fase 2.1 backend postores/documentos/blacklist implementada (servicios + rutas + wiring en `index.ts`).
  - Fase 2.2 frontend postores implementada en base funcional:
    - `/auctions/[id]/register` (flujo 3 pasos)
    - `/auctions/[id]/bidders` (admin verificacion con drawer y acciones)
    - `/profile` (vista base)
  - Seguridad PII reforzada:
    - cifrado de `rut` en registro auth
    - `rutMasked` en respuestas de auth y listados de postores
  - Estado fase: Fase 2 = PARCIAL AVANZADA
  - Fase 3.1 backend pagos implementada en base funcional (rutas + service + recibo PDF + webhook firmado base).
  - Fase 3.2 email base implementada (Resend + templates + integraciones en register/approve/reject/pago).
  - Fase 3.3 frontend pagos implementada en base funcional (`/payments/[id]`, `/payments/return`, `/my-adjudications`, admin placeholder).
  - Estado fase: Fase 3 = PARCIAL AVANZADA
  - Fase 4 inicial: logger seguro (winston) y headers de seguridad frontend en `next.config.js`.
  - Hotfix login:
    - Backend auth controllers con manejo explicito de errores (sin fallas silenciosas).
    - Fallback de store de refresh token en memoria si Redis no responde (login no se cae).
    - Frontend login muestra mensaje de error real devuelto por API.
    - CORS backend robustecido para dominios exactos y wildcard (`https://*.vercel.app`) con log de origen bloqueado.
  - Esqueleto QA/Security (S7-S8) agregado en backend:
    - `apps/backend/scripts/load-test-auction.js`
    - `apps/backend/scripts/reconnect-test-auction.js`
    - `apps/backend/scripts/smoke-test.js`
    - scripts npm: `qa:load-test`, `qa:reconnect-test`, `qa:smoke-test`, `qa:e2e-check`
  - Frontend S7:
    - Error boundary global agregado (`apps/frontend/app/error.tsx`, `apps/frontend/app/global-error.tsx`).
    - Revisión de XSS: no se detectó `dangerouslySetInnerHTML` en el código actual.
  - Frontend S8 (esqueleto E2E):
    - Playwright base configurado (`apps/frontend/playwright.config.ts`).
    - Specs base creadas: `auth.spec.ts`, `catalog.spec.ts`, `bidder-flow.spec.ts`, `auction.spec.ts`.
  - Backend S8:
    - `/health` mejorado con estado `ok/degraded/error`, chequeo DB/Redis, version y uptime.
  - Seed de pruebas actualizado:
    - Nuevas cuentas persistentes de prueba (ADMIN/BIDDER) agregadas en `apps/backend/prisma/seed.js`.
  - Hotfix auth frontend por rol:
    - redirección post-login/post-register según rol
    - cookie `martillo_role` para middleware
    - bloqueo de `/admin` para roles no administrativos
  - Seguridad backend:
    - rate limits específicos aplicados por ruta:
      - `POST /api/auth/login` -> 5/15m
      - `POST /api/auth/register` -> 3/h
      - `POST /api/lots/:lotId/media` -> 20/h por usuario
    - `console.log` en runtime backend (`src/`) reemplazado por logger.
    - `error.middleware.ts` reforzado con logging seguro centralizado.
  - Backend S8:
    - Swagger base integrado (`/api/docs`) solo en no-producción.
    - Documentación OpenAPI agregada para login, auctions public, bidder register, payment webhook y eventos socket.
  - Auditoría de dependencias ejecutada:
    - `npm audit --audit-level=moderate` realizado.
    - Pendientes documentados en `docs/SECURITY_REPORT_2026-02-14.md` (requieren upgrades mayores de Next/ESLint config).

---

## Estado por Semana

| Semana | Tema | Estado | Completado |
|--------|------|--------|------------|
| S1 | Setup Base + CI/CD + Seguridad | COMPLETO | 100% |
| S2 | Base de Datos + Auth | âœ… Completo | 95% |
| S3 | CRUD Remates + CatÃ¡logo | âš ï¸ Parcial | 75% |
| S4 | Subastas en Tiempo Real | PARCIAL | 65% |
| S5 | Registro de Postores | âŒ Pendiente | 0% |
| S6 | Pagos + Email | âŒ Pendiente | 0% |
| S7 | AuditorÃ­a + QA | âŒ Pendiente | 0% |
| S8 | Testing E2E + Deploy | âŒ Pendiente | 0% |

---

## FASE 1 â€” Completar lo parcial (S1, S3, S4)

Estado Fase 1: DONE (validado en este ciclo)

### 1.1 Completar CI/CD (Prompt 1.2)

**Archivos a crear/modificar:**
- `.github/workflows/ci.yml` â€” agregar jobs faltantes
- `.github/workflows/pr-check.yml` â€” nuevo

**Tareas:**
- [x] Agregar job `test` al CI (Jest en backend, aunque estÃ© vacÃ­o el runner debe existir)
- [x] Agregar job `security` con `npm audit --audit-level=high`
- [x] Agregar job `deploy` condicional (solo en push a `main`, depende de los anteriores):
  - Deploy frontend con `vercel-action` usando secrets
  - Deploy backend con `railway-action` usando secrets
- [x] Crear `.github/workflows/pr-check.yml`:
  - Trigger: pull_request a `develop` o `main`
  - Jobs: lint-and-types + test
- [x] Documentar secrets requeridos en GitHub:
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
  - `RAILWAY_TOKEN`

---

### 1.2 Completar Seguridad Base (Prompt 1.3)

**Archivos a crear:**
- `apps/backend/scripts/generate-keys.ts`
- `apps/backend/src/utils/encryption.ts`

**Tareas:**
- [x] Crear script `generate-keys.ts` que genere par RSA 2048 bits con `crypto` nativo
- [x] Crear `utils/encryption.ts` con `encryptPII()` y `decryptPII()` usando AES-256-GCM
- [x] Agregar a `.env.example` del backend las variables faltantes:
  - `RESEND_API_KEY`
  - `FLOW_API_KEY`, `FLOW_SECRET_KEY`
  - `ENCRYPTION_KEY` (32 bytes hex)
- [x] Aplicar encriptaciÃ³n al campo `rut` de User al guardar/leer en los controllers existentes
- [x] Enmascarar RUT en respuestas al cliente (mostrar solo Ãºltimos 4 dÃ­gitos)

---

### 1.3 Conectar Frontend a API Real (Prompt 3.2 â€” pendiente)

**Archivos a modificar:**
- `apps/frontend/app/page.tsx` â€” reemplazar mock por fetch a API
- `apps/frontend/app/auctions/[id]/page.tsx` â€” fetch real
- `apps/frontend/app/(admin)/auctions/page.tsx` â€” conectar a API
- `apps/frontend/app/(admin)/auctions/[id]/lots/page.tsx` â€” conectar a API

**Tareas:**
- [x] Reemplazar `mockAuctions` en home por fetch a `GET /api/auctions/public`
- [x] Implementar `generateStaticParams` con ISR (revalidate 60s) en `/auctions/[id]`
- [x] Conectar tabla admin de remates a `GET /api/auctions` con paginaciÃ³n
- [x] Conectar formulario "Nuevo Remate" a `POST /api/auctions`
- [x] Conectar gestiÃ³n de lotes a endpoints reales (CRUD + media upload)
- [x] Instalar `@dnd-kit/core` y `@dnd-kit/sortable` para reordenar lotes
- [x] Implementar drag & drop en la vista de lotes admin

---

### 1.4 Completar Motor de Subastas â€” Backend (Prompt 4.1 â€” pendiente)

**Archivos a modificar:**
- `apps/backend/src/socket/auction.room.ts` â€” agregar eventos del rematador

**Tareas:**
- [x] Implementar evento `auction:auctioneer:adjudicate`:
  - Solo rol AUCTIONEER
  - Crear registro Adjudication en DB
  - Cambiar status del lote a ADJUDICATED
  - Emitir `lot:adjudicated` a toda la sala
- [x] Implementar evento `auction:auctioneer:next-lot`:
  - Solo AUCTIONEER
  - Cambiar lote activo en Redis con `setActiveLot()`
  - Cambiar status del nuevo lote a ACTIVE
  - Emitir `lot:active` con datos del nuevo lote
- [x] Implementar evento `auction:auctioneer:pause`:
  - Solo AUCTIONEER
  - Emitir `auction:paused` con motivo
- [x] Implementar evento `auction:auctioneer:end`:
  - Solo AUCTIONEER
  - Cambiar status del remate a FINISHED
  - Marcar lotes restantes como UNSOLD
  - Emitir `auction:ended`
- [x] Implementar `auction:countdown` â€” broadcast cada segundo del timer por lote
- [x] Crear tests de integraciÃ³n Socket.io:
  - Test conexiÃ³n con token invÃ¡lido â†’ rechazo
  - Test puja vÃ¡lida â†’ actualiza currentPrice
  - Test race condition: 2 pujas simultÃ¡neas â†’ solo 1 gana
  - Test rate limiting: 3 pujas en 1 segundo â†’ 2da y 3ra rechazadas

---

### 1.5 Sala de Subasta + Panel Rematador â€” Frontend (Prompt 4.2)

**Archivos a crear:**
- `apps/frontend/hooks/useAuctionSocket.ts`
- `apps/frontend/app/(auction)/auctions/[id]/live/page.tsx`
- `apps/frontend/app/(admin)/auctions/[id]/control/page.tsx`
- `apps/frontend/components/auction/BidHistory.tsx`
- `apps/frontend/components/auction/CountdownTimer.tsx`
- `apps/frontend/components/auction/PriceDisplay.tsx`
- `apps/frontend/components/auction/ConnectionStatus.tsx`
- `apps/frontend/components/auction/BidConfirmModal.tsx`
- `apps/frontend/components/auctioneer/ControlPanel.tsx`
- `apps/frontend/components/auctioneer/LotQueue.tsx`

**Dependencias a instalar:**
```bash
npm install socket.io-client framer-motion -w apps/frontend
```

**Tareas:**
- [x] Crear hook `useAuctionSocket`:
  - Conectar a namespace `/auction` con accessToken
  - Manejo de reconexiÃ³n automÃ¡tica
  - Estado: `{ connected, error, reconnecting }`
  - Exponer: `{ socket, connected, joinAuction, placeBid, auctioneerControls }`
- [x] Crear pÃ¡gina sala de subasta (postor) `/auctions/[id]/live`:
  - Imagen del lote activo (grande)
  - Precio actual con animaciÃ³n de pulso (framer-motion)
  - Countdown (rojo en Ãºltimos 10 segundos)
  - BotÃ³n PUJAR verde con confirmaciÃ³n modal
  - Historial Ãºltimas 10 pujas (paddleNumber enmascarado)
  - Lista prÃ³ximos lotes
  - Indicador conexiÃ³n (punto verde/amarillo/rojo)
  - Mobile-first layout
- [x] Crear panel del rematador `/auctions/[id]/control`:
  - Solo accesible con rol AUCTIONEER
  - Lote activo con imagen + precio grande
  - Historial pujas en tiempo real (badge ONLINE/PRESENCIAL)
  - Input numÃ©rico para puja presencial + botÃ³n REGISTRAR
  - Cola de prÃ³ximos lotes
  - Botones grandes: ADJUDICAR (verde), SIGUIENTE (azul), PAUSAR (Ã¡mbar), FINALIZAR (rojo)
  - Contador de postores conectados
- [x] Crear componentes reutilizables listados arriba

---

## FASE 2 â€” Postores (S5)

### 2.1 Backend Registro y VerificaciÃ³n de Postores (Prompt 5.1)

**Modelos a agregar al schema Prisma:**
```prisma
model BidderDocument {
  id           String   @id @default(cuid())
  bidderId     String
  type         DocumentType
  cloudinaryId String
  uploadedAt   DateTime @default(now())
  bidder       Bidder   @relation(fields: [bidderId], references: [id])
}

model BlackList {
  id        String   @id @default(cuid())
  userId    String
  reason    String
  bannedBy  String
  bannedAt  DateTime @default(now())
  auctionId String?
  user      User     @relation(fields: [userId], references: [id])
}

enum DocumentType { IDENTITY ADDRESS }
```

**Archivos a crear:**
- `apps/backend/src/services/bidder.service.ts`
- `apps/backend/src/services/document.service.ts`
- `apps/backend/src/services/blacklist.service.ts`
- `apps/backend/src/services/notification.service.ts` (mock)
- `apps/backend/src/routes/bidder.routes.ts`

**Tareas:**
- [ ] Agregar modelos `BidderDocument`, `BlackList`, `Consignor`, `LotConsignor`, `Notification` al schema
- [ ] Ejecutar migraciÃ³n: `npx prisma migrate dev --name add-bidder-documents-blacklist`
- [ ] Implementar `bidder.service.ts`:
  - `applyToBid(userId, auctionId)` â€” crear Bidder PENDING, asignar paddleNumber
  - `approveBidder(bidderId, adminId)` â€” APPROVED + AuditLog
  - `rejectBidder(bidderId, adminId, reason)` â€” REJECTED
  - `banBidder(userId, reason, bannedBy)` â€” BANNED + BlackList
  - `getBiddersByAuction(auctionId, filters, pagination)`
  - `getMyBidderStatus(userId, auctionId)`
- [ ] Implementar `document.service.ts`:
  - Upload a Cloudinary en carpeta privada
  - Signed URLs con TTL 1 hora
- [ ] Implementar `blacklist.service.ts`:
  - `isBlacklisted(userId)`, `addToBlacklist()`, `removeFromBlacklist()`
- [ ] Crear `notification.service.ts` mock (solo console.log por ahora)
- [ ] Crear routes:
  ```
  POST   /api/auctions/:id/register    â€” Postor aplica
  GET    /api/auctions/:id/my-status   â€” Estado del postor
  GET    /api/bidders                  â€” Lista (ADMIN)
  GET    /api/auctions/:id/bidders     â€” Postores de un remate (ADMIN)
  POST   /api/bidders/:id/approve      â€” Aprobar (ADMIN)
  POST   /api/bidders/:id/reject       â€” Rechazar (ADMIN)
  POST   /api/bidders/:id/ban          â€” Banear (ADMIN)
  POST   /api/users/:id/documents      â€” Subir docs (propio usuario)
  GET    /api/users/:id/documents      â€” Ver docs (usuario o ADMIN)
  ```

---

### 2.2 Frontend Flujo de Postores (Prompt 5.2)

**Archivos a crear:**
- `apps/frontend/app/(auction)/auctions/[id]/register/page.tsx`
- `apps/frontend/app/(auth)/profile/page.tsx`
- `apps/frontend/app/(admin)/auctions/[id]/bidders/page.tsx`
- `apps/frontend/components/bidder/ApplicationStepper.tsx`
- `apps/frontend/components/bidder/DocumentUploader.tsx`
- `apps/frontend/components/bidder/BidderStatusBanner.tsx`
- `apps/frontend/components/admin/BidderDetailDrawer.tsx`
- `apps/frontend/components/admin/DocumentViewer.tsx`

**Tareas:**
- [ ] Crear flujo de aplicaciÃ³n 3 pasos:
  - Paso 1: Confirmar datos personales + aceptar tÃ©rminos
  - Paso 2: Upload cÃ©dula + comprobante domicilio
  - Paso 3: ConfirmaciÃ³n + estado "Pendiente de revisiÃ³n"
- [ ] Crear componente `BidderStatusBanner` para mostrar en pÃ¡gina del remate:
  - Sin aplicar â†’ botÃ³n "Participar"
  - PENDING â†’ banner Ã¡mbar
  - APPROVED â†’ banner verde con paleta #XX
  - REJECTED â†’ banner rojo con motivo
  - BANNED â†’ banner gris
- [ ] Crear admin verificaciÃ³n de postores:
  - Tabla con filtros por estado
  - Drawer lateral con datos + visor de documentos (URL firmada)
  - Botones: Aprobar / Rechazar (con motivo) / Banear
- [ ] Crear perfil de usuario:
  - Editar nombre, telÃ©fono
  - Historial de remates
  - Cambiar contraseÃ±a

---

## FASE 3 â€” Pagos y Notificaciones (S6)

### 3.1 Sistema de Pagos (Prompt 6.1)

**Dependencias backend:**
```bash
npm install pdfkit bull -w apps/backend
```

**Archivos a crear:**
- `apps/backend/src/services/payment.service.ts`
- `apps/backend/src/integrations/flow.integration.ts`
- `apps/backend/src/routes/payment.routes.ts`

**Tareas:**
- [ ] Implementar `payment.service.ts`:
  - `createPaymentOrder(adjudicationId)` â€” calcular comisiÃ³n + IVA + crear orden Flow
  - `handleFlowWebhook(payload, signature)` â€” validar firma, actualizar Payment
  - `retryPayment(paymentId, userId)`
  - `getPaymentStatus(paymentId, userId)`
  - `generateReceipt(paymentId)` â€” PDF con pdfkit
- [ ] Implementar `flow.integration.ts`:
  - `createPayment()` â€” API de Flow
  - `getPaymentStatus()` â€” consultar estado
  - Sandbox en development, producciÃ³n en NODE_ENV=production
- [ ] Crear routes:
  ```
  POST   /api/payments/flow/webhook     â€” SIN auth JWT, valida firma Flow
  GET    /api/payments/:id              â€” Estado del pago
  POST   /api/payments/:id/retry        â€” Reintentar
  GET    /api/payments/:id/receipt      â€” PDF comprobante
  GET    /api/adjudications/my          â€” Mis adjudicaciones
  ```
- [ ] Integrar creaciÃ³n automÃ¡tica de orden de pago en `auction:auctioneer:adjudicate`
- [ ] Configurar Bull Queue para vencimiento de pagos (recordatorio 24h, overdue 48h)

---

### 3.2 Notificaciones Email (Prompt 6.2)

**Dependencia:**
```bash
npm install resend -w apps/backend
```

**Archivos a crear:**
- `apps/backend/src/services/email.service.ts`
- `apps/backend/src/templates/welcome.html`
- `apps/backend/src/templates/bidder-approved.html`
- `apps/backend/src/templates/bidder-rejected.html`
- `apps/backend/src/templates/outbid.html`
- `apps/backend/src/templates/auction-reminder.html`
- `apps/backend/src/templates/adjudication-won.html`
- `apps/backend/src/templates/payment-confirmed.html`
- `apps/backend/src/templates/payment-overdue.html`

**Tareas:**
- [ ] Reemplazar mock de NotificationService con Resend real
- [ ] Crear 8 plantillas HTML responsive con branding Martillo
- [ ] Crear mÃ©todos tipados: `sendWelcome()`, `sendBidderApproved()`, etc.
- [ ] Integrar en eventos:
  - Registro â†’ `sendWelcome`
  - Aprobar postor â†’ `sendBidderApproved`
  - Rechazar â†’ `sendBidderRejected`
  - Superado en puja â†’ `sendOutbid`
  - Adjudicar â†’ `sendAdjudicationWon`
  - Pago confirmado â†’ `sendPaymentConfirmed`
  - Pago vencido â†’ `sendPaymentOverdue`
- [ ] Rate limiting emails outbid: mÃ¡ximo 1 cada 5 minutos por usuario (Redis)

---

### 3.3 Frontend Pagos (Prompt 6.3)

**Archivos a crear:**
- `apps/frontend/app/(auth)/payments/[id]/page.tsx`
- `apps/frontend/app/(auth)/payments/return/page.tsx`
- `apps/frontend/app/(auth)/my-adjudications/page.tsx`
- `apps/frontend/app/(admin)/payments/page.tsx`

**Tareas:**
- [ ] PÃ¡gina de pago: desglose (adjudicaciÃ³n + comisiÃ³n + IVA = total), countdown, botÃ³n Flow
- [ ] PÃ¡gina retorno Flow: consultar estado real al backend, animaciÃ³n Ã©xito/error
- [ ] Mis adjudicaciones: lista de lotes ganados, estado pago, descargar comprobante
- [ ] Widget toast en sala cuando el usuario gana un lote
- [ ] Admin pagos: tabla con filtros, totales, botÃ³n "marcar pagado manualmente"
- [ ] Formateo moneda: `Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })`

---

## FASE 4 â€” Seguridad y QA (S7)

### 4.1 AuditorÃ­a de Seguridad Backend (Prompt 7.1)

**Dependencia:**
```bash
npm install winston -w apps/backend
```

**Archivos a crear:**
- `apps/backend/src/utils/logger.ts`

**Tareas:**
- [ ] Revisar TODOS los endpoints: Â¿tienen authenticate/authorize correcto?
- [ ] Verificar ownership en endpoints (postor no puede ver datos de otro)
- [ ] Buscar `$queryRaw` o `$executeRaw` sin parÃ¡metros seguros
- [x] Error handler: no exponer stack traces en producciÃ³n
- [ ] Mensajes de auth genÃ©ricos ("Credenciales invÃ¡lidas", no "Email no existe")
- [ ] Crear `logger.ts` con winston:
  - Production: solo warn/error, sin datos de usuario
  - Development: logs completos
- [x] Reemplazar todos los `console.log` por el logger (runtime `src/`)
- [x] Verificar rate limits especÃ­ficos:
  - `POST /api/auth/login` â†’ 5/15min por IP âœ… ya existe
  - `POST /api/auth/register` â†’ 3/hora por IP âœ… implementado
  - `POST /api/lots/:id/media` â†’ 20/hora por usuario âœ… implementado
- [ ] Verificar headers HTTP: helmet con HSTS, CSP, X-Frame-Options
- [x] Ejecutar `npm audit --audit-level=moderate` y corregir (pendientes mayores documentados)
- [x] Generar reporte de seguridad

---

### 4.2 AuditorÃ­a Frontend + Pruebas de Carga (Prompt 7.2)

**Dependencia:**
```bash
npm install dompurify @types/dompurify -w apps/frontend
```

**Archivos a crear:**
- `apps/backend/scripts/load-test-auction.ts`

**Tareas:**
- [x] Buscar y sanitizar cualquier `dangerouslySetInnerHTML` con DOMPurify (no aplica por ahora: no hay usos en frontend)
- [x] Verificar que accessToken NO estÃ© en localStorage/sessionStorage
- [x] Crear error boundary global para React
- [x] Agregar headers de seguridad en `next.config.js`:
  ```js
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
  ]
  ```
- [x] Crear script de prueba de carga (esqueleto):
  - 50 postores simultÃ¡neos en una sala
  - Cada uno puja cada 3 segundos
  - Medir: latencia promedio, mensajes perdidos, race conditions
  - DuraciÃ³n: 5 minutos
- [x] Script de prueba de reconexiÃ³n (esqueleto):
  - Conectar â†’ 3 pujas â†’ disconnect â†’ 10s â†’ reconectar â†’ verificar estado
- [x] Crear checklist automatizada base ejecutable con `npm run qa:e2e-check` (esqueleto)
- [ ] Actualizar CONTEXT.md con resultados de auditorÃ­a

---

## FASE 5 â€” Testing E2E y Monitoreo (S8)

### 5.1 Testing E2E + Monitoreo (Prompt 8.1)

**Dependencias:**
```bash
npx playwright install # en frontend
npm install @sentry/nextjs -w apps/frontend
npm install @sentry/node -w apps/backend
npm install swagger-ui-express swagger-jsdoc -w apps/backend
```

**Archivos a crear:**
- `apps/frontend/e2e/auth.spec.ts`
- `apps/frontend/e2e/catalog.spec.ts`
- `apps/frontend/e2e/bidder-flow.spec.ts`
- `apps/frontend/e2e/auction.spec.ts`

**Tareas:**
- [x] Configurar Playwright en frontend (esqueleto base)
- [ ] Tests E2E:
  - auth: registro, login correcto, login incorrecto, refresh automÃ¡tico
  - catalog: carga sin login, lotes visibles, redirect si no registrado
  - bidder: flujo de aplicaciÃ³n, estado de aprobaciÃ³n
  - auction: sala carga, puja funciona, precio se actualiza
- [ ] Configurar Sentry:
  - Frontend: `@sentry/nextjs` con DSN desde env
  - Backend: `@sentry/node` en error handler
  - `beforeSend`: filtrar PII (emails, RUT, tokens)
- [x] Mejorar `GET /health`:
  ```json
  {
    "status": "ok | degraded | error",
    "version": "0.1.0",
    "db": "connected | error",
    "redis": "connected | error",
    "uptime": 12345,
    "timestamp": "2026-..."
  }
  ```
- [x] DocumentaciÃ³n API con Swagger (solo dev/staging, no production):
  - `POST /api/auth/login`
  - `POST /api/auctions/:id/register`
  - `POST /api/payments/flow/webhook`
  - `GET /api/auctions/public`
  - Documentar eventos Socket.io

---

### 5.2 Deploy ProducciÃ³n (Prompt 8.2)

**Archivos a crear:**
- `apps/backend/scripts/smoke-test.ts`

**Tareas:**
- [ ] Verificar TODAS las env vars en Railway producciÃ³n
- [ ] Verificar TODAS las env vars en Vercel producciÃ³n
- [ ] Merge develop â†’ main, verificar pipeline verde
- [x] Crear script smoke-test (esqueleto):
  - `GET /health` â†’ status ok, db connected, redis connected
  - `POST /api/auth/login` â†’ 401 con credenciales invÃ¡lidas
  - `GET /api/auctions/public` â†’ retorna array
  - ConexiÃ³n WebSocket â†’ conecta y desconecta limpio
- [ ] Configurar dominio personalizado (Vercel + Railway)
- [ ] Actualizar ALLOWED_ORIGINS con dominio de producciÃ³n
- [ ] Seed de producciÃ³n: SUPERADMIN desde env vars (no hardcoded)
- [ ] Actualizar CONTEXT.md con estado final: PRODUCCIÃ“N v1.0
- [ ] Configurar UptimeRobot para monitorear `/health` cada 5 minutos

---

## FASE BONUS â€” Post-MVP

### B.1 Dashboard Admin con EstadÃ­sticas

- [ ] `analytics.service.ts`: stats por remate, ingresos por perÃ­odo, bidder stats
- [ ] Dashboard con recharts: KPIs, grÃ¡fico de ingresos, donut adjudicaciÃ³n
- [ ] ExportaciÃ³n Excel (exceljs) y PDF (jspdf) de reportes por remate

### B.2 Puja AutomÃ¡tica (Proxy Bidding)

- [ ] Modelo `AutoBid` en schema Prisma
- [ ] `autobid.service.ts`: set, cancel, processAutoBids
- [ ] Integrar en flujo de pujas (post bid:place)
- [ ] UI: modal "Configurar puja automÃ¡tica" en sala de subasta
- [ ] Indicador en panel del rematador cuando puja es automÃ¡tica

---

## Orden de EjecuciÃ³n Recomendado

```
FASE 1 (2-3 semanas)
  1.4 Motor subastas backend (eventos rematador)
  1.5 Sala de subasta + panel rematador frontend
  1.3 Conectar frontend a API real
  1.1 Completar CI/CD
  1.2 Completar seguridad base

FASE 2 (1-2 semanas)
  2.1 Backend postores
  2.2 Frontend postores

FASE 3 (1-2 semanas)
  3.1 Pagos backend
  3.2 Emails
  3.3 Frontend pagos

FASE 4 (1 semana)
  4.1 AuditorÃ­a backend
  4.2 AuditorÃ­a frontend + load test

FASE 5 (1 semana)
  5.1 E2E + monitoreo
  5.2 Deploy producciÃ³n

BONUS (post-lanzamiento)
  B.1 Dashboard analytics
  B.2 Proxy bidding
```

---

## Modelos Prisma Faltantes (agregar en una sola migraciÃ³n)

```prisma
model Consignor {
  id           String   @id @default(cuid())
  userId       String
  businessName String
  bankAccount  String   // encriptado con AES-256-GCM
  contactEmail String
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
  lots         LotConsignor[]
}

model LotConsignor {
  id                String            @id @default(cuid())
  lotId             String
  consignorId       String
  agreedPrice       Decimal
  liquidationStatus LiquidationStatus @default(PENDING)
  lot               Lot               @relation(fields: [lotId], references: [id])
  consignor         Consignor         @relation(fields: [consignorId], references: [id])
}

model BidderDocument {
  id           String       @id @default(cuid())
  bidderId     String
  type         DocumentType
  cloudinaryId String
  uploadedAt   DateTime     @default(now())
  bidder       Bidder       @relation(fields: [bidderId], references: [id])
}

model BlackList {
  id        String   @id @default(cuid())
  userId    String
  reason    String
  bannedBy  String
  bannedAt  DateTime @default(now())
  auctionId String?
  user      User     @relation(fields: [userId], references: [id])
  bannedByUser User  @relation("BannedByUser", fields: [bannedBy], references: [id])
}

model Notification {
  id      String    @id @default(cuid())
  userId  String
  type    String
  payload Json
  sentAt  DateTime  @default(now())
  readAt  DateTime?
  user    User      @relation(fields: [userId], references: [id])
}

model AutoBid {
  id        String   @id @default(cuid())
  bidderId  String
  lotId     String
  maxAmount Decimal
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  bidder    Bidder   @relation(fields: [bidderId], references: [id])
  lot       Lot      @relation(fields: [lotId], references: [id])
  @@unique([bidderId, lotId])
}

enum DocumentType { IDENTITY ADDRESS }
enum LiquidationStatus { PENDING PAID }
```

---

## Dependencias Pendientes por Instalar

**Backend:**
```bash
npm install resend pdfkit bull winston swagger-ui-express swagger-jsdoc @sentry/node -w apps/backend
npm install @types/pdfkit -D -w apps/backend
```

**Frontend:**
```bash
npm install socket.io-client framer-motion @dnd-kit/core @dnd-kit/sortable dompurify @sentry/nextjs recharts -w apps/frontend
npm install @types/dompurify -D -w apps/frontend
npx playwright install
```


