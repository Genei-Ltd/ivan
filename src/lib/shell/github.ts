import { Octokit } from '@octokit/rest'
import { getEnv, parseRepo } from '@/lib/env'

export interface GitHubIdentity {
  login: string
  name: string
  email: string
}

export interface PullRequest {
  url: string
  number: number
}

let cachedIdentity: Promise<GitHubIdentity> | null = null

function getOctokit(): Octokit {
  return new Octokit({ auth: getEnv().GITHUB_TOKEN })
}

function verifiedPrimaryEmail(
  emails: { email?: string; primary?: boolean; verified?: boolean }[],
): string | undefined {
  return (
    emails.find((email) => email.primary && email.verified)?.email ??
    emails.find((email) => email.verified)?.email ??
    emails.find((email) => email.email)?.email
  )
}

async function fetchAuthenticatedGitHubIdentity(): Promise<GitHubIdentity> {
  const octokit = getOctokit()
  const { data: user } = await octokit.users.getAuthenticated()

  let email =
    typeof user.email === 'string' && user.email.length > 0
      ? user.email
      : undefined

  try {
    const { data: emails } = await octokit.request('GET /user/emails')
    email = verifiedPrimaryEmail(emails) ?? email
  } catch {
    // Fine-grained tokens may not expose private email addresses. The noreply
    // form still attributes commits to the authenticated GitHub account.
  }

  return {
    login: user.login,
    name:
      typeof user.name === 'string' && user.name.trim().length > 0
        ? user.name
        : user.login,
    email: email ?? `${String(user.id)}+${user.login}@users.noreply.github.com`,
  }
}

export function getAuthenticatedGitHubIdentity(): Promise<GitHubIdentity> {
  cachedIdentity ??= fetchAuthenticatedGitHubIdentity()
  return cachedIdentity
}

// Open a PR from the session branch back into the base branch.
export async function createPullRequest(
  branch: string,
  title: string,
  body: string,
): Promise<PullRequest> {
  const env = getEnv()
  const { owner, repo } = parseRepo(env.TARGET_REPO_URL)
  const octokit = getOctokit()

  const { data } = await octokit.pulls.create({
    owner,
    repo,
    head: branch,
    base: env.TARGET_REPO_BRANCH,
    title,
    body,
  })

  return { url: data.html_url, number: data.number }
}
