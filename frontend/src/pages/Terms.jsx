import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";

export default function Terms() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: [
        "By accessing or using SunaSathi, you agree to be bound by these Terms of Service.",
        "If you do not agree to these terms, please do not use our platform.",
        "We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.",
      ],
    },
    {
      title: "2. Account Registration",
      content: [
        "You must provide accurate and complete information when creating an account.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You must be at least 13 years of age to create an account.",
        "Each person may only maintain one account. Duplicate accounts may be removed.",
        "You are responsible for all activities that occur under your account.",
      ],
    },
    {
      title: "3. Acceptable Use",
      content: [
        "You agree to use SunaSathi only for lawful purposes and in accordance with these terms.",
        "You must not attempt to gain unauthorized access to any part of the platform.",
        "You must not use the service to distribute malware, spam, or harmful content.",
        "You must not impersonate other users or misrepresent your identity.",
        "You must not attempt to reverse engineer, decompile, or extract source code from the platform.",
      ],
    },
    {
      title: "4. Content and Intellectual Property",
      content: [
        "All music content available on SunaSathi is owned by the respective rights holders.",
        "You may not download, reproduce, distribute, or create derivative works from any content without explicit permission.",
        "SunaSathi's logo, design, and branding are proprietary and may not be used without permission.",
        "User-created content (playlists, profile information) remains your property, but you grant us a license to display it.",
      ],
    },
    {
      title: "5. Service Availability",
      content: [
        "We strive to maintain high availability but do not guarantee uninterrupted access to the service.",
        "We reserve the right to perform maintenance, which may temporarily interrupt service.",
        "We are not liable for any losses resulting from service interruptions or downtime.",
        "Features may be added, modified, or removed at our discretion.",
      ],
    },
    {
      title: "6. Account Suspension and Termination",
      content: [
        "We reserve the right to suspend or terminate accounts that violate these terms.",
        "Accounts may be suspended for suspicious activity, abuse, or harmful behavior toward other users.",
        "You may delete your account at any time by contacting support@sunasathi.com.",
        "Upon termination, your access to the service will cease and your data may be deleted.",
      ],
    },
    {
      title: "7. Privacy",
      content: [
        "Your use of SunaSathi is also governed by our Privacy Policy, which is incorporated into these terms.",
        "By using the service, you consent to the collection and use of data as described in our Privacy Policy.",
      ],
    },
    {
      title: "8. Disclaimer of Warranties",
      content: [
        "SunaSathi is provided 'as is' without warranties of any kind, express or implied.",
        "We do not warrant that the service will be error-free, secure, or continuously available.",
        "We do not warrant the accuracy or completeness of any content on the platform.",
      ],
    },
    {
      title: "9. Limitation of Liability",
      content: [
        "To the maximum extent permitted by law, SunaSathi shall not be liable for any indirect, incidental, or consequential damages.",
        "Our total liability shall not exceed the amount you paid for the service in the preceding 12 months.",
        "Some jurisdictions do not allow limitations on liability, so these restrictions may not apply to you.",
      ],
    },
    {
      title: "10. Governing Law",
      content: [
        "These Terms of Service are governed by the laws of Nepal.",
        "Any disputes shall be resolved in the courts of Pātan, Bagmati Province, Nepal.",
        "If any provision of these terms is found unenforceable, the remaining provisions remain in full effect.",
      ],
    },
    {
      title: "11. Contact",
      content: [
        "For questions about these Terms of Service, please contact us at support@sunasathi.com or through our Contact page.",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-l from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <Link to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
              <FileText className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
              <p className="text-gray-400 text-sm mt-1">Last updated: April 2026</p>
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-5 py-4">
            <p className="text-purple-300 text-sm leading-relaxed">
              Please read these Terms of Service carefully before using SunaSathi.
              These terms govern your use of our music streaming platform.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>
              <ul className="space-y-3">
                {section.content.map((item, j) => (
                  <li key={j} className="flex gap-3 text-gray-400 text-sm leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick links */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Related Policies</p>
              <p className="text-gray-400 text-sm mt-1">Review our other policies</p>
            </div>
            <div className="flex gap-3">
              <Link to="/privacy"
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium">
                Privacy Policy
              </Link>
              <Link to="/contact"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all text-sm hover:-translate-y-0.5">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}