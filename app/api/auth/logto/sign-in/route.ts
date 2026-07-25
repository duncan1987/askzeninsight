import { signIn } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const connectorId = searchParams.get('connector') || undefined;
  await signIn(logtoConfig, { connectorId });
}
