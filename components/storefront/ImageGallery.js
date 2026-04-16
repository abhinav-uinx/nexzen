'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ImageGallery({ images = [] }) {
  const [activeImage, setActiveImage] = useState(images[0] || null)

  if (images.length === 0) return null

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {/* Thumbnails */}
      <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImage(img)}
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
              activeImage === img ? 'border-slate-950 ring-2 ring-slate-100' : 'border-slate-100 opacity-60 hover:opacity-100'
            }`}
          >
            <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm">
        <Image
          src={activeImage}
          alt="Product"
          fill
          className="object-contain p-4 lg:p-12 transition-transform duration-500 hover:scale-110"
          priority
        />
      </div>
    </div>
  )
}
