import { NextResponse } from 'next/server'
import { getAuthPublicKeyInfo } from '@/lib/auth-crypto'

export const runtime = 'nodejs'

export async function GET() {
  const info = getAuthPublicKeyInfo()
  if (!info) {
    return NextResponse.json(
      { error: 'notConfigured' },
      { status: 501, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  return NextResponse.json(info, { headers: { 'Cache-Control': 'no-store' } })
}
