import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getTranslations } from "next-intl/server"

export async function FaqSection() {
  const t = await getTranslations("faqSection")

  const faqs = [
    {
      question: t("q1Question"),
      answer: t("q1Answer"),
    },
    {
      question: t("q2Question"),
      answer: t("q2Answer"),
    },
    {
      question: t("q3Question"),
      answer: t("q3Answer"),
    },
    {
      question: t("q4Question"),
      answer: t("q4Answer"),
    },
    {
      question: t("q5Question"),
      answer: t("q5Answer"),
    },
    {
      question: t("q6Question"),
      answer: t("q6Answer"),
    },
  ]

  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t("heading")}
            </h2>
            <p className="text-lg text-muted-foreground text-balance leading-relaxed">
              {t("subtitle")}
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
