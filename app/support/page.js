'use client'

import { useState } from 'react'
import { Phone, Mail, Clock, MessageSquare, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

export default function SupportPage() {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || null
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ticket')
      }
      
      setSuccess(true)
      setFormData({ ...formData, subject: '', message: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            How can we help?
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            Reach out to our support team or submit a ticket below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Contact Info Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Phone Support</h3>
                  <p className="text-sm font-medium text-slate-500">Mon-Fri, 9am-6pm IST</p>
                </div>
              </div>
              <a href="tel:+919999999999" className="text-lg font-bold text-blue-600 hover:underline">
                +91 99999 99999
              </a>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Email Us</h3>
                  <p className="text-sm font-medium text-slate-500">Typically replies in 24h</p>
                </div>
              </div>
              <a href="mailto:support@nexzenindia.com" className="text-lg font-bold text-emerald-600 hover:underline">
                support@nexzenindia.com
              </a>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Working Hours</h3>
                  <p className="text-sm font-medium text-slate-500">Monday - Friday</p>
                  <p className="text-sm font-medium text-slate-500">09:00 AM - 06:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5 sm:p-10">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="text-blue-600" size={28} />
                <h2 className="text-2xl font-bold text-slate-900">Submit a Ticket</h2>
              </div>
              
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Ticket Submitted!</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    We've received your request and our support team will get back to you shortly at {formData.email}.
                  </p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="mt-8 rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                  >
                    Submit Another Query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="rounded-xl bg-orange-50 p-4 text-sm font-medium text-orange-800 border border-orange-200">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 placeholder:text-slate-400"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 placeholder:text-slate-400"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 placeholder:text-slate-400"
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 placeholder:text-slate-400 resize-none"
                      placeholder="Please describe your issue in detail..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-slate-950 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    ) : (
                      'Submit Ticket'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
