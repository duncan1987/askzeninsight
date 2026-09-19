import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin-auth'
import { ensurePdfGlobals } from '@/lib/pdf-globals'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// TEMPORARY diagnostics endpoint for the standalone pdf-parse 500.
// Returns the on-disk module layout + pdf-parse loadability so the
// missing/broken pieces can be identified without SSH access.
// Remove once the upload 500 is resolved.
export async function GET(req: Request) {
  let authError: NextResponse | null = null
  try {
    authError = await verifyAdminAccess(req)
  } catch (e) {
    return NextResponse.json({ stage: 'verifyAdminAccess threw', error: String(e) }, { status: 500 })
  }
  if (authError) return authError

  const report: Record<string, unknown> = {
    node: process.version,
    cwd: process.cwd(),
  }

  const probe = (rel: string): Record<string, unknown> => {
    const abs = path.join(process.cwd(), rel)
    let exists = false
    let isSymlink = false
    let target: string | null = null
    let size: number | null = null
    try {
      const st = fs.lstatSync(abs)
      exists = true
      if (st.isSymbolicLink()) {
        isSymlink = true
        target = fs.readlinkSync(abs)
        try {
          size = fs.statSync(abs).size
        } catch {
          size = -1 // broken symlink
        }
      } else {
        size = st.size
      }
    } catch {
      exists = false
    }
    return { rel, exists, isSymlink, target, size }
  }

  const candidates = [
    'node_modules/pdf-parse',
    'node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs',
    'node_modules/pdf-parse/dist/worker/cjs/index.cjs',
    'node_modules/pdfjs-dist',
    'node_modules/pdfjs-dist/legacy/build/pdf.mjs',
    'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
    'node_modules/.pnpm/pdfjs-dist@5.4.296/node_modules/pdfjs-dist/legacy/build/pdf.mjs',
    'node_modules/.pnpm/pdfjs-dist@5.4.296/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
    'node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs',
    'node_modules/.pnpm/pdf-parse@2.4.5/node_modules/@napi-rs/canvas',
    'node_modules/.pnpm/node_modules/pdf-parse',
    'node_modules/.pnpm/node_modules/pdfjs-dist',
    'node_modules/.pnpm/node_modules/@napi-rs/canvas',
  ]
  report.probes = candidates.map(probe)

  try {
    report.topLevelModules = fs.readdirSync(path.join(process.cwd(), 'node_modules'))
  } catch (e) {
    report.topLevelModulesError = String(e)
  }
  try {
    report.pnpmDirs = fs
      .readdirSync(path.join(process.cwd(), 'node_modules/.pnpm'))
      .filter((d) => /pdf|canvas/i.test(d))
  } catch (e) {
    report.pnpmDirsError = String(e)
  }

  const g = globalThis as Record<string, unknown>
  report.globalsBefore = {
    DOMMatrix: typeof g.DOMMatrix,
    ImageData: typeof g.ImageData,
    Path2D: typeof g.Path2D,
  }
  ensurePdfGlobals()
  report.globalsAfter = {
    DOMMatrix: typeof g.DOMMatrix,
    ImageData: typeof g.ImageData,
    Path2D: typeof g.Path2D,
  }

  try {
    const m = await import('pdf-parse')
    report.pdfParseLoad = { ok: true, hasPDFParse: typeof m.PDFParse }
  } catch (e) {
    report.pdfParseLoad = { ok: false, error: String(e) }
  }

  return NextResponse.json(report)
}
