# Martillo - Plataforma de Subastas Híbridas

## Descripción
Martillo es una plataforma de subastas híbridas que permite realizar subastas tanto presenciales como online en tiempo real. Los usuarios pueden participar como postores, subastadores o administradores de la plataforma.

## Stack Tecnológico

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript (strict mode)
- **Estilos:** TailwindCSS
- **Componentes UI:** shadcn/ui (tema slate)
- **Linting:** ESLint + Prettier

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Lenguaje:** TypeScript
- **Dev Server:** ts-node-dev
- **Linting:** ESLint + Prettier

### Shared
- Paquete de tipos TypeScript compartidos entre frontend y backend
- Publicado como `@martillo/shared` dentro del monorepo

## Estructura de Carpetas

```
martillo/
├── apps/
│   ├── frontend/          → Next.js 14 App
│   │   ├── app/           → App Router pages & layouts
│   │   ├── components/    → Componentes React (ui/ para shadcn)
│   │   ├── lib/           → Utilidades y helpers
│   │   ├── hooks/         → Custom React hooks
│   │   ├── store/         → Estado global
│   │   └── types/         → Tipos locales del frontend
│   └── backend/           → API Express
│       └── src/
│           ├── routes/       → Definición de rutas
│           ├── controllers/  → Lógica de controladores
│           ├── middleware/   → Middleware Express
│           ├── models/       → Modelos de datos
│           ├── services/     → Lógica de negocio
│           └── utils/        → Utilidades
├── packages/
│   └── shared/            → Tipos compartidos
├── docs/                  → Documentación
├── CONTEXT.md             → Este archivo
└── README.md              → Instrucciones de setup
```

## Estado Actual
- [x] Estructura del monorepo creada
- [x] Configuración de workspaces (npm)
- [x] Frontend base con Next.js 14 + TailwindCSS + shadcn/ui
- [x] Backend base con Express + TypeScript
- [x] Paquete shared con tipos base
- [ ] Base de datos (pendiente de seleccionar)
- [ ] Autenticación
- [ ] WebSockets para subastas en vivo
- [ ] Sistema de pujas

## Próximos Pasos
1. **Base de datos** - Seleccionar e integrar base de datos (PostgreSQL + Prisma recomendado)
2. **Autenticación** - Implementar sistema de auth (JWT / NextAuth)
3. **Modelos de datos** - Definir esquema completo de la base de datos
4. **API REST** - Crear endpoints CRUD para subastas, usuarios y pujas
5. **WebSockets** - Integrar Socket.io para subastas en tiempo real
6. **UI de subastas** - Construir interfaz de catálogo y sala de subastas
7. **Sistema de pujas** - Lógica de pujas con validación en tiempo real
8. **Panel de administración** - Dashboard para gestión de subastas
