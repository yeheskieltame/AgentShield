---
title: AgentShield Backend
emoji: "🛡️"
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# AgentShield Backend

DeFi Circuit Breaker Protocol agent backend. Runs Coordinator and Observer agents continuously, with on-demand demo scenario triggers.

## API

- `GET /health` — Agent status
- `POST /demo/crash` — Flash crash simulation
- `POST /demo/whale` — Whale dump simulation
- `POST /demo/normal` — Normal trading simulation
- `POST /demo/stop` — Stop running demo
