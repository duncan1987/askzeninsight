'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

function Avatar({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
}

interface AvatarImageProps extends React.ComponentProps<typeof AvatarPrimitive.Image> {
  src?: string
}

function AvatarImage({
  className,
  src,
  onLoadingStatusChange,
  ...props
}: AvatarImageProps) {
  // For Google avatars, add a cache-busting parameter that changes daily
  // This allows browser to cache the image for a day while allowing refreshes
  const cachedSrc = React.useMemo(() => {
    if (!src) return src

    // Add cache parameter to allow long browser caching
    if (src.includes('googleusercontent.com')) {
      const url = new URL(src)
      const date = new Date()
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      url.searchParams.set('cache', dayKey)
      return url.toString()
    }
    return src
  }, [src])

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      src={cachedSrc}
      onLoadingStatusChange={onLoadingStatusChange}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
