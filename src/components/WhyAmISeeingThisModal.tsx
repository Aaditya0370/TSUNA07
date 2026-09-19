import React from 'react';
import { X, Sparkles, Sliders, Users, ThumbsUp, ThumbsDown, CheckCircle, Tag } from 'lucide-react';
import { Post } from '../types';

interface WhyAmISeeingThisModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onOpenFeedPreferences: () => void;
  onFeedback: (tag: string, action: 'boost' | 'reduce') => void;
}

export const WhyAmISeeingThisModal: React.FC<WhyAmISeeingThisModalProps> = ({
  isOpen,
  onClose,
  post,
  onOpenFeedPreferences,
  onFeedback,
}) => {
  if (!isOpen || !post) return null;

  const score = post.aiMatchScore ?? 75;
  const matched = post.matchedPreferences || [];
  const mutuals = post.authorMutualsCount || 0;

  return (
    <div
      id="why-seeing-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="why-seeing-modal-content"
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4 text-stone-200"
      >
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100">Why You're Seeing This Post</h3>
              <p className="text-[11px] text-stone-400">Instagram/Facebook-style multi-signal AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Match Percentage Badge */}
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-300 font-medium block">AI Match Score</span>
            <span className="text-xs text-stone-400 mt-0.5 block">{post.aiReason || 'Curated for your profile'}</span>
          </div>
          <div className="text-xl font-mono font-bold text-indigo-400">{score}%</div>
        </div>

        {/* Signals List */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
            Signals that influenced this rank
          </span>

          {/* Matched preferences */}
          {matched.length > 0 && (
            <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-start gap-2.5 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-200 block">50 Preferences Match</span>
                <span className="text-stone-400">
                  Matches your selected interests: <strong className="text-indigo-300">{matched.join(', ')}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Mutuals / Social Graph */}
          {mutuals > 0 && (
            <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-start gap-2.5 text-xs">
              <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-200 block">Mutual Connections</span>
                <span className="text-stone-400">
                  You share <strong className="text-purple-300">{mutuals} connections</strong> with @{post.author?.username}
                </span>
              </div>
            </div>
          )}

          {/* Content Format */}
          {post.codeSnippet && (
            <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-start gap-2.5 text-xs">
              <Sliders className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-200 block">Format Affinity</span>
                <span className="text-stone-400">
                  Boosted by your high affinity preference for code walkthroughs & technical snippets.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Controls: Show more or less like this */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <span className="text-xs font-semibold text-stone-400 block">Tune similar posts:</span>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-xs"
                >
                  <Tag className="w-3 h-3 text-stone-500" />
                  <span className="text-stone-300 font-mono">#{tag}</span>
                  <button
                    onClick={() => onFeedback(tag, 'boost')}
                    title="Show more like this"
                    className="p-1 hover:text-emerald-400 hover:bg-stone-800 rounded"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onFeedback(tag, 'reduce')}
                    title="Show less like this"
                    className="p-1 hover:text-rose-400 hover:bg-stone-800 rounded"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenFeedPreferences();
            }}
            className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" /> Edit all 50 preferences
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
