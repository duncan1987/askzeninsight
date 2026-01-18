'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      // Navigate to the portal API route which will redirect to Creem
      window.location.href = '/api/creem/portal'
    } catch (error) {
      console.error('Failed to open billing portal:', error)
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Opening...
        </>
      ) : (
        'Manage billing'
      )}
    </Button>
  )
}
