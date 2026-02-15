# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Tech Stack

- **Frontend**: TanStack Start (React 19) with file-based routing via TanStack Router
- **Backend/Database**: Convex (real-time serverless backend)
- **Authentication**: WorkOS AuthKit
- **Build Tool**: Vite with Nitro bundler
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn (use `pnpm dlx shadcn@latest add <component>`)
- **Testing**: Vitest with Testing Library
- **Linting/Formatting**: Biome (tabs, double quotes)
- **Package Manager**: pnpm
- **Type Safety**: TypeScript (strict mode) with T3 Env for environment variables

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Check (lint + format)
pnpm check

# Start Convex development server (run in separate terminal)
pnpm dlx convex dev
```

## Environment Setup

Environment variables are validated using T3 Env. Configure in `.env.local`:

```bash
# WorkOS Authentication
VITE_WORKOS_CLIENT_ID=<workos-client-id>
VITE_WORKOS_API_HOSTNAME=api.workos.com

# Convex Backend
VITE_CONVEX_URL=<convex-deployment-url>
CONVEX_DEPLOYMENT=<convex-deployment-name>

# Server-side (optional)
SERVER_URL=<server-url>
```

All client-side variables must be prefixed with `VITE_`. Schema defined in `src/env.ts`.

## Architecture Overview

### Provider Hierarchy

The application uses nested providers in `src/routes/__root.tsx`:

```tsx
WorkOSProvider (authentication)
└── ConvexProvider (backend with auth integration)
    └── App components
```

- **WorkOSProvider** (`src/integrations/workos/provider.tsx`): Handles authentication via AuthKit
- **ConvexProvider** (`src/integrations/convex/provider.tsx`): Integrates Convex with WorkOS auth using `ConvexProviderWithAuthKit`

### File-Based Routing

Routes are managed in `src/routes/` directory:

- `__root.tsx`: Root layout with providers and shell component
- `index.tsx`: Home page
- `demo/`: Demo routes (can be safely deleted)

TanStack Router auto-generates `src/routeTree.gen.ts` - do not edit manually.

### Convex Backend

Backend logic lives in `convex/` directory:

- `schema.ts`: Database schema definitions
- `auth.config.ts`: WorkOS JWT authentication configuration
- `todos.ts`: Example mutations and queries
- `_generated/`: Auto-generated files (do not edit)

### Path Aliases

TypeScript and Vite are configured to use `@/` as an alias for `src/`:

```tsx
import { env } from "@/env";
import { cn } from "@/lib/utils";
```

## Convex Schema Guidelines

When creating or modifying Convex schemas:

1. **Import validators**: Use `v` from `convex/values` for type validation
2. **System fields**: Every document has `_id` and `_creationTime` (auto-generated)
3. **ID references**: Use `v.id("tableName")` for foreign keys
4. **Indexes**: Add `.index("indexName", ["field1", "field2"])` for query performance
5. **Optional fields**: Use `v.optional(v.type())` for nullable fields
6. **Unions**: Use `v.union()` for discriminated union types

Example:

```ts
defineTable({
  name: v.string(),
  userId: v.id("users"),
  status: v.union(v.literal("active"), v.literal("inactive")),
  metadata: v.optional(v.object({ key: v.string() })),
}).index("userId", ["userId"]);
```

See https://docs.convex.dev/database/types for complete type reference.

## Code Style

- **Formatter**: Biome with tabs (not spaces) and double quotes
- **Auto-format**: Run `pnpm format` before committing
- **Files included**: `src/`, `convex/`, `.vscode/`, config files
- **Files excluded**: `src/routeTree.gen.ts`, `src/styles.css`, `convex/_generated/`

## Important Patterns

### Adding UI Components

Use Shadcn for pre-built components:

```bash
pnpm dlx shadcn@latest add button
```

Components use the `cn()` utility from `src/lib/utils.ts` for conditional class merging.

### Accessing Environment Variables

Import from `src/env.ts` for type-safe access:

```tsx
import { env } from "@/env";
console.log(env.VITE_CONVEX_URL);
```

### React Compiler

React Compiler is enabled via `babel-plugin-react-compiler` in `vite.config.ts`. Write idiomatic React - the compiler will optimize automatically.

### Server Functions

TanStack Start allows server-side code with `createServerFn`:

```tsx
import { createServerFn } from "@tanstack/react-router";

const getData = createServerFn({ method: "GET" }).handler(async () => {
  // Server-side code
});
```

### Data Loading

Use route loaders for server-side data fetching:

```tsx
export const Route = createFileRoute("/page")({
  loader: async () => {
    // Fetch data before render
  },
  component: PageComponent,
});
```

## Demo Files

Files in `src/routes/demo/` are examples and can be safely deleted after reviewing features.
