import React, { useState, useEffect } from 'react';
import { Sparkles, Users, UserPlus, UserCheck, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface SuggestionItem {
  user: User;
  matchScore: number;
  mutualsCount: number;
  matchedTopics: string[];
  reason: string;
}

interface FollowSuggestionsCardProps {
  currentUser: User | null;
  onNavigate: (tab: string, userHandle?: string) => void;
  onOpenPreferences: () => void;
  onFollowChange?: (userId: string, isNowFollowing: boolean) => void;
}

export const FollowSuggestionsCard: React.FC<FollowSuggestionsCardProps> = ({
  currentUser,
  onNavigate,
  onOpenPreferences,
  onFollowChange,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCreatorSuggestions();
      setSuggestions(data);
      const fMap: Record<string, boolean> = {};
      data.forEach((item) => {
        fMap[item.user.id] = !!item.user.isFollowing;
      });
      setFollowingMap(fMap);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [currentUser?.id, currentUser?.preferences]);

  const handleFollowClick = async (e: React.MouseEvent, targetUser: User) => {
    e.stopPropagation();
    const isCurrentlyFollowing = !!followingMap[targetUser.id];
    const newStatus = !isCurrentlyFollowing;

    setFollowingMap((prev) => ({ ...prev, [targetUser.id]: newStatus }));

    try {
      await api.toggleFollow(targetUser.id);
      if (onFollowChange) {
        onFollowChange(targetUser.id, newStatus);
      }
    } catch (err) {
      setFollowingMap((prev) => ({ ...prev, [targetUser.id]: isCurrentlyFollowing }));
      console.error('Failed to toggle follow status:', err);
    }
  };

  if (!currentUser) return null;

  return (
    <div
      id="follow-suggestions-card"
      className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-200">Suggested Creators</h3>
            <p className="text-[11px] text-stone-400">Based on your 50 preferences & mutuals</p>
          </div>
        </div>

        <button
          id="refresh-suggestions-btn"
          onClick={loadSuggestions}
          disabled={isLoading}
          className="p-1 text-stone-500 hover:text-stone-300 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
          title="Refresh recommendations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && suggestions.length === 0 ? (
        <div className="py-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Computing graph affinity...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-2.5">
          {suggestions.slice(0, 4).map(({ user, matchScore, mutualsCount, matchedTopics, reason }) => {
            const isFollowing = followingMap[user.id] ?? false;
            return (
              <div
                key={user.id}
                id={`suggested-creator-${user.id}`}
                onClick={() => onNavigate('user-landing', user.username)}
                className="group p-2.5 rounded-xl bg-stone-950/50 hover:bg-stone-800/60 border border-stone-800/80 hover:border-stone-700 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        user.avatar ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username || 'creator'}`
                      }
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-stone-700 object-cover bg-stone-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 leading-tight">
                        <span className="text-xs font-semibold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                          {user.name}
                        </span>
                        <span className="text-[11px] text-stone-500 truncate">@{user.username}</span>
                      </div>
                      <span className="text-[11px] text-stone-400 block truncate mt-0.5">
                        {user.roleTitle || 'Builder'}
                      </span>
                    </div>
                  </div>

                  <button
                    id={`suggested-follow-btn-${user.id}`}
                    onClick={(e) => handleFollowClick(e, user)}
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      isFollowing
                        ? 'bg-stone-800 text-stone-300 hover:bg-rose-950/40 hover:text-rose-300 border border-stone-700'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Match Signals */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-900 text-[10px]">
                  <span className="text-stone-400 truncate flex-1">{reason}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {mutualsCount > 0 && (
                      <span className="text-stone-400 flex items-center gap-0.5 font-mono">
                        <Users className="w-2.5 h-2.5" />
                        {mutualsCount}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono font-semibold">
                      {matchScore}% Match
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 text-center rounded-xl bg-stone-950/40 border border-stone-800/80 text-xs text-stone-400">
          <p>No new creators found.</p>
          <button
            onClick={onOpenPreferences}
            className="mt-2 text-purple-400 hover:underline inline-flex items-center gap-1 text-[11px]"
          >
            <Sparkles className="w-3 h-3" /> Tune 50 preferences
          </button>
        </div>
      )}
    </div>
  );
};
