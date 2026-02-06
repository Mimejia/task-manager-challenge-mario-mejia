# Task Manager API (Backend)

API REST con Express + Prisma + MySQL + JWT + Sync offline básico.

## Requisitos
- Node.js 20+
- MySQL 8+

## Variables de entorno
Crea un archivo `.env` en la raíz con:

```
PORT=3000
NODE_ENV=development
DATABASE_URL="mysql://taskuser:taskpassword@localhost:3306/task_manager"
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

## Instalar y correr

```bash
npm install
npm run prisma:generate
npm run dev
```

## Migraciones y seed

Si usas una BD nueva:

```bash
npx prisma migrate dev
npm run prisma:seed
```

El seed crea roles `admin` y `user`. Para crear un admin, define:

```
ADMIN_EMAIL=admin@local.test
ADMIN_PASSWORD=Admin123!
ADMIN_FULL_NAME=Admin
```

## Docker

```bash
docker compose up --build
```

## Raspberry Pi / Producción

En Raspberry (o producción):

```bash
npx prisma migrate deploy
npm run prisma:seed
```

## Endpoints

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

### Offline Sync
- `POST /api/sync/operations`

## Ejemplos rápidos

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@local.test","fullName":"Test User","password":"Test123!"}'

curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@local.test","password":"Test123!"}'

# Ejemplo Sync (offline)
curl -X POST http://localhost:3000/api/sync/operations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"android-01","operations":[{"opId":"uuid-1","entityType":"task","operation":"create","payload":{"title":"Offline task","status":"pendiente","clientId":"uuid-local-1","clientRev":1}}]}'
```
