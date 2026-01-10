import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function SubscriptionButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/pricing">Subscription</Link>
    </Button>
  )
}
