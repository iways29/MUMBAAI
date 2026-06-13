// WAITLIST ONLY — delete this file at launch

import React from 'react'
import { WaitlistForm } from '../components/WaitlistForm.tsx'

export const WaitlistSection: React.FC = () => {
  return (
    <section id="waitlist" className="px-6 md:px-12 py-[120px] scroll-mt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-5">
            Limited beta access
          </p>
          <h2 className="font-extralight text-bone tracking-display text-[clamp(36px,5vw,48px)] leading-[1.05] mb-5">
            Join the waitlist.
          </h2>
          <p className="text-ash text-[17px] leading-relaxed max-w-[48ch] mx-auto">
            Be among the first on the canvas. Early access, beta perks, and a
            direct line to the team building it.
          </p>
        </div>

        <WaitlistForm />
      </div>
    </section>
  )
}
