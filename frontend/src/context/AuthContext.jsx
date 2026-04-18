import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { liveAudio } from "../services/liveAudio";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,         setUser]         = useState(null);
  const [booting,      setBooting]      = useState(true);
  const [likedSongIds, setLikedSongIds] = useState([]);

  const fetchMe = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setUser(null); return null; }
    const res = await api.get("/api/auth/me");
    setUser(res.data);
    return res.data;
  };

  const fetchLikedSongs = async () => {
    try {
      const res = await api.get("/api/auth/liked-songs");
      const ids = (res.data.likedSongs || []).map((id) =>
        typeof id === "object" ? id.toString() : id
      );
      setLikedSongIds(ids);
    } catch {
      setLikedSongIds([]);
    }
  };

  useEffect(() => {
    setBooting(true);
    fetchMe()
      .then((u) => { if (u) fetchLikedSongs(); })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const login = async (token) => {
    localStorage.setItem("token", token);
    await fetchMe();
    await fetchLikedSongs();
  };

  const logout = () => {
    // Stop all audio immediately on logout
    try {
      liveAudio.stopLive();
      liveAudio.stopNormal();
    } catch { /* silent */ }

    localStorage.removeItem("token");
    setUser(null);
    setLikedSongIds([]);
  };

  const updateProfile = async (payload) => {
    const res = await api.put("/api/auth/me", payload);
    setUser(res.data);
    return res.data;
  };

  const toggleLike = async (songId) => {
    // Optimistic update
    setLikedSongIds((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
    try {
      const res = await api.post("/api/auth/liked-songs/toggle", { songId });
      const ids = (res.data.likedSongs || []).map((id) =>
        typeof id === "object" ? id.toString() : id
      );
      setLikedSongIds(ids);
    } catch {
      // Revert on failure
      await fetchLikedSongs();
    }
  };

  const value = useMemo(
    () => ({
      user, booting, login, logout,
      updateProfile, refreshMe: fetchMe,
      likedSongIds, toggleLike,
    }),
    [user, booting, likedSongIds]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);