import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check if webhooks are being received
 * This creates a simple log that can be checked
 * POST /api/debug/webhook-log
 */
export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headers = Object.fromEntries(req.headers.entries())

    console.log('[Webhook Debug] Received webhook:')
    console.log('[Webhook Debug] Headers:', JSON.stringify(headers, null, 2))
    console.log('[Webhook Debug] Body:', body)

    // Try to parse the body
    try {
      const json = JSON.parse(body)
      console.log('[Webhook Debug] Parsed JSON:', JSON.stringify(json, null, 2))
    } catch {
      console.log('[Webhook Debug] Body is not valid JSON')
    }

    return NextResponse.json({
      received: true,
      message: 'Webhook logged. Check Vercel logs for details.',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Webhook Debug] Error:', error)
    return NextResponse.json(
      { error: 'Failed to log webhook' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to retrieve webhook logs
 */
const webhookLogs: Array<{
  timestamp: string
  headers: Record<string, string>
  body: string
}> = []

export async function GET() {
  return NextResponse.json({
    logs: webhookLogs,
    count: webhookLogs.length,
  })
}
