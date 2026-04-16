import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.28)]">
              <Image
                src="/nexzen-logo.png"
                alt="Nexzen logo"
                fill
                sizes="64px"
                className="object-cover scale-125"
              />
            </div>
            <div>
              <p className="font-heading text-2xl font-semibold text-white">Nexzen</p>
              <p className="text-sm text-slate-400">Modern electronics commerce</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
            Nexzen is a sleek electronics storefront concept inspired by established hardware marketplaces and rebuilt with a more premium, modern browsing experience.
          </p>
        </div>

        <div>
          <p className="font-heading text-lg font-semibold text-white">Shop</p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link href="/p" className="transition hover:text-white">All products</Link>
            <Link href="/p?category=development-boards" className="transition hover:text-white">Development boards</Link>
            <Link href="/p?category=sensors-modules" className="transition hover:text-white">Sensors and modules</Link>
            <Link href="/p?category=stem-kits" className="transition hover:text-white">Maker kits</Link>
          </div>
        </div>

        <div>
          <p className="font-heading text-lg font-semibold text-white">Why it works</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
            <p>Cleaner category mapping</p>
            <p>Higher contrast calls to action</p>
            <p>Responsive product-first layouts</p>
            <p>Ready for catalog expansion</p>
          </div>
        </div>

        <div>
          <p className="font-heading text-lg font-semibold text-white">Contact</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
            <a
              href="mailto:nexzenindiastore@gmail.com"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
                  <path d="M3 6.75A1.75 1.75 0 0 1 4.75 5h14.5A1.75 1.75 0 0 1 21 6.75v10.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25V6.75Zm1.75-.25a.25.25 0 0 0-.18.07l7.1 5.68a.5.5 0 0 0 .62 0l7.1-5.68a.25.25 0 0 0-.16-.07H4.75Zm14.75 2.01-6.32 5.06a2 2 0 0 1-2.5 0L4.5 8.51v8.74c0 .14.11.25.25.25h14.5a.25.25 0 0 0 .25-.25V8.51Z" />
                </svg>
              </span>
              nexzenindiastore@gmail.com
            </a>
            <a
              href="https://wa.me/919778095484"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/90 text-white">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
                  <path d="M12.04 2.5a9.46 9.46 0 0 0-8.08 14.4L2.5 21.5l4.75-1.42a9.46 9.46 0 1 0 4.79-17.58Zm0 17.18a7.76 7.76 0 0 1-3.96-1.08l-.28-.16-2.82.85.89-2.75-.18-.28a7.76 7.76 0 1 1 6.35 3.42Zm4.26-5.84c-.23-.12-1.36-.67-1.57-.75-.21-.08-.36-.12-.51.12s-.59.75-.72.91c-.13.16-.26.18-.49.06-.23-.12-.95-.35-1.81-1.12-.67-.6-1.12-1.34-1.25-1.56-.13-.23-.01-.35.1-.46.1-.1.23-.26.34-.39.11-.13.15-.23.23-.38.08-.16.04-.29-.02-.41-.06-.12-.51-1.23-.7-1.69-.18-.43-.37-.37-.51-.37h-.43a.83.83 0 0 0-.6.28c-.21.23-.79.77-.79 1.87s.81 2.16.92 2.31c.12.16 1.58 2.41 3.83 3.38.54.23.97.37 1.3.47.55.17 1.05.14 1.45.08.44-.07 1.36-.56 1.55-1.1.19-.54.19-1 .13-1.1-.06-.1-.21-.16-.44-.27Z" />
                </svg>
              </span>
              +91 97780 95484
            </a>
            <div className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
                  <path d="M12 2.75A9.25 9.25 0 1 0 21.25 12 9.26 9.26 0 0 0 12 2.75Zm0 17A7.75 7.75 0 1 1 19.75 12 7.76 7.76 0 0 1 12 19.75Zm.75-12.5h-1.5V12c0 .2.08.39.22.53l3.25 3.25 1.06-1.06-3.03-3.03V7.25Z" />
                </svg>
              </span>
              <span>Mon to Sat, 10:00 to 18:00 IST</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        <div className="mb-3 flex justify-center gap-4">
          <Link href="/privacy" className="transition hover:text-slate-300">Privacy Policy</Link>
          <Link href="/terms" className="transition hover:text-slate-300">Terms of Service</Link>
        </div>
        Copyright 2026 Nexzen. Designed as a modern electronics storefront concept.
      </div>
    </footer>
  )
}
