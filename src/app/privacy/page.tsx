import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Roamly",
  description: "How Roamly collects, uses, and protects your data.",
};

// NOTE: This is a starter template. Before launch, have a privacy specialist
// review to confirm compliance with GDPR, UK GDPR, CCPA, and any other regimes
// relevant to your users.

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <article className="max-w-2xl mx-auto px-6 py-16 prose prose-neutral">
        <p className="text-sm text-[var(--muted)]">
          <Link href="/" className="underline">← Back to Roamly</Link>
        </p>
        <h1 className="text-3xl font-serif mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted)]">Last updated: April 17, 2026</p>

        <h2 className="mt-8 text-xl font-serif">What we collect</h2>
        <ul className="list-disc ml-6">
          <li><strong>Account data</strong> — email, name, and authentication token, managed by Clerk.</li>
          <li><strong>Trip data</strong> — the destinations, dates, interests, and itineraries you create.</li>
          <li><strong>Billing data</strong> — when you upgrade, Stripe processes your payment; we store your Stripe customer ID and plan status but never your card details.</li>
          <li><strong>Usage metrics</strong> — monthly counts of generations, regenerations, and chat messages per account, used to enforce plan limits.</li>
          <li><strong>Product analytics</strong> — aggregated page views via Vercel Analytics. No cross-site tracking.</li>
          <li><strong>Server logs</strong> — IP address and request metadata for up to 30 days, used to detect abuse.</li>
        </ul>

        <h2 className="mt-6 text-xl font-serif">How we use it</h2>
        <p>
          To provide and improve the Service, enforce usage limits, fight abuse,
          bill you, and communicate with you about your account. We do not sell
          your data. We do not use your trip content to train third-party AI
          models beyond what is needed to fulfil your individual request.
        </p>

        <h2 className="mt-6 text-xl font-serif">Processors we use</h2>
        <ul className="list-disc ml-6">
          <li><strong>Vercel</strong> — hosting and analytics.</li>
          <li><strong>Neon</strong> — Postgres database.</li>
          <li><strong>Clerk</strong> — authentication.</li>
          <li><strong>Stripe</strong> — billing.</li>
          <li><strong>Anthropic</strong> — AI inference for itinerary generation and chat.</li>
          <li><strong>Resend</strong> (optional) — transactional email when you email yourself an itinerary.</li>
          <li><strong>OpenWeather</strong>, <strong>Frankfurter</strong> — weather and exchange-rate lookups (queries do not include personal data).</li>
        </ul>
        <p>
          Each processor has its own privacy policy. We have a data-processing
          agreement in place where legally required.
        </p>

        <h2 className="mt-6 text-xl font-serif">International transfers</h2>
        <p>
          Our primary servers are in the US (Vercel <code>iad1</code>). If you
          access Roamly from outside the US, your data will be transferred to
          and processed in the US under the relevant standard contractual
          clauses.
        </p>

        <h2 className="mt-6 text-xl font-serif">Retention</h2>
        <ul className="list-disc ml-6">
          <li>Trip data: until you delete it or close your account.</li>
          <li>Account data: 30 days after account closure, then deleted.</li>
          <li>Billing records: 7 years, for tax/legal purposes.</li>
          <li>Server logs: 30 days.</li>
        </ul>

        <h2 className="mt-6 text-xl font-serif">Your rights</h2>
        <p>
          You can access, correct, export, or delete your data at any time by
          emailing <a href="mailto:privacy@roamly.vercel.app" className="underline">privacy@roamly.vercel.app</a>. EU/UK users have the rights set out in
          Articles 15–22 GDPR. California residents have rights under the CCPA;
          we do not sell personal information.
        </p>

        <h2 className="mt-6 text-xl font-serif">Cookies</h2>
        <p>
          We use strictly-necessary cookies for login and session management,
          and first-party Vercel Analytics which does not use cookies for
          cross-site tracking. No advertising cookies are set.
        </p>

        <h2 className="mt-6 text-xl font-serif">Security</h2>
        <p>
          Data is encrypted in transit (TLS) and at rest (Neon Postgres
          encryption). We scope database access narrowly and rotate secrets
          regularly. No system is perfectly secure; report vulnerabilities to <a href="mailto:security@roamly.vercel.app" className="underline">security@roamly.vercel.app</a>.
        </p>

        <h2 className="mt-6 text-xl font-serif">Children</h2>
        <p>
          Roamly is not intended for children under 13 (16 in the EU/UK). We do
          not knowingly collect data from children.
        </p>

        <h2 className="mt-6 text-xl font-serif">Contact</h2>
        <p>
          Privacy questions: <a href="mailto:privacy@roamly.vercel.app" className="underline">privacy@roamly.vercel.app</a>.
        </p>
      </article>
    </main>
  );
}
