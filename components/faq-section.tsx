import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is Ask Zen Insight?",
    answer:
      "Ask Zen Insight is an AI-powered spiritual guidance experience. It offers reflective conversations to support mindfulness, clarity, and inner peace.",
  },
  {
    question: "How does it work?",
    answer:
      "You sign in and chat with an AI assistant. The service provides thoughtful reflections and practical prompts designed to support your personal practice.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The free plan includes a limited number of messages per day so you can try the experience before upgrading.",
  },
  {
    question: "What does Pro include?",
    answer:
      "Pro increases your daily usage limit and unlocks subscriber features in your account.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "You can manage or cancel your subscription anytime from your dashboard via the billing portal.",
  },
  {
    question: "How do refunds work?",
    answer:
      "Refunds are handled according to our Refund Policy. If you need help, contact support and include your account email.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground text-balance leading-relaxed">
              Everything you need to know about Ask Zen Insight
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-accent-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
