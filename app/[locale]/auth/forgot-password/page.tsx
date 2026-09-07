'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const locale = useLocale()

  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(t('resetRequestFailed'))
        return
      }

      setSubmitted(true)
    } catch {
      setError(t('resetRequestFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (locale !== 'zh') {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <span className="text-xl font-bold text-amber-800">空寂</span>
          </div>
          <CardTitle className="text-lg text-gray-600">
            {t('forgotPasswordTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm text-green-800">
                  {t('resetRequestSubmitted')}
                </div>
              </div>
              <Button
                onClick={() => router.push('/auth/sign-in')}
                variant="outline"
                className="w-full"
              >
                {t('goToSignIn')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('username')}
                </label>
                <Input
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder={t('usernamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800"
                disabled={isLoading || !username}
              >
                {isLoading ? t('loading') : t('submitResetRequest')}
              </Button>
              <p className="text-xs text-gray-400 text-center">
                {t('resetRequestHint')}
              </p>
            </form>
          )}

          <div className="mt-6 pt-4 border-t text-center">
            <button
              type="button"
              onClick={() => router.push('/auth/sign-in')}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('goToSignIn')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
