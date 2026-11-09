#!/usr/bin/env node
/**
 * Renders the brand files from the supplied logo (src/assets/brand/carpe-tempus-logo.jpg)
 * and the colours in src/styles/tokens.css:
 *
 *   src/assets/brand/oak.png      the oak cut out on transparency, for Mark.astro and OakIllustration.astro
 *   public/favicon.ico            16, 32 and 48 px PNGs in one ICO
 *   public/apple-touch-icon.png   180 × 180
 *   public/brand/logo-512.png     512 × 512, used as the Organization logo in JSON-LD
 *   public/og/default.png         1200 × 630 social card
 *
 * Run after replacing the logo or changing the palette:  pnpm brand:render
 * The outputs are committed; the site build does not run this script.
 *
 * Needs Chromium for Playwright 1.56.1. Claude Code cloud sessions have it pre-installed;
 * elsewhere run `pnpm exec playwright install chromium` once.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { chromium } from "playwright-core"

const root = new URL("../", import.meta.url)
const file = path => new URL(path, root)

const tokens = await readFile(file("src/styles/tokens.css"), "utf8")
const palette = Object.fromEntries(
  [...tokens.matchAll(/--palette-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(
    ([, name, value]) => [name, value],
  ),
)
for (const name of ["paper", "ink", "ink-soft", "gold", "gold-deep"]) {
  if (!palette[name])
    throw new Error(`--palette-${name} not found in tokens.css`)
}

const dataUrl = async (path, type) =>
  `data:${type};base64,${(await readFile(file(path))).toString("base64")}`
const newsreader = await dataUrl(
  "node_modules/@fontsource-variable/newsreader/files/newsreader-latin-standard-normal.woff2",
  "font/woff2",
)
const inter = await dataUrl(
  "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  "font/woff2",
)

const css = `
  @font-face { font-family: "Newsreader Variable"; src: url(${newsreader}) format("woff2"); font-weight: 200 800; }
  @font-face { font-family: "Inter Variable"; src: url(${inter}) format("woff2"); font-weight: 100 900; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: transparent; }
  img { display: block; }
`

const browser = await chromium.launch()

/**
 * Cuts the oak out of the supplied logo. The tree is the first band of rows with ink
 * in it (the wordmark and motto sit below a clear gap). The paper around it becomes
 * transparent with soft edges, and the tree is centred on a square canvas.
 */
async function cutOutOak(logo) {
  const page = await browser.newPage()
  const png = await page.evaluate(async src => {
    const image = new Image()
    image.src = src
    await image.decode()
    const { naturalWidth: width, naturalHeight: height } = image
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d", { willReadFrequently: true })
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, width, height).data

    // The paper colour: the average of the top-left corner.
    const corner = 64
    const paper = [0, 0, 0]
    for (let y = 0; y < corner; y++)
      for (let x = 0; x < corner; x++)
        for (let c = 0; c < 3; c++)
          paper[c] += pixels[(y * width + x) * 4 + c] / corner ** 2

    // How far a pixel is from the paper: its largest channel difference.
    const distance = i =>
      Math.max(
        Math.abs(pixels[i] - paper[0]),
        Math.abs(pixels[i + 1] - paper[1]),
        Math.abs(pixels[i + 2] - paper[2]),
      )
    // Clearly not paper: the paper's texture varies by less than 10.
    const ink = 48
    const inkAt = (x, y) => distance((y * width + x) * 4) > ink
    const rowHasInk = y => {
      for (let x = 0; x < width; x++) if (inkAt(x, y)) return true
      return false
    }

    let top = 0
    while (!rowHasInk(top)) top++
    let bottom = top
    for (let y = top, gap = 0; y < height && gap < 24; y++) {
      if (rowHasInk(y)) {
        bottom = y
        gap = 0
      } else gap++
    }
    let left = width
    let right = 0
    for (let y = top; y <= bottom; y++)
      for (let x = 0; x < width; x++)
        if (inkAt(x, y)) {
          left = Math.min(left, x)
          right = Math.max(right, x)
        }

    const treeWidth = right - left + 1
    const treeHeight = bottom - top + 1
    const side = Math.round(Math.max(treeWidth, treeHeight) * 1.08)
    const offsetX = Math.round((side - treeWidth) / 2)
    const offsetY = Math.round((side - treeHeight) / 2)
    const out = new ImageData(side, side)

    // Opacity rises smoothly from just above the paper's texture to fully opaque
    // well before the palest leaves, so only edges and fine veins are soft.
    const [from, to] = [12, 96]
    for (let y = 0; y < treeHeight; y++)
      for (let x = 0; x < treeWidth; x++) {
        const i = ((top + y) * width + left + x) * 4
        const t = Math.min(1, Math.max(0, (distance(i) - from) / (to - from)))
        const alpha = t * t * (3 - 2 * t)
        if (alpha === 0) continue
        const o = ((offsetY + y) * side + offsetX + x) * 4
        // Take the paper out of soft edges so they don't halo on stone (the array clamps).
        for (let c = 0; c < 3; c++)
          out.data[o + c] = paper[c] + (pixels[i + c] - paper[c]) / alpha
        out.data[o + 3] = Math.round(alpha * 255)
      }

    canvas.width = side
    canvas.height = side
    context.putImageData(out, 0, 0)
    return canvas.toDataURL("image/png")
  }, logo)
  await page.close()
  return Buffer.from(png.split(",")[1], "base64")
}

