// Bundles dist/ into a single self-contained HTML file (JS + CSS inlined)
// so the app can be opened straight from a file:// URL, e.g. on Android.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const outFile = resolve(root, '..', 'demo', 'inventario-demo.html')

let html = readFileSync(join(dist, 'index.html'), 'utf8')

const readAsset = (href) => readFileSync(join(dist, href.replace(/^\.?\//, '')), 'utf8')

html = html.replace(
  /<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g,
  (_, src) => `<script type="module">${readAsset(src).replace(/<\/script/gi, '<\\/script')}</script>`,
)
html = html.replace(
  /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g,
  (_, href) => `<style>${readAsset(href)}</style>`,
)
html = html.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>\s*/g, '')

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, html)
console.log(`demo written to ${outFile} (${(html.length / 1024).toFixed(0)} KiB)`)
