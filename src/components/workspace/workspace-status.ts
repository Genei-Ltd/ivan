import type { SessionStatus } from '@/lib/shell/types'

export const STATUS_LABEL: Record<SessionStatus | 'connecting', string> = {
  connecting: 'Connecting',
  creating: 'Provisioning',
  ready: 'Ready',
  working: 'Working',
  submitting: 'Opening PR',
  submitted: 'PR opened',
  error: 'Error',
  stopped: 'Stopped',
}

export function statusVariant(
  status: SessionStatus | 'connecting',
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'error') {
    return 'destructive'
  }
  if (status === 'ready' || status === 'submitted') {
    return 'default'
  }
  if (status === 'stopped') {
    return 'outline'
  }
  return 'secondary'
}
