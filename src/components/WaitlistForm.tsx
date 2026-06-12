// WAITLIST ONLY — delete this file at launch

import React, { useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import { Check } from 'lucide-react'

const inputClass =
  'w-full bg-panel border border-hairline hover:border-hairline-strong focus:border-plum rounded-node px-4 py-3.5 text-bone placeholder:text-smoke text-[15px] tracking-body outline-none transition-colors duration-fast'

const labelClass = 'block text-[13px] font-semibold text-ash mb-2 tracking-body'

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
      <div className="border border-hairline rounded-[24px] p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full border border-plum flex items-center justify-center">
          <Check size={24} className="text-plum" />
        </div>
        <h3 className="text-heading-sm text-[24px] font-normal text-bone mb-3">
          You're on the list.
        </h3>
        <p className="text-ash text-[15px] leading-relaxed max-w-md mx-auto">
          We'll email you the moment MUMBAAI is ready for you — early access,
          no spam.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-hairline rounded-[24px] p-8 md:p-10">
      {message && !isSuccess && (
        <div className="mb-6 px-4 py-3 rounded-node border border-danger text-danger text-[14px]">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full name *</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Company <span className="text-smoke font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="Where you work"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Do you think we're solving a real problem? *</label>
          <div className="flex gap-2">
            {(['yes', 'no', 'maybe'] as const).map((value) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="solving_real_problem"
                  value={value}
                  checked={solvingRealProblem === value}
                  onChange={(e) => setSolvingRealProblem(e.target.value)}
                  className="sr-only peer"
                  required={value === 'yes'}
                />
                <span className="inline-block px-5 py-2 rounded-pill border border-hairline text-ash text-[13px] font-semibold uppercase tracking-kicker transition-colors duration-fast peer-checked:border-plum peer-checked:text-bone hover:border-hairline-strong">
                  {value}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Anything else? <span className="text-smoke font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="Tell us more about your thoughts…"
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
            className={`${inputClass} h-28 resize-none`}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-pill bg-plum hover:bg-plum-hover disabled:opacity-50 disabled:cursor-not-allowed text-bone text-[13px] font-semibold uppercase tracking-kicker py-4 transition-colors duration-fast"
        >
          {isSubmitting ? 'Joining…' : 'Join the waitlist'}
        </button>

        <p className="text-[12px] text-smoke text-center tracking-body">
          We respect your privacy. Your information will only be used to notify
          you about MUMBAAI.
        </p>
      </form>
    </div>
  )
}
