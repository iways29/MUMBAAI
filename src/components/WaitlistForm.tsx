// WAITLIST ONLY — delete this file at launch

import React, { useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import { Sparkles, CheckCircle } from 'lucide-react'

export const WaitlistForm: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [solvingRealProblem, setSolvingRealProblem] = useState('')
  const [additionalComments, setAdditionalComments] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{
          name,
          email,
          company: company || null,
          solving_real_problem: solvingRealProblem,
          additional_comments: additionalComments || null
        }])

      if (error) throw error

      setIsSuccess(true)
      setMessage('You\'re on the list! We\'ll be in touch soon.')

      // Clear form
      setName('')
      setEmail('')
      setCompany('')
      setSolvingRealProblem('')
      setAdditionalComments('')

    } catch (error: any) {
      // Check for duplicate email
      if (error.code === '23505') {
        setMessage('This email is already on our waitlist!')
      } else {
        setMessage(error.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#9DD9D2]/30 via-[#F4D06F]/30 to-[#9DD9D2]/30 rounded-3xl blur-2xl opacity-60" />

        <div className="relative bg-white rounded-2xl p-12 border border-[#9DD9D2]/40 shadow-xl shadow-stone-200/50 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#9DD9D2] to-[#7bc4bd] flex items-center justify-center shadow-lg shadow-[#9DD9D2]/30">
            <CheckCircle size={40} className="text-white" />
          </div>

          {/* Success Message */}
          <h3 className="text-3xl font-bold text-stone-800 mb-4">
            You're In! 🎉
          </h3>
          <p className="text-lg text-stone-600 mb-8 max-w-md mx-auto">
            We'll notify you as soon as MUMBAAI is ready for you. Get ready to transform how you think with AI.
          </p>

          {/* Decorative badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#9DD9D2]/20 border border-[#9DD9D2]/40 rounded-full">
              <span className="text-sm font-medium text-[#2a8a7d]">✓ Early Access</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#F4D06F]/20 border border-[#F4D06F]/40 rounded-full">
              <span className="text-sm font-medium text-[#a08030]">✓ Beta Perks</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#FF8811]/20 via-[#F4D06F]/20 to-[#9DD9D2]/20 rounded-3xl blur-2xl opacity-60" />

      <div className="relative bg-white rounded-2xl p-8 border border-[#F4D06F]/30 shadow-xl shadow-stone-200/50">
        {message && !isSuccess && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 text-red-700 border border-red-200">
            <span className="text-lg">!</span>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Email */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-[#FFF8F0]/50 border border-[#F4D06F]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811]/50 focus:border-[#FF8811] transition-all placeholder:text-stone-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-[#FFF8F0]/50 border border-[#F4D06F]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811]/50 focus:border-[#FF8811] transition-all placeholder:text-stone-400"
                required
              />
            </div>
          </div>

          {/* Company (Optional) */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Company/Organization <span className="text-stone-400 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Acme Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-4 bg-[#FFF8F0]/50 border border-[#F4D06F]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811]/50 focus:border-[#FF8811] transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Do you think we're solving a real problem? */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Do you think we're solving a real problem? *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="solving_real_problem"
                  value="yes"
                  checked={solvingRealProblem === 'yes'}
                  onChange={(e) => setSolvingRealProblem(e.target.value)}
                  className="w-4 h-4 text-[#FF8811] border-stone-300 focus:ring-[#FF8811] cursor-pointer"
                  required
                />
                <span className="text-sm font-medium text-stone-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="solving_real_problem"
                  value="no"
                  checked={solvingRealProblem === 'no'}
                  onChange={(e) => setSolvingRealProblem(e.target.value)}
                  className="w-4 h-4 text-[#FF8811] border-stone-300 focus:ring-[#FF8811] cursor-pointer"
                />
                <span className="text-sm font-medium text-stone-700">No</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="solving_real_problem"
                  value="maybe"
                  checked={solvingRealProblem === 'maybe'}
                  onChange={(e) => setSolvingRealProblem(e.target.value)}
                  className="w-4 h-4 text-[#FF8811] border-stone-300 focus:ring-[#FF8811] cursor-pointer"
                />
                <span className="text-sm font-medium text-stone-700">Maybe</span>
              </label>
            </div>
          </div>

          {/* Additional Comments */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Additional Comments <span className="text-stone-400 text-xs">(optional)</span>
            </label>
            <textarea
              placeholder="Tell us more about your thoughts..."
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              className="w-full p-4 bg-[#FFF8F0]/50 border border-[#F4D06F]/30 rounded-xl h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8811]/50 focus:border-[#FF8811] transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#FF8811] to-[#F4D06F] text-white p-4 rounded-xl font-semibold hover:from-[#e67a0f] hover:to-[#e6c35f] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-[#FF8811]/25 hover:shadow-xl hover:shadow-[#FF8811]/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Joining Waitlist...'
            ) : (
              <>
                <Sparkles size={20} />
                Join the Waitlist
              </>
            )}
          </button>

          {/* Privacy Notice */}
          <p className="text-xs text-stone-400 text-center">
            We respect your privacy. Your information will only be used to notify you about MUMBAAI.
          </p>
        </form>
      </div>
    </div>
  )
}
