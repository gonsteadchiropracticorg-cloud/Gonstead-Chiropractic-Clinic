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
import { WhatsAppFloat } from "@/components/whatsapp-float"
import { LanguageProvider } from "@/components/language-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { DynamicFooter } from "@/components/dynamic-footer"

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

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
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white dark:from-gray-900 dark:to-gray-800">
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-[#0d5c75]/10 dark:border-gray-700">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 relative">
                    <Image
                      src="/images/gonstead-logo-new.png"
                      alt="Gonstead Chiropractic Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#0d5c75] dark:text-white font-poppins">
                      Gonstead Chiropractic
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Dr. Bashir Khan</p>
                  </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
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
                      className={`text-sm font-medium transition-colors hover:text-[#0d5c75] dark:hover:text-blue-400 ${
                        activeSection === item.id
                          ? "text-[#0d5c75] dark:text-blue-400 border-b-2 border-[#0d5c75] dark:border-blue-400"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Theme and Language Toggles */}
                <div className="hidden md:flex items-center gap-3">
                  <ThemeToggle />
                  <LanguageToggle />
                  <Button
                    onClick={() => scrollToSection("contact")}
                    className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
                  >
                    Book Appointment
                  </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 text-gray-600 dark:text-gray-300"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>

              {/* Mobile Menu */}
              {isMenuOpen && (
                <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
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
                        onClick={() => scrollToSection(item.id)}
                        className="text-left text-gray-600 dark:text-gray-300 hover:text-[#0d5c75] dark:hover:text-blue-400 font-medium"
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="flex items-center gap-3 pt-2">
                      <ThemeToggle />
                      <LanguageToggle />
                    </div>
                    <Button
                      onClick={() => scrollToSection("contact")}
                      className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white w-full"
                    >
                      Book Appointment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Hero Section */}
          <section id="home" className="pt-16 min-h-screen flex items-center">
            <div className="container mx-auto px-4 py-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Badge className="bg-[#0d5c75]/10 text-[#0d5c75] dark:bg-blue-900/20 dark:text-blue-400 border-[#0d5c75]/20">
                      Gonstead Certified Specialist
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold text-[#0d5c75] dark:text-white font-poppins leading-tight">
                      Expert Spinal Care with{" "}
                      <span className="text-[#2a9d8f] dark:text-blue-400">Gonstead Precision</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      Experience the most advanced chiropractic care with Dr. Bashir Khan. Specializing in the Gonstead
                      technique for precise spinal analysis and targeted adjustments that deliver lasting results.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => scrollToSection("contact")}
                      className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white px-8 py-3 text-lg"
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      Book Consultation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => scrollToSection("about")}
                      className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white px-8 py-3 text-lg"
                    >
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Learn More
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#0d5c75] dark:text-blue-400">1000+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Patients Treated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#0d5c75] dark:text-blue-400">15+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Years Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#0d5c75] dark:text-blue-400">98%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative z-10">
                    <Image
                      src="/images/dr-bashir-photo.jpeg"
                      alt="Dr. Bashir Khan - Gonstead Chiropractor"
                      width={500}
                      height={600}
                      className="rounded-2xl shadow-2xl object-cover"
                    />
                  </div>
                  <div className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-[#0d5c75]/20 to-[#2a9d8f]/20 rounded-2xl"></div>

                  {/* Floating Elements */}
                  <div className="absolute -bottom-8 -right-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">4.9/5 Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="py-20 bg-white dark:bg-gray-800">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="bg-[#0d5c75]/10 text-[#0d5c75] dark:bg-blue-900/20 dark:text-blue-400 border-[#0d5c75]/20 mb-4">
                  About Our Clinic
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0d5c75] dark:text-white mb-6 font-poppins">
                  Precision Spinal Care with Gonstead Excellence
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  At Gonstead Chiropractic Clinic, we combine traditional Gonstead techniques with modern technology to
                  provide the most effective spinal care in Nowshera.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: Target,
                    title: "Precise Diagnosis",
                    description: "Advanced spinal analysis using Gonstead methodology for accurate diagnosis",
                  },
                  {
                    icon: Zap,
                    title: "Effective Treatment",
                    description: "Targeted adjustments that address the root cause of your spinal issues",
                  },
                  {
                    icon: Heart,
                    title: "Compassionate Care",
                    description: "Patient-centered approach with personalized treatment plans",
                  },
                  {
                    icon: Shield,
                    title: "Safe & Proven",
                    description: "Time-tested Gonstead techniques with modern safety protocols",
                  },
                ].map((feature, index) => (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow border-[#0d5c75]/10">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-[#0d5c75]/10 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <feature.icon className="h-8 w-8 text-[#0d5c75] dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#0d5c75] dark:text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section id="services" className="py-20">
            <div className="container mx-auto px-4">
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

              <Tabs defaultValue="gonstead" className="max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-8">
                  <TabsTrigger value="gonstead">Gonstead Technique</TabsTrigger>
                  <TabsTrigger value="consultation">Consultations</TabsTrigger>
                  <TabsTrigger value="wellness">Wellness Programs</TabsTrigger>
                </TabsList>

                <TabsContent value="gonstead" className="space-y-6">
                  <Card className="border-[#0d5c75]/20">
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
                    <Card className="border-[#2a9d8f]/20">
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

                    <Card className="border-[#2a9d8f]/20">
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
                  <Card className="border-[#2a9d8f]/20">
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
            </div>
          </section>

          {/* Doctor Profile Section - IMPROVED */}
          <section id="doctor" className="py-20 bg-white dark:bg-gray-800">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="bg-[#0d5c75]/10 text-[#0d5c75] dark:bg-blue-900/20 dark:text-blue-400 border-[#0d5c75]/20 mb-4">
                  Meet Your Doctor
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0d5c75] dark:text-white mb-6 font-poppins">
                  Dr. Bashir Khan - Gonstead Specialist
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Experience exceptional chiropractic care with a doctor who combines traditional Gonstead techniques
                  with modern expertise.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Professional Doctor Image - IMPROVED */}
                <div className="relative flex justify-center">
                  <div className="relative">
                    {/* Main Image Container */}
                    <div className="w-64 h-64 relative overflow-hidden rounded-full border-4 border-[#0d5c75]/20 shadow-2xl bg-gradient-to-br from-[#0d5c75]/5 to-[#2a9d8f]/5">
                      <Image
                        src="/images/dr-bashir-photo.jpeg"
                        alt="Dr. Bashir Khan - Gonstead Chiropractor"
                        fill
                        className="object-cover object-center scale-110 hover:scale-115 transition-transform duration-300"
                        priority
                      />
                      {/* Professional Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d5c75]/10 via-transparent to-transparent"></div>
                    </div>

                    {/* Professional Badges */}
                    <div className="absolute -top-2 -right-2 bg-[#0d5c75] text-white p-2 rounded-full shadow-lg border-2 border-white">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="absolute -bottom-2 -left-2 bg-[#2a9d8f] text-white p-2 rounded-full shadow-lg border-2 border-white">
                      <Stethoscope className="h-4 w-4" />
                    </div>

                    {/* Professional Ring */}
                    <div className="absolute -inset-4 rounded-full border-2 border-[#0d5c75]/10 animate-pulse"></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0d5c75] dark:text-white mb-2">Dr. Bashir Khan</h3>
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
                    <Button
                      onClick={() => scrollToSection("contact")}
                      className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Consultation
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white bg-transparent"
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
          <section id="contact" className="py-20 bg-white dark:bg-gray-800">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="bg-[#0d5c75]/10 text-[#0d5c75] dark:bg-blue-900/20 dark:text-blue-400 border-[#0d5c75]/20 mb-4">
                  Book Your Appointment
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0d5c75] dark:text-white mb-6 font-poppins">
                  Start Your Journey to Better Spinal Health
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Ready to experience the precision of Gonstead chiropractic care? Book your consultation today and take
                  the first step towards a pain-free life.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Booking Form */}
                <div>
                  <EnhancedAppointmentBooking />
                </div>

                {/* Contact Information & Map */}
                <div className="space-y-8">
                  <Card className="border-[#0d5c75]/20">
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
                            Near Police Station, Tehsil Road
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

                  {/* Emergency Contact */}
                  <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <h3 className="font-semibold text-red-700 dark:text-red-400">Emergency Care Available</h3>
                      </div>
                      <p className="text-red-600 dark:text-red-300 text-sm mb-3">
                        For urgent spinal issues or severe pain, we provide emergency consultations.
                      </p>
                      <Button className="bg-red-600 hover:bg-red-700 text-white w-full">
                        <Phone className="mr-2 h-4 w-4" />
                        Call Emergency Line
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <DynamicFooter scrollToSection={scrollToSection} />

          {/* Floating Components */}
          <AdvancedChatbot />
          <WhatsAppFloat />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
