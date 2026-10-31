"use client"

import React, { useState } from 'react';
import { Mail, User, MessageCircle, Send, CheckCircle, Stethoscope, ArrowRight } from 'lucide-react';

export const EmailContactSection = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Your EmailJS configuration
      const serviceId = process.env.NEXT_PUBLIC_EMAIL_SERVICE_ID || "service_s8n248l"
      const templateId = process.env.NEXT_PUBLIC_EMAIL_TEMPLATE_ID || "template_cvai1qm"
      const publicKey = process.env.NEXT_PUBLIC_EMAIL_PUBLIC_KEY || "STD49hXa06xbHgXCK"

      const templateParams = {
        from_name: name.trim(),
        from_email: email.trim(),
        phone: '', // Empty for this form
        subject: 'Contact Form Submission from Website',
        message: comment.trim(),
        health_concerns: '', // Empty for this form
        to_email: "gonsteadchiropractic.org@gmail.com",
      }

      // Send email using dynamically loaded EmailJS
      const emailjs = (await import('@emailjs/browser')).default
      await emailjs.send(serviceId, templateId, templateParams, publicKey)

      setConfirmation('Thank you for reaching out! Your message has been sent successfully. Our team will contact you within 24 hours.');
      
      // Reset form fields
      setName('');
      setEmail('');
      setComment('');
    } catch (error) {
      setConfirmation('Sorry, there was an error sending your message. Please try again or contact us directly at +92 304 699 6267.');
    } finally {
      setIsSubmitting(false);
      
      // Auto-hide confirmation after 8 seconds
      setTimeout(() => setConfirmation(''), 8000);
    }
  };

  if (confirmation) {
    return (
      <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-xl border border-green-200 dark:border-green-800/50 p-8 transform transition-all duration-500 hover:shadow-2xl">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-white animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-200">Message Sent Successfully!</h3>
            <p className="text-green-600 dark:text-green-300 leading-relaxed">
              {confirmation}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Stethoscope className="h-4 w-4" />
            <span>Professional Healthcare Response Guaranteed</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[rgb(205,223,222)] dark:bg-slate-800 rounded-2xl shadow-xl border border-teal-500/20 p-8 transform transition-all duration-300 hover:shadow-2xl relative overflow-hidden">
      {/* Subtle Ambient Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-cyan-500/5 to-transparent pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgb(49,83,113)]/20 dark:bg-white/20 rounded-full shadow-md mb-4">
          <Mail className="h-8 w-8 text-[rgb(49,83,113)] dark:text-white" />
        </div>
        <h2 className="text-xl font-bold text-[rgb(49,83,113)] dark:text-white mb-2">Get in Touch</h2>
        <p className="text-[rgb(49,83,113)]/80 dark:text-white/90 text-sm leading-relaxed">
          Direct contact with Gonstead Chiropractic Clinic for personalized care and consultation
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        {/* Name Field */}
        <div className="group">
          <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-[rgb(49,83,113)] dark:text-white mb-2">
            <User className="h-4 w-4 text-[rgb(49,83,113)] dark:text-white" />
            Full Name *
          </label>
          <div className="relative">
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[rgb(221,230,229)] dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-[#0d5c75] transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500 group-hover:shadow-md"
              placeholder="Enter your full name"
              required
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 to-[#2a9d8f]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Email Field */}
        <div className="group">
          <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-[rgb(49,83,113)] dark:text-white mb-2">
            <Mail className="h-4 w-4 text-[rgb(49,83,113)] dark:text-white" />
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[rgb(221,230,229)] dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-[#0d5c75] transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500 group-hover:shadow-md"
              placeholder="your.email@example.com"
              required
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 to-[#2a9d8f]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>
        
        
        {/* Comment Field */}
        <div className="group">
          <label htmlFor="comment" className="flex items-center gap-2 text-sm font-semibold text-[rgb(49,83,113)] dark:text-white mb-2">
            <MessageCircle className="h-4 w-4 text-[rgb(49,83,113)] dark:text-white" />
            Your Message *
          </label>
          <div className="relative">
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 bg-[rgb(221,230,229)] dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-[#0d5c75] transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500 group-hover:shadow-md resize-none"
              placeholder="Tell us about your condition, symptoms, or any questions you have..."
              rows={4}
              required
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 to-[#2a9d8f]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#1e7a6b] text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
          >
            {/* Button Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-center justify-center gap-3">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Send Message to Gonstead Chiropractic Clinic</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </div>
          </button>
        </div>
        
        {/* Professional Note */}
        <div className="text-center pt-4 border-t border-[rgb(49,83,113)]/20 dark:border-white/20">
          <p className="text-xs text-[rgb(49,83,113)]/70 dark:text-white/70 leading-relaxed">
            🔒 Your information is secure and confidential. Our team will respond within 24 hours.
          </p>
        </div>
      </form>
    </div>
  );
};

