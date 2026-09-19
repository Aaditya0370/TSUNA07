import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  MessageSquare,
  Users,
  Check,
  Copy,
  Sparkles,
  Loader2,
  FileCode,
  Paperclip,
} from 'lucide-react';
import { ChatConversation, Community } from '../types';
import { api } from '../services/api';

interface ShareViewProps {
  item: {
    type: 'post' | 'code' | 'file' | 'flow' | 'event';
    title: string;
    description?: string;
    codeSnippet?: any;
    attachment?: any;
  } | null;
  conversations: ChatConversation[];
  communities: Community[];
  onShareSuccess?: (targetType: 'chat' | 'community', targetId: string) => void;
  onNavigate: (tab: string, id?: string) => void;
}

export const ShareView: React.FC<ShareViewProps> = ({
  item,
  conversations,
  communities,
  onShareSuccess,
  onNavigate,
}) => {
  const [selectedType, setSelectedType] = useState<'chat' | 'community'>('chat');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    conversations[0]?.id || ''
  );
  const [note, setNote] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedDone, setSharedDone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fallbackTitle = item?.title || 'Shared Creation';
  const shareableUrl = `${window.location.origin}/#${encodeURIComponent(fallbackTitle)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (!selectedTargetId || !item) return;
    setIsSharing(true);
    try {
      await api.shareItem({
        targetType: selectedType,
        targetId: selectedTargetId,
        itemType: item.type,
        itemData: item,
        message: note,
      });

      setSharedDone(true);
      setTimeout(() => {
        setIsSharing(false);
        setSharedDone(false);
        if (onShareSuccess) {
          onShareSuccess(selectedType, selectedTargetId);
        } else {
          if (selectedType === 'chat') {
            onNavigate('chat');
          } else {
            onNavigate('community-detail', selectedTargetId);
          }
        }
      }, 700);
    } catch (err) {
      console.error('Failed to share:', err);
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Workspace</span>
          </button>

          <span className="text-xs font-mono text-neutral-500">
            TSUNA // SHARE_PIPELINE
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-neutral-900 pb-5 text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Share Creation</h1>
                <p className="text-xs text-neutral-400">
                  Relay code, projects, and shaders directly into channels or collective feeds.
                </p>
              </div>
            </div>
          </div>

          {/* Item Preview Card */}
          <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-left">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="uppercase tracking-wider font-mono text-[10px]">
                {item?.type || 'item'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {item?.title || 'Selected Work'}
            </h3>
            {item?.description && (
              <p className="text-xs text-neutral-400 line-clamp-2">
                {item.description}
              </p>
            )}
            {item?.codeSnippet && (
              <div className="mt-2 rounded-lg border border-neutral-800 bg-black p-2.5 font-mono text-[11px] text-emerald-300/80">
                <FileCode className="h-3 w-3 inline mr-1 text-neutral-400" />
                <span>{item.codeSnippet.filename || 'snippet.ts'}</span>
              </div>
            )}
            {item?.attachment && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-neutral-300">
                <Paperclip className="h-3.5 w-3.5 text-neutral-400" />
                <span>{item.attachment.name}</span>
                <span className="text-neutral-500 text-[10px]">({item.attachment.size})</span>
              </div>
            )}
          </div>

          {/* Direct Link Share Box */}
          <div className="mt-5 text-left">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Direct Shareable Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2 text-xs font-mono text-neutral-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Destination Selector */}
          <div className="mt-6 text-left space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Share Destination
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('chat');
                    setSelectedTargetId(conversations[0]?.id || '');
                  }}
                  className={`flex items-center justify-center space-x-2 rounded-xl border py-2.5 text-xs font-medium transition cursor-pointer ${
                    selectedType === 'chat'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat Conversation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('community');
                    setSelectedTargetId(communities[0]?.id || '');
                  }}
                  className={`flex items-center justify-center space-x-2 rounded-xl border py-2.5 text-xs font-medium transition cursor-pointer ${
                    selectedType === 'community'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Community Feed</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Select {selectedType === 'chat' ? 'Channel / Chat' : 'Community'}
              </label>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {selectedType === 'chat'
                  ? conversations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))
                  : communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (#{c.slug})
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Add Commentary / Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Take a look at how this shader uniforms are routed..."
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-5 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={isSharing || !selectedTargetId}
                className="flex items-center space-x-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : sharedDone ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Shared!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Publish Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
