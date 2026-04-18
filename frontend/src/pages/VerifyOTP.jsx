import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Mail, RotateCcw, CheckCircle, ArrowLeft } from "lucide-react";

export default function VerifyOTP() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const email = location.state?.email || "";

  const [otp,            setOtp]            = useState(["", "", "", "", "", ""]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [success,        setSuccess]        = useState(false);
  const [resendLoading,  setResendLoading]  = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRefs   = useRef([]);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    startCooldown(60);
    return () => clearInterval(cooldownRef.current);
  }, []);

  const startCooldown = (seconds) => {
    setResendCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (index, value) => {
    const digit  = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (digit && index === 5 && newOtp.every((d) => d !== "")) {
      submitOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft"  && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = ["", "", "", "", "", ""];
    pasted.split("").forEach((digit, i) => { newOtp[i] = digit; });
    setOtp(newOtp);
    setError("");
    const lastIdx = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIdx]?.focus();
    if (pasted.length === 6) submitOTP(pasted);
  };

  const submitOTP = async (code) => {
    if (!code || code.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/verify-otp", { email, otp: code });
      setSuccess(true);
      if (res.data.token) {
        await login(res.data.token);
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Verification failed. Try again.";
      setError(msg);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");
    try {
      await api.post("/api/auth/resend-otp", { email });
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      startCooldown(60);
    } catch (err) {
      const msg   = err.response?.data?.message || "Failed to resend OTP";
      setError(msg);
      const match = msg.match(/(\d+) second/);
      if (match) startCooldown(parseInt(match[1]));
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

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
          {success ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-gray-400 mb-6">Welcome to SunaSathi 🎵</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
              <div className="mt-4 flex justify-center">
                <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-gray-400 text-sm">We sent a 6-digit code to</p>
                <p className="text-white font-semibold text-sm mt-1">{email}</p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              {/* OTP boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={index === 0}
                    disabled={loading}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`
                      w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold
                      rounded-xl border-2 bg-white/5 text-white transition-all outline-none
                      ${digit
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-200"
                        : "border-white/10 focus:border-indigo-500/70 focus:bg-white/10"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : "cursor-text"}
                    `}
                  />
                ))}
              </div>

              <button
                onClick={() => submitOTP(otp.join(""))}
                disabled={loading || otp.some((d) => d === "")}
                className="w-full py-4 rounded-xl font-semibold
                  bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                  hover:shadow-2xl hover:shadow-purple-500/50
                  transition-all duration-300 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                ) : "Verify Email"}
              </button>

              <div className="mt-6 text-center space-y-1">
                <p className="text-sm text-gray-500">Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed
                    text-indigo-400 hover:text-indigo-300 disabled:text-gray-500"
                >
                  <RotateCcw className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s`
                    : resendLoading ? "Sending..." : "Resend OTP"}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 text-center">
                <Link to="/register"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Register
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}