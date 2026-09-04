"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, ImageIcon, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

export function ImageUpload() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const t = useTranslations("imageUpload")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="mx-auto max-w-4xl border-2 border-accent/20 bg-card/50 backdrop-blur p-6 md:p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-accent-foreground" />
            {t("uploadImage")}
          </h3>

          <label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-accent hover:bg-accent/5">
            <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
            {selectedImage ? (
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Uploaded preview"
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center p-6">
                <Upload className="h-12 w-12 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{t("clickToUpload")}</span>
                  <span className="text-muted-foreground">{t("orDragAndDrop")}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t("fileHint")}</p>
              </div>
            )}
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
            {t("aiPrompt")}
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder={t("promptPlaceholder")}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none bg-background"
              />
              <p className="text-xs text-muted-foreground">
                {t("promptExample")}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
                disabled={!selectedImage || !prompt}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t("generateWithAI")}
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-green-500" />
                <span>{t("generationSpeed")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
