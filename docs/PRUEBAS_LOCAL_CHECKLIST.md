# Checklist de Pruebas Locales - Martillo

Fecha: 2026-02-15
Ambiente: Local (`frontend:3000`, `backend:4000`)

## 1) Salud del sistema

- [ ] Ejecutar `curl http://localhost:4000/health`
- [ ] Confirmar `status: "ok"`
- [ ] Confirmar `db: "connected"`
- [ ] Confirmar `redis: "connected"`

## 2) Navegacion publica

- [ ] Abrir `http://localhost:3000/`
- [ ] Verificar que cargan cards de remates
- [ ] Verificar navegacion a detalle de remate

## 3) Login y sesiones

### Admin

- [ ] Ir a `http://localhost:3000/login`
- [ ] Ingresar `admin.test@martillo.com / AdminMartillo123!`
- [ ] Confirmar redireccion a `/dashboard`

### Cliente

- [ ] Ir a `http://localhost:3000/login`
- [ ] Ingresar `cliente.test@martillo.com / ClienteMartillo123!`
- [ ] Confirmar inicio de sesion correcto

### Logout

- [ ] Cerrar sesion desde dashboard
- [ ] Confirmar retorno a `/login`
- [ ] Confirmar que rutas protegidas redirigen a login

## 4) Control de acceso por rol

- [ ] Logueado como cliente, abrir `http://localhost:3000/admin`
- [ ] Confirmar bloqueo o redireccion (sin acceso admin)
- [ ] Logueado como admin, abrir `/admin`
- [ ] Logueado como admin, abrir `/admin/auctions`
- [ ] Logueado como admin, abrir `/admin/payments`
- [ ] Confirmar acceso correcto a las 3 rutas admin

## 5) Flujo de remates y postores

- [ ] Abrir `/auctions/remate-001`
- [ ] Verificar lotes, condiciones y boton participar
- [ ] Solicitar acceso al remate como usuario postor
- [ ] Confirmar estado `PENDING`
- [ ] Entrar como admin a `/admin/auctions/remate-001/bidders`
- [ ] Aprobar postor pendiente
- [ ] Confirmar estado `APPROVED` y asignacion de paleta

## 6) Tiempo real (sala y control)

- [ ] Abrir sesion postor en `/auctions/remate-001/live`
- [ ] Verificar estado de conexion y lote activo
- [ ] Abrir sesion admin en `/admin/auctions/remate-001/control`
- [ ] Verificar controles: adjudicar, pasar, pausar, finalizar
- [ ] Ejecutar una puja desde postor
- [ ] Confirmar actualizacion en vivo en ambas sesiones

## 7) Validacion tecnica (DoD)

- [ ] Ejecutar `npm run lint -w apps/backend`
- [ ] Ejecutar `npm run lint -w apps/frontend`
- [ ] Ejecutar `npm run build -w apps/backend`
- [ ] Ejecutar `npm run build -w apps/frontend`
- [ ] Confirmar todo en verde (warnings no bloqueantes permitidos)

## Notas

- Credenciales de prueba dependen de que existan en la base de datos activa.
- Si algun flujo falla, guardar evidencia: ruta, request, status code, mensaje de error y hora.
