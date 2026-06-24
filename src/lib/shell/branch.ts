import { randomUUID } from 'node:crypto'

// Deterministic, readable branch name from the task prompt plus a short unique
// suffix. A slug keeps it dependency-free and offline.
export function branchNameFromPrompt(prompt: string): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  const suffix = randomUUID().slice(0, 6)
  return `agent/${slug || 'change'}-${suffix}`
}
