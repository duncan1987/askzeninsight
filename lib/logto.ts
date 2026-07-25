import { LogtoNextConfig, UserScope } from '@logto/next';

export const logtoConfig: LogtoNextConfig = {
  appId: process.env.LOGTO_APP_ID || '',
  appSecret: process.env.LOGTO_APP_SECRET || '',
  endpoint: process.env.LOGTO_ENDPOINT || '',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  cookieSecret: process.env.LOGTO_COOKIE_SECRET || 'change_this_to_a_secure_secret_at_least_32_chars',
  cookieSecure: process.env.NODE_ENV === 'production',
  scopes: [UserScope.Email, UserScope.Profile],
};
