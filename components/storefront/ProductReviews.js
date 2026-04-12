'use client'

import { useState, useEffect } from 'react'

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
      }
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // For image uploading, we'd add file inputs and base64 conversions here.
    // Simplifying to rating + comment for immediate stability.
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment })
      })
      if (res.ok) {
        setIsModalOpen(false)
        setComment('')
        setRating(5)
        setError('')
        fetchReviews()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error || "You must be logged in to post a review.")
      }
    } catch(e) {
      console.error(e)
      setError("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8 mt-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Community Feedback</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-slate-950">Customer Reviews</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Write a Review
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 animate-pulse">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-500">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                  {review.user?.avatarUrl ? (
                    <img src={review.user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-700 font-bold">
                      {(review.user?.name || 'G')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{review.user?.name || 'Guest User'}</p>
                  <div className="flex text-amber-400 text-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl">
            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-6">Write a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Comment</label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="What did you think of this product?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
