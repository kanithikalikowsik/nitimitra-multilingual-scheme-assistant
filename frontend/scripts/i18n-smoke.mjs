import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { copy } = await server.ssrLoadModule('/src/lib/content.ts')
  const { readLanguage, persistLanguage } = await server.ssrLoadModule('/src/lib/language.ts')
  const { hasVerifiedSource } = await server.ssrLoadModule('/src/lib/sourceVerification.ts')
  const chatSession = await server.ssrLoadModule('/src/lib/assistantSession.ts')
  const keys = Object.keys(copy.en).sort()
  for (const language of ['en', 'te', 'hi']) {
    assert.deepEqual(Object.keys(copy[language]).sort(), keys, `${language} translation keys differ`)
    for (const [key, value] of Object.entries(copy[language])) {
      assert.ok(typeof value === 'string' ? value.trim() : Array.isArray(value) && value.length, `${language}.${key} is empty`)
    }
  }
  assert.match(copy.te.navHome, /[\u0C00-\u0C7F]/, 'Telugu script is missing')
  assert.match(copy.hi.navHome, /[\u0900-\u097F]/, 'Devanagari script is missing')
  assert.equal(hasVerifiedSource({ verification_status: 'verified', source_url: 'https://example.gov', last_verified_at: '2026-01-01' }), true)
  assert.equal(hasVerifiedSource({ verification_status: 'verified', source_url: 'https://example.gov' }), false, 'missing verification date must not qualify')
  assert.equal(hasVerifiedSource({ verification_status: 'pending', source_url: 'https://example.gov', last_verified_at: '2026-01-01' }), false)
  assert.equal(hasVerifiedSource({ verification_status: 'verified', source_url: 'http://example.gov', last_verified_at: '2026-01-01' }), false, 'HTTP source must not qualify')

  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  for (const language of ['en', 'te', 'hi']) {
    persistLanguage(storage, language)
    assert.equal(readLanguage(storage), language, `${language} does not persist`)
  }

  const chatValues = new Map()
  const chatStorage = {
    getItem: key => chatValues.get(key) ?? null,
    setItem: (key, value) => chatValues.set(key, value),
    removeItem: key => chatValues.delete(key),
  }
  const chat = Array.from({ length: 35 }, (_, index) => ({ id: String(index), kind: 'user', text: `Question ${index}` }))
  chatSession.writeAssistantSession(chatStorage, chat)
  assert.equal(chatSession.readAssistantSession(chatStorage).length, 30, 'chat session history is capped')
  chatSession.clearAssistantSession(chatStorage)
  assert.deepEqual(chatSession.readAssistantSession(chatStorage), [], 'clear conversation removes tab session history')
  chatValues.set('nitimitra.assistant.conversation.v1', '{broken')
  assert.deepEqual(chatSession.readAssistantSession(chatStorage), [], 'malformed chat history is ignored')
  console.log('PASS all locales have matching non-empty keys and expected scripts')
  console.log('PASS English, Telugu and Hindi persist through storage reloads')
  console.log('PASS official source links require verified HTTPS source and date')
  console.log('PASS assistant session history is temporary, bounded and clearable')
} finally {
  await server.close()
}
