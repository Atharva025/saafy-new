import { viteBackendMiddleware } from '../src/backend/server.js'

export const config = {
  api: {
    bodyParser: false, // Let our backend stream parser handle request body parsing
  },
}

export default async function handler(req, res) {
  try {
    await viteBackendMiddleware(req, res, () => {
      // If the middleware calls next(), the route was not handled
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Route not matched by backend middleware' }))
    })
  } catch (err) {
    console.error('Serverless API Error:', err)
    if (!res.writableEnded) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }))
    }
  }
}
