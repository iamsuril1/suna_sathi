import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar         from "./components/Navbar";
import Footer         from "./components/Footer";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import VerifyOTP      from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";
import Admin          from "./pages/Admin";
import Dashboard      from "./pages/Dashboard";
import AddMusic       from "./pages/AddMusic";
import AdminUsers     from "./pages/AdminUsers";
import Analytics      from "./pages/Analytics";
import AdminLive      from "./pages/AdminLive";
import Profile        from "./pages/Profile";
import About          from "./pages/About";
import Contact        from "./pages/Contact";
import Privacy        from "./pages/Privacy";
import Terms          from "./pages/Terms";
import PublicPlaylist from "./pages/PublicPlaylist";
import Live           from "./pages/Live";
import PrivateRoute   from "./components/PrivateRoute";
import AdminRoute     from "./components/AdminRoute";
import PublicRoute    from "./components/PublicRoute";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Public / unauthenticated only */}
        <Route path="/"          element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"  element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password"       element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* OTP — accessible without login */}
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Info pages — everyone */}
        <Route path="/about"   element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms"   element={<Terms />} />

        {/* Public playlist share */}
        <Route path="/playlist/share/:shareToken" element={<PublicPlaylist />} />

        {/* User routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/live"      element={<PrivateRoute><Live /></PrivateRoute>} />

        {/* Admin routes */}
        <Route path="/admin"             element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/add-music"   element={<AdminRoute><AddMusic /></AdminRoute>} />
        <Route path="/admin/users"       element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/analytics"   element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="/admin/live"        element={<AdminRoute><AdminLive /></AdminRoute>} />
      </Routes>
      <Footer />
    </AuthProvider>
  );
}