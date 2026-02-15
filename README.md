# Martillo

Plataforma de subastas hibridas (presenciales + online) en tiempo real.

## Requisitos previos

- Node.js 22 (recomendado) o 20
- npm

Nota: con Node 24 hemos visto fallos intermitentes en Next.js (`/_next/static/*` 404) que dejan el frontend sin estilos.

## Instalacion

```bash
git clone <repo-url> martillo
cd martillo
npm install
```

## Desarrollo

### Ejecutar todo (frontend + backend)

```bash
npm run dev
```

### Ejecutar individualmente

```bash
# Frontend (http://localhost:3000)
npm run dev:frontend

# Backend (http://localhost:4000)
npm run dev:backend
```

### Variables de entorno

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

## Scripts

| Script                 | Descripcion                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Inicia frontend y backend en paralelo   |
| `npm run dev:frontend` | Inicia solo el frontend (Next.js)       |
| `npm run dev:backend`  | Inicia solo el backend (Express)        |
| `npm run build`        | Build de produccion completo            |
| `npm run lint`         | Ejecuta ESLint en los workspaces        |
| `npm run format`       | Formatea codigo con Prettier            |

## Estructura

```text
martillo/
  apps/
    frontend/   -> Next.js 14 + TailwindCSS + shadcn/ui
    backend/    -> Express + TypeScript
  packages/
    shared/     -> Tipos TypeScript compartidos
  docs/         -> Documentacion
  CONTEXT.md
  README.md
```

## Stack

- Frontend: Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- Backend: Node.js, Express, TypeScript
- Monorepo: npm workspaces

