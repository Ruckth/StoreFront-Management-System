# StoreFront Management System

Full-stack technical assignment for a two-sided storefront where sellers manage product listings and buyers browse products, add items to a cart, and checkout. The project is split into a Django REST API backend and a React TypeScript frontend.

## Features

- Authentication with JWT access and refresh tokens.
- Role-based access for `seller` and `buyer` accounts.
- Seller product management: create, edit, delete, and upload product images.
- Marketplace browsing with product search, stock filtering, and product detail pages.
- Buyer cart management with add, update quantity, remove item, and checkout flows.
- Inventory updates during checkout, including stock validation and transaction-safe rollback.
- Buyer order history with immutable order item snapshots.

## Tech Stack

- Backend: Python, Django, Django REST Framework, Simple JWT.
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn-style UI components.
- Database: SQLite by default for local development; PostgreSQL is supported through `DATABASE_URL` or Railway PG variables.
- Media: local Django media storage for uploaded product images.
- Deployment: Railway configs are included for both backend and frontend.

## Architecture

The backend exposes a REST API under `/api` and owns authentication, authorization, product data, cart state, order creation, and inventory integrity. The frontend calls the API through `VITE_API_BASE_URL` and guards buyer/seller pages by role.

The main domain models are users, products, carts, cart items, orders, and order items. Checkout runs inside a database transaction, locks cart/product rows, validates inventory, creates the order, reduces product quantities, and marks the cart as checked out.

- ER diagram: [docs/er-diagram.md](docs/er-diagram.md)
- API contract: [docs/api-contract.md](docs/api-contract.md)

## Local Setup

### Backend

```bash
cd backend
python3 -m venv ../.venv
../.venv/bin/pip install -r requirements.txt
cp .env.example .env
../.venv/bin/python manage.py migrate
../.venv/bin/python manage.py runserver
```

The backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

The frontend runs at `http://localhost:5173`.

## Environment Variables

Backend variables are documented in [backend/.env.example](backend/.env.example).

Important backend variables:

- `DEBUG`: `True` for local development, `False` in production.
- `SECRET_KEY`: required when `DEBUG=False`.
- `ALLOWED_HOSTS`: comma-separated Django host allowlist.
- `CORS_ALLOWED_ORIGINS`: comma-separated frontend origins.
- `FRONTEND_URL`: deployed frontend URL.
- `DATABASE_URL` or Railway `PG*` variables: optional PostgreSQL configuration.
- `SERVE_MEDIA_FILES`: whether Django serves uploaded media files.

Frontend variables are documented in [frontend/.env.example](frontend/.env.example).

Important frontend variable:

- `VITE_API_BASE_URL`: backend API URL, for example `http://localhost:8000/api`.

## Tests And Checks

Run backend tests:

```bash
cd backend
../.venv/bin/python manage.py test
```

Run frontend checks:

```bash
cd frontend
pnpm lint
pnpm build
```

GitHub Actions also runs backend tests, frontend lint, and frontend build on push and pull request.

## Manual Test Assets

`test-products/leather-products/` contains optional product images and metadata for manual testing. These assets are not automatically imported into the backend database and are not wired into the frontend demo catalog.

## Deployment Notes

Railway configuration files are included:

- [backend/railway.toml](backend/railway.toml): collects static files, runs migrations, starts Gunicorn, and exposes `/health/`.
- [frontend/railway.toml](frontend/railway.toml): builds the Vite app and serves the production preview.

For production, set secure environment values, configure `VITE_API_BASE_URL` to the deployed backend API, and set backend CORS/host variables to the deployed frontend and backend domains.
