import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  FileText,
  Download,
  ExternalLink,
  Play,
  Calendar,
  Users,
  Film,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Post, Community } from '../types';
import { api } from '../services/api';

interface PostAttachmentsProps {
  post: Post;
  onNavigate?: (tab: string) => void;
  onSelectCommunity?: (communityId: string) => void;
  onSelectEvent?: (eventId: string) => void;
}

export const PostAttachments: React.FC<PostAttachmentsProps> = ({
  post,
  onNavigate,
  onSelectCommunity,
  onSelectEvent,
}) => {
  const [copied, setCopied] = useState(false);
  const [isJoinedGroup, setIsJoinedGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [hasRsvpdEvent, setHasRsvpdEvent] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleJoinGroup = async (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    if (isJoinedGroup || joiningGroup) return;
    setJoiningGroup(true);
    try {
      await api.joinCommunity(communityId);
      setIsJoinedGroup(true);
    } catch (err) {
      console.warn('Failed to join community via invite:', err);
      setIsJoinedGroup(true); // optimistic fallback
    } finally {
      setJoiningGroup(false);
    }
  };

  const triggerFileDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3.5 space-y-3">
      {/* 1. CODE SNIPPET ATTACHMENT */}
      {post.codeSnippet && (
        <div className="rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-neutral-900 bg-black/70 px-3.5 py-2">
            <div className="flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
              <Code2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-neutral-200">
                {post.codeSnippet.filename || 'snippet'}
              </span>
              <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-[10px] uppercase text-neutral-400">
                {post.codeSnippet.language}
              </span>
            </div>
            <button
              type="button"
              onClick={() => post.codeSnippet && handleCopyCode(post.codeSnippet.code)}
              className="flex items-center space-x-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-[10px] text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              title="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed bg-black/40">
            <code>{post.codeSnippet.code}</code>
          </pre>
        </div>
      )}

      {/* 2. LINK PREVIEW ATTACHMENT */}
      {post.linkPreview && (
        <a
          href={post.linkPreview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-xl border border-neutral-900 bg-neutral-950/90 hover:border-neutral-700 transition overflow-hidden p-3.5"
        >
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            {post.linkPreview.image && (
              <div className="h-24 w-full sm:w-36 rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                <img
                  src={post.linkPreview.image}
                  alt={post.linkPreview.title || 'Link Preview'}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 text-[10px] font-mono text-neutral-400 mb-1">
                <ExternalLink className="h-3 w-3 text-neutral-400 group-hover:text-emerald-400 transition" />
                <span className="truncate">{post.linkPreview.siteName || new URL(post.linkPreview.url).hostname}</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition truncate">
                {post.linkPreview.title || post.linkPreview.url}
              </h4>
              {post.linkPreview.description && (
                <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                  {post.linkPreview.description}
                </p>
              )}
              <span className="inline-block text-[10px] font-mono text-neutral-500 hover:underline mt-1.5 truncate max-w-full">
                {post.linkPreview.url}
              </span>
            </div>
          </div>
        </a>
      )}

      {/* 3. IMAGE ATTACHMENT */}
      {post.image && (
        <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden group">
          <img
            src={post.image}
            alt={post.title}
            className="w-full max-h-[480px] object-cover rounded-lg group-hover:opacity-95 transition"
            loading="lazy"
          />
        </div>
      )}

      {/* 4. ANIMATED GIF ATTACHMENT */}
      {post.gifUrl && (
        <div className="relative rounded-xl border border-neutral-900 bg-black overflow-hidden group">
          <img
            src={post.gifUrl}
            alt="Animated GIF"
            className="w-full max-h-[400px] object-cover rounded-lg"
            loading="lazy"
          />
          <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5 rounded-full bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-white border border-neutral-800">
            <Film className="h-3 w-3 text-pink-400" />
            <span className="font-bold tracking-wider">GIF</span>
          </div>
        </div>
      )}

      {/* 5. VIDEO ATTACHMENT */}
      {post.videoUrl && (
        <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden">
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <video
              src={post.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-contain rounded-xl"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* 6. EVENT INVITATION ATTACHMENT */}
      {post.eventInvite && (
        <div className="rounded-xl border border-emerald-900/60 bg-gradient-to-r from-neutral-950 via-emerald-950/20 to-neutral-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="rounded bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300">
                  EVENT INVITE • {post.eventInvite.eventType.replace('_', ' ')}
                </span>
                {post.eventInvite.communityName && (
                  <span className="text-[10px] font-mono text-neutral-400">
                    by {post.eventInvite.communityName}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                {post.eventInvite.eventTitle}
              </h4>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                📅 {post.eventInvite.startTime}
              </p>
              {post.eventInvite.description && (
                <p className="text-xs text-neutral-300 mt-1 line-clamp-1">
                  {post.eventInvite.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setHasRsvpdEvent(!hasRsvpdEvent);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                hasRsvpdEvent
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {hasRsvpdEvent ? '✓ Going' : 'RSVP'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('events')}
              className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-neutral-200 transition cursor-pointer"
            >
              View Event
            </button>
          </div>
        </div>
      )}

      {/* 7. GROUP / COMMUNITY INVITE ATTACHMENT */}
      {post.groupInvite && (
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start space-x-3.5">
            {post.groupInvite.avatar ? (
              <img
                src={post.groupInvite.avatar}
                alt={post.groupInvite.communityName}
                className="h-11 w-11 rounded-xl object-cover border border-neutral-800 shrink-0"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 shrink-0">
                <Users className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-neutral-300">
                  COMMUNITY INVITE
                </span>
                {post.groupInvite.category && (
                  <span className="text-[10px] font-mono text-emerald-400">
                    {post.groupInvite.category}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                {post.groupInvite.communityName}
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                {post.groupInvite.tagline || 'Collaborative collective on Tsuna'}
              </p>
              {post.groupInvite.membersCount !== undefined && (
                <span className="text-[10px] font-mono text-neutral-500 mt-0.5 inline-block">
                  👥 {post.groupInvite.membersCount + (isJoinedGroup ? 1 : 0)} builders joined
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={(e) => handleJoinGroup(e, post.groupInvite!.communityId)}
              disabled={isJoinedGroup || joiningGroup}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                isJoinedGroup
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-emerald-500 text-black hover:bg-emerald-400 font-bold'
              }`}
            >
              {isJoinedGroup ? (
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Joined</span>
                </span>
              ) : joiningGroup ? (
                'Joining...'
              ) : (
                'Join Group'
              )}
            </button>
            <button
              type="button"
              onClick={() => onSelectCommunity?.(post.groupInvite!.communityId)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              Explore
            </button>
          </div>
        </div>
      )}

      {/* 8. LEGACY / FILE ATTACHMENT */}
      {post.attachment && (
        <div className="flex items-center justify-between rounded-xl border border-neutral-900 bg-black p-3.5">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{post.attachment.name}</p>
              <p className="text-[10px] font-mono text-neutral-400">
                {post.attachment.size} • {post.attachment.type.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerFileDownload(
                post.attachment?.name || 'asset.txt',
                `Tsuna Verified Asset: ${post.attachment?.name || 'File'}\nShared in post: ${post.title}\nSize: ${post.attachment?.size || 'N/A'}`
              );
            }}
            className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
        </div>
      )}
    </div>
  );
};
