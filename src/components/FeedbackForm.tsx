import React, { useState } from 'react'
import { supabase } from '../lib/supabase.ts'

interface FeedbackFormProps {
  id?: string
}

const inputClass =
  'w-full bg-panel border border-hairline hover:border-hairline-strong focus:border-plum rounded-node px-4 py-3.5 text-bone placeholder:text-smoke text-[15px] tracking-body outline-none transition-colors duration-fast'

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

  const succeeded = message.includes('Thank you')

  return (
    <section id={id} className="px-6 md:px-12 py-[120px] scroll-mt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[13px] font-semibold uppercase tracking-kicker text-plum mb-5">
            We're listening
          </p>
          <h2 className="font-extralight text-bone tracking-display text-[clamp(36px,5vw,48px)] leading-[1.05] mb-5">
            Tell us what you think.
          </h2>
          <p className="text-ash text-[17px] leading-relaxed max-w-[48ch] mx-auto">
            MUMBAAI is built in public. Your feedback decides what we build next.
          </p>
        </div>

        <div className="border border-hairline rounded-[24px] p-8 md:p-10">
          {message && (
            <div
              className={`mb-6 px-4 py-3 rounded-node border text-[14px] ${
                succeeded
                  ? 'border-plum text-bone'
                  : 'border-danger text-danger'
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <p className="text-[13px] font-semibold text-ash mb-3 tracking-body">
                How would you rate your experience?
              </p>
              <div className="flex gap-2" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} of 5`}
                    onClick={() => setRating(star)}
                    className={`w-11 h-11 rounded-pill border text-[14px] font-semibold transition-colors duration-fast ${
                      rating && rating >= star
                        ? 'border-plum text-bone'
                        : 'border-hairline text-smoke hover:border-hairline-strong hover:text-ash'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="What works? What's missing? What would you love to see?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className={`${inputClass} h-32 resize-none`}
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-pill bg-plum hover:bg-plum-hover disabled:opacity-50 disabled:cursor-not-allowed text-bone text-[13px] font-semibold uppercase tracking-kicker py-4 transition-colors duration-fast"
            >
              {isSubmitting ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
