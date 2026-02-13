# Martillo

Plataforma de subastas híbridas (presenciales + online) en tiempo real.

## Requisitos Previos

- Node.js >= 18
- npm >= 9

## Instalación

```bash
# Clonar el repositorio
git clone <repo-url> martillo
cd martillo

# Instalar todas las dependencias (raíz + workspaces)
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

### Configurar variables de entorno

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia frontend y backend en paralelo |
| `npm run dev:frontend` | Inicia solo el frontend (Next.js) |
| `npm run dev:backend` | Inicia solo el backend (Express) |
| `npm run build` | Build de producción completo |
| `npm run lint` | Ejecuta ESLint en todos los workspaces |
| `npm run format` | Formatea código con Prettier |

## Estructura del Proyecto

```
martillo/
├── apps/
│   ├── frontend/   → Next.js 14 + TailwindCSS + shadcn/ui
│   └── backend/    → Express + TypeScript
├── packages/
│   └── shared/     → Tipos TypeScript compartidos
├── docs/           → Documentación
├── CONTEXT.md      → Contexto del proyecto
└── README.md       → Este archivo
```

## Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Monorepo:** npm workspaces
