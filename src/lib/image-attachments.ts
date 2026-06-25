export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const

export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(',')
export const MAX_IMAGE_ATTACHMENTS = 6
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

const IMAGE_EXTENSIONS: Record<(typeof IMAGE_MIME_TYPES)[number], string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function isSupportedImageMime(
  mimeType: string,
): mimeType is (typeof IMAGE_MIME_TYPES)[number] {
  return IMAGE_MIME_TYPES.includes(
    mimeType.toLowerCase() as (typeof IMAGE_MIME_TYPES)[number],
  )
}

export function imageExtension(mimeType: string): string {
  return isSupportedImageMime(mimeType) ? IMAGE_EXTENSIONS[mimeType] : 'png'
}

export function mimeTypeFromFilename(name: string): string | undefined {
  const extension = name.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    default:
      return undefined
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`
  }
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = units[0]
  for (let i = 1; i < units.length && value >= 1024; i += 1) {
    value /= 1024
    unit = units[i]
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`
}
