import Image from 'next/image'
import Link from 'next/link'

function CategoryVisual({ category }) {
  if (category.imageUrl) {
    return (
      <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-[1.4rem] bg-slate-100">
        <Image
          src={category.imageUrl}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      </div>
    )
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold tracking-[0.2em] text-cyan-300 transition-transform duration-300 group-hover:scale-105">
      {category.icon}
    </div>
  )
}

export default function CategoryGrid({ categories }) {
  if (!categories || categories.length === 0) return null

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Category architecture</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950 sm:text-4xl">
              Built for the way electronics teams actually shop.
            </h2>
          </div>
          <Link href="/products" className="hidden text-sm font-medium text-slate-700 transition hover:text-slate-950 sm:block">
            View all products
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_18px_60px_rgba(15,23,42,0.09)]"
            >
              <CategoryVisual category={category} />
              <h3 className="mt-5 font-heading text-2xl font-semibold text-slate-950">{category.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
              <p className="mt-6 text-sm font-medium text-blue-700 transition group-hover:text-slate-950">
                Explore category
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
