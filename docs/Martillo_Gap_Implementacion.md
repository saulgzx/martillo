# Martillo - Gap de Implementacion y Correcciones Pendientes

Fecha de auditoria: 2026-02-14
Base de comparacion:

- Guia funcional: `c:\Users\Alexis\Downloads\Martillo\Martillo_Prompts_Desarrollo.md`
- Estado real del repo: rama local actual

## Resumen ejecutivo

Estado general: base tecnica y auth funcionales, con avances parciales en CRUD y socket.
Brecha principal: semanas 4.2 a 8.x casi completas pendientes.

## Estado por prompt

- [x] 1.1 Monorepo base
- [ ] 1.2 CI/CD completo (solo hay CI minimo, no deploy orchestration ni pr-check)
- [ ] 1.3 Seguridad base completa (falta script de llaves RS256 y variables completas)
- [ ] 2.1 Prisma completo (faltan entidades de negocio solicitadas)
- [x] 2.2 Auth backend (base funcional)
- [x] 2.3 Auth frontend (base funcional)
- [ ] 3.1 CRUD backend remates/lotes (parcial)
- [ ] 3.2 Catalogo/admin frontend (parcial, aun con mocks)
- [ ] 4.1 Motor realtime backend (parcial)
- [ ] 4.2 Sala postor + panel rematador frontend
- [ ] 5.1 Backend postores/documentos/blacklist/PII
- [ ] 5.2 Frontend onboarding/verificacion postores
- [ ] 6.1 Pagos Flow/Stripe + webhooks + colas
- [ ] 6.2 Emails transaccionales Resend
- [ ] 6.3 Frontend pagos y adjudicaciones
- [ ] 7.1 Auditoria seguridad backend
- [ ] 7.2 Auditoria seguridad frontend + carga
- [ ] 8.1 E2E + monitoreo + bugfixing
- [ ] 8.2 Deploy final + smoke + cierre de contexto
- [ ] B.1 Dashboard analytics/reportes
- [ ] B.2 Proxy bidding

## Faltantes y correcciones por prioridad

## P0 - Bloqueantes de arquitectura

- [ ] Corregir codificacion de textos (mojibake) en archivos de documentacion y contenidos UI donde aplique.
- [ ] Actualizar `CONTEXT.md` al estado real del proyecto (hoy esta desalineado).
- [ ] Endurecer `apps/frontend/vercel.json` para monorepo (root/build coherente con setup final en Vercel).
- [ ] Revisar `apps/backend/.env.example` y `apps/frontend/.env.example` para incluir todas las variables de la guia.

## P1 - CI/CD y base operativa

- [ ] Crear `.github/workflows/pr-check.yml`.
- [ ] Evolucionar `.github/workflows/ci.yml` a jobs en paralelo:
  - lint-and-types
  - test
  - security (`npm audit --audit-level=high`)
- [ ] Agregar job deploy condicionado a `main` (Vercel + Railway) con secrets.
- [ ] Documentar secrets requeridos en `README.md`.

## P2 - Backend de datos y seguridad

### Prisma / dominio

- [ ] Agregar modelos faltantes en `apps/backend/prisma/schema.prisma`:
  - `Notification`
  - `Consignor`
  - `LotConsignor`
  - `BlackList` (para semana 5)
  - `BidderDocument` (para semana 5)
  - `AutoBid` (bonus B.2)
- [ ] Revisar tipos/enums para alinear 1:1 con la guia (incluyendo `LotMedia.type` como enum).
- [ ] Migraciones nuevas + validacion de `prisma migrate deploy` en entorno real.

### Seguridad backend

- [ ] Crear `apps/backend/scripts/generate-keys.ts` (RSA 2048 PEM).
- [ ] Completar validacion en `apps/backend/src/config/env.ts` con variables de Cloudinary/Resend/Flow/encryption.
- [ ] Rate limits especificos pendientes:
  - register 3/h
  - upload media 20/h por usuario
- [ ] Introducir logger seguro (`winston`) y retirar logs sensibles.

## P3 - Funcionalidad de remates/lotes

### Backend

- [ ] Completar reglas de negocio en `apps/backend/src/services/auction.service.ts` y `apps/backend/src/services/lot.service.ts`:
  - ownership checks
  - restricciones por estado en cada accion
  - paginacion/sort estandar en todos los listados
- [ ] Integrar auditoria completa de acciones admin.
- [ ] Cobertura de pruebas de integracion para rutas de auctions/lots/upload.

### Frontend

- [ ] Remover dependencia de `apps/frontend/lib/mock-auctions.ts` en vistas productivas.
- [ ] Conectar paginas admin/catalogo a API real.
- [ ] Implementar reorder con DnD real en lotes.
- [ ] Implementar modal/drawer de detalle de lote en catalogo publico.

## P4 - Tiempo real (subastas)

### Backend (apps/backend/src/socket/\*)

- [ ] Implementar eventos de rematador:
  - `auction:auctioneer:adjudicate`
  - `auction:auctioneer:next-lot`
  - `auction:auctioneer:pause`
  - `auction:auctioneer:end`
