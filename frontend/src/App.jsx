import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar        from "./components/Navbar";
import Footer        from "./components/Footer";
import Home          from "./pages/Home";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import VerifyOTP     from "./pages/VerifyOTP";
import Admin         from "./pages/Admin";
import Dashboard     from "./pages/Dashboard";
import AddMusic      from "./pages/AddMusic";
import AdminUsers    from "./pages/AdminUsers";
import Analytics     from "./pages/Analytics";
import Profile       from "./pages/Profile";
import About         from "./pages/About";
import Contact       from "./pages/Contact";
import PublicPlaylist from "./pages/PublicPlaylist";
import PrivateRoute  from "./components/PrivateRoute";
import AdminRoute    from "./components/AdminRoute";
import PublicRoute   from "./components/PublicRoute";
import { AuthProvider } from "./context/AuthContext";
import Live from "./pages/Live";
import AdminLive from "./pages/AdminLive";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />

      <Routes>
        {/* Public / unauthenticated only */}
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* OTP verification — accessible without login */}
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Info pages — everyone */}
        <Route path="/about"   element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Public playlist share — no auth required */}
        <Route path="/playlist/share/:shareToken" element={<PublicPlaylist />} />

        {/* User routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* Live session routes */} 
          <Route path="/live" element={<PrivateRoute><Live /></PrivateRoute>} />
          <Route path="/admin/live" element={<AdminRoute><AdminLive /></AdminRoute>} />

        {/* Admin routes */}
        <Route path="/admin"            element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/add-music"  element={<AdminRoute><AddMusic /></AdminRoute>} />
        <Route path="/admin/users"      element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/analytics"  element={<AdminRoute><Analytics /></AdminRoute>} />
      </Routes>

      <Footer />
    </AuthProvider>
  );
}