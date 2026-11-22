import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const originalFetch = globalThis.fetch
try {
  const { askAssistant, SchemeApiError } = await server.ssrLoadModule('/src/services/schemeService.ts')
  let requestUrl = ''
  let requestInit
  globalThis.fetch = async (url, init) => {
    requestUrl = String(url)
    requestInit = init
    return {
      ok: true,
      status: 200,
      json: async () => ({ answer: 'General reply', status: 'answered', sources: [], stored: false }),
    }
  }
  const history = Array.from({ length: 10 }, (_, index) => ({ role: 'user', content: `Question ${index}` }))
  const result = await askAssistant('Hello', 'te', history)
  assert.match(requestUrl, /\/api\/assistant\/chat$/)
  assert.equal(requestInit.method, 'POST')
  assert.equal(requestInit.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(requestInit.body), { message: 'Hello', language: 'te', history: history.slice(-8) })
  assert.deepEqual(result, { answer: 'General reply', status: 'answered', sources: [], stored: false })

  globalThis.fetch = async () => ({
    ok: false,
    status: 422,
    json: async () => ({ detail: [{ msg: 'String should have at most 1500 characters' }] }),
  })
  await assert.rejects(() => askAssistant('x', 'en', []), error => {
    assert.ok(error instanceof SchemeApiError)
    assert.match(error.message, /1500/)
    return true
  })

  globalThis.fetch = async () => { throw new TypeError('network unavailable') }
  await assert.rejects(() => askAssistant('Hello', 'en', []), error => {
    assert.ok(error instanceof SchemeApiError)
    assert.match(error.message, /backend is running/i)
    return true
  })
  console.log('PASS assistant frontend POST path, payload, response, validation and network errors')
} finally {
  globalThis.fetch = originalFetch
  await server.close()
}
