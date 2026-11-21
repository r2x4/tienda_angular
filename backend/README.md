# Backend - tienda_angular

Fundaciones iniciales del backend (FastAPI + PostgreSQL + SQLAlchemy + Alembic).

## Servicios Docker

- `api`: FastAPI en `http://localhost:8000`
- `db`: PostgreSQL 16 en `localhost:5432`

## Variables de entorno

Copiar `backend/.env.example` a `backend/.env` y ajustar valores si es necesario.

## Iniciar entorno

Desde la raíz del proyecto:

```powershell
docker compose -f backend/docker-compose.yml --env-file backend/.env.example up --build -d
```

O si ya creó `backend/.env`:

```powershell
docker compose -f backend/docker-compose.yml --env-file backend/.env up --build -d
```

## Ver estado

```powershell
docker compose -f backend/docker-compose.yml ps
```

## Logs

```powershell
docker compose -f backend/docker-compose.yml logs -f api
docker compose -f backend/docker-compose.yml logs -f db
```

## Probar health

```powershell
curl http://localhost:8000/health
```

## Detener entorno

```powershell
docker compose -f backend/docker-compose.yml down
```

Detener y eliminar volumen de datos (destructivo):

```powershell
docker compose -f backend/docker-compose.yml down -v
```

## Alembic / Migraciones

Comandos ejecutados desde la raíz del repo. La API/DB deben estar corriendo en Docker.

```powershell
# Estado actual de migraciones en la DB
docker compose -f backend/docker-compose.yml exec api alembic current

# Historial de migraciones
docker compose -f backend/docker-compose.yml exec api alembic history

# Verificar autogeneración (no aplica cambios; revisa si detecta diffs)
docker compose -f backend/docker-compose.yml exec api alembic revision --autogenerate -m "check" --rev-id check

# Aplicar migraciones (cuando existan)
docker compose -f backend/docker-compose.yml exec api alembic upgrade head

# Revertir última migración
docker compose -f backend/docker-compose.yml exec api alembic downgrade -1
```

## Pruebas backend

```powershell
docker compose -f backend/docker-compose.yml exec api pytest -q
```
