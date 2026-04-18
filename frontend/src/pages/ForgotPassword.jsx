import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#1a1f35] to-[#0B0F1A] text-white flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-l from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center group">
            <img src="/logo.png" alt="SunaSathi"
              className="h-12 w-auto object-contain group-hover:opacity-90 transition-opacity" />
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">

          {sent ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                If an account exists for <span className="text-white font-medium">{email}</span>,
                we've sent a password reset link.
              </p>
              <p className="text-gray-500 text-xs mb-8">
                The link expires in 15 minutes. Check your spam folder if you don't see it.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm"
                >
                  Try a different email
                </button>
                <Link to="/login"
                  className="block w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-center text-sm transition-all hover:-translate-y-0.5">
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Forgot password?</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500
                        focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-semibold
                    bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                    hover:shadow-2xl hover:shadow-purple-500/50
                    transition-all duration-300 hover:-translate-y-0.5
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                  ) : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <Link to="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}