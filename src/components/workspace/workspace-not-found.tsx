import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function WorkspaceNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Session not found</h1>
      <p className="text-muted-foreground">It may have been torn down.</p>
      <Button asChild variant="outline">
        <Link href="/">Start a new session</Link>
      </Button>
    </div>
  )
}
