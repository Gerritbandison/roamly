import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Roamly",
  description: "Terms that govern your use of Roamly.",
};

// NOTE: This is a starter template. Before launch, have a lawyer review this
// document to ensure it is appropriate for your jurisdiction, billing model,
// and risk profile.

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <article className="max-w-2xl mx-auto px-6 py-16 prose prose-neutral">
        <p className="text-sm text-[var(--muted)]">
          <Link href="/" className="underline">← Back to Roamly</Link>
        </p>
        <h1 className="text-3xl font-serif mt-6 mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--muted)]">Last updated: April 17, 2026</p>

        <h2 className="mt-8 text-xl font-serif">1. Acceptance</h2>
        <p>
          By creating an account or using Roamly (&quot;the Service&quot;), you agree to
          these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 className="mt-6 text-xl font-serif">2. What Roamly does</h2>
        <p>
          Roamly generates travel itineraries using AI. Itineraries are
          suggestions only; prices, hours, visa rules, and availability change
          frequently. <strong>You are responsible for verifying every detail
          before booking or travelling.</strong> We do not guarantee accuracy,
          safety, legality, or fitness for any purpose.
        </p>

        <h2 className="mt-6 text-xl font-serif">3. Accounts</h2>
        <p>
          You must be 13 or older (16 in the EU/UK) to use Roamly. Keep your
          login credentials secure. You are responsible for activity under your
          account.
        </p>

        <h2 className="mt-6 text-xl font-serif">4. Subscriptions &amp; billing</h2>
        <p>
          Paid plans are billed monthly or annually through Stripe. Subscriptions
          auto-renew unless cancelled before the renewal date. You can cancel at
          any time; access continues until the end of the current billing
          period. Usage limits for free and paid tiers are described on the
          pricing page and may be adjusted with notice.
        </p>

        <h2 className="mt-6 text-xl font-serif">5. Refunds</h2>
        <p>
          Monthly plans are non-refundable once charged. Annual plans may be
          refunded on a pro-rata basis within 14 days of purchase if you have
          not used more than 3 trip generations. EU/UK consumers retain their
          statutory right of withdrawal.
        </p>

        <h2 className="mt-6 text-xl font-serif">6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc ml-6">
          <li>Scrape, resell, or redistribute generated itineraries at scale.</li>
          <li>Use the Service to generate illegal, harmful, or infringing content.</li>
          <li>Attempt to reverse-engineer prompts, bypass rate limits, or circumvent usage caps.</li>
          <li>Automate account creation or use the Service via bots without permission.</li>
        </ul>

        <h2 className="mt-6 text-xl font-serif">7. Content ownership</h2>
        <p>
          You own the trip data you enter. The AI output is provided for your
          personal use; you may share, print, and adapt it, but Roamly retains a
          licence to display aggregated, de-identified usage for product
          improvement.
        </p>

        <h2 className="mt-6 text-xl font-serif">8. Disclaimers &amp; liability</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties. To the maximum
          extent permitted by law, Roamly&apos;s total liability for any claim arising
          from the Service is capped at the amount you paid us in the 12 months
          preceding the claim, or US $50, whichever is greater.
        </p>

        <h2 className="mt-6 text-xl font-serif">9. Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these Terms or that
          expose us to legal or security risk. You may delete your account at
          any time.
        </p>

        <h2 className="mt-6 text-xl font-serif">10. Changes</h2>
        <p>
          We may update these Terms. Material changes will be announced by email
          or an in-app notice at least 14 days before they take effect.
        </p>

        <h2 className="mt-6 text-xl font-serif">11. Contact</h2>
        <p>
          Questions? Email <a href="mailto:support@roamly.vercel.app" className="underline">support@roamly.vercel.app</a>.
        </p>
      </article>
    </main>
  );
}
