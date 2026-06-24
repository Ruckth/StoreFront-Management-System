# StoreFront Frontend

React TypeScript frontend for the StoreFront Management System assignment. The app provides seller inventory pages, buyer marketplace browsing, cart checkout, and order history.

See the root [README.md](../README.md) for the full project overview, backend setup, architecture notes, and test instructions.

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The local app runs at `http://localhost:5173`.

## Environment

Set the backend API URL in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

For production, point `VITE_API_BASE_URL` to the deployed backend API.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm build
pnpm preview
```

`pnpm build` runs TypeScript project checks before creating the Vite production build.
