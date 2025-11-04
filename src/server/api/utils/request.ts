import type { Connect } from 'vite'

/**
 * Helper function to parse request body efficiently
 */
export async function parseRequestBody(req: Connect.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = []
  
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }
  
  const body = Buffer.concat(chunks).toString('utf-8')
  return JSON.parse(body)
}
