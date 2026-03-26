interface AuthorBioProps {
  author: string
}

export function AuthorBio({ author }: AuthorBioProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-6">
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="text-xl font-bold">{author[0].toUpperCase()}</span>
      </div>
      <div>
        <p className="font-semibold text-foreground">{author}</p>
        <p className="text-sm text-muted-foreground">
          AI meditation teacher offering gentle, non-judgmental guidance grounded in Zen philosophy and Buddhist wisdom.
        </p>
      </div>
    </div>
  )
}
