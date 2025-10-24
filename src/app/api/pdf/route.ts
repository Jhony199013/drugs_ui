import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return new Response('Missing url', { status: 400 })
  }

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        // Прокидываем базовые заголовки, без кук
        'Accept': 'application/pdf,*/*',
        'Cache-Control': 'no-cache'
      },
      // Без credentials, чтобы не было CORS с куками
      redirect: 'follow'
    })

    if (!upstream.ok) {
      return new Response('Upstream error', { status: upstream.status })
    }

    const bytes = await upstream.arrayBuffer()
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=60'
      }
    })
  } catch (e) {
    return new Response('Fetch error', { status: 502 })
  }
}


