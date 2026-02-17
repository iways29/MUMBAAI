import React, { useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import { MessageSquare } from 'lucide-react'

interface FeedbackFormProps {
  id?: string
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ id }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([{ name, email, feedback, rating }])

      if (error) throw error

      setMessage('Thank you for your feedback!')
      setName('')
      setEmail('')
      setFeedback('')
      setRating(null)
    } catch (error: any) {
      setMessage(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id={id} className="py-20 px-8 bg-gradient-to-b from-[#FFF8F0] to-white">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#9DD9D2]/20 border border-[#9DD9D2]/40 rounded-full mb-4">
            <MessageSquare size={14} className="text-[#5ba59e]" />
            <span className="text-sm font-medium text-[#5ba59e] tracking-wide">We're listening</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight mb-3">
            Share Your Feedback
          </h2>
          <p className="text-stone-500">Help us build the future of conversational AI</p>
        </div>

        {/* Form Card */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#FF8811]/20 via-[#F4D06F]/20 to-[#9DD9D2]/20 rounded-3xl blur-2xl opacity-60" />

          <div className="relative bg-white rounded-2xl p-8 border border-[#F4D06F]/30 shadow-xl shadow-stone-200/50">
            {message && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.includes('Thank you')
                  ? 'bg-[#9DD9D2]/20 text-[#2a8a7d] border border-[#9DD9D2]/40'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <span className="text-lg">{message.includes('Thank you') ? '✓' : '!'}</span>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 bg-[#FFF8F0]/50 border border-[#F4D06F]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811]/50 focus:border-[#FF8811] transition-all placeholder:text-stone-400"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-4 bg-[#FFF8F0]/50 border border-[#F4D06F]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811]/50 focus:border-[#FF8811] transition-all placeholder:text-stone-400"
                    required
                  />
                </div>
              </div>

              <div className="text-center py-2">
                <p className="text-sm text-stone-500 mb-3">How would you rate your experience?</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-all duration-200 hover:scale-110 ${
                        rating && rating >= star
                          ? 'text-[#F4D06F] drop-shadow-sm'
                          : 'text-stone-200 hover:text-[#F4D06F]/60'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  placeholder="Tell us what you think... What features would you love to see?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-4 bg-[#FFF8F0]/50 border border-[#F4D06F]/30 rounded-xl h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8811]/50 focus:border-[#FF8811] transition-all placeholder:text-stone-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#FF8811] to-[#F4D06F] text-white p-4 rounded-xl font-semibold hover:from-[#e67a0f] hover:to-[#e6c35f] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-[#FF8811]/25 hover:shadow-xl hover:shadow-[#FF8811]/30 hover:-translate-y-0.5"
              >
                {isSubmitting ? 'Sending...' : 'Submit Feedback →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
