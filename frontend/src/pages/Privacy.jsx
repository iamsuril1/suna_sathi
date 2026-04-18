import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: [
        "Account information: When you register, we collect your name, email address, and password (stored as a secure hash).",
        "Usage data: We collect information about how you use SunaSathi, including songs played, playlists created, and listening duration.",
        "Device information: We may collect device type, operating system, and browser information to improve your experience.",
        "Communications: If you contact us through our contact form, we store your messages to provide support.",
      ],
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "To provide and maintain our music streaming service.",
        "To personalize your experience and remember your preferences.",
        "To send you service-related emails such as OTP verification and password reset links.",
        "To improve our platform based on usage patterns and feedback.",
        "To detect and prevent fraudulent or abusive activity.",
      ],
    },
    {
      title: "3. Data Storage and Security",
      content: [
        "Your data is stored on secure servers. Passwords are hashed using bcrypt and never stored in plain text.",
        "We use JWT tokens for authentication, which expire after 7 days.",
        "We implement rate limiting and other security measures to protect against unauthorized access.",
        "While we take reasonable precautions, no system is 100% secure. We encourage you to use a strong, unique password.",
      ],
    },
    {
      title: "4. Cookies and Local Storage",
      content: [
        "We use browser localStorage to store your authentication token and music preferences (liked songs, volume settings).",
        "We do not use third-party tracking cookies or advertising cookies.",
        "You can clear your browser's local storage at any time, which will log you out of the platform.",
      ],
    },
    {
      title: "5. Sharing Your Information",
      content: [
        "We do not sell, trade, or rent your personal information to third parties.",
        "We do not share your data with advertisers.",
        "We may share data with service providers who help us operate the platform (e.g., email delivery), under strict confidentiality agreements.",
        "We may disclose information if required by law or to protect the rights and safety of our users.",
      ],
    },
    {
      title: "6. Your Rights",
      content: [
        "Access: You can view and update your account information at any time through your Profile page.",
        "Deletion: You can request deletion of your account by contacting us at support@sunasathi.com.",
        "Data portability: You can request a copy of your personal data.",
        "Opt-out: You can stop using the service at any time.",
      ],
    },
    {
      title: "7. Children's Privacy",
      content: [
        "SunaSathi is not intended for children under 13 years of age.",
        "We do not knowingly collect personal information from children under 13.",
        "If you believe a child has provided us with personal information, please contact us immediately.",
      ],
    },
    {
      title: "8. Changes to This Policy",
      content: [
        "We may update this Privacy Policy from time to time.",
        "We will notify you of significant changes by email or by posting a notice on our platform.",
        "Your continued use of SunaSathi after changes constitutes acceptance of the updated policy.",
      ],
    },
    {
      title: "9. Contact Us",
      content: [
        "If you have questions about this Privacy Policy or how we handle your data, please contact us at support@sunasathi.com or through our Contact page.",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <Link to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Shield className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
              <p className="text-gray-400 text-sm mt-1">Last updated: April 2026</p>
            </div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-4">
            <p className="text-indigo-300 text-sm leading-relaxed">
              At SunaSathi, we take your privacy seriously. This policy explains what data we collect,
              how we use it, and your rights regarding your personal information.
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
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CTA */}
          <div className="text-center pt-4">
            <p className="text-gray-500 text-sm mb-4">
              Have questions about our privacy practices?
            </p>
            <Link to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-0.5">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}