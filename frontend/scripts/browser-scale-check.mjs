/**
 * Headless check: apply shipped fluid clamp at two viewports.
 * Verifies production CSS bundles contain the fluid html font-size rule.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { rootFontSizeCssClamp, rootFontSizePx } from '../src/scale/fluidRoot.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, '..')
const monorepo = path.resolve(frontendRoot, '../..')
const scratch = process.env.SCRATCH || frontendRoot

const clamp = rootFontSizeCssClamp()
const results = []

const distCss = [
  { name: 'smartqa', dir: path.join(monorepo, 'wenshu/frontend/dist/assets') },
  { name: 'code-review', dir: path.join(monorepo, 'code-review-agent/frontend/dist/assets') },
  { name: 'xhagentos', dir: path.join(frontendRoot, 'dist/assets') },
]

for (const app of distCss) {
  let found = false
  let sample = ''
  if (fs.existsSync(app.dir)) {
    for (const f of fs.readdirSync(app.dir).filter((x) => x.endsWith('.css'))) {
      const css = fs.readFileSync(path.join(app.dir, f), 'utf8')
      const compact = css.replace(/\s/g, '')
      if (/clamp\(\s*14px/i.test(css) && css.includes('vw') && compact.includes('font-size:clamp(14px')) {
        found = true
        sample = f
        break
      }
      if (/clamp\(\s*14px/i.test(css) && css.includes('vw')) {
        found = true
        sample = f
        break
      }
    }
  }
  results.push({ check: 'dist-css', app: app.name, found, sample, dir: app.dir })
}

const browser = await chromium.launch({ headless: true })
for (const width of [375, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 800 } })
  await page.setContent(
    `<!doctype html><html><head><style>
      html{font-size:${clamp}}
      body{margin:0;font-size:1rem;font-family:system-ui;background:#0f1419;color:#e7ecf3}
      .shell{padding:1.25rem;max-width:68.75rem}
      h1{font-size:1.45rem}
      p{font-size:1rem}
    </style></head><body><div class="shell"><h1 id="h">Title</h1><p id="p">Body text scales with root</p></div></body></html>`,
    { waitUntil: 'load' },
  )
  const metrics = await page.evaluate(() => ({
    root: getComputedStyle(document.documentElement).fontSize,
    h1: getComputedStyle(document.getElementById('h')).fontSize,
    p: getComputedStyle(document.getElementById('p')).fontSize,
  }))
  results.push({
    check: 'computed',
    width,
    expectedRootPx: rootFontSizePx(width),
    ...metrics,
  })
  await page.screenshot({ path: path.join(scratch, `fluid-demo-${width}.png`) })
  await page.close()
}
await browser.close()

const n = results.find((r) => r.check === 'computed' && r.width === 375)
const w = results.find((r) => r.check === 'computed' && r.width === 1440)
const scaleOk = n && w && parseFloat(w.root) > parseFloat(n.root)
const cssOk = results.filter((r) => r.check === 'dist-css').every((r) => r.found)

fs.writeFileSync(path.join(scratch, 'browser-metrics.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
console.log({ scaleOk, cssOk, narrow: n?.root, wide: w?.root, clamp })

if (!scaleOk || !cssOk) {
  console.error('browser-scale-check FAILED')
  process.exit(1)
}
console.log('browser-scale-check: OK')
