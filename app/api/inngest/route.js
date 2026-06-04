import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { testConnection } from '@/lib/functions/test-connection'
import { generateArticle, searchTopics } from '@/lib/inngest-functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [testConnection, generateArticle, searchTopics],
})
