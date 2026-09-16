"use client"

import { useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { TruncationLine } from "./truncation-line-extension"
import {
  TypoHighlight,
  buildTextMap,
  mapTypoFindings,
  setTypoHighlights,
  clearTypoHighlights,
  type TypoFinding,
} from "./typo-check-extension"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Scissors,
  ImageIcon,
  SpellCheck,
  Eraser,
  Loader2,
} from "lucide-react"

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  showTruncationLine?: boolean
  placeholder?: string
}

export function TiptapEditor({
  content,
  onChange,
  showTruncationLine = true,
  placeholder = "开始编写内容...",
}: TiptapEditorProps) {
  const [checking, setChecking] = useState(false)
  const [typoCount, setTypoCount] = useState<number | null>(null)
  const [typoMessage, setTypoMessage] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      TypoHighlight,
      ...(showTruncationLine ? [TruncationLine] : []),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  })

  if (!editor) return null

  const addImage = () => {
    const url = prompt("输入图片 URL:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const handleTypoCheck = async () => {
    if (checking || !editor) return
    const textMap = buildTextMap(editor)
    if (!textMap.plain.trim()) {
      setTypoCount(null)
      setTypoMessage("没有可校验的文字")
      return
    }
    setChecking(true)
    setTypoMessage("校验中...")
    clearTypoHighlights(editor)
    try {
      const res = await fetch("/api/typos/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textMap.plain }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setTypoCount(null)
        setTypoMessage(data?.error || `校验失败 (HTTP ${res.status})`)
        return
      }
      const findings: TypoFinding[] = Array.isArray(data?.typos) ? data.typos : []
      const ranges = mapTypoFindings(textMap, findings)
      setTypoHighlights(editor, ranges)
      setTypoCount(ranges.length)
      setTypoMessage(null)
    } catch {
      setTypoCount(null)
      setTypoMessage("校验失败，请检查网络后重试")
    } finally {
      setChecking(false)
    }
  }

  const handleClearTypos = () => {
    if (!editor) return
    clearTypoHighlights(editor)
    setTypoCount(null)
    setTypoMessage(null)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 border-b px-3 py-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleTypoCheck}
          disabled={checking}
          title="错别字校验：只标黄提示，不做任何改动"
        >
          {checking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SpellCheck className="h-4 w-4" />
          )}
          <span className="hidden sm:inline text-xs ml-1">错别字校验</span>
        </Button>
        {showTruncationLine && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTruncationLine().run()}
            title="插入截断线 (Ctrl+Shift+T)"
          >
            <Scissors className="h-4 w-4" />
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground pl-2">
          {typoMessage && <span>{typoMessage}</span>}
          {typoCount !== null && typoMessage === null && (
            <>
              {typoCount > 0 ? (
                <span>
                  发现 <span className="font-medium text-amber-600 dark:text-amber-400">{typoCount}</span> 处疑似错别字（已标黄），请自行修改
                </span>
              ) : (
                <span>未发现明显错别字</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearTypos}
                title="清除错别字标记"
              >
                <Eraser className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
