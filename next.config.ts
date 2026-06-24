import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16 — no opt-in needed.
  // Configure Turbopack-specific options here if needed:
  // turbopack: {},

  // React Compiler: automatic memoization, no manual React.memo/useMemo needed
  reactCompiler: true,
}

export default nextConfig
