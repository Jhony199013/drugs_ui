import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

export async function GET() {
  try {
    const require = createRequire(import.meta.url)
    const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
    const code = await readFile(workerPath)
    return new Response(code, {
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (e) {
    return new Response('Worker mjs not found', { status: 500 })
  }
}


