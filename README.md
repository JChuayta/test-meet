# Test Meet

Google Meet-like application with video conferencing capabilities.

## Tech Stack

- **Backend:** NestJS + TypeORM + MySQL + WebSockets
- **Frontend:** React + Vite + react-bootstrap
- **Real-time:** WebRTC + Socket.io for signaling

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development (both backend and frontend)
pnpm dev

# Or start individually
pnpm dev:backend
pnpm dev:frontend
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Docker

```bash
docker-compose up -d
```

## Structure

```
test-meet/
├── testmeet-backend/      # NestJS API
├── testmeet-frontend/     # React + Vite UI
```