import { useState } from "react";
import { X, Copy, Check, Share2, Lock, Unlock, RefreshCw, Eye, Link as LinkIcon } from "lucide-react";
import api from "../services/api";

export default function SharePlaylistModal({ playlist, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(
    playlist?.shareToken 
      ? `${window.location.origin}/playlist/share/${playlist.shareToken}`
      : null
  );

  if (!playlist) return null;

  const makePublic = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/api/playlists/${playlist.id}/make-public`);
      setShareUrl(res.data.shareUrl);
      onUpdate?.();
    } catch (err) {
      console.error("Failed to make playlist public:", err);
      alert(err.response?.data?.message || "Failed to make playlist public");
    } finally {
      setLoading(false);
    }
  };

  const makePrivate = async () => {
    try {
      setLoading(true);
      await api.post(`/api/playlists/${playlist.id}/make-private`);
      setShareUrl(null);
      onUpdate?.();
    } catch (err) {
      console.error("Failed to make playlist private:", err);
      alert(err.response?.data?.message || "Failed to make playlist private");
    } finally {
      setLoading(false);
    }
  };

  const regenerateLink = async () => {
    if (!window.confirm("This will invalidate the current share link. Continue?")) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/api/playlists/${playlist.id}/regenerate-token`);
      setShareUrl(res.data.shareUrl);
      onUpdate?.();
    } catch (err) {
      console.error("Failed to regenerate link:", err);
      alert(err.response?.data?.message || "Failed to regenerate link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: playlist.name,
          text: `Check out my playlist "${playlist.name}" on SunaSathi!`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    }
  };

  const isPublic = playlist.isPublic || shareUrl !== null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Share Playlist</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Playlist Info */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
            <span className="text-lg font-bold text-purple-300">
              {playlist.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{playlist.name}</p>
            <p className="text-sm text-gray-400">
              {playlist.songs?.length || 0} songs • {playlist.viewCount || 0} views
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <>
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Unlock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Public Playlist</p>
                    <p className="text-xs text-gray-400">Anyone with the link can view</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Private Playlist</p>
                    <p className="text-xs text-gray-400">Only you can view</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={isPublic ? makePrivate : makePublic}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isPublic
                  ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                  : "bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
            >
              {loading ? "..." : isPublic ? "Make Private" : "Make Public"}
            </button>
          </div>
        </div>

        {/* Share Options */}
        {isPublic && shareUrl && (
          <div className="space-y-3">
            {/* Copy Link */}
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-indigo-500/50"
              type="button"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-white text-sm">
                  {copied ? "Link Copied!" : "Copy Share Link"}
                </p>
                <p className="text-xs text-gray-400 truncate">{shareUrl}</p>
              </div>
            </button>

            {/* Native Share (mobile) */}
            {navigator.share && (
              <button
                onClick={shareNative}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-indigo-500/50"
                type="button"
              >
                <Share2 className="w-5 h-5 text-gray-400" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-white text-sm">Share via...</p>
                  <p className="text-xs text-gray-400">Use your device's share menu</p>
                </div>
              </button>
            )}

            {/* Regenerate Link */}
            <button
              onClick={regenerateLink}
              disabled={loading}
              className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <RefreshCw className="w-5 h-5 text-purple-400" />
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">Regenerate Link</p>
                <p className="text-xs text-gray-400">Invalidate current link and create new one</p>
              </div>
            </button>

            {/* Stats */}
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-400">
                {playlist.viewCount || 0} people have viewed this playlist
              </span>
            </div>
          </div>
        )}

        {!isPublic && (
          <div className="text-center py-8">
            <LinkIcon className="w-12 h-12 mx-auto text-gray-700 mb-3" />
            <p className="text-gray-400 text-sm mb-4">
              Make your playlist public to generate a shareable link
            </p>
          </div>
        )}
      </div>
    </div>
  );
}