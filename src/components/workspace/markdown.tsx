import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

// Custom renderers, mirroring the agent-tw chat: bordered tables that scroll
// horizontally and code blocks that don't blow out the message width.
const components: Components = {
  table({ children }) {
    return (
      <div className="my-[1.5em] w-full overflow-x-auto">
        <table className="border-border m-0 w-full border-collapse border">
          {children}
        </table>
      </div>
    )
  },
  th({ children }) {
    return (
      <th className="border-border bg-muted min-w-28 border px-3 py-2 text-left">
        {children}
      </th>
    )
  },
  td({ children }) {
    return (
      <td className="border-border min-w-28 border px-3 py-2">{children}</td>
    )
  },
  pre({ children }) {
    return (
      <pre className="border-border w-full overflow-x-auto border">
        {children}
      </pre>
    )
  },
  a({ children, href }) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  },
}

const remarkPlugins = [remarkGfm]
const remarkPluginsWithBreaks = [remarkGfm, remarkBreaks]

function MarkdownImpl({
  children,
  small,
  withBreaks,
  className,
}: {
  children: string
  small?: boolean
  withBreaks?: boolean
  className?: string
}) {
  return (
    <article
      className={cn(
        'prose dark:prose-invert max-w-none wrap-break-word',
        small && 'prose-sm',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={withBreaks ? remarkPluginsWithBreaks : remarkPlugins}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </article>
  )
}

export const Markdown = memo(MarkdownImpl)
