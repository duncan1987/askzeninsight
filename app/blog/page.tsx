import { Header } from "@/components/header"
import { BlogList } from "@/components/blog-list"
import { Footer } from "@/components/footer"

// Force dynamic rendering because Header uses cookies for authentication
export const dynamic = 'force-dynamic'

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <BlogList />
      </main>
      <Footer />
    </div>
  )
}
