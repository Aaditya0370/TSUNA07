import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share2, Sparkles, ExternalLink, Download } from 'lucide-react';
import { User } from '../types';
import { sounds } from '../utils/audio';

interface CreatorShareCardModalProps {
  user: User;
  onClose: () => void;
}

export const CreatorShareCardModal: React.FC<CreatorShareCardModalProps> = ({ user, onClose }) => {
  const [copied, setCopied] = useState(false);
  const handleUrl = `${window.location.origin}/@${user.username}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(handleUrl);
    setCopied(true);
    sounds.playTap();
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <QrCode className="h-4 w-4 text-emerald-400" />
            <span>Tsuna Creator Pass & QR</span>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* The Visual Badge Card */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 p-6 shadow-xl space-y-5">
          {/* Top badge glow */}
          <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Profile header */}
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-emerald-400/80 shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-base font-bold text-white truncate">{user.name}</h3>
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="text-xs font-mono text-emerald-400">@{user.username}</p>
              <p className="text-xs text-neutral-400 truncate mt-0.5">{user.roleTitle || 'Builder'}</p>
            </div>
          </div>

          {/* Bio snippet */}
          {user.bio && (
            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
              "{user.bio}"
            </p>
          )}

          {/* Skills tags */}
          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {user.skills.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-300"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* QR Code Graphic (SVG generated inline) */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner">
            <svg
              className="h-36 w-36 text-black"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Distinctive scannable QR matrix pattern */}
              <rect x="0" y="0" width="100" height="100" fill="white" />
              {/* Corner 1 */}
              <rect x="10" y="10" width="25" height="25" fill="black" />
              <rect x="14" y="14" width="17" height="17" fill="white" />
              <rect x="18" y="18" width="9" height="9" fill="black" />
              {/* Corner 2 */}
              <rect x="65" y="10" width="25" height="25" fill="black" />
              <rect x="69" y="14" width="17" height="17" fill="white" />
              <rect x="73" y="18" width="9" height="9" fill="black" />
              {/* Corner 3 */}
              <rect x="10" y="65" width="25" height="25" fill="black" />
              <rect x="14" y="69" width="17" height="17" fill="white" />
              <rect x="18" y="73" width="9" height="9" fill="black" />
              {/* Data modules */}
              <rect x="42" y="12" width="6" height="6" fill="black" />
              <rect x="52" y="18" width="6" height="6" fill="black" />
              <rect x="42" y="28" width="6" height="6" fill="black" />
              <rect x="15" y="42" width="6" height="6" fill="black" />
              <rect x="25" y="48" width="6" height="6" fill="black" />
              <rect x="42" y="42" width="16" height="16" fill="black" />
              <rect x="46" y="46" width="8" height="8" fill="white" />
              <rect x="68" y="42" width="6" height="6" fill="black" />
              <rect x="78" y="48" width="6" height="6" fill="black" />
              <rect x="42" y="65" width="6" height="6" fill="black" />
              <rect x="52" y="72" width="6" height="6" fill="black" />
              <rect x="68" y="65" width="6" height="6" fill="black" />
              <rect x="78" y="75" width="12" height="6" fill="black" />
              <rect x="65" y="85" width="6" height="6" fill="black" />
              <rect x="80" y="85" width="8" height="8" fill="black" />
            </svg>
            <span className="text-[10px] font-mono text-neutral-600 mt-2 font-semibold">
              Scan to view @{user.username} on Tsuna
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 rounded-xl bg-neutral-900/80 border border-neutral-800 p-2 text-xs">
            <span className="font-mono text-neutral-400 truncate flex-1 pl-1">
              {handleUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1 rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-black hover:bg-emerald-400 transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
