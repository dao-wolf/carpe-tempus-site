/**
 * Brand geometry for the site's drawn motifs: the English oak leaf (OakLeaf.astro).
 * The logo itself is the supplied artwork in src/assets/brand/, not geometry.
 */

/** Pseudo-random numbers from a seed, so generated artwork is identical on every build. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const round = (n: number) => Math.round(n * 10) / 10

/**
 * An English oak leaf: rounded lobes, an obovate outline, small ear-like lobes at
 * the base and a short stalk. The leaf points up; its base sits at (50, 100) in a
 * 100 × 100 box. Returns the outline and the veins as SVG path data.
 */
export function oakLeaf(seed = 7): { outline: string; veins: string } {
  const random = seeded(seed)
  const tipY = 3
  const baseY = 88
  const length = baseY - tipY
  const samples = 120
  const cycles = 4.4

  // Half-width of the outline at t (0 = tip, 1 = base): a rounded tip, widest above
  // the middle, narrowing to small ear-like lobes where the stalk joins.
  const envelope = (t: number) =>
    36 * Math.sin(Math.PI * t ** 0.8) ** 0.7 * (1 - 0.55 * t ** 3)
  // Each lobe gets its own size, so the leaf is not mechanically regular.
  const lobeSize = Array.from({ length: 12 }, () => 0.9 + random() * 0.2)
  const lobes = (t: number, phase: number, sizes: number[]) => {
    const position = t * cycles + phase
    const wave = 0.5 + 0.5 * Math.cos(2 * Math.PI * position)
    const size = sizes[Math.min(sizes.length - 1, Math.round(position))]
    return (0.34 + 0.66 * wave ** 0.6) * size
  }

  const side = (direction: 1 | -1, phase: number, sizes: number[]) =>
    Array.from({ length: samples + 1 }, (_, i) => {
      const t = i / samples
      const x = 50 + direction * envelope(t) * lobes(t, phase, sizes)
      return [round(x), round(tipY + t * length)] as const
    })

  const rightSizes = lobeSize.map(size => 2 - size)
  const left = side(-1, 0, lobeSize)
  const right = side(1, 0.12, rightSizes).reverse()
  const points = [...left, ...right]
  const outline = `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`

  // Midrib into a short stalk, and a vein towards the centre of each lobe.
  const veins: string[] = [`M50 ${tipY + 6}V${baseY}Q50.5 94 52 99`]
  for (const [direction, phase] of [
    [-1, 0],
    [1, 0.12],
  ] as const) {
    for (let k = 1; k <= 4; k++) {
      const t = (k - phase) / cycles
      if (t >= 0.9) continue
      const y = tipY + t * length
      const reach = envelope(t) * 0.72
      veins.push(
        `M50 ${round(y + reach * 0.5)}L${round(50 + direction * reach)} ${round(y)}`,
      )
    }
  }
  return { outline, veins: veins.join("") }
}
