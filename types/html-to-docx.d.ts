declare module 'html-to-docx' {
  interface HtmlToDocxDocumentOptions {
    orientation?: 'portrait' | 'landscape'
    margins?: {
      marginTop?: number
      marginRight?: number
      marginBottom?: number
      marginLeft?: number
      header?: number
      footer?: number
    }
    font?: string
    fontSize?: number
    fontTable?: unknown[]
    style?: string
    header?: boolean
    footer?: boolean
    title?: string
    subject?: string
    creator?: string
    keywords?: string
    description?: string
    lastModifiedBy?: string
    revision?: number
    createdAt?: Date
    modifiedAt?: Date
  }

  function HTMLtoDOCX(
    html: string,
    headerHTML?: string | null,
    documentOptions?: HtmlToDocxDocumentOptions,
    footerHTML?: string | null
  ): Promise<Buffer>

  export default HTMLtoDOCX
}
