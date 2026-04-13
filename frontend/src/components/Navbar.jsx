import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Radio } from "lucide-react";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const logoTo = user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/";
  const dashboardLink = user?.role === "admin" ? "/admin" : "/dashboard";
  const dashboardLabel = user?.role === "admin" ? "Admin Dashboard" : "Dashboard";

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <header className="bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          to={logoTo}
          className="flex items-center group"
          onClick={() => setOpen(false)}
        >
          <img
            src="/logo.png"
            alt="SunaSathi"
            className="h-10 w-auto object-contain group-hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                to={dashboardLink}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-indigo-500/50 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{dashboardLabel}</span>
              </Link>

                 <Link
  to="/live"
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all"
>
  <Radio className="w-4 h-4" />
  <span>Live</span>
</Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-indigo-500/50 transition-all"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-red-500/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden border-t border-white/10 px-4 py-4 bg-[#0B0F1A]/95 backdrop-blur-xl">
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={dashboardLink}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{dashboardLabel}</span>
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  onClick={() => setOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-center"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-center shadow-lg shadow-indigo-500/50 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}