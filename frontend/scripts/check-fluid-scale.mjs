/**
 * Gating checks for XHAgentOS fluid root type scale.
 * Imports the shipped TypeScript helper via dynamic transpile-free path:
 * the formula is re-exported from fluidRoot.ts as pure functions — we
 * mirror-import by reading compiled-equivalent JS logic from the .ts file
 * through a tiny inline evaluation of the same module using Node strip types...
 * Prefer: compile-free duplicate import by executing the .ts with node --experimental
 * Not available everywhere. Instead: import from a .ts-adjacent .js re-export.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const failures = []

function assert(cond, msg) {
  if (!cond) failures.push(msg)
}

// Import shipped helper (JS re-export of the TS module for Node tests)
const mod = await import(pathToFileURL(path.join(root, 'src/scale/fluidRoot.js')).href)
const { rootFontSizePx, rootFontSizeCssClamp, FLUID_ROOT_SCALE } = mod

const narrow = rootFontSizePx(375)
const wide = rootFontSizePx(1440)
assert(wide > narrow, `wide (${wide}) must be > narrow (${narrow})`)
assert(narrow === FLUID_ROOT_SCALE.minFont, 'narrow anchor')
assert(wide === FLUID_ROOT_SCALE.maxFont, 'wide anchor')

const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8')
assert(/html\s*\{[^}]*font-size\s*:\s*clamp\(/s.test(tokens), 'tokens.css html font-size must use clamp()')
assert(tokens.includes('vw'), 'tokens.css fluid root must use vw')
assert(/--font-size-base\s*:\s*[\d.]+rem/.test(tokens), 'font tokens rem-based')
assert(/--spacing-md\s*:\s*[\d.]+rem/.test(tokens), 'spacing tokens rem-based')

const theme = fs.readFileSync(path.join(root, 'src/components/ThemeProvider.tsx'), 'utf8')
assert(theme.includes('rootFontSizePx'), 'ThemeProvider must drive Ant Design fontSize from fluid helper')
assert(theme.includes('resize'), 'ThemeProvider should update scale on viewport resize')

const tsHelper = fs.readFileSync(path.join(root, 'src/scale/fluidRoot.ts'), 'utf8')
assert(tsHelper.includes('export function rootFontSizePx'), 'TS source exports rootFontSizePx')

if (failures.length) {
  console.error('check-fluid-scale FAILED:')
  failures.forEach((f) => console.error(' -', f))
  process.exit(1)
}

console.log('check-fluid-scale: OK')
console.log(JSON.stringify({
  ok: true,
  app: 'xhagentos',
  narrowPx: narrow,
  widePx: wide,
  clamp: rootFontSizeCssClamp(),
  files: ['src/scale/fluidRoot.ts', 'src/scale/fluidRoot.js', 'src/styles/tokens.css', 'src/components/ThemeProvider.tsx'],
}, null, 2))
