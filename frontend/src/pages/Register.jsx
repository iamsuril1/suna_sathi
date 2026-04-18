import { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    password: "", confirmPassword: "",
  });
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPass,      setShowPass]      = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
      });
      if (res.data.requiresVerification) {
        navigate("/verify-otp", {
          state:   { email: res.data.email || form.email },
          replace: true,
        });
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
            <p className="text-gray-400">Start your musical journey today</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required placeholder="John"
                    className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500
                      focus:outline-none focus:border-indigo-500/50 transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Last Name</label>
                <input type="text" value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required placeholder="Doe"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500
                    focus:outline-none focus:border-indigo-500/50 transition-all text-sm" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500
                    focus:outline-none focus:border-indigo-500/50 transition-all" />
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required placeholder="Min. 6 chars"
                    className="w-full pl-9 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500
                      focus:outline-none focus:border-indigo-500/50 transition-all text-sm" />
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Confirm</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required placeholder="Repeat password"
                    className="w-full pl-4 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500
                      focus:outline-none focus:border-indigo-500/50 transition-all text-sm" />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password strength */}
            {form.password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        form.password.length >= level * 3
                          ? level <= 1 ? "bg-red-500"
                            : level <= 2 ? "bg-yellow-500"
                            : level <= 3 ? "bg-blue-500"
                            : "bg-green-500"
                          : "bg-white/10"
                      }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {form.password.length < 6 ? "Too short"
                    : form.password.length < 9 ? "Weak"
                    : form.password.length < 12 ? "Good"
                    : "Strong"}
                </p>
              </div>
            )}

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-white/20 bg-white/5 text-indigo-500
                  focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer" />
              <label className="text-sm text-gray-400 cursor-pointer"
                onClick={() => setAgreedToTerms(!agreedToTerms)}>
                I agree to the{" "}
                <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Terms of Service
                </Link>{" "}and{" "}
                <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-base
                bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                hover:shadow-2xl hover:shadow-purple-500/50
                transition-all duration-300 hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Account...</>
              ) : "Create Account"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}