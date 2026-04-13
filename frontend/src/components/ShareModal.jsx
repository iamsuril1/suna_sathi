import { useState } from "react";
import { X, Copy, Check, Facebook, Twitter, Share2 } from "lucide-react";

export default function ShareModal({ song, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!song) return null;

  const shareUrl = window.location.origin + "/dashboard";
  const shareText = `🎵 Check out "${song.name}" by ${song.artist} on SunaSathi! ${window.location.origin}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1120] backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Share Song</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Song Info */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{song.name}</p>
            <p className="text-sm text-gray-400 truncate">{song.artist} · {song.genre} · {song.year}</p>
          </div>
        </div>

        {/* Share text preview */}
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-4">
          <p className="text-xs text-gray-400 mb-1">Share text</p>
          <p className="text-sm text-gray-300 break-all">{shareText}</p>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          {/* Copy */}
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
            <div className="flex-1 text-left">
              <p className="font-medium text-white text-sm">
                {copied ? "Copied!" : "Copy to Clipboard"}
              </p>
              <p className="text-xs text-gray-400">Copy song info as text</p>
            </div>
          </button>

          {/* Native Share */}
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

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareToFacebook}
              className="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-blue-500/50"
              type="button"
            >
              <Facebook className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-white text-sm">Facebook</span>
            </button>

            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-sky-500/50"
              type="button"
            >
              <Twitter className="w-5 h-5 text-sky-400" />
              <span className="font-medium text-white text-sm">Twitter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}