import { Children, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import { createLogger } from '@/lib/logger'

const logger = createLogger('MarkdownRenderer')

const PORTFOLIO_ID_RE = /\b([A-Z]{2,5}_[A-Z0-9]+(?:-[A-Z0-9]+)*_\d{1,4}[a-zA-Z]?)\b/g

/**
 * Recursively process React children to replace portfolio_id patterns with Link elements.
 * Only processes string children; leaves other React elements untouched.
 */
function linkifyPortfolioIds(children) {
  return Children.map(children, (child) => {
    if (typeof child !== 'string') return child

    const parts = []
    let lastIndex = 0
    let match

    PORTFOLIO_ID_RE.lastIndex = 0
    while ((match = PORTFOLIO_ID_RE.exec(child)) !== null) {
      if (match.index > lastIndex) {
        parts.push(child.slice(lastIndex, match.index))
      }
      const id = match[1]
      parts.push(
        <Link
          key={`${id}-${match.index}`}
          to={`/detail/${id}`}
          className="text-primary underline hover:text-primary/80"
        >
          {id}
        </Link>
      )
      lastIndex = PORTFOLIO_ID_RE.lastIndex
    }

    if (parts.length === 0) return child
    if (lastIndex < child.length) {
      parts.push(child.slice(lastIndex))
    }
    return parts
  })
}

function resolveImageSrc(src) {
  if (!src) return src
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '')

  // Relative path — prepend API base
  if (src.startsWith('/')) {
    return `${baseUrl}${src}`
  }

  // LLM sometimes hallucates a full URL (e.g. https://example.com/api/v1/charts/uuid.png)
  // Extract the path and resolve against the real backend
  const chartMatch = src.match(/\/api\/v1\/charts\/[a-f0-9-]+\.png/)
  if (chartMatch) {
    logger.warning(`Rewriting hallucinated chart URL: ${src} → ${baseUrl}${chartMatch[0]}`)
    return `${baseUrl}${chartMatch[0]}`
  }

  return src
}

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500

function ChartImage({ src, alt }) {
  const resolvedSrc = resolveImageSrc(src)
  const [retries, setRetries] = useState(0)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const handleError = useCallback(() => {
    if (retries < MAX_RETRIES) {
      logger.warning(`Image load failed (attempt ${retries + 1}/${MAX_RETRIES + 1}), retrying: ${resolvedSrc}`)
      setTimeout(() => setRetries(r => r + 1), RETRY_DELAY_MS)
    } else {
      logger.error(`Image load failed after ${MAX_RETRIES + 1} attempts: ${resolvedSrc}`)
      setFailed(true)
    }
  }, [retries, resolvedSrc])

  if (failed) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-border p-3 my-2">
        <span>No se pudo cargar la imagen.</span>
        <a
          href={resolvedSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          Abrir en nueva pestaña
        </a>
      </div>
    )
  }

  return (
    <img
      key={retries}
      src={resolvedSrc}
      alt={alt || 'Gráfico'}
      className={`max-w-full rounded-lg border border-border my-2 ${loaded ? '' : 'bg-muted/20 min-h-[100px]'}`}
      onLoad={() => setLoaded(true)}
      onError={handleError}
    />
  )
}

export function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-sm border border-border rounded">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-1.5 text-left font-medium border-b border-border">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 border-b border-border">{linkifyPortfolioIds(children)}</td>
        ),
        code: ({ inline, className, children }) => {
          if (inline) {
            return (
              <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>
            )
          }
          return (
            <pre className="bg-muted p-3 rounded-md overflow-x-auto my-2">
              <code className={`text-sm font-mono ${className || ''}`}>{children}</code>
            </pre>
          )
        },
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            {children}
          </a>
        ),
        img: ({ src, alt }) => <ChartImage src={src} alt={alt} />,
        p: ({ children }) => <p className="mb-2 last:mb-0">{linkifyPortfolioIds(children)}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{linkifyPortfolioIds(children)}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-1.5 mt-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
        strong: ({ children }) => <strong className="font-semibold">{linkifyPortfolioIds(children)}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/40 pl-3 italic my-2 text-muted-foreground">{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
