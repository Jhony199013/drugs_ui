import { readFile } from 'fs/promises'

export async function GET() {
  const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
  const code = await readFile(workerPath)

  const arrayBuffer = code.buffer.slice(
    code.byteOffset,
    code.byteOffset + code.byteLength
  )

  return new Response(arrayBuffer as BodyInit, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
