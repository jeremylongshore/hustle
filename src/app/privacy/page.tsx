import IntentPartner from '@/components/IntentPartner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>
      <IntentPartner />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-500 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-zinc max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">1. Introduction</h2>
              <p className="text-zinc-700 leading-relaxed">
                HUSTLE™ (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy and the privacy of your children.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-amber-900 mb-3">⚠️ COPPA Compliance Notice</h2>
              <p className="text-amber-900 leading-relaxed mb-2">
                This Service is intended for use by parents and legal guardians to track athletic performance of children under 13.
                We comply with the Children&apos;s Online Privacy Protection Act (COPPA) by:
              </p>
              <ul className="list-disc pl-6 text-amber-900 space-y-1">
                <li>Requiring verifiable parental consent before collecting children&apos;s information</li>
                <li>Collecting only information necessary to provide the Service</li>
                <li>Not requiring children to provide more information than necessary</li>
                <li>Providing parents with the ability to review, delete, and control their child&apos;s information</li>
                <li>Maintaining reasonable security procedures to protect collected information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">2. Information We Collect</h2>

              <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">From Parents/Guardians:</h3>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Name, email address, and phone number</li>
                <li>Account credentials (password is encrypted)</li>
                <li>Payment information (processed securely by third-party payment processors)</li>
              </ul>

              <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">From/About Athletes (with parental consent):</h3>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Athlete&apos;s name and date of birth</li>
                <li>Team/club affiliation</li>
                <li>Playing position</li>
                <li>Optional: Profile photo</li>
                <li>Game statistics and performance data</li>
              </ul>

              <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Automatically Collected Information:</h3>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Device information and IP address</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-zinc-700 leading-relaxed mb-2">
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Provide and maintain the Service</li>
                <li>Create and manage your account</li>
                <li>Track and display athletic performance data</li>
                <li>Send account-related notifications and updates</li>
                <li>Improve our Service and develop new features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">4. Information Sharing and Disclosure</h2>
              <p className="text-zinc-700 leading-relaxed mb-2">
                We do NOT sell, rent, or share your child&apos;s personal information with third parties for marketing purposes.
                We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li><strong>With your consent:</strong> When you explicitly authorize sharing (e.g., with coaches or team administrators)</li>
                <li><strong>Service providers:</strong> Trusted vendors who assist in operating the Service (hosting, email, payment processing)</li>
                <li><strong>Legal compliance:</strong> When required by law or to protect our rights</li>
                <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or asset sale (with continued privacy protection)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">5. Parental Rights and Controls</h2>
              <p className="text-zinc-700 leading-relaxed mb-2">
                As a parent or guardian, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li><strong>Review:</strong> Access all information we have collected about your child</li>
                <li><strong>Delete:</strong> Request deletion of your child&apos;s information at any time</li>
                <li><strong>Refuse:</strong> Refuse further collection or use of your child&apos;s information</li>
                <li><strong>Modify:</strong> Correct or update any inaccurate information</li>
              </ul>
              <p className="text-zinc-700 leading-relaxed mt-3">
                To exercise these rights, contact us at <a href="mailto:privacy@intentsolutions.io" className="text-zinc-900 underline hover:text-zinc-700">privacy@intentsolutions.io</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">6. Data Security</h2>
              <p className="text-zinc-700 leading-relaxed">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure cloud infrastructure (Google Cloud Platform)</li>
              </ul>
              <p className="text-zinc-700 leading-relaxed mt-3">
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">7. Data Retention</h2>
              <p className="text-zinc-700 leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide the Service.
                You may request deletion of your account and associated data at any time. Upon deletion request,
                we will remove your data within 30 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">8. Cookies and Tracking Technologies</h2>
              <p className="text-zinc-700 leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences,
                and analyze usage patterns. You can control cookie preferences through your browser settings.
                Essential cookies required for the Service to function cannot be disabled.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">9. Third-Party Services</h2>
              <p className="text-zinc-700 leading-relaxed mb-2">
                Our Service may integrate with third-party services:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li><strong>Google Cloud Platform:</strong> Hosting and infrastructure</li>
                <li><strong>Resend:</strong> Transactional email delivery</li>
                <li><strong>Payment processors:</strong> Secure payment handling (if applicable)</li>
              </ul>
              <p className="text-zinc-700 leading-relaxed mt-3">
                These services have their own privacy policies. We recommend reviewing them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">10. International Data Transfers</h2>
              <p className="text-zinc-700 leading-relaxed">
                Your information may be transferred to and processed in the United States or other countries
                where we or our service providers operate. By using the Service, you consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">11. Changes to This Privacy Policy</h2>
              <p className="text-zinc-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes
                by email or through the Service. Your continued use after changes become effective constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">12. Contact Us</h2>
              <p className="text-zinc-700 leading-relaxed">
                For questions about this Privacy Policy or to exercise your parental rights, contact us at:
              </p>
              <div className="mt-3 text-zinc-700 leading-relaxed">
                <p><strong>Email:</strong> <a href="mailto:privacy@intentsolutions.io" className="text-zinc-900 underline hover:text-zinc-700">privacy@intentsolutions.io</a></p>
                <p className="mt-1"><strong>Subject Line:</strong> Privacy Request - HUSTLE</p>
              </div>
            </section>

            <section className="pt-6 border-t border-zinc-200 mt-8">
              <p className="text-sm text-zinc-500 italic">
                By using HUSTLE™, you acknowledge that you have read, understood, and agree to this Privacy Policy.
                If you are using the Service on behalf of a minor, you certify that you are the parent or legal guardian
                and have the authority to consent to the collection and use of the child&apos;s information.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
