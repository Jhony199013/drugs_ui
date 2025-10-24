import { readFile } from 'fs/promises'

export async function GET() {
  const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
  const code = await readFile(workerPath)

  // ✅ Преобразуем Buffer в Uint8Array
  const uint8Array = new Uint8Array(code)

  return new Response(uint8Array, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}


