import IntentPartner from '@/components/IntentPartner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-zinc-500 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-zinc max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">1. Agreement to Terms</h2>
              <p className="text-zinc-700 leading-relaxed">
                By accessing or using HUSTLE™ (&quot;Service&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, you may not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">2. User Eligibility</h2>
              <p className="text-zinc-700 leading-relaxed mb-2">
                The Service is intended for use by parents and legal guardians who are at least 18 years of age.
                By using the Service, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>You are at least 18 years old</li>
                <li>You are the parent or legal guardian of any minors whose data you enter into the Service</li>
                <li>You have the legal authority to consent to the collection and use of your child&apos;s information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">3. Service Description</h2>
              <p className="text-zinc-700 leading-relaxed">
                HUSTLE™ provides athletic performance tracking services for youth athletes, including:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Game statistics logging and tracking</li>
                <li>Performance analytics and progress reporting</li>
                <li>Athlete profile management</li>
                <li>Data export and sharing capabilities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">4. User Accounts</h2>
              <p className="text-zinc-700 leading-relaxed mb-2">
                To use the Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and complete information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">5. Privacy and Data Protection</h2>
              <p className="text-zinc-700 leading-relaxed">
                Your use of the Service is also governed by our <Link href="/privacy" className="text-zinc-900 underline hover:text-zinc-700">Privacy Policy</Link>,
                which is incorporated into these Terms by reference. We are committed to protecting children&apos;s privacy in compliance with COPPA
                (Children&apos;s Online Privacy Protection Act).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">6. User Content and Data</h2>
              <p className="text-zinc-700 leading-relaxed mb-2">
                You retain ownership of all data you submit to the Service. By using the Service, you grant us a license to:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Store, process, and display your data as necessary to provide the Service</li>
                <li>Create aggregated, anonymized statistics for service improvement</li>
                <li>Share data only as you explicitly authorize or as required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">7. Acceptable Use</h2>
              <p className="text-zinc-700 leading-relaxed mb-2">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Submit false, misleading, or fraudulent information</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Use the Service to harass, abuse, or harm another person</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">8. Intellectual Property</h2>
              <p className="text-zinc-700 leading-relaxed">
                The Service, including all content, features, and functionality, is owned by HUSTLE™ and is protected by
                copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create
                derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">9. Disclaimer of Warranties</h2>
              <p className="text-zinc-700 leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">10. Limitation of Liability</h2>
              <p className="text-zinc-700 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, HUSTLE™ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">11. Termination</h2>
              <p className="text-zinc-700 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms.
                You may terminate your account at any time by contacting us. Upon termination, you may request deletion
                of your data as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">12. Changes to Terms</h2>
              <p className="text-zinc-700 leading-relaxed">
                We may modify these Terms at any time. We will notify you of material changes by email or through the Service.
                Your continued use of the Service after changes become effective constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">13. Governing Law</h2>
              <p className="text-zinc-700 leading-relaxed">
                These Terms are governed by the laws of the United States and the state in which HUSTLE™ operates,
                without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">14. Contact Information</h2>
              <p className="text-zinc-700 leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-zinc-700 leading-relaxed mt-2">
                Email: <a href="mailto:legal@intentsolutions.io" className="text-zinc-900 underline hover:text-zinc-700">legal@intentsolutions.io</a>
              </p>
            </section>

            <section className="pt-6 border-t border-zinc-200 mt-8">
              <p className="text-sm text-zinc-500 italic">
                By using HUSTLE™, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
