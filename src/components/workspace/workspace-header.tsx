import Link from 'next/link'
import { Loader2Icon } from 'lucide-react'
import type { SessionStatus } from '@/lib/shell/types'
import { IvanLogo } from '@/components/layout/ivan-logo'
import { Badge } from '@/components/ui/badge'
import {
  STATUS_LABEL,
  statusVariant,
} from '@/components/workspace/workspace-status'

export function WorkspaceHeader({
  busy,
  status,
}: {
  busy: boolean
  status: SessionStatus | 'connecting'
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
        <IvanLogo className="size-7 rounded-lg" sizes="28px" />
        <span>Ivan</span>
      </Link>
      <div className="flex items-center gap-2">
        {busy && (
          <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
        )}
        <Badge variant={statusVariant(status)}>{STATUS_LABEL[status]}</Badge>
      </div>
    </header>
  )
}
