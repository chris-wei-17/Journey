import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Header title="Terms of Service" />
      
      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Journey, a comprehensive fitness tracking application. These Terms of Service ("Terms") govern your use of our website, mobile application, and related services (collectively, the "Service") operated by Journey ("we," "us," or "our").
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, then you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Journey is a fitness tracking platform that provides tools for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Tracking fitness progress and health metrics</li>
                <li>Recording and organizing progress photos</li>
                <li>Logging nutrition and meal information</li>
                <li>Setting and monitoring fitness goals</li>
                <li>Accessing fitness-related content and insights</li>
                <li>Connecting with a community of fitness enthusiasts</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Account Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account at any time for violations of these Terms or other reasons at our sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content and Conduct</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 User Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of any content you submit, post, or display on the Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Prohibited Conduct</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Use the Service for any unlawful purposes or to solicit unlawful activities</li>
                <li>Post content that is harmful, threatening, abusive, or offensive</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Transmit any viruses, malware, or other harmful code</li>
                <li>Harvest or collect information about other users</li>
                <li>Use the Service to spam or send unsolicited communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Health and Medical Disclaimers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>IMPORTANT:</strong> Journey is not a medical device or service. The information provided by our Service is for informational and educational purposes only and should not be considered medical advice.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Always consult with healthcare professionals before starting any fitness program</li>
                <li>The Service is not intended to diagnose, treat, cure, or prevent any disease</li>
                <li>We do not guarantee the accuracy of health-related information</li>
                <li>You use the Service at your own risk and should exercise common sense</li>
                <li>Stop using the Service and consult a healthcare provider if you experience any adverse effects</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Subscription and Payment Terms</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Subscription Plans</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We offer various subscription plans that may include premium features. Subscription fees are charged in advance and are non-refundable except as required by law.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Automatic Renewal</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Subscriptions automatically renew at the end of each billing period unless cancelled. You may cancel your subscription at any time through your account settings or by contacting customer support.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Price Changes</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to change subscription prices with reasonable notice. Price changes will not affect existing subscriptions until renewal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are and will remain our exclusive property. The Service is protected by copyright, trademark, and other laws. You may not duplicate, copy, or reuse any portion of the Service without our express written permission.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Services and Advertising</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Third-Party Integrations</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Service may integrate with third-party services, websites, or applications. We are not responsible for the content, privacy policies, or practices of any third-party services.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Advertising</h3>
              <p className="text-gray-700 leading-relaxed">
                We may display advertisements through Google AdSense and other advertising partners. We do not endorse or guarantee the products or services advertised, and you interact with advertisers at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use the Service. By using the Service, you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate security measures to protect your personal information, but we cannot guarantee the absolute security of your data transmitted to our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers and Limitation of Liability</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Service Disclaimers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION, WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.2 Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                IN NO EVENT SHALL JOURNEY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to defend, indemnify, and hold harmless Journey and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be interpreted and enforced in accordance with the laws of [Your Jurisdiction], without regard to conflict of law provisions.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Any dispute arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization]. You waive any right to a jury trial or to participate in a class action lawsuit.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. Your continued use of the Service after the effective date of the revised Terms constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Severability</h2>
              <p className="text-gray-700 leading-relaxed">
                If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will remain in full force and effect. The invalid or unenforceable provision will be replaced with a valid provision that most closely reflects the intent of the original provision.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> legal@journeyapp.com</p>
                <p className="text-gray-700"><strong>Address:</strong> Journey Legal Team, [Your Address]</p>
                <p className="text-gray-700"><strong>Phone:</strong> [Your Phone Number]</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Button 
              onClick={() => setLocation("/")}
              variant="outline"
              className="mr-4"
            >
              Back to Home
            </Button>
            <Button 
              onClick={() => setLocation("/privacy-policy")}
              variant="default"
            >
              View Privacy Policy
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}