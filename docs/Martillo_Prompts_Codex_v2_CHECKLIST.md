# Martillo - Checklist de Ejecucion (Fuente Oficial)

Fuente de verdad funcional:

- `docs/Martillo_Prompts_Desarrollo_v2.md` (copiado 1:1 desde `Martillo_Prompts_Codex_v2.md`)

Este archivo es solo tablero de estado (checklist operativo).

## Estado global

- [x] Documento oficial sincronizado en repo
- [x] Deploy base Railway/Vercel operativo
- [ ] Proyecto 100% alineado al spec oficial

## Fase 0

- [x] P0.1 Normalizacion de formato (EOL/Prettier)
- [x] P0.2 Cerrar huecos minimos de deploy
- [x] P0.3 Alineacion de frontend con manual de marca

## Semana 1

- [x] Prompt 1.1 Monorepo y configuracion inicial (DONE)
- [x] Prompt 1.2 CI/CD base operativo
- [x] Prompt 1.3 Seguridad base backend

## Semana 2

- [ ] Prompt 2.1 Schema Prisma oficial tenant-first (PENDIENTE CRITICO)
- [ ] Prompt 2.2 Auth JWT RS256 contrato exacto oficial (PARCIAL)
- [ ] Prompt 2.3 Frontend auth contrato exacto oficial (PARCIAL)

## Semana 3

- [ ] Prompt 3.1 Backend CRUD remates/lotes completo (PARCIAL)
- [ ] Prompt 3.2 Frontend catalogo/admin completo sin mocks (PARCIAL)

## Semana 4

- [ ] Prompt 4.1 Motor subastas realtime backend completo (PARCIAL)
- [ ] Prompt 4.2 Sala postor + panel rematador frontend (PARCIAL)

## Semana 5

- [ ] Prompt 5.1 Backend registro/verificacion postores (PARCIAL)
- [ ] Prompt 5.2 Frontend flujo de postores (PARCIAL)

## Semana 6

- [ ] Prompt 6.1 Sistema de pagos Flow/Stripe + webhook idempotente (PARCIAL)
- [ ] Prompt 6.2 Notificaciones email Resend (PARCIAL)
- [ ] Prompt 6.3 Frontend pagos y adjudicaciones (PARCIAL)

## Semana 7

- [ ] Prompt 7.1 Auditoria de seguridad backend (PARCIAL)
- [ ] Prompt 7.2 Seguridad frontend + pruebas de carga (PARCIAL)

## Semana 8

- [ ] Prompt 8.1 E2E Playwright + monitoreo (PARCIAL)
- [ ] Prompt 8.2 Deploy final + checklist de lanzamiento (PENDIENTE)

## Bonus

- [ ] Prompt B.1 Dashboard admin con metricas/reportes
- [ ] Prompt B.2 Proxy bidding

## Regla de actualizacion

- Despues de cada prompt ejecutado: actualizar este archivo en el mismo commit.
- Estados validos por item:
  - `DONE` = implementado y validado (lint/build y pruebas del prompt)
  - `PARCIAL` = implementado en parte o sin validacion completa
  - `PENDIENTE` = no implementado

Ultima actualizacion: 2026-02-15 - Restriccion de \"Mi cuenta\": ADMIN/SUPERADMIN no pueden solicitar cambios ni acceder a /profile (redirige a /admin). Notificaciones minimas a ADMIN/SUPERADMIN al crear solicitud de cambio de perfil (endpoint /api/admin/notifications). Fix refreshToken: setea accessToken antes de /me (evita loop 401). Mis adjudicaciones ya no queda cargando infinito (timeout + manejo de error). Roles normalizados a SUPERADMIN/ADMIN/USER; topbar sin rol visible + menu \"Mi cuenta\" (logout dentro del submenu) y link a Dashboard para USER; perfil con flujo de solicitud de cambios (USER solicita / ADMIN aprueba o rechaza). Estabilidad de frontend: se fija Node soportado (22 recomendado/20) con `.nvmrc`/`.node-version` y check en scripts; build/dev limpian `.next` para evitar 404s en `/_next/static/*` que dejan el sitio sin estilos.

Migraciones Prisma (local): 2026-02-15 - Ejecutado `prisma migrate deploy` (sin pendientes) y `prisma db seed` contra el `DATABASE_URL` actual (Railway). Backend /health OK en `http://localhost:4000/health`.
