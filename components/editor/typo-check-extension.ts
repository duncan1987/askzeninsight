import { Extension } from "@tiptap/core"
import type { Editor } from "@tiptap/core"
import type { Node as ProsemirrorNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

/**
 * 错别字校验高亮扩展
 *
 * 使用 ProseMirror decorations（装饰层）标记疑似错别字：
 * - 不修改文档内容（不会触发 onChange / 自动保存 / 历史记录）
 * - 用户编辑时装饰随文档自动映射（remap），其余标记保持对位
 * - 可随时一键清除
 */

export interface TypoFinding {
  /** 出错的原文片段（须与文本完全一致） */
  wrong: string
  /** 错误片段前紧邻的 1-3 个字（可为空） */
  before: string
  /** 错误片段后紧邻的 1-3 个字（可为空） */
  after: string
  /** 建议的正确写法 */
  suggestion: string
  /** 简短原因 */
  reason: string
}

export interface TypoRange {
  from: number
  to: number
  wrong: string
  suggestion: string
  reason: string
}

interface TypoPluginState {
  decorations: DecorationSet
}

export const typoPluginKey = new PluginKey<TypoPluginState>("typoHighlight")

export const TypoHighlight = Extension.create({
  name: "typoHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin<TypoPluginState>({
        key: typoPluginKey,
        state: {
          init: () => ({ decorations: DecorationSet.empty }),
          apply: (tr, value) => {
            const meta = tr.getMeta(typoPluginKey)
            if (meta !== undefined) {
              return { decorations: meta as DecorationSet }
            }
            if (tr.docChanged) {
              // 编辑时保持装饰与文档对位
              return { decorations: value.decorations.map(tr.mapping, tr.doc) }
            }
            return value
          },
        },
        props: {
          decorations(state) {
            return typoPluginKey.getState(state)?.decorations ?? DecorationSet.empty
          },
        },
      }),
    ]
  },
})

export function setTypoHighlights(editor: Editor, ranges: TypoRange[]) {
  const decorations = ranges.map((r) =>
    Decoration.inline(r.from, r.to, {
      class: "typo-highlight",
      title: `疑似错别字「${r.wrong}」→ 建议「${r.suggestion}」：${r.reason}`,
    })
  )
  const tr = editor.state.tr
  tr.setMeta(typoPluginKey, DecorationSet.create(editor.state.doc, decorations))
  tr.setMeta("addToHistory", false)
  editor.view.dispatch(tr)
}

export function clearTypoHighlights(editor: Editor) {
  const tr = editor.state.tr
  tr.setMeta(typoPluginKey, DecorationSet.empty)
  tr.setMeta("addToHistory", false)
  editor.view.dispatch(tr)
}

/* ------------------------------------------------------------------ */
/* 文档纯文本 <-> ProseMirror 位置映射                                  */
/* ------------------------------------------------------------------ */

interface TextSegment {
  /** 该文本节点在纯文本中的起始下标 */
  start: number
  /** 该文本节点在 ProseMirror 文档中的位置 */
  pos: number
  text: string
}

export interface TextMap {
  plain: string
  segments: TextSegment[]
}

/**
 * 遍历文档构建纯文本与文本节点位置映射。
 * 块级节点之间插入 "\n" 分隔符（分隔符只占纯文本下标，不对应文档位置）。
 */
export function buildTextMap(editor: Editor): TextMap {
  const segments: TextSegment[] = []
  let plain = ""

  const visit = (node: ProsemirrorNode, pos: number) => {
    if (node.isText && node.text) {
      segments.push({ start: plain.length, pos, text: node.text })
      plain += node.text
    } else if (node.isBlock && plain.length > 0) {
      plain += "\n"
    }
    node.content.forEach((child, _index, offset) => visit(child, pos + 1 + offset))
  }

  editor.state.doc.forEach((child, _index, offset) => visit(child, offset))
  return { plain, segments }
}

const MAX_WRONG_LENGTH = 30

/**
 * 将 AI 返回的错别字列表映射为编辑器中的高亮区间。
 * 定位策略：优先匹配「before + wrong」并校验后文 after；
 * 找不到再退化为仅匹配 wrong。同一位置不会被重复标记。
 */
export function mapTypoFindings(map: TextMap, findings: TypoFinding[]): TypoRange[] {
  const { plain, segments } = map
  const used = new Set<string>()
  const ranges: TypoRange[] = []

  const findSegment = (start: number, end: number): TextSegment | null => {
    for (const seg of segments) {
      if (seg.start <= start && end <= seg.start + seg.text.length) {
        return seg
      }
    }
    return null
  }

  for (const f of findings) {
    if (!f || typeof f.wrong !== "string") continue
    const wrong = f.wrong
    if (wrong.length === 0 || wrong.length > MAX_WRONG_LENGTH) continue

    const before = typeof f.before === "string" ? f.before.slice(-3) : ""
    const after = typeof f.after === "string" ? f.after.slice(0, 3) : ""

    // 收集候选位置：先带前文匹配，再退化为裸匹配
    const candidates: number[] = []
    if (before) {
      const primary = before + wrong
      let i = plain.indexOf(primary)
      while (i !== -1) {
        candidates.push(i + before.length)
        i = plain.indexOf(primary, i + 1)
      }
    }
    if (candidates.length === 0) {
      let j = plain.indexOf(wrong)
      while (j !== -1) {
        candidates.push(j)
        j = plain.indexOf(wrong, j + 1)
      }
    }

    for (const s of candidates) {
      const e = s + wrong.length
      if (after && plain.slice(e, e + after.length) !== after) continue
      const seg = findSegment(s, e)
      if (!seg) continue
      const key = `${s}-${e}`
      if (used.has(key)) continue
      used.add(key)
      ranges.push({
        from: seg.pos + (s - seg.start),
        to: seg.pos + (e - seg.start),
        wrong,
        suggestion: typeof f.suggestion === "string" ? f.suggestion : "",
        reason: typeof f.reason === "string" ? f.reason : "",
      })
      break
    }
  }

  return ranges
}
