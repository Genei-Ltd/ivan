import pg from 'pg'

const { Pool } = pg

const SSL_QUERY_PARAMS = [
  'ssl',
  'sslmode',
  'sslcert',
  'sslkey',
  'sslrootcert',
  'sslcertmode',
  'uselibpqcompat',
]

export function postgresConnectionString(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL
}

function shouldUseSsl(url: URL): boolean {
  const sslMode = url.searchParams.get('sslmode')
  return (
    url.hostname.endsWith('.aivencloud.com') ||
    Boolean(sslMode && sslMode !== 'disable')
  )
}

export function createPostgresPool(options: { max?: number } = {}): pg.Pool {
  const rawUrl = postgresConnectionString()
  if (!rawUrl) {
    throw new Error('DATABASE_URL or POSTGRES_URL is required')
  }

  const url = new URL(rawUrl)
  const useSsl = shouldUseSsl(url)
  for (const param of SSL_QUERY_PARAMS) {
    url.searchParams.delete(param)
  }

  const config: pg.PoolConfig = {
    connectionString: url.toString(),
    max: options.max,
  }
  if (useSsl) {
    config.ssl = { rejectUnauthorized: false }
  }

  return new Pool(config)
}
