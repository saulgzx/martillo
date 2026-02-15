# Martillo - Contexto Actualizado

## Resumen

Martillo es una plataforma de subastas híbridas (online + presencial) con monorepo (`apps/frontend`, `apps/backend`, `packages/shared`) y despliegue en Vercel + Railway.

Fecha de actualización: 2026-02-14

## Stack

- Frontend: Next.js 14, TypeScript, Tailwind, Zustand
- Backend: Express, TypeScript, Prisma, Redis, Socket.io
- DB/Cache: PostgreSQL + Redis (Railway)
- Infra: Vercel (frontend), Railway (backend)

## Estado actual

- Backend:
  - Auth JWT (login/register/refresh/logout/me) operativo
  - CRUD base de subastas/lotes operativo
  - Socket de subasta implementado en base
  - `/health` mejorado con `status`, `db`, `redis`, `uptime`, `version`
  - Seguridad base: helmet, CORS con whitelist/wildcard, rate limiting por ruta
  - Swagger base integrado en `/api/docs` solo en no-producción
- Frontend:
  - Flujos auth implementados
  - Rutas públicas/admin/live implementadas en base
  - Error boundaries globales agregados
  - Redirección por rol y bloqueo de rutas admin para no-admin
- QA/Operación:
  - Scripts base: smoke, load-test, reconnect-test, e2e-check, verify-backup
  - Playwright base configurado (specs esqueleto)

## Seguridad y auditoría

- Ejecutado: `npm audit --audit-level=moderate`
- Hallazgos vigentes: dependencias con upgrade mayor requerido (Next/ESLint config)
- Detalle y plan: `docs/SECURITY_REPORT_2026-02-14.md`

## Entorno producción (actual)

- Proyecto Railway: `adaptable-inspiration`
- Servicio backend: `just-courtesy`
- Dominio backend activo: `https://martillo.up.railway.app`

## Pendientes prioritarios

1. Completar pruebas E2E reales (hoy hay esqueleto base).
2. Configurar Sentry frontend/backend.
3. Resolver separación final de UX por rol (admin vs cliente) y pulir vistas.
4. Cerrar pendientes de seguridad con plan de upgrade mayor en branch dedicado.
