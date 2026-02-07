# Reality Fork

A version control system for JSON data with branching, diffing, merging, and rollback capabilities.

## Quick Start

```bash
# First time setup (installs dependencies + starts MongoDB)
npm run setup

# Start both frontend and backend in development mode
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | First-time setup: starts MongoDB + installs all dependencies |
| `npm run dev` | Run frontend and backend concurrently (development) |
| `npm run dev:frontend` | Run only frontend (http://localhost:5173) |
| `npm run dev:backend` | Run only backend (http://localhost:5000) |
| `npm run build` | Build frontend for production |
| `npm start` | Run in production mode |
| `npm run docker:up` | Start MongoDB Docker container |
| `npm run docker:down` | Stop MongoDB Docker container |
| `npm run install:all` | Install dependencies for all packages |
| `npm run clean` | Remove all node_modules |

## Project Structure

```
reality-fork/           # Frontend (React + Vite)
reality-fork-backend/   # Backend (Node.js + Express + MongoDB)
package.json            # Root control package
```

## Prerequisites

- Node.js >= 18
- Docker (for MongoDB)
