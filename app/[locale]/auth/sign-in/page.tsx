'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { validatePassword, type PasswordRule } from '@/lib/password'
import { validateUsername } from '@/lib/username'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Check, X, ArrowLeft } from 'lucide-react'

type TabType = 'signIn' | 'register'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')
  const locale = useLocale()

  const redirectTo = searchParams.get('redirect') || '/'

  const [activeTab, setActiveTab] = useState<TabType>('signIn')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'accountPending') {
          setError(t('accountPending'))
        } else if (data.error === 'accountRejected') {
          setError(t('accountRejected'))
        } else {
          setError(t('invalidCredentials'))
        }
        return
      }

      router.push(redirectTo)
    } catch {
      setError(t('signInFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
      setUsernameError(t(usernameValidation.errorKey!))
      return
    }
    setUsernameError(null)

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, nickname, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'usernameExists') {
          setError(t('usernameExists'))
        } else if (data.error === 'usernameReserved') {
          setError(t('usernameReserved'))
        } else if (data.error === 'usernameInvalid') {
          setError(t('usernameInvalid'))
        } else if (data.error === 'passwordTooWeak') {
          setError(t('passwordTooWeak'))
        } else {
          setError(t('registerFailed'))
        }
        return
      }

      setSuccessMessage(t('registerPendingApproval'))
      setUsername('')
      setPassword('')
      setNickname('')
      setConfirmPassword('')
    } catch {
      setError(t('registerFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUsernameBlur = () => {
    if (username) {
      const validation = validateUsername(username)
      if (!validation.isValid) {
        setUsernameError(t(validation.errorKey!))
      } else {
        setUsernameError(null)
      }
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
            {activeTab === 'signIn' ? t('signInTab') : t('registerTab')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex mb-6 border-b">
            <button
              type="button"
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'signIn'
                  ? 'text-amber-700 border-b-2 border-amber-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => { setActiveTab('signIn'); setError(null); setSuccessMessage(null) }}
            >
              {t('signInTab')}
            </button>
            <button
              type="button"
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-amber-700 border-b-2 border-amber-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => { setActiveTab('register'); setError(null); setSuccessMessage(null) }}
            >
              {t('registerTab')}
            </button>
          </div>

          {activeTab === 'signIn' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password')}
                </label>
                <Input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => router.push('/auth/forgot-password')}
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800"
                disabled={isLoading}
              >
                {isLoading ? t('loading') : t('signIn')}
              </Button>
              <div className="text-center text-sm text-gray-500">
                {t('noAccount')}{' '}
                <button
                  type="button"
                  className="text-amber-700 hover:underline"
                  onClick={() => { setActiveTab('register'); setError(null); setSuccessMessage(null) }}
                >
                  {t('goToRegister')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
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
                  onChange={(e) => { setUsername(e.target.value); setUsernameError(null) }}
                  onBlur={handleUsernameBlur}
                  required
                />
                {usernameError && (
                  <p className="mt-1 text-xs text-red-600">{usernameError}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {t('usernameInvalid')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('nickname')}
                </label>
                <Input
                  type="text"
                  name="nickname"
                  autoComplete="name"
                  placeholder={t('nicknamePlaceholder')}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password')}
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
                disabled={isLoading || (password.length > 0 && !passwordIsValid) || (confirmPassword.length > 0 && password !== confirmPassword)}
              >
                {isLoading ? t('loading') : t('register')}
              </Button>
              <div className="text-center text-sm text-gray-500">
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  className="text-amber-700 hover:underline"
                  onClick={() => { setActiveTab('signIn'); setError(null); setSuccessMessage(null) }}
                >
                  {t('goToSignIn')}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('backToHome')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
