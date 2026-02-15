# Alineacion contra `Martillo_Prompts_Codex_v2.md`

Fecha: 2026-02-15  
Fuente oficial comparada: `c:\Users\Alexis\Downloads\Martillo\Martillo_Prompts_Codex_v2.md`  
Archivo operativo actualizado: `docs/Martillo_Prompts_Desarrollo_v2.md`

## Estado de alineacion

- `DONE` Se reemplazo `docs/Martillo_Prompts_Desarrollo_v2.md` por la version oficial adjunta (hash SHA256 coincide).
- `DONE` Arquitectura de roles globales alineada en codigo a `SUPERADMIN | ADMIN | USER`.
- `PENDIENTE CRITICO` Modelo multi-tenant del Prompt 2.1 aun no esta implementado.
- `PENDIENTE CRITICO` Rutas y contratos de varios prompts no coinciden 1:1 con la especificacion oficial.

## Hallazgos criticos (P0)

1. Falta arquitectura SaaS por tenant en base de datos.
   - Esperado por prompt oficial: modelo `Tenant` y `tenantId` en `User`, `Auction`, `AuditLog`, etc.
   - Estado actual: `apps/backend/prisma/schema.prisma` no contiene `Tenant` ni aislamiento completo por tenant.

2. Contratos de API de postores no coinciden con el prompt oficial.
   - Oficial: `POST /api/auctions/:id/bidders/request` y familias asociadas.
   - Actual: rutas con convencion distinta en `apps/backend/src/routes/bidder.routes.ts`.

3. Motor realtime y nomenclatura de eventos no esta totalmente estandarizada al spec.
   - Oficial: flujo de rematador/admin y eventos de sala con semantica cerrada por tenant.
   - Actual: implementacion parcial/mixta en `apps/backend/src/socket/auction.room.ts`.

4. Prompt 2.2 define refresh token UUID + store Redis por token con deteccion de reuse.
   - Actual: `apps/backend/src/services/auth.service.ts` usa refresh JWT con `jti`, no flujo exacto especificado.

5. Semana 6 (pagos/flow) y semana 8 (E2E/monitoreo) siguen incompletas contra el detalle oficial.
   - Archivos base existen en parte, pero no hay cierre integral de contratos + pruebas end-to-end.

## Hallazgos altos (P1)

1. Roadmap interno desactualizado respecto al nuevo documento oficial.
   - `docs/ROADMAP_PENDIENTES.md` fue evolucionando por iteraciones previas y mezcla criterios de guias anteriores.

2. Encoding inconsistente en documentacion historica.
   - Hay archivos con mojibake (acentos rotos) en docs heredados.

3. Diferencias en naming de rutas admin/live entre prompts y app router actual.
   - Debe normalizarse segun el contrato final del documento oficial.

## Plan de correccion recomendado (orden estricto)

1. `P2.1` Rehacer schema Prisma a especificacion oficial (Tenant-first) y migracion de datos.
2. `P2.2` Ajustar AuthService al contrato oficial (access JWT + refresh UUID Redis + reuse detection).
3. `P3-P5` Normalizar rutas/ownership por tenant en backend y frontend.
4. `P6` Cerrar pagos Flow + webhooks idempotentes + notificaciones.
5. `P7-P8` Cerrar auditoria, carga, E2E y monitoreo.

## Notas operativas

- Cada correccion debe cerrar con:
  - `npm run lint -w apps/backend`
  - `npm run lint -w apps/frontend`
  - `npm run build -w apps/backend`
  - `npm run build -w apps/frontend`
- En Railway, cada cambio de schema requiere:
  - `npx prisma migrate deploy`
  - `npx prisma db seed`
