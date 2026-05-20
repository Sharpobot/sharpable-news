import { inngest } from '@/lib/inngest'

export const testConnection = inngest.createFunction(
  { id: 'test-connection', name: 'Test Connection', triggers: [{ event: 'test/connection' }] },
  async ({ event, step }) => {
    await step.run('log-message', async () => {
      console.log('Inngest is working')
      return { message: 'Inngest is working' }
    })

    return { success: true, message: 'Inngest is working' }
  }
)
