# Daily Stock Summary

App that takes a stock symbol, pulls the last month of 15-minute intraday data from Yahoo Finance, and summarizes it per day.

- **server/**: Node.js + TypeScript API (Fastify)
- **client/**: React + TypeScript UI (Vite, TanStack Query, Recharts)


## Quick start (Docker)

Requires Docker.

```sh
docker compose up --build
```

Open http://localhost:8080

nginx serves the built frontend and proxies `/api` to the server, so the browser only talks to one origin (no CORS).

## Running locally

Requires Node.js 22+.

**Server** (http://localhost:3000)

```sh
cd server
npm install
npm run dev
```

**Client** (http://localhost:5173)

```sh
cd client
npm install
npm run dev
```

## Tests

**Server**

```sh
cd server
npm run test:unit         
npm run test:integration  # calls the real Yahoo API
npm test    
```

**Client**

```sh
cd client
npm test
``