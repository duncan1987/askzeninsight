'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { validatePassword, type PasswordRule } from '@/lib/password'
import { encryptPasswordForTransport } from '@/lib/encrypt-password-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Check, X, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')
  const locale = useLocale()

  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: await encryptPasswordForTransport(password) }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'tokenExpired') {
          setError(t('resetTokenExpired'))
        } else if (data.error === 'tokenUsed') {
          setError(t('resetTokenUsed'))
        } else if (data.error === 'invalidToken') {
          setError(t('resetTokenInvalid'))
        } else if (data.error === 'passwordTooWeak') {
          setError(t('passwordTooWeak'))
        } else {
          setError(t('resetFailed'))
        }
        return
      }

      setResetDone(true)
    } catch {
      setError(t('resetFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const passwordRules = password ? validatePassword(password).rules : []
  const passwordIsValid = password ? validatePassword(password).isValid : false

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
            {t('resetPasswordTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {resetDone ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm text-green-800">
                  {t('resetSuccess')}
                </div>
              </div>
              <Button
                onClick={() => router.push('/auth/sign-in')}
                className="w-full bg-amber-700 hover:bg-amber-800"
              >
                {t('goToSignIn')}
              </Button>
            </div>
          ) : !token ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {t('resetTokenMissing')}
              </div>
              <Button
                onClick={() => router.push('/auth/forgot-password')}
                variant="outline"
                className="w-full"
              >
                {t('forgotPasswordTitle')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('newPassword')}
                </label>
                <Input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password && (
                  <div className="mt-2 space-y-1">
                    {passwordRules.map((rule: PasswordRule) => (
                      <div key={rule.key} className="flex items-center gap-1 text-xs">
                        {rule.passed ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <X className="h-3 w-3 text-gray-300" />
                        )}
                        <span className={rule.passed ? 'text-green-600' : 'text-gray-400'}>
                          {t(rule.label)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('confirmPassword')}
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{t('passwordMismatch')}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800"
                disabled={isLoading || !passwordIsValid || password !== confirmPassword}
              >
                {isLoading ? t('loading') : t('resetPasswordSubmit')}
              </Button>
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
