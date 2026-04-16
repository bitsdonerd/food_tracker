---
name: food-tracker-plan
description: Load the Food Tracker implementation plan, architecture, design patterns (Factory, Builder, Observer), domain classes, TDD methodology, and sprint roadmap. Use when working on the food_tracker project to refresh context on how to structure new code, which layer a change belongs to, how to write tests, or what the sprint priorities are.
---

# Food Tracker Implementation Plan

This skill loads the full implementation plan for the Food Tracker project
(Gerenciador de Marmitas). The authoritative document is
[docs/IMPLEMENTATION_PLAN.md](../../../docs/IMPLEMENTATION_PLAN.md) —
read it before answering architectural questions or writing new code.

## When to use this skill

Invoke this skill when the user:
- Asks about the project architecture, design patterns, or class structure
- Wants to implement a new feature (orders, reports, realtime, etc.)
- Asks about TDD approach, how to write tests, or test structure
- Asks about the sprint roadmap, priorities, or what to work on next
- Asks about the database schema or migrations
- Asks about the Pusher/WebSocket realtime flow

## What to do when invoked

1. **Read the plan** — Open
   [docs/IMPLEMENTATION_PLAN.md](../../../docs/IMPLEMENTATION_PLAN.md)
   and use it as the source of truth.
2. **Check current state** — Before recommending code, verify what already
   exists. The plan lists what is done vs. pending; the repo state is
   authoritative.
3. **Follow TDD** — Always write tests FIRST. Unit tests for Domain layer;
   integration tests for API endpoints. See section 6 of the plan.
4. **Respect the layers** — Domain logic (price calculation, validation) goes
   in `domain/`; orchestration (save + notify) goes in `services/`; SQL goes
   in `models/`; HTTP concerns go in `pages/api/`.
5. **Follow project conventions** — Conventional Commits, snake_case files,
   PascalCase classes, custom errors from [infra/errors.js](../../../infra/errors.js),
   absolute imports via jsconfig.

## Key reference points

### Architecture (section 2)
Layered architecture: Pages → Controllers → Services → Domain → Models → Infra.

### Design Patterns (section 3)
- **Factory** (`PedidoFactory`): decides Marmita vs PratoFeito
- **Builder** (`PedidoBuilder`): fluent interface for building orders
- **Observer** (Pusher): realtime Kitchen dashboard via WebSocket

### Pricing Rules (section 3)
- Marmita 1 carne = R$18
- Marmita 2 carnes = R$20
- PF simples = R$18
- PF carne dobrada = R$22

### Database Schema (section 4)
Tables: `products`, `profiles`, `orders`, `order_items`.
Enums: `order_type` (MARMITA | PF), `order_status` (PENDING → PREPARING →
READY → DELIVERED | CANCELLED), `user_role` (WAITER | KITCHEN | ADMIN).

### TDD Methodology (section 6)
Red → Green → Refactor. Examples of unit and integration tests included.

### Sprint Roadmap (section 8)
- S1: Setup (partial) — Vercel, Pusher, migrations SQL pending
- S2: Core Domain + Backend (current focus)
- S3: Waiter Interface
- S4: Kitchen Dashboard
- S5: Admin & Closing

### Project Conventions (section 9)
Commits, style, imports, errors, routes, tests, database, naming.

## Do NOT

- Skip writing tests first — this project uses TDD.
- Put business logic in API route handlers. It belongs in the Domain layer.
- Use a generic `Error` — always use the custom classes from
  [infra/errors.js](../../../infra/errors.js).
- Invent file paths or class names without checking the plan and the current
  repo state first.
