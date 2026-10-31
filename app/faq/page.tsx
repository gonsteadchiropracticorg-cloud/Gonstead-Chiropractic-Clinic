"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Stethoscope,
  Activity,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Languages,
  BookOpen,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  FAQCategory,
  FAQItem,
  searchFAQs,
} from "@/lib/faq-data"

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<"all" | FAQCategory>("all")
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "gonstead-technique": true,
  })
  const [language, setLanguage] = useState<"en" | "ur">("en")

  // Filtered FAQs based on query and category
  const filteredFAQs = useMemo(() => {
    return searchFAQs(searchQuery, selectedCategory)
  }, [searchQuery, selectedCategory])

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {}
    filteredFAQs.forEach((item) => {
      allOpen[item.id] = true
    })
    setOpenItems(allOpen)
  }

  const collapseAll = () => {
    setOpenItems({})
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "treatment":
        return <Stethoscope className="h-4 w-4 text-[#2a9d8f]" />
      case "conditions":
        return <Activity className="h-4 w-4 text-emerald-500" />
      case "clinic":
        return <MapPin className="h-4 w-4 text-cyan-600" />
      case "booking":
        return <Calendar className="h-4 w-4 text-amber-500" />
      default:
        return <HelpCircle className="h-4 w-4 text-[#0d5c75]" />
    }
  }

  // Schema.org FAQ structured data for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.slice(0, 15).map((item) => ({
      "@type": "Question",
      name: item.label,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#edf7f6] to-[#f1f5f9] dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[rgb(70,146,138)]/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-white/20 shadow-sm transition-all">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-white/40 rounded-lg p-1"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0 bg-white/10 rounded-full p-1 border border-white/20">
              <Image
                src="/images/gonstead-logo-new.png"
                alt="Gonstead Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-poppins font-black text-sm sm:text-lg tracking-wide text-white block group-hover:text-emerald-200 transition-colors">
                GONSTEAD CHIROPRACTIC
              </span>
              <span className="text-xs text-white/80 font-medium block">
                Bashir Khan Chiropractic Clinic
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLanguage((l) => (l === "en" ? "ur" : "en"))}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9"
              aria-label="Toggle Language"
            >
              <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span>{language === "en" ? "اردو" : "English"}</span>
            </Button>

            {/* Theme Toggle */}
            <div className="bg-white/10 rounded-lg p-1 text-white">
              <ThemeToggle />
            </div>

            {/* Back to Home Button */}
            <Link href="/">
              <Button
                size="sm"
                className="bg-white text-[rgb(70,146,138)] hover:bg-white/90 font-semibold text-xs sm:text-sm h-8 sm:h-9 px-3 shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Back to </span>Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 px-4 bg-gradient-to-r from-[rgb(70,146,138)] via-[rgb(50,126,128)] to-[rgb(30,96,118)] text-white shadow-inner overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs sm:text-sm font-medium tracking-wide mb-4 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <span>
              {language === "en"
                ? "Knowledge & Patient Guide"
                : "مریضوں کی رہنمائی اور اکثر پوچھے گئے سوالات"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-poppins tracking-tight mb-4">
            {language === "en" ? (
              <>Frequently Asked <span className="text-emerald-300">Questions</span></>
            ) : (
              <>گونسٹیڈ کائروپریکٹک <span className="text-emerald-300">جامع رہنمائی</span></>
            )}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            {language === "en"
              ? "Everything you need to know about the Gonstead technique, spinal consultations, conditions we treat, fees, and appointment preparations."
              : "گونسٹیڈ طریقہ علاج، ریڑھ کی ہڈی و مہروں کے مسائل، سائیٹکا، فیس، اور اپائنٹمنٹ کے بارے میں مکمل معلومات۔"}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative shadow-2xl rounded-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === "en"
                    ? "Search questions (e.g., sciatica, fees, first visit, hours)..."
                    : "سوال تلاش کریں (مثلاً سائیٹکا، فیس، کلینک کے اوقات)..."
                }
                className="w-full pl-12 pr-10 py-6 text-sm sm:text-base bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border-2 border-white/30 dark:border-slate-700 shadow-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20"
                aria-label="Search FAQs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-xs bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-full px-2.5 py-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-5xl px-3 sm:px-6 py-8 sm:py-12">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 pb-4 overflow-x-auto no-scrollbar scroll-smooth mb-6">
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shadow-sm border ${
                  isActive
                    ? "bg-[rgb(70,146,138)] text-white border-[rgb(70,146,138)] shadow-md shadow-[rgb(70,146,138)]/20 scale-[1.02]"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{language === "en" ? cat.label : cat.labelUr}</span>
              </button>
            )
          })}
        </div>

        {/* Results Counter & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-1">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {language === "en" ? (
              <>Showing <strong className="text-slate-800 dark:text-slate-200">{filteredFAQs.length}</strong> questions</>
            ) : (
              <><strong className="text-slate-800 dark:text-slate-200">{filteredFAQs.length}</strong> سوالات دستیاب ہیں</>
            )}
            {searchQuery && (
              <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                for &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={expandAll}
              className="text-xs h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {language === "en" ? "Expand All" : "سب کھولیں"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={collapseAll}
              className="text-xs h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {language === "en" ? "Collapse All" : "سب بند کریں"}
            </Button>
          </div>
        </div>

        {/* FAQ Accordion List */}
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">
              {language === "en" ? "No questions match your search" : "کوئی سوال نہیں ملا"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              {language === "en"
                ? "Try searching for a different keyword or contact our clinic directly for immediate help."
                : "براہ کرم کوئی دوسرا لفظ تلاش کریں یا کلینک سے براہ راست رابطہ کریں۔"}
            </p>
            <Button
              variant="default"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
              className="bg-[rgb(70,146,138)] hover:bg-[rgb(60,136,128)] text-white text-xs sm:text-sm"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5 sm:space-y-4">
            {filteredFAQs.map((faq) => {
              const isOpen = !!openItems[faq.id]
              const title = language === "ur" && faq.labelUr ? faq.labelUr : faq.label
              const answer = language === "ur" && faq.answerUr ? faq.answerUr : faq.answer

              return (
                <div
                  key={faq.id}
                  id={faq.id}
                  className={`rounded-2xl transition-all duration-300 border bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md ${
                    isOpen
                      ? "border-[rgb(70,146,138)]/60 dark:border-teal-500/40 ring-1 ring-[rgb(70,146,138)]/20"
                      : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full text-left px-4 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-3 focus:outline-none focus:bg-slate-50/50 dark:focus:bg-slate-800/50"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 w-6 h-6 rounded-lg bg-[rgb(70,146,138)]/10 dark:bg-teal-500/10 flex items-center justify-center flex-shrink-0 text-[rgb(70,146,138)] dark:text-teal-400">
                        {getCategoryIcon(faq.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {faq.categoryName && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold tracking-wider uppercase py-0 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none"
                            >
                              {faq.categoryName}
                            </Badge>
                          )}
                          {faq.isPopular && (
                            <Badge
                              variant="default"
                              className="text-[10px] font-semibold py-0 px-2 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                            >
                              Popular
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-sm sm:text-base md:text-lg font-bold font-poppins text-slate-800 dark:text-slate-100 leading-snug">
                          {title}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-1 flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-transform duration-200">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-[rgb(70,146,138)]" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Body */}
                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-1 border-t border-slate-100 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in-50 duration-200">
                      {/* Main Answer text */}
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal mb-4">
                        {answer}
                      </p>

                      {/* Detailed Sections (Protocol, Tips, Signs) */}
                      {faq.sections && faq.sections.length > 0 && (
                        <div className="mt-4 space-y-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                          {faq.sections.map((section, idx) => {
                            const sectionTitle =
                              language === "ur" && section.titleUr
                                ? section.titleUr
                                : section.title
                            const items =
                              language === "ur" && section.itemsUr
                                ? section.itemsUr
                                : section.items

                            return (
                              <div
                                key={idx}
                                className="bg-white dark:bg-slate-800/60 rounded-xl p-3.5 sm:p-4 border border-slate-200/70 dark:border-slate-700/60"
                              >
                                <h4 className="text-xs sm:text-sm font-bold text-[rgb(70,146,138)] dark:text-teal-400 mb-2 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>{sectionTitle}</span>
                                </h4>
                                <ul className="space-y-1.5 pl-1">
                                  {items.map((itemStr, itemIdx) => (
                                    <li
                                      key={itemIdx}
                                      className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2"
                                    >
                                      <span className="text-[rgb(70,146,138)] font-bold mt-0.5">•</span>
                                      <span>{itemStr}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Helpful Action Links */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Dr. Bashir Certified Gonstead Protocol</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href="/patient/auth">
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-[rgb(70,146,138)] hover:bg-[rgb(60,136,128)] text-white shadow-sm rounded-lg"
                            >
                              Book Consultation
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                          <a
                            href="https://wa.me/923046996267?text=Hello%20Gonstead%20Chiropractic,%20I%20have%20a%20question%20about:%20"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Ask on WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Still Have Questions? Banner */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-[rgb(70,146,138)] to-[#0d5c75] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
            <HelpCircle className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3">
              <Clock className="h-3.5 w-3.5" />
              <span>We Respond Rapidly</span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-poppins mb-2">
              {language === "en"
                ? "Can't find the answer you're looking for?"
                : "کیا آپ کو اپنے سوال کا جواب نہیں ملا؟"}
            </h3>

            <p className="text-xs sm:text-sm text-white/90 mb-6 leading-relaxed">
              {language === "en"
                ? "Our clinical team is always available to discuss your specific symptoms, review X-rays or MRI reports, and guide you towards lasting spinal relief."
                : "ہماری کلینکل ٹیم آپ کی رہنمائی، رپورٹس کے جائزے اور اپائنٹمنٹ کے لیے ہر وقت تیار ہے۔"}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://wa.me/923046996267?text=Hello%20Dr.%20Bashir,%20I%20would%20like%20to%20consult%20regarding%20my%20spine%20issue."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 h-auto rounded-xl shadow-lg">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat on WhatsApp
                </Button>
              </a>

              <a href="tel:+923046996267">
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 h-auto rounded-xl backdrop-blur-sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call +92 304 699 6267
                </Button>
              </a>

              <Link href="/patient/auth">
                <Button
                  variant="outline"
                  className="bg-white text-[rgb(70,146,138)] hover:bg-white/95 font-bold text-xs sm:text-sm px-4 py-2.5 h-auto rounded-xl"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Online
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Gonstead Chiropractic Clinic (Nowshera). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[rgb(70,146,138)] transition-colors">
              Home
            </Link>
            <Link href="/faq" className="text-[rgb(70,146,138)] font-semibold">
              FAQ
            </Link>
            <Link href="/patient/auth" className="hover:text-[rgb(70,146,138)] transition-colors">
              Patient Portal
            </Link>
            <a href="tel:+923046996267" className="hover:text-[rgb(70,146,138)] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
