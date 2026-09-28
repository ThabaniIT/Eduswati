// lib/supabase/admin.ts
// ⚠️  ONLY import this in server-side API routes or Server Actions.
// Never expose the service role key to the browser.
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
