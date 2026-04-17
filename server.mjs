import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import server from './dist/server/server.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const clientDir = join(__dirname, 'dist/client')
const port = process.env.PORT || 3000

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const filePath = join(clientDir, url.pathname)

  if (!filePath.startsWith(clientDir)) {
    res.writeHead(403)
    res.end()
    return
  }

  try {
    const fileStat = await stat(filePath)
    if (fileStat.isFile()) {
      const ext = extname(filePath)
      const mime = MIME_TYPES[ext] || 'application/octet-stream'
      const data = await readFile(filePath)
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      })
      res.end(data)
      return
    }
  } catch {}

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value)
  }
  const request = new Request(url, {
    method: req.method,
    headers,
    body:
      req.method !== 'GET' && req.method !== 'HEAD'
        ? await new Promise((resolve) => {
            const chunks = []
            req.on('data', (chunk) => chunks.push(chunk))
            req.on('end', () => resolve(Buffer.concat(chunks)))
          })
        : undefined,
  })

  const response = await server.fetch(request)

  res.writeHead(response.status, Object.fromEntries(response.headers))
  if (response.body) {
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
  }
  res.end()
}).listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
