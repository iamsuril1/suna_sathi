import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return null;
    }
    const res = await api.get("/api/auth/me");
    setUser(res.data);
    return res.data;
  };

  useEffect(() => {
    setBooting(true);
    fetchMe()
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const login = async (token) => {
    localStorage.setItem("token", token);
    await fetchMe();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const res = await api.put("/api/auth/me", payload);
    setUser(res.data);
    return res.data;
  };

  const value = useMemo(
    () => ({ user, booting, login, logout, updateProfile, refreshMe: fetchMe }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
