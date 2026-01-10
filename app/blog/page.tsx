import { Header } from "@/components/header"
import { BlogList } from "@/components/blog-list"
import { Footer } from "@/components/footer"

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
