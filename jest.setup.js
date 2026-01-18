// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
process.env.CREEM_API_KEY = process.env.CREEM_API_KEY || 'test_key'
process.env.CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || 'test_secret'
process.env.ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || 'test_zhipu_key'
process.env.ZHIPU_API_FREE = process.env.ZHIPU_API_FREE || 'test_zhipu_free_key'
