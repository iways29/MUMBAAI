// WAITLIST ONLY — delete this file at launch

import React from 'react'
import { WaitlistForm } from '../components/WaitlistForm.tsx'
import { Sparkles, Users, Rocket } from 'lucide-react'

export const WaitlistSection: React.FC = () => {
  return (
    <section id="waitlist" className="relative py-24 px-8 bg-gradient-to-b from-white via-[#FFF3E0] to-white overflow-hidden scroll-mt-20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs - made more vibrant */}
        <div className="absolute top-20 -left-40 w-96 h-96 bg-[#FF8811] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-[#9DD9D2] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-[#F4D06F] rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-4000" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Badge - more vibrant */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF8811]/10 to-[#F4D06F]/10 backdrop-blur-sm border border-[#FF8811]/50 rounded-full mb-6 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8811] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8811]"></span>
            </span>
            <span className="text-sm font-semibold text-[#FF8811]">Limited Beta Access</span>
          </div>

          {/* Title - darker gradient */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-stone-800 tracking-tight mb-6 leading-[1.1]">
            <span className="bg-gradient-to-r from-[#FF6600] via-[#FF8811] to-[#FF6600] bg-clip-text text-transparent">
              Join the Waitlist
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-stone-700 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Be among the first to experience the future of AI conversations. Get early access and exclusive perks.
          </p>

          {/* Value Props - more vibrant */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-12">
            {/* Early Access */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#9DD9D2]/20 to-[#7bc4bd]/20 backdrop-blur-sm border border-[#9DD9D2]/60 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9DD9D2] to-[#7bc4bd] flex items-center justify-center shadow-sm">
                <Rocket size={16} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-[#1a6b61]">Early Access</span>
            </div>

            {/* Beta Perks */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F4D06F]/20 to-[#e6c35f]/20 backdrop-blur-sm border border-[#F4D06F]/60 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F4D06F] to-[#e6c35f] flex items-center justify-center shadow-sm">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-[#8b6d20]">Beta Perks</span>
            </div>

            {/* Limited Spots */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF8811]/20 to-[#e67a0f]/20 backdrop-blur-sm border border-[#FF8811]/60 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF8811] to-[#e67a0f] flex items-center justify-center shadow-sm">
                <Users size={16} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-[#b35f0a]">Limited Spots</span>
            </div>
          </div>
        </div>

        {/* Waitlist Form */}
        <WaitlistForm />
      </div>
    </section>
  )
}
