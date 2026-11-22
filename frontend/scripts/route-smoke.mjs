import assert from 'node:assert/strict'
import React, { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({
  server: { middlewareMode: true },
  ssr: { noExternal: ['react-router'] },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
})
const originalConsoleError = console.error
console.error = (...args) => {
  if (String(args[0]).includes('useLayoutEffect does nothing on the server')) return
  originalConsoleError(...args)
}

try {
  const [routerModule, shellModule, homeModule, explorerModule, detailModule, eligibilityModule, assistantModule, contentModule] = await Promise.all([
    vite.ssrLoadModule('react-router'),
    vite.ssrLoadModule('/src/components/SiteShell.tsx'),
    vite.ssrLoadModule('/src/pages/HomePage.tsx'),
    vite.ssrLoadModule('/src/pages/SchemeExplorerPage.tsx'),
    vite.ssrLoadModule('/src/pages/SchemeDetailPage.tsx'),
    vite.ssrLoadModule('/src/pages/EligibilityPage.tsx'),
    vite.ssrLoadModule('/src/pages/AssistantPage.tsx'),
    vite.ssrLoadModule('/src/lib/content.ts'),
  ])
  const { MemoryRouter, Route, Routes } = routerModule
  const { default: SiteShell } = shellModule
  const { default: HomePage } = homeModule
  const { default: SchemeExplorerPage } = explorerModule
  const { default: SchemeDetailPage } = detailModule
  const { default: EligibilityPage } = eligibilityModule
  const { default: AssistantPage } = assistantModule
  const { countSchemesByCategory } = homeModule
  const expectedCategoryCounts = Object.fromEntries(contentModule.categories.map(({ id }) => [id, id === 'education-scholarships' ? 2 : 0]))
  assert.deepEqual(countSchemesByCategory([
    { categoryId: 'education-scholarships' },
    { categoryId: 'education-scholarships' },
  ]), expectedCategoryCounts, 'homepage category counts must derive from returned schemes')
  process.stdout.write('PASS homepage category badges count returned records, including empty categories\n')
  const routes = [
    ['/', HomePage],
    ['/schemes', SchemeExplorerPage],
    ['/schemes/demo-community-learning-support', SchemeDetailPage, '/schemes/:id'],
    ['/schemes/invalid-scheme-id', SchemeDetailPage, '/schemes/:id'],
    ['/eligibility', EligibilityPage],
    ['/assistant', AssistantPage],
  ]

  for (const language of ['en', 'te', 'hi']) {
    const t = contentModule.copy[language]
    for (const [path] of routes) {
      const routeElements = routes.map(([routePath, Page, routePattern]) => h(Route, {
        path: routePattern || routePath,
        element: h(Page, { t, language }),
        key: routePath,
      }))
      const tree = h(MemoryRouter, { initialEntries: [path] },
        h(SiteShell, { language, setLanguage: () => {}, t },
          h(Routes, null, ...routeElements)))
      const html = renderToStaticMarkup(tree)
      if (!html.includes(t.navHome) || !html.includes('NitiMitra')) {
        throw new Error(`Route ${path} did not render the ${language} interface.`)
      }
      if (language === 'te' && !/[\u0C00-\u0C7F]/.test(html)) throw new Error(`Route ${path} has no Telugu text.`)
      if (language === 'hi' && !/[\u0900-\u097F]/.test(html)) throw new Error(`Route ${path} has no Hindi text.`)
    }
    process.stdout.write(`PASS all routes in ${language}\n`)
  }
} finally {
  console.error = originalConsoleError
  await vite.close()
}
