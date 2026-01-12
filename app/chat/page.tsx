import { Header } from "@/components/header"
import { ChatInterface } from "@/components/chat-interface"
import { Footer } from "@/components/footer"

// Force dynamic rendering because Header uses cookies for authentication
export const dynamic = 'force-dynamic'

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ChatInterface />
      </main>
      <Footer />
    </div>
  )
}
