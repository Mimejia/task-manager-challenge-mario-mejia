# Task Manager API (Backend)

Bienvenido al backend del Mobile Developer Challenge.

Este backend no es solo una API REST. Está pensado para escenarios reales: escalabilidad, mantenibilidad y sincronización offline. Fue desarrollado y probado en un entorno híbrido (Mac + servidor Linux) para asegurar que no depende de “localhost”.

## Decisiones de arquitectura

### Del ORM al Repository Pattern
Para cumplir con estándares de ingeniería más estrictos, el acceso a datos se aisló detrás de interfaces.

- Prisma no se usa en controladores ni servicios de negocio.
- Los servicios (`TaskService`, `AuthService`, `WorkspaceService`, `SyncService`) dependen de interfaces y reciben implementaciones por inyección.
- Esto permite pruebas más simples y desacopla la lógica de negocio del ORM.

Estructura principal:

- `src/features/*/repositories`
- `src/features/*/services`

### Sync offline transaccional
Cada operación offline se aplica de forma transaccional:

- task + event + version + sync_operations en la misma transacción
- control de concurrencia con `client_id` y `version`
- idempotencia por `device_id` + `op_id`

### Infraestructura y compatibilidad
Todo el proyecto corre en Docker, y también fue probado en Raspberry Pi 5 para validar un entorno Linux real (ARM64) y condiciones de red más realistas.

## Stack tecnológico

- Runtime: Node.js 20+ (TypeScript)
- Framework: Express
- Base de datos: MySQL 8
- ORM: Prisma (detrás de repositorios)
- Auth: JWT (access + refresh)
- Offline-first: sincronización transaccional con versionado

## Configuración rápida

Crea un archivo `.env` en la raíz:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="mysql://taskuser:taskpassword@localhost:3306/task_manager"
JWT_ACCESS_SECRET="dev_access_secret"
JWT_REFRESH_SECRET="dev_refresh_secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

## Cómo correr el proyecto

### Opción A: Docker

```bash
docker compose up --build
```

La API queda en `http://localhost:3000/api`.

### Opción B: Desarrollo local

```bash
npm install
docker compose up -d db
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

## Migraciones y seed

Para una base nueva:

```bash
npx prisma migrate dev
npm run prisma:seed
```

El seed crea roles `admin` y `user`. Para crear un admin, define:

```env
ADMIN_EMAIL=admin@local.test
ADMIN_PASSWORD=Admin123!
ADMIN_FULL_NAME=Admin
```

## Endpoints clave

### Auth
- `POST /api/register`
- `POST /api/login`

### Workspaces
- `GET /api/workspaces`
- `POST /api/workspaces`
- `POST /api/workspaces/:id/invitations`
- `POST /api/workspaces/invitations/accept`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Sync offline
- `POST /api/sync/operations`

## Pruebas rápidas

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","fullName":"Demo User","password":"Password123!"}'

curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"Password123!"}'

curl -X POST http://localhost:3000/api/sync/operations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"android-01","operations":[{"opId":"uuid-1","entityType":"task","operation":"create","payload":{"title":"Offline task","status":"pendiente","clientId":"uuid-local-1","clientRev":1}}]}'
```

Hecho con TypeScript y probado en un entorno real fuera de localhost.
