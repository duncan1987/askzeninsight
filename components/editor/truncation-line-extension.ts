import { Node, mergeAttributes } from "@tiptap/core"

export interface TruncationLineOptions {
  HTMLAttributes: Record<string, string>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    truncationLine: {
      setTruncationLine: () => ReturnType
    }
  }
}

export const TruncationLine = Node.create<TruncationLineOptions>({
  name: "truncationLine",
  group: "block",
  inline: false,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      "data-truncation-line": {
        default: true,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-truncation-line="true"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-truncation-line": "true",
        class: "truncation-line-marker",
        style: "border-top: 2px dashed #d97706; padding: 8px 0; margin: 16px 0; text-align: center; color: #d97706; font-size: 0.875rem; user-select: none;",
      }),
      ["span", { contenteditable: "false", style: "pointer-events: none;" }, "✂ 截断线（截断线以下内容需打卡后可见）"],
    ]
  },

  addCommands() {
    return {
      setTruncationLine:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-t": () => this.editor.commands.setTruncationLine(),
    }
  },
})

export function getTruncationIndex(html: string): number | null {
  const marker = '<div data-truncation-line="true"'
  const index = html.indexOf(marker)
  if (index === -1) return null
  const beforeMarker = html.slice(0, index)
  const textContent = beforeMarker.replace(/<[^>]*>/g, "")
  return textContent.length
}

export function stripTruncationLine(html: string): string {
  return html.replace(
    /<div data-truncation-line="true"[^>]*>[\s\S]*?<\/div>/g,
    ""
  )
}
