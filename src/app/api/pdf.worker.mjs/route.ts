import { readFile } from 'fs/promises'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // В некоторых версиях есть только не-минимизированный файл и/или legacy-ветка
    const candidates = [
      'pdfjs-dist/build/pdf.worker.mjs',
      'pdfjs-dist/build/pdf.worker.min.mjs',
      'pdfjs-dist/legacy/build/pdf.worker.mjs',
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    ] as const

    let resolvedPath: string | null = null
    for (const candidate of candidates) {
      try {
        // require.resolve доступен в Node.js рантайме
        resolvedPath = require.resolve(candidate)
        break
      } catch {
        // пробуем следующий
      }
    }

    if (!resolvedPath) {
      return new Response('Worker mjs not found', { status: 500 })
    }

    const code = await readFile(resolvedPath)

    // Преобразуем Buffer → ArrayBuffer с явным приведением типа
    const arrayBuffer = code.buffer.slice(
      code.byteOffset,
      code.byteOffset + code.byteLength
    ) as ArrayBuffer

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e) {
    return new Response('Worker mjs not found', { status: 500 })
  }
}