- [ ] Emitir eventos pendientes:
  - `lot:active`
  - `auction:paused`
  - `auction:ended`
  - `auction:countdown`
- [ ] Agregar test de race condition real de socket.
- [ ] Agregar test de rate limit realtime.

### Frontend

- [ ] Crear `apps/frontend/src/hooks/useAuctionSocket.ts`.
- [ ] Crear sala live postor: `app/(auction)/auctions/[id]/live/page.tsx`.
- [ ] Crear panel de rematador: `app/(admin)/auctions/[id]/control/page.tsx`.
- [ ] Componentes realtime faltantes:
  - `BidHistory`
  - `CountdownTimer`
  - `PriceDisplay`
  - `ConnectionStatus`
  - `BidConfirmModal`
  - `ControlPanel`
  - `LotQueue`

## P5 - Registro/verificacion de postores

### Backend

- [ ] Crear servicios y rutas de postores/documentos/blacklist.
- [ ] Implementar signed URLs de Cloudinary para documentos sensibles.
- [ ] Implementar encriptacion AES-256-GCM para PII (`rut`, `bankAccount`) en `src/utils/encryption.ts`.

### Frontend

- [ ] Flujo de aplicacion por pasos (`register` de remate).
- [ ] Banner de estado de postulacion por remate.
- [ ] Panel admin de verificacion de postores con drawer de detalle.
- [ ] Perfil de usuario y cambio de contrasena.

## P6 - Pagos y notificaciones

### Backend pagos

- [ ] Crear `payment.service.ts`, `flow.integration.ts`, `payment.routes.ts`.
- [ ] Validacion de firma webhook Flow y validacion de montos contra DB.
- [ ] Integracion de generacion de orden al adjudicar en socket.
- [ ] Cola Bull para recordatorios 24h/48h y vencimientos.
- [ ] Generacion de comprobante PDF.

### Backend emails

- [ ] Implementar `email.service.ts` con Resend.
- [ ] Crear templates HTML transaccionales en `src/templates/`.
- [ ] Integrar envios por evento.
- [ ] Rate limit de emails outbid.

### Frontend pagos

- [ ] Pagina de pago por adjudicacion.
- [ ] Pagina return Flow con consulta server-side real.
- [ ] Vista `my-adjudications`.
- [ ] Widget de pago dentro de sala live.
- [ ] Panel admin de pagos.

## P7 - Seguridad y carga

### Backend

- [ ] Auditoria de rutas completa (authz/authn/zod/ownership).
- [ ] Revisar y fortalecer error handler para no filtrar detalles en produccion.
- [ ] Ejecutar `npm audit` y remediar.
- [ ] Reporte de seguridad versionado en docs.

### Frontend + carga

- [ ] Validar XSS y sanitizacion de HTML dinamico.
- [ ] Agregar headers CSP/seguridad en `next.config.js`.
- [ ] Script de carga `apps/backend/scripts/load-test-auction.ts`.
- [ ] Script de reconexion bajo perdida de conectividad.
- [ ] Script/checklist automatizada `e2e-check`.

## P8 - E2E, monitoreo y release

- [ ] Configurar Playwright y suite e2e base.
- [ ] Configurar Sentry frontend y backend (sin PII).
- [ ] Mejorar `/health` con estado db/redis/uptime/version/degraded.
- [ ] Crear scripts:
  - `apps/backend/scripts/verify-backup.ts`
  - `apps/backend/scripts/smoke-test.ts`
- [ ] Swagger/OpenAPI en endpoints criticos (`/api/docs` en dev/staging).
- [ ] Checklist de lanzamiento y actualizacion final de `CONTEXT.md`.

## Correcciones puntuales detectadas

- [ ] `apps/frontend` contiene rutas/admin en estado demo con datos mock; mover a datos reales para evitar falso verde.
- [ ] `apps/backend/prisma/seed.js` usa credenciales hardcodeadas de prueba; parametrizar para produccion.
- [ ] `apps/backend/src/config/env.ts` aun no valida todas las variables de negocio de semanas 5-8.
- [ ] `apps/backend/src/socket/auction.room.ts` no cubre todos los eventos y reglas pedidas en la guia.
- [ ] `apps/backend/src/routes` aun no incluye dominios de bidder/payment/notification/reports.

## Definicion de "MVP funcional real" (criterio de cierre)

Para considerar el roadmap de la guia cubierto:

- [ ] Backend: auth + auctions + lots + realtime + bidders + pagos + emails + seguridad auditada.
- [ ] Frontend: auth + catalogo real + admin real + sala live + flujo postor + pagos.
- [ ] Data: migraciones aplicables en Railway y seed sin hardcode de credenciales sensibles.
- [ ] Calidad: lint/build/test/e2e verdes.
- [ ] Operacion: health extendido, observabilidad (Sentry), smoke test y docs operativas.

## Comandos de control sugeridos

```bash
npm run lint -w apps/backend
npm run lint -w apps/frontend
npm run build -w apps/backend
npm run build -w apps/frontend
npm run test -w apps/backend
```

## Nota final

Este documento es una lista de brechas (gap list), no una critica de calidad.
El proyecto esta bien encaminado; falta cerrar capas enteras que la guia original define para produccion.
