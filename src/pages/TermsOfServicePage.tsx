import React from 'react';
import AuthBackground from '../components/auth/AuthBackground';
import { Link } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E0E] relative overflow-hidden font-montserrat">
      <AuthBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl bg-[#0C0C0C]/80 border border-[#252525] rounded-2xl p-6 sm:p-8 text-white backdrop-blur-md">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-sm text-[#CFCFCF] mb-6">Welcome to Studio AI (“we,” “our,” “us”). These Terms of Service (“Terms”) govern your access and use of our website, services, and any related offerings (collectively, the “Services”). By accessing or using our Services, you agree to these Terms. If you do not agree, please do not use our Services.</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h2 className="font-semibold text-white mb-2">1) Scope</h2>
              <p className="text-[#CFCFCF]">This website provides non-binding information about our company and services. Visiting the site or using the contact form does not create a contract.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">2) Acceptable Use</h2>
              <p className="text-[#CFCFCF]">Do not misuse the site (e.g., attempt unauthorised access, inject malware, scrape at scale, or use content unlawfully). We may take reasonable measures to protect the site.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">3) Intellectual Property</h2>
              <p className="text-[#CFCFCF]">All texts, images, designs, and trademarks are protected and belong to Studio AI or its licensors. You may link to our pages. Any other use (copying, modifying, re-publishing) requires prior written permission unless allowed by statutory exceptions.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">4) External Links</h2>
              <p className="text-[#CFCFCF]">Our website may contain links to third-party websites for your convenience. We have no control over their content or policies and disclaim responsibility for them.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">5) No Advice</h2>
              <p className="text-[#CFCFCF]">Content is for general information only and does not constitute legal, financial, or technical advice.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">6) Liability</h2>
              <p className="text-[#CFCFCF]">We are not liable for any damages arising from the use of this site except where German law mandates otherwise, such as liability for intent, gross negligence, injury to life, body, or health.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">7) Changes to the Website</h2>
              <p className="text-[#CFCFCF]">We may change, restrict, or discontinue content at any time.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">8) Governing Law & Venue</h2>
              <p className="text-[#CFCFCF]">These Terms are governed by German law, excluding conflict-of-law rules. Any disputes shall be subject to the exclusive jurisdiction of the courts of Berlin.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">9) Contact</h2>
              <p className="text-[#CFCFCF]">privacy@Studio.ai</p>
            </div>

            <div className="space-y-1">
              <p className="text-[#CFCFCF]">©2025 Studio AI. All rights reserved</p>
              <p className="text-[#CFCFCF]">Wallstraße 119, 10179 Berlin</p>
              <p className="text-[#CFCFCF]">sales@Studio.ai</p>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span className="underline text-white"> <Link
                to="/terms-of-service"
                className="underline hover:text-[#00BBFF] transition-colors"
              >
                Terms of service
              </Link></span>
              <span className="underline text-white"> <Link
                to="/privacy-policy"
                className="underline hover:text-[#00BBFF] transition-colors"
              >
                Privacy policy
              </Link></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;