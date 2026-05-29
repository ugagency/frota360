import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Service-role client (bypass RLS). Usar APENAS em:
 *  - Server Actions / Route Handlers
 *  - Operações administrativas (criar tenant, cleanup de signup, webhooks)
 *
 * NUNCA importar de Client Components — o `server-only` quebra o build.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )
}
