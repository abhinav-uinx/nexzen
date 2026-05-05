import LoadingPanel from '@/components/ui/LoadingPanel'

export default function Loading() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <LoadingPanel
          eyebrow="Loading"
          title="Preparing your Nexzen experience"
          description="We are pulling in the latest products, account details, and storefront data."
        />
      </div>
    </section>
  )
}
