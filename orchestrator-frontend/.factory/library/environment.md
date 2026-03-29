# Environment

## Backend Services (Docker - DO NOT MODIFY)

| Service | Port | Container |
|---|---|---|
| Spring Boot API | localhost:8081 | erp_domain_app |
| PostgreSQL | localhost:5433 | erp_db |
| RabbitMQ | localhost:5672 (AMQP), 15672 (mgmt) | erp_rabbit |
| MailHog | localhost:1025 (SMTP), 8025 (UI) | erp_mailhog |

## Frontend Dev Server

- Port: 3002
- Vite proxy: `/api` -> `http://localhost:8081`
- Package manager: bun 1.3.5
- Runtime: React 18 + TypeScript 5 + Vite 5 + Tailwind 3

## Test Accounts

All passwords: `Validation1!cc18570e52fe48dd`

| Role | Email | Company Code |
|---|---|---|
| Admin | validation.admin@example.com | MOCK |
| Accounting | validation.accounting@example.com | MOCK |
| Sales | validation.sales@example.com | MOCK |
| Factory | validation.factory@example.com | MOCK |
| Dealer | validation.dealer@example.com | MOCK |
| Superadmin | validation.superadmin@example.com | SKE |

## Machine Resources

- 16 CPU cores
- 15GB RAM (11GB available)
- Ubuntu Linux

## Commands

- Install: `bun install`
- Dev server: `bun run dev`
- Build: `bun run build`
- Typecheck: `npx tsc --noEmit`
- Lint: `bun run lint`
- Unit tests: `bun run test`
- E2E tests: `bun run test:e2e`
- Electron dev: `bun run electron:dev`
