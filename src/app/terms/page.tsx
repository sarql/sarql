import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Client Agreement & Service Terms — Sarql',
  description:
    'Standard service clauses and client terms governing digital engagements with Sarql Innovations.',
};

const CLAUSES = [
  {
    num: '01',
    title: 'Services',
    text: 'Sarql Innovations agrees to perform the digital services outlined in the Project Architecture. Any additional work requested outside this scope will be treated as a new engagement subject to separate valuation.',
  },
  {
    num: '02',
    title: 'Payment Terms',
    text: 'A non-refundable advance is required to initiate the project. Final balance must be settled upon project completion and before the handover of high-resolution source files or production deployment.',
  },
  {
    num: '03',
    title: 'Timeline',
    text: 'The delivery window is estimated as stated in the project summary. Sarql will make every effort to meet deadlines, provided the Client delivers necessary assets and feedback within 48 hours of request.',
  },
  {
    num: '04',
    title: 'Revisions',
    text: 'Each deliverable includes up to two rounds of major revisions. Minor tweaks are included for 14 days post-handover. Significant structural changes after approval will incur additional costs.',
  },
  {
    num: '05',
    title: 'Client Role',
    text: 'Client is responsible for providing all content, images, and brand assets. Delay in providing these materials will directly extend the project timeline by an equal duration.',
  },
  {
    num: '06',
    title: 'Ownership',
    text: 'Upon final payment, ownership of the final design/code is transferred to the Client. Sarql retains the right to showcase the work in its portfolio for promotional purposes.',
  },
  {
    num: '07',
    title: 'Cancellation',
    text: 'Either party may terminate the agreement with 7 days written notice. In case of cancellation, all work completed up to that date will be billed pro-rata.',
  },
  {
    num: '08',
    title: 'Confidentiality',
    text: 'Both parties agree to protect and keep secret all sensitive business information shared during the course of the project, including trade secrets and strategies.',
  },
  {
    num: '09',
    title: 'Liability',
    text: 'Sarql is not liable for loss of profits, data, or business interruption. Our maximum liability is limited to the total amount paid by the Client for the specific project.',
  },
  {
    num: '10',
    title: 'Acceptance',
    text: 'By signing this instrument or paying the advance, the Client accepts all terms. This agreement represents the entire understanding between the Client and Sarql Innovations.',
  },
];

export default function AgreementPage() {
  return (
    <div style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="tw-container" style={{ maxWidth: '52rem' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '0', color: '#737373', marginBottom: '0.5rem' }}>
          Standard Service Clauses
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 2.75rem)', lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.03em', color: '#000', marginBottom: '0.875rem' }}>
          Client Agreement &amp; Terms
        </h1>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.6, color: 'var(--text-gray-600)', marginBottom: '3.5rem' }}>
          Transparent expectations engineered for seamless collaboration, intellectual property protection, and mutual success.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
          {CLAUSES.map((c) => (
            <div
              key={c.num}
              style={{
                background: 'var(--bg-cream)',
                borderRadius: '1.25rem',
                padding: '2rem',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-gray-400)' }}>
                  {c.num}
                </span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#000', letterSpacing: '-0.01em', margin: 0 }}>
                  {c.title}
                </h2>
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: '1.65', color: 'var(--text-gray-600)', margin: 0 }}>
                {c.text}
              </p>
            </div>
          ))}
        </div>

        <div style={{ background: '#000', color: '#fff', borderRadius: '1.25rem', padding: '2.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.75rem' }}>
            Ready to initiate an engagement?
          </h3>
          <p style={{ opacity: 0.8, fontSize: '0.9375rem', marginBottom: '1.5rem', maxWidth: '30rem', margin: '0 auto 1.5rem' }}>
            We work with clarity and velocity. Contact our team to draft your project scope architecture.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn-signup" style={{ backgroundColor: '#fff', color: '#000' }}>
              Start a Project
            </Link>
            <Link href="/packages" className="btn-sales" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Review Packages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
