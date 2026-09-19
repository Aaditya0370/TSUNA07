import React, { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus, UserCheck, Users, ExternalLink, Sparkles } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface ProfileSearchResult {
  user: User;
  mutualsCount: number;
  isFollowing: boolean;
  matchHighlights: string[];
}

interface ProfileSearchSectionProps {
  currentUser: User | null;
  onNavigate: (tab: string, userHandle?: string) => void;
  onFollowToggle?: (userId: string, isNowFollowing: boolean) => void;
}

export const ProfileSearchSection: React.FC<ProfileSearchSectionProps> = ({
  currentUser,
  onNavigate,
  onFollowToggle,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await api.searchProfiles(query.trim());
        setResults(data);
        // Initialize local following state
        const stateMap: Record<string, boolean> = {};
        data.forEach((r) => {
          stateMap[r.user.id] = r.isFollowing;
        });
        setFollowingStates((prev) => ({ ...prev, ...stateMap }));
      } catch (err) {
        console.error('Error searching profiles:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleFollowClick = async (e: React.MouseEvent, targetUser: User) => {
    e.stopPropagation();
    const currentlyFollowing = !!followingStates[targetUser.id];
    const newStatus = !currentlyFollowing;

    // Optimistic update
    setFollowingStates((prev) => ({ ...prev, [targetUser.id]: newStatus }));

    try {
      await api.toggleFollow(targetUser.id);
      if (onFollowToggle) {
        onFollowToggle(targetUser.id, newStatus);
      }
    } catch (err) {
      // Revert on error
      setFollowingStates((prev) => ({ ...prev, [targetUser.id]: currentlyFollowing }));
      console.error('Failed to toggle follow status:', err);
    }
  };

  return (
    <div
      id="profile-search-section"
      className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Search className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-stone-200">Search Profiles</h3>
        </div>
        {query && (
          <span className="text-[11px] text-stone-400 font-mono">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
        <input
          id="profile-search-input"
          type="text"
          placeholder="Search by name, @handle, role, or skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-stone-950/80 border border-stone-800 rounded-xl pl-8 pr-7 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-2 text-stone-500 hover:text-stone-300"
            aria-label="Clear profile search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-4 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Searching creators...</span>
        </div>
      )}

      {/* Results List */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
          {results.map(({ user, mutualsCount, matchHighlights }) => {
            const isFollowing = followingStates[user.id] ?? false;
            return (
              <div
                key={user.id}
                id={`search-result-user-${user.id}`}
                onClick={() => onNavigate('user-landing', user.username)}
                className="group p-2.5 rounded-xl bg-stone-950/50 hover:bg-stone-800/60 border border-stone-800/80 hover:border-stone-700 transition-all cursor-pointer flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={
                        user.avatar ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username || 'creator'}`
                      }
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-stone-700 object-cover bg-stone-800"
                    />
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-stone-950" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="text-xs font-semibold text-stone-200 truncate group-hover:text-indigo-300 transition-colors">
                        {user.name}
                      </span>
                      <span className="text-[11px] text-stone-500 truncate">@{user.username}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400 truncate">
                      <span className="truncate">{user.roleTitle || 'Builder'}</span>
                      {mutualsCount > 0 && (
                        <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-indigo-400 font-mono">
                          <Users className="w-2.5 h-2.5" />
                          {mutualsCount} mutual{mutualsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  id={`search-follow-btn-${user.id}`}
                  onClick={(e) => handleFollowClick(e, user)}
                  className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                    isFollowing
                      ? 'bg-stone-800 text-stone-300 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900 border border-stone-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
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
            );
          })}
        </div>
      )}

      {/* No results state */}
      {!isLoading && query && results.length === 0 && (
        <div className="py-4 text-center text-xs text-stone-500">
          No profiles found matching "{query}"
        </div>
      )}

      {/* Idle placeholder hint */}
      {!query && (
        <p className="text-[11px] text-stone-500 leading-normal">
          Find developers, shader artists, and sound engineers by @handle or skill.
        </p>
      )}
    </div>
  );
};
