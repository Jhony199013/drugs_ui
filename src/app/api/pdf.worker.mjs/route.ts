import { readFile } from 'fs/promises'
import { createRequire } from 'module'

export async function GET() {
  try {
    const require = createRequire(import.meta.url)
    const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
    const code = await readFile(workerPath)

    // ✅ Преобразуем Buffer → ArrayBuffer с явным приведением типа
    const arrayBuffer = code.buffer.slice(
      code.byteOffset,
      code.byteOffset + code.byteLength
    ) as ArrayBuffer

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e) {
    return new Response('Worker mjs not found', { status: 500 })
  }
}
