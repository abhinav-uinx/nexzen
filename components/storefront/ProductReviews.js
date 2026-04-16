'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'

import styles from './ProductReviews.module.css'

export default function ProductReviews({ productId, density = 'default' }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const { session } = useAuth()

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
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers,
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
    <div className={styles.container}>
      <div className={`${styles.header} ${density === 'compact' ? 'items-end' : ''}`}>
        <div>
          <p className={`${styles.subtitle} ${density === 'compact' ? 'text-[10px] tracking-[0.2em] font-black text-blue-600' : ''}`}>
            COMMUNITY FEEDBACK
          </p>
          <div className={styles.titleWrapper}>
            <h2 className={`${styles.title} ${density === 'compact' ? 'font-black uppercase tracking-tighter text-3xl' : ''}`}>
              Customer Reviews
            </h2>
            <span className={styles.count}>({reviews.length})</span>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          suppressHydrationWarning
          className={`${styles.writeReviewBtn} ${density === 'compact' ? 'rounded-lg px-6 py-3 text-[10px] font-black uppercase tracking-widest' : ''}`}
        >
          Write a Review
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className={styles.emptyState}>No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className={`${styles.reviewsList} ${density === 'compact' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
          {(isExpanded ? reviews : reviews.slice(0, 3)).map(review => (
            <div key={review.id} className={`${styles.reviewItem} ${density === 'compact' ? 'border-2 border-slate-50 bg-slate-50/30 p-4 rounded-xl' : ''}`}>
              <div className={styles.reviewHeader}>
                <div className={`${styles.avatarWrapper} ${density === 'compact' ? 'h-8 w-8' : ''}`}>
                  {review.user?.avatarUrl ? (
                    <img src={review.user.avatarUrl} alt="avatar" className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {(review.user?.name || 'G')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className={`${styles.reviewerName} ${density === 'compact' ? 'text-[11px] font-black uppercase tracking-widest' : ''}`}>
                    {review.user?.name || 'Guest User'}
                  </p>
                  <div className={`${styles.ratingWrapper} ${density === 'compact' ? 'text-[10px]' : ''}`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? 'text-blue-600' : 'text-slate-200 text-xs'}>{i < review.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className={`${styles.comment} ${density === 'compact' ? 'mt-3 text-xs leading-relaxed text-slate-600 font-medium' : ''}`}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}

          {reviews.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={styles.expandBtn}
            >
              {isExpanded ? 'Show less' : `Read all ${reviews.length} reviews`}
            </button>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Write a Review</h3>
            <form onSubmit={handleSubmit} className={styles.formSpace}>
              <div>
                <label className={styles.label}>Rating</label>
                <div className={styles.starRatingWrapper}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`${styles.starBtn} ${star <= rating ? styles.starBtnActive : styles.starBtnInactive}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className={styles.label}>Comment</label>
                <textarea
                  required
                  rows={4}
                  className={styles.textarea}
                  placeholder="What did you think of this product?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {error && (
                <div className={styles.errorBox}>
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitBtn}
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
