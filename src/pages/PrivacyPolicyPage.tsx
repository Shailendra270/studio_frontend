import React from 'react';
import AuthBackground from '../components/auth/AuthBackground';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E0E] relative overflow-hidden font-montserrat">
      <AuthBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl bg-[#0C0C0C]/80 border border-[#252525] rounded-2xl p-6 sm:p-8 text-white backdrop-blur-md">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Privacy Policy</h1>

          {/* Impressum */}
          <div className="space-y-2 text-sm text-[#CFCFCF] mb-6">
            <h2 className="font-semibold text-white">Impressum</h2>
            <p>Service Provider (Anbieter): Shekar kapoor</p>
            <p>Wallstraße 9, 10179 Berlin, Germany</p>
            <p>Email: <a href="mailto:privacy@Studio.ai" className="underline">privacy@Studio.ai</a></p>
            <p>Responsible for content per § 18 Abs. 2 MStV: Shekar kapoor</p>
            <p>
              EU Online Dispute Resolution:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                ec.europa.eu/consumers/odr
              </a>
            </p>
            <p>
              We are not obliged and generally not willing to participate in dispute resolution before a consumer arbitration board.
            </p>
          </div>

          {/* Privacy Policy Sections */}
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h2 className="font-semibold text-white mb-2">1) Controller & Contact</h2>
              <p className="text-[#CFCFCF]">Anbieter: Shekar kapoor, Wallstraße 119, 10179 Berlin, Germany</p>
              <p className="text-[#CFCFCF]">Email: <a href="mailto:privacy@Studio.ai" className="underline">privacy@Studio.ai</a></p>
              <p className="text-[#CFCFCF]">Responsible for content per § 18 Abs. 2 MStV: Shekar kapoor</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">2) Hosting & Access Logs</h2>
              <p className="text-[#CFCFCF]">Provider: Framer.</p>
              <p className="text-[#CFCFCF]">We process basic server data (IP address, timestamp, requested URL, referrer, user-agent) for technical and security reasons (Art. 6(1)(f) GDPR). Data is deleted when no longer needed.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">3) Cookies & Consent</h2>
              <p className="text-[#CFCFCF]">A consent banner appears on our website. We only load analytics or marketing cookies after your explicit consent (Art. 6(1)(a) GDPR, §25 TDDDG). You can change preferences at any time.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">4) Analytics (Google Analytics 4)</h2>
              <p className="text-[#CFCFCF]">Provider: Google Ireland Ltd. (possibly Google LLC, USA).</p>
              <p className="text-[#CFCFCF]">We use Google Analytics 4 to understand site usage, only with your consent. Data may be transferred outside the EU under the EU Standard Contractual Clauses. Opt-out any time via the banner.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">5) Marketing (Google Ads/Remarketing)</h2>
              <p className="text-[#CFCFCF]">Not always enabled. May use cookies or identifiers to personalize ads, only with consent. Same data transfer notes as above. Opt-out at any time.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">6) Contact Form / Email</h2>
              <p className="text-[#CFCFCF]">If you contact us, we process your details for the purpose of responding (Art. 6(1)(b) or (f) GDPR). We retain correspondence as required by business or legal rules.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">7) Data Recipients/Processors</h2>
              <p className="text-[#CFCFCF]">We use GDPR-compliant vendors for hosting, analytics, and communications.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">8) Data Security</h2>
              <p className="text-[#CFCFCF]">We use TLS encryption and technical/organizational measures to protect your data.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">9) Your Rights</h2>
              <p className="text-[#CFCFCF]">You have the right to access, rectify, erase, restrict, or object to processing. Withdraw consent at any time. Right to complain to: Berliner Beauftragte für Datenschutz und Informationsfreiheit.</p>
            </div>

            <div>
              <h2 className="font-semibold text-white mb-2">10) Changes</h2>
              <p className="text-[#CFCFCF]">We may update this policy as needed.</p>
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

export default PrivacyPolicyPage;