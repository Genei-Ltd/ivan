import type { NextConfig } from 'next'

function devOriginHost(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  try {
    return new URL(value).hostname
  } catch {
    return value.replace(/^https?:\/\//, '').split('/')[0]
  }
}

const allowedDevOrigins = Array.from(
  new Set(
    [
      process.env.IVAN_APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      ...(process.env.IVAN_ALLOWED_DEV_ORIGINS ?? '').split(','),
    ]
      .map((value) => devOriginHost(value?.trim()))
      .filter((host): host is string => Boolean(host)),
  ),
)

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16 — no opt-in needed.
  // Configure Turbopack-specific options here if needed:
  // turbopack: {},

  // React Compiler: automatic memoization, no manual React.memo/useMemo needed
  reactCompiler: true,

  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
}

export default nextConfig
