const KNOWN_SLACK_MENTIONS = new Map([
  ['U0BD2NNU1UJ', 'Ivan'],
  ['U0BCNJD9LG7', 'yvonne'],
])

const SLACK_MENTION_PATTERN = /<@([A-Z0-9_]+)(?:\|[^>]+)?>|@([A-Z0-9_]+)\b/g

export function normalizeKnownSlackMentions(text: string): string {
  return text.replace(SLACK_MENTION_PATTERN, (match, tokenId, plainId) => {
    const name = KNOWN_SLACK_MENTIONS.get(String(tokenId ?? plainId))
    return name ? `@${name}` : match
  })
}
