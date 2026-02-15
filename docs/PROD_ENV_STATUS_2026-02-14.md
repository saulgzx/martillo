# Production Env Status - Railway (2026-02-14)

Project: `adaptable-inspiration`  
Service: `just-courtesy` (backend)

## Verificados como presentes

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `ALLOWED_ORIGINS`
- `NODE_ENV`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `ENCRYPTION_KEY`

## Faltantes o no confirmados en backend

- `FLOW_API_KEY` (no visible en variables del servicio)
- `FLOW_SECRET_KEY` (no visible en variables del servicio)
- `SENTRY_DSN` (no visible en variables del servicio)

## Notas

- `REDIS_URL` fue corregida en esta iteración porque estaba malformada (duplicada).
- Dominio backend activo verificado: `https://martillo.up.railway.app`.
- Para cerrar el checklist de producción completo, falta verificar variables en Vercel desde dashboard:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_SOCKET_URL`
  - `SENTRY_DSN` (si se usará frontend Sentry)
