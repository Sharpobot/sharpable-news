import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { testConnection } from '@/lib/functions/test-connection'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [testConnection],
})
