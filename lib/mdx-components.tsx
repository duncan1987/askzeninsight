import Image from 'next/image'
import Link from 'next/link'
import type { MDXComponents } from 'mdx/types'

export function getMdxComponents(): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-6 mt-10 text-3xl font-bold tracking-tight text-foreground first:mt-0 md:text-4xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-4 mt-10 text-2xl font-semibold tracking-tight text-foreground scroll-mt-20 md:text-3xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-8 text-xl font-semibold text-foreground scroll-mt-20">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-2 mt-6 text-lg font-semibold text-foreground">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="mb-6 text-base leading-7 text-muted-foreground">{children}</p>
    ),
    a: ({ href, children }) => {
      if (href?.startsWith('/')) {
        return (
          <Link href={href} className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
            {children}
          </Link>
        )
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
          {children}
        </a>
      )
    },
    ul: ({ children }) => (
      <ul className="mb-6 ml-6 list-disc space-y-2 text-base leading-7 text-muted-foreground marker:text-primary/60">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-6 ml-6 list-decimal space-y-2 text-base leading-7 text-muted-foreground marker:text-primary/60">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="pl-1">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-primary/40 bg-muted/50 py-4 pl-6 pr-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="my-10 border-border" />
    ),
    img: ({ src, alt }) => {
      if (!src) return null
      if (src.startsWith('/')) {
        return (
          <figure className="my-8">
            <Image
              src={src}
              alt={alt || ''}
              width={800}
              height={450}
              className="w-full rounded-lg border border-border"
            />
            {alt && (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {alt}
              </figcaption>
            )}
          </figure>
        )
      }
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt || ''} className="w-full rounded-lg border border-border" />
          {alt && (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {alt}
            </figcaption>
          )}
        </figure>
      )
    },
    pre: ({ children }) => (
      <pre className="my-6 overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-sm leading-relaxed">
        {children}
      </pre>
    ),
    code: ({ children }) => {
      if (typeof children === 'string' && !children.includes('\n')) {
        return (
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">
            {children}
          </code>
        )
      }
      return <code className="text-sm font-mono">{children}</code>
    },
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    table: ({ children }) => (
      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border bg-muted/50 px-4 py-2 text-left font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-4 py-2 text-muted-foreground">
        {children}
      </td>
    ),
  }
}
