import { signOut } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';

export async function POST() {
  const returnTo = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  await signOut(logtoConfig, returnTo);
}
