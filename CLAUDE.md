# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NestJS 11 backend ("main service") for a language-learning platform. It manages a content hierarchy of languages → language levels / categories → courses → lessons → lesson blocks (info blocks and quiz blocks, with 10 quiz types). PostgreSQL via Prisma, Redis for caching. Package manager is **pnpm**.

## Commands

```bash
pnpm install                # install deps
pnpm start:dev              # run with watch (development)
pnpm start:prod             # run compiled build (node dist/src/main)
pnpm build                  # nest build → dist/
pnpm lint                   # eslint --fix over {src,apps,libs,test}
pnpm format                 # prettier --write

pnpm test                   # jest unit tests (*.spec.ts under src/)
pnpm test:watch
pnpm test:cov
pnpm test:e2e               # jest --config test/jest-e2e.json
pnpm jest path/to/file.spec.ts   # run a single test file

pnpm prisma generate        # regenerate client into generated/prisma (REQUIRED after schema edits)
pnpm prisma migrate dev --name <name>   # create + apply a migration
pnpm prisma migrate deploy  # apply migrations (run automatically by the container on startup)

docker compose up -d        # local Postgres (vocabulary) + Redis
```

The app boots on `PORT` (default 3000). Swagger UI is served at `/docs`.

## Critical conventions

- **ESM project.** `package.json` has `"type": "module"`. All relative imports **must** use explicit `.js` extensions even though the source is `.ts` (e.g. `import { CourseService } from './course.service.js'`). Follow this in every new file or the build/runtime breaks.
- **Prisma client is custom-generated, not `@prisma/client`.** The generator (`prisma/schema.prisma`) outputs to `generated/prisma` (gitignored). Import `PrismaClient` from `../../../generated/prisma/client.js`, not the package. `PrismaService` extends it and wires the `@prisma/adapter-pg` driver adapter with `DATABASE_URL`. Always run `pnpm prisma generate` after pulling or changing the schema.
- **Database table/model naming:** Prisma models are camelCase singular (`blokInfo`, `quizOneTrueChoise`) and `@@map` to snake_case plural SQL tables. Note pre-existing typos baked into names (`blok`, `Choise`) — match them, don't "fix" them, or you'll diverge from the schema.

## Architecture

### Response envelope (applied globally in `src/main.ts`)
- `TransformInterceptor` (`src/common/interceptors/`) wraps **every** controller return value into `{ code, message, data }`. Controllers return raw entities; do not build the envelope yourself.
- `HttpExceptionFilter` (`src/common/filters/`) catches everything and emits the same `{ code, message, data }` shape. It special-cases Prisma errors: `P2002` → 409 Conflict, `P2025` → 404, other Prisma codes → 400. Because of this, **services throw plain `throw new Error('...')`** for business errors (e.g. "Course already exists") and rely on the filter to format them. Use Nest `HttpException` subclasses (e.g. `BadRequestException`) when you need a specific status.
- Global prefix is `api/course` (set in `main.ts`), so controller routes are served under `/api/course/...`.

### Feature module pattern
Each domain (`course`, `category`, `language`, `lesson`, `lesson-blok`) is a self-contained NestJS module: `*.module.ts`, `*.service.ts`, controllers, and `dto/`. Modules import `PrismaModule`; `RedisModule` is `@Global`, so `RedisService` is injectable everywhere without importing it.

- **Public vs private controllers:** several domains split into `*.public.controller.ts` (read-only, routed under `public/<domain>`) and `*.private.controller.ts` (CRUD, under `private/<domain>`). There is currently **no auth guard** enforcing this split — it is a routing convention only.
- **Validation is manual.** Controllers hand-check required DTO fields and `isNaN(id)` and throw `BadRequestException`. There is no global `ValidationPipe` wired, so `class-validator` decorators on DTOs are not auto-enforced — replicate the existing manual checks when adding endpoints.
- **`lesson-blok`** is the most complex module: one controller (`LessonBlokController`) fronts two services (`LessonInfoBlokService`, `LessonQuizBlokService`) for the `info` and `quiz` block subtrees. `GET /:LessonId` merges both block lists and sorts by `order`.

### Caching pattern (see `course.service.ts` as the reference implementation)
Services cache through `RedisService` (ioredis wrapper: `get/set/del/exists/expire/keys`). Convention: a per-service `cacheKey` prefix (e.g. `course:`), keys like `course:all`, `course:<id>`, `course:language-<id>`, TTL 3600s. **On every create/update/delete, `del` the affected keys (including `:all`) to invalidate** before/after the DB write. Mirror this when adding mutating methods.

### Configuration
`ConfigModule.forRoot({ isGlobal: true, validate })` runs `src/common/env.validation.ts`, which validates required env vars at boot and throws if any are missing/invalid: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` (required), `REDIS_PASSWORD` (optional). Add new required env vars to that class.

## Deployment

Multi-stage `dockerfile` builds with pnpm, runs `prisma generate` + `pnpm build`, and the production container starts with `npx prisma migrate deploy && pnpm start:prod` (migrations apply on startup). CI (`.github/workflows/docker.yml`) builds and pushes a multi-arch image to GHCR on pushes to the `prod` branch and on `v*` tags. The default working branch here is `prod`.
