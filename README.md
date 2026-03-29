# Coffice — Claude Office Visualizer

> A real-time pixel art office that visualizes your Claude Code sessions. Watch anime-styled agents arrive, sit at desks, type, and report back as Claude orchestrates work in an animated office environment.

> **Fork of [paulrobello/claude-office](https://github.com/paulrobello/claude-office)** — extensively rebuilt with anime sprites, ambient NPCs, collapsible panels, 3D UI effects, and a full design system overhaul.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Runs on Linux | macOS | Windows](https://img.shields.io/badge/runs%20on-Linux%20%7C%20macOS%20%7C%20Windows-blue)

## What It Does

Coffice hooks into your Claude Code CLI and renders every operation as an office scene:

- A **boss character** sits at a desk and reacts to your prompts
- **Employee agents** (subagents) arrive via elevator, walk to desks, and work on tasks
- **Visitor NPCs** wander in, sit at free desks, comment, and leave
- **Cats** roam the office, nap on beds, and visit the food area
- A **whiteboard** cycles through 11 data modes (todo list, org chart, metrics, heat map...)
- A **city window** shows a real-time day/night skyline
- A **trash can** fills as context accumulates, and the boss stomps it during compaction

Everything updates in real-time via WebSocket. No polling, no refresh.

## Features

### Office Life
- Anime character sprites (Konosuba-themed) with 12-frame smooth animation
- 4 worker variants randomly assigned to agents
- Ambient idle workers that enter/exit via elevator with desk-avoiding pathfinding
- Two wandering cats with speech bubbles, beds, trees, and food bowls
- Employee of the Month frame (updates based on most active agent)
- Ceiling fluorescent lights, monitor screen glow, drop shadows, warm ambient lighting

### Dashboard
- **Session browser** with search/filter and auto-follow for new sessions
- **Boss status card** with state badge and context utilization gauge
- **Agent state panel** — auto-collapses when empty, expands when agents arrive
- **Event log** with clickable detail modals, auto-scrolls to latest
- **Conversation history** tab showing full chat exchanges with markdown
- **Git status panel** — collapsed by default, auto-expands when data arrives

### Controls
- Zoom/pan with mouse wheel, pinch, or buttons (+, -, 1:1, fullscreen)
- Keyboard shortcuts (D=debug, F=fullscreen, P=paths, Q=queues, L=labels, O=obstacles)
- Settings modal: clock type, animation speed, show/hide cats, show/hide idle workers
- Double-click to reset view

### Technical
- **WebSocket** real-time state with exponential backoff reconnection (1s-30s)
- **Reconnection indicator** — amber banner shows attempt count during disconnects
- **Error boundary** — PixiJS crashes show a styled restart screen, not a blank page
- **Focus-trapped modals** with Tab wrapping and focus restore
- **Auto-fit viewport** — office scales to fill available space on any screen size
- **Performance optimized** — useCallback-wrapped tick loops with early returns when idle
- **Collapsible sidebar panels** — unused sections shrink away, giving space to active panels

## Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/OrangeZef/claude-office.git
cd claude-office
cp .env.example .env  # Edit with your paths
docker compose up -d --build
```

Open [http://localhost:8000](http://localhost:8000) and start a Claude Code session to see it visualized.

### Development

```bash
# Prerequisites: Python 3.14+, Node.js 20+, uv
make install-all
make dev-tmux
```

Open [http://localhost:3000](http://localhost:3000). Navigate tmux windows with `Ctrl-b n/p`.

### AI Enhancements (Optional)

For AI-generated agent names and task summaries, create a `backend/.env` file with your Claude Code OAuth token (see `backend/README.md` for details). Without this, the visualizer works fully but shows raw agent IDs instead of friendly names.

## Commands

| Command | Description |
|---------|-------------|
| `make dev-tmux` | Start in tmux (recommended) |
| `make dev` | Start backend + frontend in parallel |
| `make checkall` | Format, lint, typecheck, test |
| `make simulate` | Run event simulation |
| `make hooks-install` | Install Claude Code hooks |
| `make hooks-status` | Check hook status |
| `docker compose up -d --build` | Docker deployment |

## Project Structure

```
claude-office/
├── backend/              # FastAPI + WebSocket server
│   ├── app/
│   │   ├── api/          # REST and WebSocket endpoints
│   │   ├── core/         # State machine, event processor
│   │   └── models/       # Pydantic models (auto-generates frontend types)
│   └── pyproject.toml
├── frontend/             # Next.js + PixiJS
│   ├── public/sprites/   # Anime character frames (384x640, 12 per character)
│   ├── src/
│   │   ├── components/   # React + PixiJS game components
│   │   ├── hooks/        # WebSocket, textures, sessions
│   │   ├── stores/       # Zustand state (game, preferences)
│   │   └── systems/      # Animation, pathfinding, compaction
│   └── package.json
├── hooks/                # Claude Code CLI integration
├── .claude/skills/       # Sprite generation skills
├── docs/                 # Architecture, whiteboard modes, Docker guide
└── Makefile
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Office not centered | Resize the browser window — it auto-recenters |
| Hooks not firing | `make hooks-status`, then `make hooks-install` |
| WebSocket disconnects | Check backend is running, amber reconnect banner shows status |
| Sprites not loading | Clear browser cache, check Docker logs |
| Port 8000 in use | Stop other services or change port in docker-compose.yml |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design and data flow
- [Whiteboard Modes](docs/WHITEBOARD.md) — 11 display modes
- [Docker Guide](docs/DOCKER.md) — deployment configuration
- [Quick Start](docs/QUICKSTART.md) — setup in under 5 minutes

## Credits

Original project by [Paul Robello](https://github.com/paulrobello/claude-office).

## License

MIT