async function render(body, { width, height, transparent = false }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  })
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`,
  )
  await page.evaluate(async () => {
    await document.fonts.load('500 20px "Newsreader Variable"')
    await document.fonts.load('400 20px "Inter Variable"')
    await document.fonts.ready
    await Promise.all([...document.images].map(image => image.decode()))
  })
  const png = await page.screenshot({
    type: "png",
    omitBackground: transparent,
    clip: { x: 0, y: 0, width, height },
  })
  await page.close()
  return png
}

/** ICO container holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + 16 * images.length
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...images.map(image => image.png)])
}

async function write(path, contents) {
  await mkdir(new URL(".", file(path)), { recursive: true })
  await writeFile(file(path), contents)
  console.log(`wrote ${path}`)
}

const oakPng = await cutOutOak(
  await dataUrl("src/assets/brand/carpe-tempus-logo.jpg", "image/jpeg"),
)
await write("src/assets/brand/oak.png", oakPng)

const oakSrc = `data:image/png;base64,${oakPng.toString("base64")}`
const oak = (size, style = "") =>
  `<img alt="" src="${oakSrc}" width="${size}" height="${size}" style="${style}">`

// Favicon: the oak on a paper disc, which reads on light and dark tabs alike.
const icons = []
for (const size of [16, 32, 48]) {
  const disc = `
    <div style="width:${size}px;height:${size}px;display:grid;place-items:center;border-radius:50%;background:${palette.paper}">
      ${oak(Math.round(size * 0.96))}
    </div>`
  icons.push({
    size,
    png: await render(disc, { width: size, height: size, transparent: true }),
  })
}
await write("public/favicon.ico", ico(icons))

const oakOnPaper = (canvas, mark) => `
  <div style="width:${canvas}px;height:${canvas}px;display:grid;place-items:center;background:${palette.paper}">
    ${oak(mark)}
  </div>`
await write(
  "public/apple-touch-icon.png",
  await render(oakOnPaper(180, 152), { width: 180, height: 180 }),
)
await write(
  "public/brand/logo-512.png",
  await render(oakOnPaper(512, 440), { width: 512, height: 512 }),
)

const socialCard = `
  <div style="position:relative;width:1200px;height:630px;overflow:hidden;background:${palette.paper};color:${palette.ink}">
    <div style="position:absolute;inset:28px;border:1px solid ${palette.gold}"></div>
    ${oak(440, "position:absolute;left:688px;top:95px")}
    <div style="position:absolute;left:92px;top:92px;width:600px">
      <div style="display:flex;align-items:center;gap:16px">
        ${oak(60)}
        <div>
          <div style="font:500 30px/1 'Newsreader Variable';letter-spacing:0.08em;text-transform:uppercase">Carpe Tempus</div>
          <div style="margin-top:9px;font:600 12px/1 'Inter Variable';letter-spacing:0.3em;text-transform:uppercase;color:${palette["gold-deep"]}">Seize the time</div>
        </div>
      </div>
      <p style="margin:52px 0 0;font:600 15px 'Inter Variable';letter-spacing:0.16em;text-transform:uppercase;color:${palette["gold-deep"]}">Product engineering · Paid social marketing</p>
      <p style="margin:16px 0 0;font:500 62px/1.04 'Newsreader Variable';letter-spacing:-0.02em">Build better products.<br>Reach the right customers.</p>
      <p style="margin:22px 0 0;font:400 26px/1.35 'Newsreader Variable';color:${palette["ink-soft"]}">A London consultancy, led by its founders.</p>
    </div>
  </div>`
await write(
  "public/og/default.png",
  await render(socialCard, { width: 1200, height: 630 }),
)

await browser.close()
