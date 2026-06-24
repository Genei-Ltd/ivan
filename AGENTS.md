# Project Guidelines

---

## Framework: Next.js 16 with Turbopack

This project uses **Next.js 16** with the **App Router** and **Turbopack** (the default bundler). Configuration is in `next.config.ts`.

### Key Principles

- **Server Components are the default** — only add `'use client'` when you need state, effects, or browser APIs.
- **Fetch data on the server** in Server Components. Avoid `useEffect` for initial data loads.
- **`params` and `searchParams` are Promises** — always `await` them: `const { id } = await params`.
- **`cookies()`, `headers()`, and `draftMode()`** must also be awaited.
- Use **Server Actions** for form submissions and mutations. Use **API Routes** (`route.ts`) only for external clients or webhooks.
- **React Compiler** is enabled — no need for manual `React.memo`, `useMemo`, or `useCallback`.

### App Router Conventions

- `layout.tsx` — persistent wrapper (does not re-render on navigation)
- `page.tsx` — the route's UI
- `loading.tsx` — Suspense fallback for the route segment
- `error.tsx` — error boundary (must be `'use client'`)
- `not-found.tsx` — 404 UI
- `route.ts` — API endpoint

### Project Structure

```
src/
├── app/              # App Router (routing only)
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   ├── styleguide/   # Design-system verification page
│   ├── globals.css   # Global styles + Tailwind theme
│   ├── loading.tsx   # Root loading state
│   ├── error.tsx     # Root error boundary
│   └── not-found.tsx # 404 page
├── components/       # Shared components
│   ├── layout/       # Layout primitives
│   └── ui/           # shadcn/ui components
├── lib/              # Shared utilities
├── providers/        # Theme and motion providers
└── hooks/            # Custom React hooks
```

---

## Package Management with pnpm

This project uses **pnpm** as the JavaScript package manager. Always use pnpm for package management.

New dependency versions must wait seven days before pnpm can install them. This is configured in `pnpm-workspace.yaml`.

### Core Commands

Default to using pnpm for all JavaScript package operations:

- **Install dependencies**: `pnpm install`, `pnpm add`, or `pnpm remove`
- **Run scripts**: `pnpm <script>` or `pnpm run <script>`

---

## UI Development with shadcn/ui

This project uses **shadcn/ui** components for building all user interfaces. Always prefer shadcn components over custom implementations or other UI libraries.

Use the local design-system components in `src/components/ui` and layout primitives in `src/components/layout` first. The design-system tokens live in `src/app/globals.css`. Verify component and token changes at `/styleguide`.

### Available Components

The project has access to the `@shadcn` registry with 449+ components including:

- **Core UI**: button, input, textarea, select, checkbox, radio-group, switch, slider, label, form
- **Layout**: card, separator, sidebar, scroll-area, resizable
- **Navigation**: breadcrumb, navigation-menu, tabs, pagination
- **Feedback**: alert, dialog, toast (sonner), progress, spinner, skeleton
- **Data Display**: table, badge, avatar, calendar, chart
- **Overlays**: popover, tooltip, dropdown-menu, context-menu
- **Interactive**: accordion, collapsible, carousel
- **Pre-built Blocks**: dashboards, login pages, sidebar patterns, calendar variants

### How to Use shadcn Components

#### 1. Discovering Components

Use MCP tools to explore available components:

```bash
# List all available components
mcp__shadcn__list_items_in_registries with registries: ["@shadcn"]

# Search for specific components
mcp__shadcn__search_items_in_registries with query: "button" or "form"

# View component details and implementation
mcp__shadcn__view_items_in_registries with items: ["@shadcn/button"]

# Get usage examples
mcp__shadcn__get_item_examples_from_registries with query: "button-demo"
```

#### 2. Adding Components

Before using a component, add it to the project:

```bash
# Get the add command for one or more components
mcp__shadcn__get_add_command_for_items with items: ["@shadcn/button", "@shadcn/card"]

# Then execute the command via Bash tool
pnpm dlx shadcn@latest add button card
```

#### 3. Implementation Workflow

When building UI features:

1. **Identify needed components** - Search the shadcn registry for matching components
2. **Check for examples** - Look for demo/example implementations (e.g., "button-demo", "form example")
3. **Add components** - Use the shadcn CLI to add required components to the project
4. **Import and use** - Import from `@/components/ui/component-name`
5. **Customize** - Modify the component files in `components/ui/` as needed

#### 4. Component Usage Pattern

```tsx
// Import shadcn components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Use in your component
export function MyFeature() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Title</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter name" />
          </div>
          <Button>Submit</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Best Practices

1. **Always check for existing components first** - Don't build custom UI when shadcn has a component
2. **Use the examples** - shadcn provides demo implementations for most components
3. **Leverage pre-built blocks** - For complex patterns (login, dashboard, sidebar), use the block templates
4. **Maintain consistency** - Stick to shadcn's design system and component patterns
5. **Customize in place** - Components are copied to your project, so you can modify them as needed
6. **Verify after adding** - Use `mcp__shadcn__get_audit_checklist` after adding components to ensure everything works

### Project Configuration

This project is configured with:

- Registry: `@shadcn`
- RSC: enabled (Server Components supported)
- Components location: `src/components/ui/`
- Configuration file: `components.json`

View config with: `mcp__shadcn__get_project_registries`

### When Building New Features

1. **Search shadcn registry** for needed components
2. **Check examples/demos** for usage patterns
3. **Add components via CLI** before implementation
4. **Follow shadcn's component composition patterns**
5. **Use Tailwind CSS classes** for styling
6. **Don't create custom components** when shadcn has an equivalent
7. **Don't use other UI libraries** (Material-UI, Chakra, etc.)

---

## Verifying Changes

Run `pnpm lint` and `pnpm typecheck` before handing back to the user. The linter has no warning budget and checks Tailwind classes.
