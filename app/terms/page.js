export const metadata = {
  title: 'Terms of Service | Nexzen',
  description: 'The terms and conditions governing the use of Nexzen India Store.',
}

export default function TermsOfServicePage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-12">
        <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Legal</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: April 12, 2026</p>

        <div className="prose prose-slate mt-10 max-w-none prose-h2:font-heading prose-h2:text-2xl prose-h2:font-semibold prose-p:text-slate-600 prose-li:text-slate-600">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using Nexzen, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access our hardware distribution services.
          </p>

          <h2>2. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account natively. You are responsible for safeguarding your authentication credentials.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            The Nexzen platform, including its original content, storefront architecture, and functionality are and will remain the exclusive property of Nexzen and its licensors. Our platform is protected by copyright, trademark, and other laws of India.
          </p>

          <h2>4. Hardware Supply</h2>
          <p>
            All electronic boards, sensors, and components are subject to availability. We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change dynamically tracking supply chain parameters.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            In no event shall Nexzen, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have questions regarding these Terms of Service, please reach out to our dedicated support channels.
          </p>
        </div>
      </div>
    </section>
  )
}
