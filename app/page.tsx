"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Stethoscope,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Calendar,
  Video,
  Shield,
  Heart,
  Zap,
  Target,
  BookOpen,
  ArrowRight,
  PlayCircle,
  Menu,
  X,
  Award,
  GraduationCap,
  Activity,
} from "lucide-react"
import Image from "next/image"
import { EnhancedAppointmentBooking } from "@/components/enhanced-appointment-booking"
import { TechnologyShowcase } from "@/components/technology-showcase"
import { AdvancedChatbot } from "@/components/advanced-chatbot"
import { SportsInjuriesFloat } from "@/components/sports-injuries-float"
import { LanguageProvider, useLanguage } from "@/components/language-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { AppointmentBookingModal } from "@/components/appointment-booking-modal"
import { VoiceAssistantButton } from "@/components/voice-assistant-button"
import { EmailContactSection } from "@/components/EmailContactSection"
import { FooterWeatherWidget } from "@/components/footer-weather-widget"
import { TrustpilotReviewPreview } from '@/components/TrustpilotReviewPreview'
import { PreVisitInstructions } from "@/components/pre-visit-instructions"

function HomePageContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(null as string | null)
  const { t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "services", "doctor", "technology", "contact"]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetHeight = element.offsetHeight

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    // Initialize active section on mount
    handleScroll()
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#E0F2F1] to-[#F8F5F0] dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
          {/* Enhanced Professional Navigation - COMPREHENSIVE MODERN DESIGN */}
      <nav className="fixed top-0 left-0 right-0 z-[9999] bg-[rgb(70,146,138)]/95 dark:bg-[rgb(70,146,138)]/95 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_32px_rgba(70,146,138,0.25)]">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-20 sm:h-24">
            <div className="flex items-center gap-2 sm:gap-3 -ml-2 sm:-ml-4">
              {/* Professional Logo - Clean and Simple */}
              <div className="flex-shrink-0">
                <Image
                  src="/images/gonstead-logo-new.png"
                  alt="Gonstead Chiropractic Logo"
                  width={80}
                  height={80}
                  className="object-contain w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20"
                  priority
                />
              </div>
              {/* Professional Medical Brand - Compact Design */}
              <div className="flex flex-col justify-center">
                {/* Main Clinic Name - Compact */}
                <div className="leading-none">
                  <h1 className="text-xs sm:text-sm lg:text-base font-bold font-poppins">
                    {/* Main title with gradient */}
                    <span className="block bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent font-black tracking-wide">
                      GONSTEAD CHIROPRACTIC
                    </span>
                    {/* Compact clinic badge */}
                    <span className="inline-flex items-center bg-gradient-to-r from-emerald-400/15 to-cyan-400/15 backdrop-blur-sm border border-white/15 rounded-full px-2 py-0.5 text-white font-medium tracking-wide text-xs mt-0.5">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                      CLINIC
                    </span>
                  </h1>
                </div>
                
                {/* Doctor Name - Compact */}
                <div className="mt-1">
                  <p className="text-xs font-medium text-white/90 tracking-wide">
                    Bashir Khan Chiropractic
                  </p>
                </div>
                
                {/* Specialist Badge - Inline and Compact */}
                <div className="mt-0.5">
                  <span className="inline-flex items-center bg-gradient-to-r from-emerald-500/15 to-green-500/15 backdrop-blur-sm border border-emerald-400/30 rounded-md px-2 py-0.5 text-xs font-medium text-emerald-300 dark:text-emerald-300 tracking-wide shadow-sm">
                    <svg className="w-2.5 h-2.5 mr-1.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V6a1 1 0 112 0v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3z" clipRule="evenodd" />
                    </svg>
                    SPINAL HEALTH SPECIALIST
                    <span className="w-1 h-1 bg-emerald-400 rounded-full ml-1.5 animate-pulse"></span>
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {[
                { id: "home", label: "Home" },
                { id: "about", label: "About" },
                { id: "services", label: "Services" },
                { id: "doctor", label: "Doctor" },
                { id: "technology", label: "Technology" },
                { id: "contact", label: "Contact" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-md hover:bg-white/15 ${
                    activeSection === item.id
                      ? "text-white bg-white/15 border border-white/20"
                      : "text-white/85 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center bg-white/10 hover:bg-white/15 rounded-md px-2 py-1 transition-all duration-200">
                <ThemeToggle />
              </div>
              <div className="flex items-center bg-white/10 hover:bg-white/15 rounded-md px-2 py-1 transition-all duration-200">
                <LanguageToggle />
              </div>
              <AppointmentBookingModal
                buttonText="Book Now"
                className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#1e7a6b] text-white px-4 py-2 rounded-md font-medium shadow-md hover:shadow-lg transition-all duration-200 text-sm"
              />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white hover:text-white/80 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/20">
              <div className="flex flex-col gap-4">
                {[
                  { id: "home", label: "Home" },
                  { id: "about", label: "About" },
                  { id: "services", label: "Services" },
                  { id: "doctor", label: "Doctor" },
                  { id: "technology", label: "Technology" },
                  { id: "contact", label: "Contact" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      scrollToSection(item.id)
                      setIsMenuOpen(false)
                    }}
                    className="text-left text-white hover:text-white/80 font-semibold px-4 py-2 rounded transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex items-center gap-3 pt-2 px-4">
                  <div className="bg-white/10 rounded-lg p-2">
                    <ThemeToggle />
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <LanguageToggle />
                  </div>
                </div>
                <div className="px-4">
                  <AppointmentBookingModal
                    buttonText="Book Appointment"
                    fullWidth={true}
                    className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#1e7a6b] text-white w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Professional Medical Design with Background Image */}
      <section id="home" className="relative pt-28 sm:pt-32 min-h-[60vh] lg:min-h-[65vh] flex items-center overflow-hidden">
            {/* Professional Background Image with Enhanced Glassmorphism Blur Effect */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url(/images/chiropractic-hero-background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center'
              }}
            >
              {/* Darkened Glassmorphism Blur Overlay - enhanced depth and visibility */}
              <div className="absolute inset-0 backdrop-blur-[3px] bg-gradient-to-br from-[rgb(76,157,144)]/55 via-[rgb(56,127,134)]/50 to-[rgb(36,97,124)]/55 dark:from-[rgb(76,157,144)]/65 dark:via-[rgb(56,127,134)]/60 dark:to-[rgb(36,97,124)]/65"></div>
              
              {/* Enhanced Glass Layer for Professional Depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 backdrop-blur-[1px]"></div>
              
              {/* Subtle Glass Shimmer Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent animate-pulse opacity-50"></div>
              
              {/* Professional Spine Pattern - Mobile Hidden */}
              <div className="hidden sm:block absolute right-10 top-1/4 w-3 h-96 bg-gradient-to-b from-transparent via-white/20 to-transparent rounded-full shadow-lg"></div>
              <div className="hidden sm:block absolute right-11 top-1/3 w-5 h-5 bg-white/30 rounded-full shadow-md"></div>
              <div className="hidden sm:block absolute right-7 top-1/2 w-5 h-5 bg-white/30 rounded-full shadow-md"></div>
              <div className="hidden sm:block absolute right-11 top-2/3 w-5 h-5 bg-white/30 rounded-full shadow-md"></div>
            </div>

            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 relative z-10 transform-gpu">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                {/* Content Section with 3D Transform */}
                <div className="space-y-8 lg:pr-8 transform-gpu animate-slide-in-left relative z-10">
                  {/* Professional Medical Badge with Voice Assistant */}
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                    <VoiceAssistantButton />
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping animation-delay-1000"></div>
                  </div>

                  {/* Main Heading */}
                  <div className="space-y-3 sm:space-y-4">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white font-poppins leading-tight">
                      {t("hero.precision")}
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 animate-gradient">
                        {t("hero.spinal.care")}
                      </span>
                      <span className="block text-lg sm:text-xl md:text-3xl lg:text-4xl text-blue-200 font-light mt-1 sm:mt-2">
                        {t("hero.gonstead.excellence")}
                      </span>
                    </h1>
                    
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl">
                      {t("hero.description")}
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <AppointmentBookingModal
                      buttonText={t("hero.book.consultation")}
                      fullWidth={false}
                      className="bg-gradient-to-r from-[rgb(76,157,144)] to-[rgb(56,137,124)] hover:from-[rgb(66,147,134)] hover:to-[rgb(46,127,114)] text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg shadow-xl shadow-[rgb(76,157,144)]/25 border border-[rgb(76,157,144)]/20 transition-all duration-300 hover:scale-105 hover:shadow-[rgb(76,157,144)]/40 w-full sm:w-auto"
                    />
                    <Button
                      variant="outline"
                      onClick={() => scrollToSection("about")}
                      className="border-2 border-[rgb(76,157,144)]/50 text-emerald-300 hover:bg-[rgb(76,157,144)]/10 hover:border-[rgb(76,157,144)] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                    >
                      <PlayCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="text-base">{t("hero.discover.method")}</span>
                    </Button>
                  </div>
                  
                  {/* Visiting Card Download Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/images/visiting-card.png';
                        link.download = 'Bashir_Khan_Chiropractic_Visiting_Card.png';
                        link.click();
                      }}
                      className="border border-emerald-300/50 text-emerald-300 hover:bg-emerald-300/10 hover:border-emerald-300 px-4 py-2 text-sm font-medium rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Visiting Card
                    </Button>
                  </div>

                  {/* Professional Stats */}
                  <div className="grid grid-cols-3 gap-6 pt-8 border-t border-blue-400/20">
                    <div className="text-center group">
                      <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-400 mb-2 group-hover:scale-110 transition-transform">2000+</div>
                      <div className="text-sm sm:text-base text-blue-200 font-medium">{t("hero.patients.healed")}</div>
                    </div>
                    <div className="text-center group">
                      <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-teal-400 mb-2 group-hover:scale-110 transition-transform">15+</div>
                      <div className="text-sm sm:text-base text-cyan-200 font-medium">{t("hero.years.mastery")}</div>
                    </div>
                    <div className="text-center group">
                      <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-teal-400 to-green-400 mb-2 group-hover:scale-110 transition-transform">99%</div>
                      <div className="text-sm sm:text-base text-teal-200 font-medium">{t("hero.success.rate")}</div>
                    </div>
                  </div>
                </div>

                {/* Professional Image Section with 3D Effects */}
                <div className="relative flex justify-center lg:justify-end transform-gpu animate-slide-in-right z-10">
                  {/* Main Professional Container */}
                  <div className="relative">
                    {/* Enhanced 3D Glowing Background Effects */}
                    <div className="absolute -inset-12 bg-gradient-to-r from-blue-500/25 via-cyan-500/25 to-teal-500/25 rounded-3xl blur-3xl animate-pulse-3d transform-gpu translate-z-10"></div>
                    <div className="absolute -inset-8 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-teal-400/20 rounded-3xl blur-2xl animate-pulse-3d animation-delay-1000 transform-gpu translate-z-20"></div>
                    <div className="absolute -inset-4 bg-gradient-to-br from-blue-600/35 to-cyan-600/35 rounded-2xl animate-pulse-3d animation-delay-2000 transform-gpu translate-z-30 shadow-2xl"></div>
                    
                    {/* Professional 3D Image Frame */}
                    <div className="relative w-64 h-80 md:w-80 md:h-96 overflow-hidden rounded-2xl border-2 border-blue-400/40 shadow-2xl shadow-blue-500/30 bg-gradient-to-br from-gray-800 to-gray-900 transform-gpu hover:rotate-y-12 hover:rotate-x-6 transition-all duration-700 preserve-3d animate-tilt-3d">
                      {/* Doctor's Image */}
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/dr-bashir-photo.jpeg"
                          alt="Dr. Bashir Khan - Gonstead Specialist"
                          fill
                          className="object-cover object-center scale-105 hover:scale-110 transition-transform duration-500"
                          priority
                        />
                        
                        {/* Professional Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-blue-900/20"></div>
                        
                        {/* Professional Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Bashir Khan Chiropractic</h3>
                            <p className="text-blue-300 font-medium">Gonstead Certified Specialist</p>
                            <div className="flex items-center gap-2 text-sm text-cyan-200">
                              <Award className="h-4 w-4" />
                              <span>15+ Years Excellence</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Professional Elements */}
                    <div className="absolute -top-6 -right-6 bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl shadow-xl border border-blue-400/20 backdrop-blur-sm">
                      <div className="flex items-center gap-3 text-white">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <div className="text-sm font-bold">4.9/5</div>
                      </div>
                    </div>

                    <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-teal-500 to-green-500 p-4 rounded-2xl shadow-xl border border-teal-400/20 backdrop-blur-sm">
                      <div className="flex items-center gap-3 text-white">
                        <Shield className="h-6 w-6" />
                        <div className="text-sm font-bold">Certified Expert</div>
                      </div>
                    </div>

                    <div className="absolute top-1/2 -left-8 bg-gradient-to-br from-cyan-500 to-blue-500 p-3 rounded-xl shadow-xl border border-cyan-400/20 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <Target className="h-5 w-5" />
                        <span>Precision Care</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Professional Elements */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex items-center gap-4 text-blue-200 animate-bounce">
                  <div className="w-1 h-12 bg-gradient-to-b from-blue-400 to-transparent rounded-full"></div>
                  <span className="text-sm font-medium">{t("hero.scroll.explore")}</span>
                </div>
              </div>
            </div>

            {/* Custom Styles for Animations */}
            <style jsx>{`
              @keyframes gradient {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
              }
              .animate-gradient {
                background-size: 200% 200%;
                animation: gradient 3s ease infinite;
              }
              .bg-grid-pattern {
                background-image: 
                  linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
                background-size: 50px 50px;
              }
              @keyframes spin-slow {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .animate-spin-slow {
                animation: spin-slow 20s linear infinite;
              }
              @keyframes bounce-slow {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              .animate-bounce-slow {
                animation: bounce-slow 3s ease-in-out infinite;
              }
              .animation-delay-1000 {
                animation-delay: 1s;
              }
              .animation-delay-2000 {
                animation-delay: 2s;
              }
              .animation-delay-3000 {
                animation-delay: 3s;
              }
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(180deg); }
              }
              .animate-float {
                animation: float 6s ease-in-out infinite;
              }
              .bg-300% {
                background-size: 300% 300%;
              }
              .animate-gradient {
                background-size: 300% 300%;
                animation: gradient 4s ease infinite;
              }
              @keyframes gradient {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
              }
              .animation-delay-1000 {
                animation-delay: 1s;
              }
              .animation-delay-2000 {
                animation-delay: 2s;
              }
              .animation-delay-3000 {
                animation-delay: 3s;
              }
            `}</style>
          </section>

          {/* About Section */}
          <section id="about" className="relative py-20 bg-white dark:bg-[rgb(30,63,99)] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                 style={{backgroundImage: 'url(/images/medical-background-professional.PNG)'}}>
              {/* Glass Blur Overlay */}
              <div className="absolute inset-0 bg-[rgba(174,193,191,0.8)] backdrop-blur-sm"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center mb-16">
                <Badge className="bg-[#0d5c75]/10 text-[#0d5c75] dark:bg-blue-900/20 dark:text-blue-400 border-[#0d5c75]/20 mb-4">
                  {t("about.clinic")}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0d5c75] dark:text-white mb-6 font-poppins">
                  {t("about.title")}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  {t("about.description")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: Target,
                    title: t("about.precise.diagnosis"),
                    description: t("about.precise.description"),
                    image: "/images/Precise Diagnosis.png",
                  },
                  {
                    icon: Zap,
                    title: t("about.effective.treatment"),
                    description: t("about.effective.description"),
                    image: "/images/Effective Treatment.png",
                  },
                  {
                    icon: Heart,
                    title: t("about.compassionate.care"),
                    description: t("about.compassionate.description"),
                    image: "/images/Compassionate Care.png",
                  },
                  {
                    icon: Shield,
                    title: t("about.safe.proven"),
                    description: t("about.safe.description"),
                    image: "/images/Safe & Proven.png",
                  },
                ].map((feature, index) => (
                  <Card key={index} className="group relative overflow-hidden text-center hover:shadow-2xl transition-all duration-500 border-[#0d5c75]/20 hover:border-[#0d5c75]/40 transform hover:scale-105 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardContent className="p-6 relative z-10">
                      {/* Glassmorphism Background with Image */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-md border border-white/30 rounded-lg">
                        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 group-hover:opacity-30 transition-opacity duration-500" 
                             style={{backgroundImage: `url('${feature.image}')`}}>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d5c75]/10 via-transparent to-[#2a9d8f]/10"></div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-20">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#0d5c75]/20 to-[#2a9d8f]/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <feature.icon className="h-10 w-10 text-[#0d5c75] dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0d5c75] dark:text-white mb-4 group-hover:text-[#2a9d8f] transition-colors duration-300">{feature.title}</h3>
                        <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{feature.description}</p>
                      </div>
                      
                      {/* Animated Border */}
                      <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r from-[#0d5c75] via-[#2a9d8f] to-[#0d5c75] bg-clip-border opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg m-[2px]"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section id="services" className="relative py-20 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                 style={{backgroundImage: 'url(/images/human skeleton.png)'}}>
            </div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center mb-16">
                <Badge className="bg-[#2a9d8f]/10 text-[#2a9d8f] dark:bg-green-900/20 dark:text-green-400 border-[#2a9d8f]/20 mb-4">
                  Our Services
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0d5c75] dark:text-white mb-6 font-poppins">
                  Comprehensive Chiropractic Solutions
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  From acute pain relief to preventive care, we offer a full range of chiropractic services tailored to
                  your specific needs.
                </p>
              </div>

              <Tabs defaultValue="gonstead" className="max-w-6xl mx-auto">
                {/* Clean & Simple Responsive Services Menu - Horizontal on all screens */}
                <div className="w-full mb-8">
                  <TabsList className="w-full grid grid-cols-3 gap-2 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-cyan-500/30 rounded-xl shadow-lg dark:shadow-cyan-500/20">
                    {/* Horizontal layout on both mobile and desktop */}
                    <TabsTrigger 
                      value="gonstead" 
                      className="w-full bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[rgb(64,133,133)] data-[state=active]:to-[rgb(74,143,143)] data-[state=active]:text-white text-gray-800 dark:text-gray-200 data-[state=active]:dark:from-cyan-600 data-[state=active]:dark:to-blue-600 font-semibold text-xs sm:text-sm md:text-base py-3 sm:py-3 px-2 sm:px-4 rounded-lg border border-transparent data-[state=active]:border-white/20 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <span>Gonstead Technique</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="consultation" 
                      className="w-full bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[rgb(64,133,133)] data-[state=active]:to-[rgb(74,143,143)] data-[state=active]:text-white text-gray-800 dark:text-gray-200 data-[state=active]:dark:from-cyan-600 data-[state=active]:dark:to-blue-600 font-semibold text-xs sm:text-sm md:text-base py-3 sm:py-3 px-2 sm:px-4 rounded-lg border border-transparent data-[state=active]:border-white/20 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <span>Consultations</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="wellness" 
                      className="w-full bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[rgb(64,133,133)] data-[state=active]:to-[rgb(74,143,143)] data-[state=active]:text-white text-gray-800 dark:text-gray-200 data-[state=active]:dark:from-cyan-600 data-[state=active]:dark:to-blue-600 font-semibold text-xs sm:text-sm md:text-base py-3 sm:py-3 px-2 sm:px-4 rounded-lg border border-transparent data-[state=active]:border-white/20 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <span>Wellness Programs</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="gonstead" className="space-y-6">
                  <Card className="border-[#0d5c75]/20 bg-[rgb(206,225,225)]/90">
                    <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Gonstead Chiropractic Adjustments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-[#0d5c75] dark:text-white mb-3">
                            What Makes Gonstead Special:
                          </h4>
                          <ul className="space-y-2">
                            {[
                              "Precise spinal analysis and X-ray evaluation",
                              "Specific adjustment techniques for targeted results",
                              "Focus on spinal biomechanics and nerve function",
                              "Minimal force, maximum effectiveness approach",
                            ].map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-300">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0d5c75] dark:text-white mb-3">Conditions We Treat:</h4>
                          <ul className="space-y-2">
                            {[
                              "Lower back pain and sciatica",
                              "Neck pain and headaches",
                              "Disc herniation and bulging",
                              "Postural problems and muscle tension",
                            ].map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 text-[#2a9d8f] mt-1 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-300">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="consultation" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-[#2a9d8f]/20 bg-[rgb(205,223,222)]/90">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[#0d5c75] dark:text-white">
                          <Users className="h-5 w-5" />
                          In-Clinic Consultations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-300">Comprehensive spinal examination</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-300">X-ray analysis and interpretation</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-300">Hands-on Gonstead adjustments</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-300">Personalized treatment planning</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-[#2a9d8f]/20 bg-[rgb(205,223,222)]/90">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[#0d5c75] dark:text-white">
                          <Video className="h-5 w-5" />
                          Video Consultations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-300">Remote health assessments</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-300">Exercise and posture guidance</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-300">Follow-up care and monitoring</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-300">Convenient from home access</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="wellness" className="space-y-6">
                  <Card className="border-[#2a9d8f]/20 bg-[rgb(205,223,222)]/90">
                    <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#0d5c75] text-white">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Comprehensive Wellness Programs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-semibold text-[#0d5c75] dark:text-white mb-3">Preventive Care</h4>
                          <ul className="space-y-2">
                            <li className="text-sm text-gray-600 dark:text-gray-300">• Regular spinal check-ups</li>
                            <li className="text-sm text-gray-600 dark:text-gray-300">• Posture correction programs</li>
                            <li className="text-sm text-gray-600 dark:text-gray-300">• Workplace ergonomics</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0d5c75] dark:text-white mb-3">Rehabilitation</h4>
                          <ul className="space-y-2">
                            <li className="text-sm text-gray-600 dark:text-gray-300">• Therapeutic exercises</li>
                            <li className="text-sm text-gray-600 dark:text-gray-300">
                              • Strength and flexibility training
                            </li>
                            <li className="text-sm text-gray-600 dark:text-gray-300">• Recovery monitoring</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0d5c75] dark:text-white mb-3">Education</h4>
                          <ul className="space-y-2">
                            <li className="text-sm text-gray-600 dark:text-gray-300">• Spinal health workshops</li>
                            <li className="text-sm text-gray-600 dark:text-gray-300">
                              • Lifestyle modification guidance
                            </li>
                            <li className="text-sm text-gray-600 dark:text-gray-300">• Home care instructions</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              {/* Professional Call-to-Action */}
              <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="max-w-2xl mx-auto mb-6">
                  <h3 className="text-2xl font-bold text-[#0d5c75] dark:text-white mb-3">
                    Ready to Experience Professional Chiropractic Care?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Don't let spinal pain control your life. Book your consultation today and start your journey to lasting relief.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <AppointmentBookingModal
                    buttonText="Schedule Your Consultation"
                    buttonSize="lg"
                    className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#1e7a6b] text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105"
                  />
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Quick 2-minute booking</span>
                  </div>
                </div>
              </div>
              
            </div>
          </section>


          {/* Doctor Profile Section - PREMIUM REDESIGN */}
          <section id="doctor" className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                 style={{backgroundImage: 'url(/images/clarence-gonstead.png)'}}>
              {/* Glass Blur Overlay */}
              <div className="absolute inset-0 bg-[rgba(174,193,191,0.8)] backdrop-blur-sm"></div>
            </div>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-[#0d5c75] rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#2a9d8f] rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#0d5c75]/20 to-[#2a9d8f]/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-20">
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center px-4 py-2 mb-6 bg-gradient-to-r from-[#0d5c75]/10 to-[#2a9d8f]/10 rounded-full border border-[#0d5c75]/20 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-[#0d5c75] rounded-full mr-3 animate-pulse"></div>
                  <span className="text-[#0d5c75] dark:text-blue-400 font-semibold text-sm tracking-wide uppercase">
                    Meet Your Doctor
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0d5c75] via-[#2a9d8f] to-[#0d5c75] bg-clip-text text-transparent mb-6 font-poppins leading-tight">
                  Bashir Khan Chiropractic
                </h2>
                <div className="inline-block mb-6">
                  <span className="text-xl md:text-2xl font-semibold text-[#2a9d8f] dark:text-blue-400 bg-gradient-to-r from-[#2a9d8f]/10 to-[#0d5c75]/10 px-6 py-2 rounded-full border border-[#2a9d8f]/20">
                    Gonstead Specialist
                  </span>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Experience exceptional chiropractic care with a doctor who combines traditional Gonstead techniques
                  with modern expertise and compassionate care.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Premium Doctor Image Design - Mobile First */}
                <div className="order-1 lg:order-2 relative flex justify-center">
                  <div className="relative group">
                    {/* Outer Decorative Ring */}
                    <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-[#0d5c75]/20 via-[#2a9d8f]/20 to-[#0d5c75]/20 animate-spin-slow"></div>
                    
                    {/* Middle Ring */}
                    <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-white/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-600/80 shadow-2xl"></div>
                    
                    {/* Inner Glow Ring */}
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#0d5c75]/30 to-[#2a9d8f]/30 blur-sm animate-pulse"></div>
                    
                    {/* Main Image Container */}
                    <div className="w-80 h-80 relative overflow-hidden rounded-full border-4 border-white dark:border-gray-700 shadow-2xl bg-gradient-to-br from-[#0d5c75]/5 to-[#2a9d8f]/5 group-hover:scale-105 transition-all duration-700">
                      <Image
                        src="/images/dr-bashir-photo.jpeg"
                        alt="Dr. Bashir Khan - Gonstead Chiropractor"
                        fill
                        className="object-cover object-center scale-110 group-hover:scale-115 transition-transform duration-700"
                        priority
                      />
                      {/* Professional Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d5c75]/15 via-transparent to-transparent"></div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2a9d8f]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    {/* Professional Achievement Badges */}
                    <div className="absolute -top-4 -right-4 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white p-3 rounded-full shadow-xl border-4 border-white dark:border-gray-700 animate-bounce-slow">
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#2a9d8f] to-[#0d5c75] text-white p-3 rounded-full shadow-xl border-4 border-white dark:border-gray-700 animate-bounce-slow animation-delay-1000">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    
                    {/* Experience Badge */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border-2 border-[#0d5c75]/20">
                      <span className="text-[#0d5c75] dark:text-blue-400 font-bold text-sm">15+ Years</span>
                    </div>
                    
                    {/* Success Rate Badge */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border-2 border-[#2C5E75]/20">
                      <span className="text-[#2C5E75] dark:text-green-400 font-bold text-sm">99% Success</span>
                    </div>
                    
                    {/* Floating Particles */}
                    <div className="absolute -top-8 -left-8 w-4 h-4 bg-[#0d5c75]/60 rounded-full animate-float"></div>
                    <div className="absolute -bottom-8 -right-8 w-3 h-3 bg-[#2a9d8f]/60 rounded-full animate-float animation-delay-2000"></div>
                    <div className="absolute top-1/2 -right-12 w-2 h-2 bg-[#0d5c75]/40 rounded-full animate-float animation-delay-3000"></div>
                  </div>
                </div>

                {/* Content Section - Mobile Second */}
                <div className="order-2 lg:order-1 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0d5c75] dark:text-white mb-2">Bashir Khan Chiropractic</h3>
                    <p className="text-lg text-[#2a9d8f] dark:text-blue-400 font-semibold mb-4">
                      Gonstead Certified Specialist
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Dr. Bashir Khan brings over 15 years of specialized experience in Gonstead Chiropractic to
                      Nowshera. His dedication to precision and patient care has helped thousands of patients achieve
                      lasting relief from spinal conditions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#0d5c75] dark:text-white flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education & Certification
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li>• Doctor of Chiropractic (D.C.)</li>
                        <li>• Gonstead Technique Certification</li>
                        <li>• Advanced Spinal Analysis Training</li>
                        <li>• Continuing Education in Modern Techniques</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#0d5c75] dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Specializations
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li>• Gonstead Spinal Analysis</li>
                        <li>• Disc Herniation Treatment</li>
                        <li>• Postural Correction</li>
                        <li>• Sports Injury Rehabilitation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-[#0d5c75]/5 dark:bg-blue-900/20 p-6 rounded-lg">
                    <h4 className="font-semibold text-[#0d5c75] dark:text-white mb-3">Philosophy of Care</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      "Every patient deserves precise, personalized care. Through the Gonstead technique, I focus on
                      identifying the exact source of spinal dysfunction and providing targeted treatment that addresses
                      the root cause, not just the symptoms."
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <AppointmentBookingModal
                      buttonText="Book Consultation"
                      className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
                    />
                    <Button
                      variant="outline"
                      className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white bg-transparent"
                      onClick={() => window.open('tel:+923046996267', '_self')}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* Technology Section */}
          <section id="technology" className="py-20">
            <div className="container mx-auto px-4">
              <TechnologyShowcase />
            </div>
          </section>

          {/* Contact & Booking Section */}
          <section id="contact" className="relative py-20 bg-white dark:bg-[rgb(30,63,99)] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                 style={{backgroundImage: 'url(/images/spinal-nerves-subluxation-poster.jpeg)'}}>
              {/* Glass Blur Overlay */}
              <div className="absolute inset-0 bg-[rgba(174,193,191,0.8)] backdrop-blur-sm"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center mb-16 relative">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-[#0d5c75]/10 to-[#2a9d8f]/10 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-[#2a9d8f]/15 to-[#0d5c75]/15 rounded-full blur-2xl animate-pulse animation-delay-1000"></div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-64 h-24 bg-gradient-to-r from-transparent via-[#0d5c75]/5 to-transparent rounded-full blur-xl"></div>
                </div>
                
                {/* Professional Badge with 3D Effect */}
                <div className="relative inline-block mb-6">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#0d5c75]/20 to-[#2a9d8f]/20 rounded-full blur-md opacity-70 animate-pulse"></div>
                  <Badge className="relative bg-gradient-to-r from-[#0d5c75]/20 to-[#2a9d8f]/20 text-[#0d5c75] dark:bg-blue-900/20 dark:text-blue-400 border-2 border-[#0d5c75]/30 px-6 py-3 text-base font-bold shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#0d5c75] rounded-full animate-pulse"></div>
                      <span className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] bg-clip-text text-transparent font-bold">Book Your Appointment</span>
                      <div className="w-2 h-2 bg-[#2a9d8f] rounded-full animate-pulse animation-delay-1000"></div>
                    </div>
                  </Badge>
                </div>
                
                {/* Enhanced Main Title with 3D Text Effect */}
                <div className="relative mb-6">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins leading-tight relative z-10">
                    <span className="block">
                      <span className="relative inline-block">
                        <span className="bg-gradient-to-r from-[#0d5c75] via-[#2a9d8f] to-[#0d5c75] bg-clip-text text-transparent animate-gradient bg-300% font-black tracking-tight hover:scale-105 transition-transform duration-300">
                          Start Your Journey
                        </span>
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#0d5c75]/20 via-[#2a9d8f]/20 to-[#0d5c75]/20 rounded-lg blur-lg opacity-30 animate-pulse"></div>
                      </span>
                    </span>
                    <span className="block mt-2">
                      <span className="relative inline-block">
                        <span className="bg-gradient-to-r from-[#2a9d8f] via-[#0d5c75] to-[#2a9d8f] bg-clip-text text-transparent animate-gradient bg-300% font-black tracking-tight hover:scale-105 transition-transform duration-300">
                          to Better Spinal Health
                        </span>
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#2a9d8f]/20 via-[#0d5c75]/20 to-[#2a9d8f]/20 rounded-lg blur-lg opacity-30 animate-pulse animation-delay-2000"></div>
                      </span>
                    </span>
                  </h2>
                  
                  {/* Animated Underline */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-[#2a9d8f] to-[#0d5c75] rounded-full animate-pulse animation-delay-1000"></div>
                </div>
                
                {/* Enhanced Description with Professional Styling */}
                <div className="relative max-w-4xl mx-auto">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#0d5c75]/5 via-transparent to-[#2a9d8f]/5 rounded-2xl blur-xl opacity-50"></div>
                  <p className="relative text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl px-8 py-6 shadow-lg">
                    <span className="block">
                      <span className="text-[#0d5c75] dark:text-[#2a9d8f] font-bold">Ready to experience</span> the precision of Gonstead chiropractic care?
                    </span>
                    <span className="block mt-2">
                      <span className="text-[#2a9d8f] dark:text-[#0d5c75] font-bold">Book your consultation today</span> and take the first step towards a pain-free life.
                    </span>
                  </p>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#0d5c75]/20 rounded-full animate-bounce opacity-60"></div>
                  <div className="absolute -top-2 -right-6 w-6 h-6 bg-[#2a9d8f]/20 rounded-full animate-bounce animation-delay-1000 opacity-60"></div>
                  <div className="absolute -bottom-4 left-1/4 w-4 h-4 bg-[#0d5c75]/20 rounded-full animate-bounce animation-delay-2000 opacity-60"></div>
                  <div className="absolute -bottom-2 right-1/4 w-5 h-5 bg-[#2a9d8f]/20 rounded-full animate-bounce animation-delay-3000 opacity-60"></div>
                </div>
                
                {/* Professional Stats with Animation */}
                <div className="flex justify-center items-center gap-8 mt-8">
                  <div className="text-center group">
                    <div className="text-2xl font-bold text-[#0d5c75] dark:text-[#2a9d8f] mb-1 group-hover:scale-110 transition-transform">2000+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Patients Healed</div>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#0d5c75]/30 to-transparent"></div>
                  <div className="text-center group">
                    <div className="text-2xl font-bold text-[#2a9d8f] dark:text-[#0d5c75] mb-1 group-hover:scale-110 transition-transform">99%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Success Rate</div>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#2a9d8f]/30 to-transparent"></div>
                  <div className="text-center group">
                    <div className="text-2xl font-bold text-[#0d5c75] dark:text-[#2a9d8f] mb-1 group-hover:scale-110 transition-transform">15+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Years Experience</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Professional Email Contact Section */}
                <div className="space-y-8">
                  <EmailContactSection />
                </div>

                {/* Contact Information & Map */}
                <div className="space-y-8">
                  <Card className="border-[#0d5c75]/20 bg-[rgb(206,225,225)]/90">
                    <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Visit Our Clinic
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-[#0d5c75] dark:text-blue-400 mt-1" />
                        <div>
                          <p className="font-semibold text-[#0d5c75] dark:text-white">Address</p>
                          <p className="text-gray-600 dark:text-gray-300">
                            Near Peshawar Model School, Tehsil Road
                            <br />
                            Nowshera, Khyber Pakhtunkhwa
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-[#0d5c75] dark:text-blue-400 mt-1" />
                        <div>
                          <p className="font-semibold text-[#0d5c75] dark:text-white">Phone</p>
                          <a
                            href="tel:+923046996267"
                            className="text-gray-600 dark:text-gray-300 hover:text-[#0d5c75] dark:hover:text-blue-400"
                          >
                            +92 304 699 6267
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-[#0d5c75] dark:text-blue-400 mt-1" />
                        <div>
                          <p className="font-semibold text-[#0d5c75] dark:text-white">Email</p>
                          <a
                            href="mailto:info@gonsteadchiropractic.com"
                            className="text-gray-600 dark:text-gray-300 hover:text-[#0d5c75] dark:hover:text-blue-400"
                          >
                            info@gonsteadchiropractic.com
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-[#0d5c75] dark:text-blue-400 mt-1" />
                        <div>
                          <p className="font-semibold text-[#0d5c75] dark:text-white">Hours</p>
                          <div className="text-gray-600 dark:text-gray-300 space-y-1">
                            <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
                            <p>Sunday: Emergency appointments only</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Google Maps */}
                  <Card className="border-[#0d5c75]/20">
                    <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#0d5c75] text-white">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Find Us on Map
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="w-full h-64 rounded-b-lg overflow-hidden">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d846.892964448336!2d71.9809278937682!3d34.009980051381675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ded38c7d0ae201%3A0xf71d089470e91031!2sPeshawar%20Model%20School%20Nowshera%20Campus!5e1!3m2!1sen!2sus!4v1751737912463!5m2!1sen!2sus"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Gonstead Chiropractic Clinic Location"
                        ></iframe>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            </div>
          </section>

          {/* Professional Patient Reviews Section */}
          <section className="relative py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 overflow-hidden">
            {/* Background Enhancement */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-72 h-72 bg-[#00b67a]/5 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00b67a]/3 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#00b67a]/8 rounded-full blur-2xl animate-pulse animation-delay-1000"></div>
            </div>
            
            {/* Professional Divider */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00b67a]/30 to-transparent"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <TrustpilotReviewPreview className="" />
            </div>
            
            {/* Professional Bottom Accent */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00b67a]/20 to-transparent"></div>
          </section>

          {/* Patient Education Access Section */}
          <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-12 px-4 sm:px-6 lg:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
            {/* Sophisticated Background Elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><defs><pattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'><path d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='1'/></pattern></defs><rect width='100%' height='100%' fill='url(%23grid)'/></svg>")`
            }}></div>
            
            {/* Main Content */}
            <div className="relative max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left Content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl mr-4 shadow-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
                      Advanced Patient Education Resources
                    </h2>
                  </div>
                  
                  <p className="text-lg text-slate-300 mb-6 max-w-2xl leading-relaxed">
                    Discover valuable insights into chiropractic care and enhance your healing journey with our meticulously curated guides.
                  </p>
                  
                  {/* Enhanced Benefits */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-sm border border-emerald-500/20 rounded-full px-5 py-3 hover:from-emerald-600/30 hover:to-teal-600/30 transition-all duration-300 shadow-md hover:shadow-lg">
                      <Award className="w-5 h-5 text-emerald-300" />
                      <span className="text-sm text-emerald-200 font-medium">Expert-Approved</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 backdrop-blur-sm border border-teal-500/20 rounded-full px-5 py-3 hover:from-teal-600/30 hover:to-cyan-600/30 transition-all duration-300 shadow-md hover:shadow-lg">
                      <Clock className="w-5 h-5 text-teal-300" />
                      <span className="text-sm text-teal-200 font-medium">Always Updated</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-sm border border-cyan-500/20 rounded-full px-5 py-3 hover:from-cyan-600/30 hover:to-blue-600/30 transition-all duration-300 shadow-md hover:shadow-lg">
                      <Users className="w-5 h-5 text-cyan-300" />
                      <span className="text-sm text-cyan-200 font-medium">Easy to Follow</span>
                    </div>
                  </div>
                </div>
                
                {/* Right CTA */}
                <div className="flex-shrink-0">
                  <a
                    href="/educational-guide.html"
                    className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl 
                             hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 shadow-2xl hover:shadow-lg
                             transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
                             border border-emerald-400/20 backdrop-blur-sm"
                    aria-label="View comprehensive educational guide for chiropractic patients"
                  >
                    <BookOpen className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300 animate-bounce-slow" />
                    <span className="relative">
                      View Guide
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white/50 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </section>


          {/* Footer */}
          <footer className="bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 text-white py-8">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {/* Logo & Clinic Info */}
                <div className="flex-shrink-0 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                    <Image
                    src="/images/gonstead-chiropractic-logo-new.png"
                      alt="Gonstead Chiropractic Logo"
                      width={80}
                      height={80}
                      className="filter brightness-110 animate-pulse"
                    />
                    <div>
                      <h3 className="text-xl font-bold font-poppins">Gonstead Chiropractic</h3>
                      <p className="text-xs text-white/80">Bashir Khan Chiropractic</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 max-w-xs mx-auto md:mx-0">
                    {t("footer.description")}
                  </p>
                </div>

                {/* Quick Contact */}
                <div className="flex flex-col items-center text-center md:text-left" aria-label="Contact Information">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2" aria-label="Phone">
                    <Phone className="h-4 w-4 text-white/80 mt-0.5" />
                    <a href="tel:+923046996267" className="hover:text-white transition-colors">{t("clinic.phone")}</a>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2" aria-label="Email">
                    <Mail className="h-4 w-4 text-white/80 mt-0.5" />
                    <a href="mailto:info@gonsteadchiropractic.com" className="hover:text-white transition-colors">{t("clinic.email")}</a>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-2" aria-label="Location">
                    <MapPin className="h-4 w-4 text-white/80 mt-0.5" />
                    <span className="text-xs text-white/80">{t("clinic.location")}</span>
                  </div>
                </div>

                {/* Weather Widget */}
                <div className="flex justify-center">
                  <FooterWeatherWidget />
                </div>

                {/* CTA Section */}
                <div className="flex flex-col items-center text-center md:text-right">
                  <h4 className="font-semibold mb-3 text-sm">{t("contact.badge")}</h4>
                  <AppointmentBookingModal
                    buttonText={t("book.appointment")}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300"
                  />
                </div>
              </div>

              {/* Copyright */}
              <div className="border-t border-white/20 mt-6 pt-4 text-center">
                <p className="text-xs text-white/80">{t("footer.copyright")}</p>
              </div>
            </div>
          </footer>
        </div>

        {/* Floating Components */}
        <AdvancedChatbot />
        <SportsInjuriesFloat />
    </>
  )
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <HomePageContent />
    </LanguageProvider>
  )
}
