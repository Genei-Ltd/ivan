# Next.js Vibe Coding Template

A modern, batteries-included Next.js template designed to get you into the flow quickly. Skip the setup and start building.

## Ivan

Ivan (a play on Aiven) is a self-hostable, Lovable-style shell: describe a change in plain English and Ivan edits a locked template repo on a fresh branch inside a Vercel Sandbox, you watch the result live in an iframe, then ship a PR. It runs in-process, with in-memory sessions and env-based tokens, so there's no database or per-user auth to stand up.

### How it works

- `src/lib/shell/` — the engine: provision a sandbox, clone the target repo, install deps + the Claude Code CLI, start `next dev` on an exposed port, run the agent (stream-json), commit/push, open the PR.
- `src/lib/shell/claude-skills/` — Ivan-owned Claude Code skills copied into the sandbox as `~/.claude/skills/*` before each agent run.
- `src/lib/shell/store.ts` — in-memory sessions + a per-session SSE event bus.
- `src/app/api/sessions/**` — create / list / event-stream / message / resume / submit.
- `src/app/page.tsx` + `src/app/workspace/[id]` — launcher and the chat-plus-live-preview workspace.

The agent runs **inside** the sandbox (the same model as a local coding agent), so its secrets live in the sandbox. Suitable for an internal, single-process deployment.

### Running it

1. Copy `.env.example` to `.env` and fill it in (Anthropic key, target repo, GitHub token, Vercel Sandbox credentials).
2. `pnpm dev`, open the app, describe a change, and watch the preview.

### Slack input

Slack messages use the same Ivan session flow as the app text box, via Chat SDK's official Slack adapter.

1. Set `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET`. Set `IVAN_APP_URL` to your deployed app URL if you want Slack replies to link to the workspace.
2. In Slack, set the Events API request URL to `https://your-domain.com/api/webhooks/slack`.
3. Add bot scopes for the surfaces you want: `chat:write`, `app_mentions:read`, `channels:history`, `channels:read`, `groups:history`, `groups:read`, `im:history`, `im:read`, `mpim:history`, and `mpim:read`.
4. Subscribe to `app_mention`, `message.channels`, `message.groups`, `message.im`, and `message.mpim`.

Mention Ivan in a Slack thread or DM it directly. The first message creates an Ivan workspace session; later Slack messages in that same thread are sent to the same session.

### Sandbox preview HMR

Next.js 16 defaults to Turbopack, whose HMR can be unreliable behind the sandbox proxy, so `src/lib/shell/creation.ts` starts sandboxed dev servers with `--webpack`. Ivan's own dev server allowlists hosts from `IVAN_APP_URL`, `NEXT_PUBLIC_APP_URL`, and `IVAN_ALLOWED_DEV_ORIGINS` so it can run behind ngrok or another tunnel.

Before booting a Next 16 target app, Ivan also adds the sandbox preview host to that app's `allowedDevOrigins` so `/_next` dev resources can load from the public `sb-*.vercel.run` iframe, and injects `devIndicators: false` so the preview iframe does not show Next's development indicator.

Those runtime preview config edits are marked `assume-unchanged` inside the sandbox clone, then removed and unhidden before Ivan commits the agent's generated PR.

Ivan creates named persistent Vercel Sandboxes for new sessions. If a sandbox stops, the workspace can reattach by name and restart the dev server while the Ivan session record still exists in memory.

## What's Included

This template comes pre-configured with everything you need for modern Next.js development:

### Core Stack

- **Next.js 16** with App Router and Turbopack
- **React 19** with Server Components by default
- **React Compiler** for automatic memoization
- **TypeScript** with strict mode
- **pnpm** as the package manager
- **Tailwind CSS v4** for styling
- **shadcn/ui** component system with reusable design-system components

### Developer Experience

- **ESLint** with Next.js and React-specific rules
- **Prettier** for consistent code formatting
- **Husky** + **lint-staged** for pre-commit hooks
- **Path aliases** configured (`@/` imports)
- **Styleguide** route at `/styleguide`

### AI-Enhanced Development

- **MCP servers** pre-configured:
  - shadcn component integration
  - CoLoop.ai documentation access
- **AI Agents** optimized with custom instructions

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Using shadcn/ui Components

This template includes a reusable design system in `src/components/ui`, layout primitives in `src/components/layout`, and tokens in `src/app/globals.css`.

Open `/styleguide` to inspect the tokens and components.

Add more shadcn/ui components as needed:

```bash
# Add individual components
pnpm dlx shadcn@latest add button card dialog

# Or use the MCP tools in Claude Code/OpenAI Codex
# Search for components, view examples, and add them interactively
```

Example usage:

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

## Project Structure

```
next-vibe-template/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── styleguide/         # Design-system verification page
│   │   ├── globals.css         # Global styles + Tailwind theme
│   │   ├── loading.tsx         # Root loading state
│   │   ├── error.tsx           # Root error boundary
│   │   └── not-found.tsx       # 404 page
│   ├── components/
│   │   ├── layout/             # Layout primitives
│   │   └── ui/                 # Design-system components
│   ├── providers/              # Theme and motion providers
│   ├── hooks/                  # Custom React hooks
│   └── lib/
│       └── utils.ts            # Utility functions
├── public/                     # Static assets
├── AGENTS.md                   # Project instructions for agents
└── components.json             # shadcn configuration
```

## Development Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Run strict ESLint
pnpm typecheck              # Type checking
pnpm format                 # Format with Prettier
pnpm format:check           # Check formatting
```

## Why pnpm?

This template uses **pnpm** because it is:

- Faster for package installation
- Strict about dependency resolution
- Widely supported in Node.js projects
- Simple to use in scripts and CI

New dependency versions must wait seven days before pnpm can install them. This is configured in `pnpm-workspace.yaml` as a supply-chain safety delay.

Common npm commands map cleanly to `pnpm`:

- `npm install` -> `pnpm install`
- `npm run dev` -> `pnpm dev`
- `npm run build` -> `pnpm build`

## Customization

### Add More Components

Browse and add components from the shadcn registry:

```bash
# List available components
pnpm dlx shadcn@latest

# Add specific components
pnpm dlx shadcn@latest add [component-name]
```

### Modify Tailwind Theme

Edit the CSS variables in `src/app/globals.css` to customize your design system. The template uses Tailwind v4 with CSS-based configuration.

Use `/styleguide` to verify changes across light mode, dark mode, tokens, typography, and components.

## AI Development

This template is optimized for AI-assisted development:

- **AGENTS.md**: Project guidelines for AI agents
- **MCP Integration**: Pre-configured servers for enhanced capabilities

When using Claude Code or OpenAI Codex, the AI will automatically:

- Use pnpm for package management
- Prefer shadcn components over custom UI
- Use Server Components by default
- Follow Next.js App Router conventions
- Follow the project's code style and conventions

## Tech Stack Details

| Technology   | Version | Purpose              |
| ------------ | ------- | -------------------- |
| Next.js      | 16.2.9  | React meta-framework |
| React        | 19.2.7  | UI framework         |
| TypeScript   | ~6.0.3  | Type safety          |
| Tailwind CSS | 4.3.1   | Styling              |
| shadcn/ui    | Latest  | Component library    |
| pnpm         | Latest  | Package manager      |
| ESLint       | 10.5.0  | Code linting         |
| Prettier     | 3.8.4   | Code formatting      |

## License

MIT

---

**Happy coding!** Get in the vibe and start building.
