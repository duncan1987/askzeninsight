import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is Nano Banana?",
    answer:
      "It's a revolutionary AI image editing model that transforms photos using natural language prompts. Currently the most powerful image editing model available, with exceptional consistency and superior performance compared to Flux Kontext for character editing and scene preservation.",
  },
  {
    question: "How does it work?",
    answer:
      'Simply upload an image and describe your desired edits in natural language. The AI understands complex instructions like "place the creature in a snowy mountain" or "imagine the whole face and create it". It processes your text prompt and generates perfectly edited images.',
  },
  {
    question: "How is it better than Flux Kontext?",
    answer:
      "This model excels in character consistency, scene blending, and one-shot editing. Users report it completely outperforms Flux Kontext in preserving facial features and seamlessly integrating edits with backgrounds. It also supports multi-image context, making it ideal for creating consistent AI influencers.",
  },
  {
    question: "Can I use it for commercial projects?",
    answer:
      "Yes! It's perfect for creating AI UGC content, social media campaigns, and marketing materials. Many users leverage it for creating consistent AI influencers and product photography. The high-quality outputs are suitable for professional use.",
  },
  {
    question: "What types of edits can it handle?",
    answer:
      'The editor handles complex edits including face completion, background changes, object placement, style transfers, and character modifications. It excels at understanding contextual instructions like "place in a blizzard" or "create the whole face" while maintaining photorealistic quality.',
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! You can start using Nano Banana for free. Simply upload your image and try out the AI editing capabilities. Experience the power of advanced image transformation with no commitment required.",
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
              Everything you need to know about Nano Banana
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
