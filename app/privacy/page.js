export const metadata = {
  title: 'Privacy Policy | Nexzen',
  description: 'How Nexzen protects and manages your electronic data securely.',
}

export default function PrivacyPolicyPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-12">
        <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Legal</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: April 12, 2026</p>

        <div className="prose prose-slate mt-10 max-w-none prose-h2:font-heading prose-h2:text-2xl prose-h2:font-semibold prose-p:text-slate-600 prose-li:text-slate-600">
          <h2>1. Information We Collect</h2>
          <p>
            When you create an account with Nexzen using direct registration or Google Authentication, we collect basic profile information including your name, email address, and profile picture. When you place hardware orders, we collect standard shipping and billing details necessary for fulfillment.
          </p>

          <h2>2. How We Use Your Data</h2>
          <p>
            Your information is used strictly to provide you with our services. We use your data to:
          </p>
          <ul>
            <li>Securely authenticate your session via Supabase OAuth.</li>
            <li>Process and dispatch electronic components, kits, and boards to your address.</li>
            <li>Send critical transactional emails (like order receipts and OTP verification).</li>
            <li>Improve the functionality and rendering of our storefront platform.</li>
          </ul>

          <h2>3. Data Protection</h2>
          <p>
            We implement industry-standard encryption protocols. Your passwords and OAuth tokens are never stored in plain text. Authentication flows are structurally hardened against Personal Identifiable Information (PII) leakage to ensure your data remains completely private.
          </p>

          <h2>4. Third-Party Sharing</h2>
          <p>
            We do not sell, trade, or maliciously rent your personal identification information. We may share generic aggregated demographic information not linked to any personal identification information with trusted hardware suppliers and logistic partners exclusively for order fulfillment purposes.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have questions regarding this Privacy Policy or your data, please contact our support desk securely.
          </p>
        </div>
      </div>
    </section>
  )
}
