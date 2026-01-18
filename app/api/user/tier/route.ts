import { createClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/subscription'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({
      tier: 'anonymous',
      model: 'glm-4-flash',
      saveHistory: false,
      authenticated: false,
    })
  }

  // First try cookie-based auth
  let user = null
  const { data: { user: cookieUser } } = await supabase.auth.getUser()

  if (cookieUser) {
    user = cookieUser
  } else {
    // Try Bearer token from Authorization header
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user: tokenUser } } = await supabase.auth.getUser(token)
      user = tokenUser
    }
  }

  if (!user) {
    return NextResponse.json({
      tier: 'anonymous',
      model: 'glm-4-flash',
      saveHistory: false,
      authenticated: false,
    })
  }

  const subscription = await getUserSubscription(user.id)

  return NextResponse.json({
    ...subscription,
    authenticated: true,
    email: user.email,
  })
}
