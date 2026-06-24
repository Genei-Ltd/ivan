import { Octokit } from '@octokit/rest'
import { getEnv, parseRepo } from '@/lib/env'

export interface PullRequest {
  url: string
  number: number
}

// Open a PR from the session branch back into the base branch.
export async function createPullRequest(
  branch: string,
  title: string,
  body: string,
): Promise<PullRequest> {
  const env = getEnv()
  const { owner, repo } = parseRepo(env.TARGET_REPO_URL)
  const octokit = new Octokit({ auth: env.GITHUB_TOKEN })

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
