import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import api from "../services/api";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      await api.post("/api/contact", form);
      
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-l from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-8">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium">Get in Touch</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
              <span className="block text-white mb-2">We'd Love to</span>
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Hear From You
              </span>
            </h1>

            <p className="text-xl text-gray-400">
              Have questions? We're here to help and answer any questions you might have.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Email */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-indigo-500/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Email Us</h3>
                <p className="text-gray-400 text-sm mb-3">Our team typically responds within 24 hours</p>
                <a href="mailto:support@sunasathi.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  support@sunasathi.com
                </a>
              </div>

              {/* Phone */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-purple-500/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Call Us</h3>
                <p className="text-gray-400 text-sm mb-3">Mon-Fri from 9am to 6pm NPT</p>
                <a href="tel:+9771234567890" className="text-purple-400 hover:text-purple-300 transition-colors">
                  +977 (123) 456-7890
                </a>
              </div>

              {/* Location */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Visit Us</h3>
                <p className="text-gray-400 text-sm mb-3">Come say hello at our office</p>
                <address className="text-gray-400 not-italic">
                  Pātan, Bagmati Province<br />
                  Nepal
                </address>
              </div>

              {/* Business Hours */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Business Hours</h3>
                <div className="space-y-1 text-sm text-gray-400">
                  <p>Monday - Friday: 9am - 6pm</p>
                  <p>Saturday: 10am - 4pm</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                <h2 className="text-2xl font-bold text-white mb-2">Send us a Message</h2>
                <p className="text-gray-400 mb-8">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                {success && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300">
                    <p className="font-medium">Message sent successfully!</p>
                    <p className="text-sm text-green-400 mt-1">We'll get back to you soon.</p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Your Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 
                        focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 
                        focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 
                        focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Message</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      rows={6}
                      placeholder="Tell us more about your inquiry..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 
                        focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl 
                      bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold 
                      shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 
                      transition-all hover:-translate-y-1
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Frequently Asked Questions
              </span>
            </h2>
            <p className="text-gray-400">Quick answers to common questions</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How quickly do you respond to inquiries?",
                a: "We typically respond to all inquiries within 24 hours during business days. For urgent matters, please call us directly."
              },
              {
                q: "Do you offer phone support?",
                a: "Yes, our phone support is available Monday through Friday from 9am to 6pm NPT. You can reach us at +977 (123) 456-7890."
              },
              {
                q: "Can I visit your office?",
                a: "Yes! We welcome visitors at our Pātan office. Please contact us beforehand to schedule an appointment."
              },
              {
                q: "What if I have a technical issue?",
                a: "For technical support, please email support@sunasathi.com with details about your issue. Our technical team will assist you promptly."
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-indigo-500/50 transition-all">
                <h3 className="text-lg font-bold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}