/*
 * Browser-global stubs required to load pdf-parse's embedded pdf.js in
 * Node without @napi-rs/canvas.
 *
 * pdf-parse polyfills DOMMatrix/ImageData/Path2D from @napi-rs/canvas,
 * which it loads via a runtime createRequire that standalone file
 * tracing cannot follow. When canvas is unavailable the polyfill is
 * skipped (warn-only) and the embedded pdf.js then dies at module init
 * with "ReferenceError: DOMMatrix is not defined" (observed on the EC2
 * standalone build). Text extraction never touches canvas rendering, so
 * minimal stubs are sufficient — and real values, if a global already
 * exists, are always left untouched.
 */

interface PointLike {
  x: number
  y: number
}

interface MatrixLike {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

class MinimalDOMMatrix implements MatrixLike {
  a = 1
  b = 0
  c = 0
  d = 1
  e = 0
  f = 0

  constructor(init?: number[] | Float64Array | DOMMatrixInit) {
    const arr = init as number[] | undefined
    if (arr && Array.isArray(arr) && arr.length === 6) {
      ;[this.a, this.b, this.c, this.d, this.e, this.f] = arr
    } else if (arr && Array.isArray(arr) && arr.length === 16) {
      this.a = arr[0]
      this.b = arr[1]
      this.c = arr[4]
      this.d = arr[5]
      this.e = arr[12]
      this.f = arr[13]
    } else if (init && typeof init === 'object') {
      const m = init as Partial<MatrixLike>
      this.a = m.a ?? 1
      this.b = m.b ?? 0
      this.c = m.c ?? 0
      this.d = m.d ?? 1
      this.e = m.e ?? 0
      this.f = m.f ?? 0
    }
  }

  static fromMatrix(m: MatrixLike): MinimalDOMMatrix {
    return new MinimalDOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f])
  }

  multiplySelf(m: MatrixLike): this {
    const { a, b, c, d, e, f } = this
    this.a = a * m.a + c * m.b
    this.b = b * m.a + d * m.b
    this.c = a * m.c + c * m.d
    this.d = b * m.c + d * m.d
    this.e = a * m.e + c * m.f + e
    this.f = b * m.e + d * m.f + f
    return this
  }

  multiply(m: MatrixLike): MinimalDOMMatrix {
    return MinimalDOMMatrix.fromMatrix(this).multiplySelf(m)
  }

  translateSelf(x: number, y: number): this {
    this.e += this.a * x + this.c * y
    this.f += this.b * x + this.d * y
    return this
  }

  scaleSelf(sx: number, sy: number = sx): this {
    this.a *= sx
    this.b *= sx
    this.c *= sy
    this.d *= sy
    return this
  }

  rotateSelf(deg: number): this {
    const rad = (deg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.multiplySelf(new MinimalDOMMatrix([cos, sin, -sin, cos, 0, 0]))
  }

  inverse(): MinimalDOMMatrix {
    const { a, b, c, d, e, f } = this
    const det = a * d - b * c
    if (!det) return new MinimalDOMMatrix()
    const r = new MinimalDOMMatrix()
    r.a = d / det
    r.b = -b / det
    r.c = -c / det
    r.d = a / det
    r.e = (c * f - d * e) / det
    r.f = (b * e - a * f) / det
    return r
  }

  transformPoint(p: PointLike): PointLike {
    return {
      x: this.a * p.x + this.c * p.y + this.e,
      y: this.b * p.x + this.d * p.y + this.f,
    }
  }
}

class MinimalImageData {
  data: Uint8ClampedArray
  width: number
  height: number

  constructor(a: Uint8ClampedArray | number, b: number, c?: number) {
    if (a instanceof Uint8ClampedArray) {
      this.data = a
      this.width = b
      this.height = c ?? 0
    } else {
      this.width = a
      this.height = b
      this.data = new Uint8ClampedArray(a * b * (c ?? 4))
    }
  }
}

class MinimalPath2D {
  moveTo(_x: number, _y: number): void {}
  lineTo(_x: number, _y: number): void {}
  closePath(): void {}
  bezierCurveTo(): void {}
  quadraticCurveTo(): void {}
  arc(): void {}
  arcTo(): void {}
  rect(): void {}
  ellipse(): void {}
  addPath(): void {}
}

/**
 * Install minimal browser-global stubs (only when undefined) so the
 * embedded pdf.js inside pdf-parse can initialize in a bare Node process.
 * Safe to call repeatedly; never overrides an existing global.
 */
export function ensurePdfGlobals(): void {
  const g = globalThis as Record<string, unknown>
  if (typeof g.DOMMatrix === 'undefined') g.DOMMatrix = MinimalDOMMatrix
  if (typeof g.ImageData === 'undefined') g.ImageData = MinimalImageData
  if (typeof g.Path2D === 'undefined') g.Path2D = MinimalPath2D
}
