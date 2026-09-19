import React, { useState, useEffect } from 'react';
import { Community, Post, TsunaEvent, User } from '../types';
import { Search, Users, Code2, Calendar, FileText, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface DiscoverViewProps {
  onSelectCommunity: (id: string) => void;
  onSelectPost: (post: Post) => void;
  onNavigate: (tab: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectCommunity,
  onSelectPost,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [results, setResults] = useState<{
    communities: Community[];
    posts: Post[];
    events: TsunaEvent[];
    creators: User[];
  }>({
    communities: [],
    posts: [],
    events: [],
    creators: [],
  });

  useEffect(() => {
    runSearch();
  }, [query, filterType]);

  const runSearch = async () => {
    try {
      const res = await api.searchAll(query, filterType);
      setResults(res);
    } catch (err) {
      console.error('Failed to search:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header & Big Search Bar */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
          <Search className="h-4 w-4 text-white" />
          <span>Universal Discovery Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Discover creators, shader kernels, communities & live jams
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Search across all verified code snippets, audio patches, engineering guilds, and upcoming sprint events.
        </p>

        {/* Input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search e.g. 'WebGPU', 'Shader', 'Audio', 'Rust'..."
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-3.5 pl-12 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 shadow-xl"
          />
          <Search className="absolute left-4 top-4 h-5 w-5 text-neutral-500" />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'communities', label: 'Communities' },
            { id: 'code', label: 'Code Snippets' },
            { id: 'creators', label: 'Creators' },
            { id: 'events', label: 'Sessions & Jams' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filterType === tab.id
                  ? 'bg-white text-black font-semibold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results grid */}
      <div className="space-y-8">
        {/* Communities Section */}
        {(filterType === 'all' || filterType === 'communities') && results.communities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Communities ({results.communities.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.communities.map((comm) => (
                <div
                  key={comm.id}
                  onClick={() => onSelectCommunity(comm.id)}
                  className="cursor-pointer rounded-xl border border-neutral-900 bg-neutral-950/80 p-4 transition hover:border-neutral-700 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <img
                      src={comm.avatar}
                      alt={comm.name}
                      className="h-10 w-10 rounded-xl object-cover border border-neutral-800 shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{comm.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{comm.tagline}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-500 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code & Posts Section */}
        {(filterType === 'all' || filterType === 'code') && results.posts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Posts & Code Snippets ({results.posts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{post.title}</span>
                    <span className="rounded bg-neutral-900 px-1.5 py-0.2 text-[10px] font-mono text-neutral-400">
                      {post.postType}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2">{post.content}</p>
                  {post.codeSnippet && (
                    <div className="rounded-lg border border-neutral-900 bg-black p-2.5 font-mono text-[11px] text-neutral-300 overflow-x-auto">
                      <code>{post.codeSnippet.code.slice(0, 140)}...</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creators Section */}
        {(filterType === 'all' || filterType === 'creators') && results.creators.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Active Creators & Builders ({results.creators.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {results.creators.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 text-center space-y-2"
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="mx-auto h-14 w-14 rounded-full border-2 border-neutral-800 object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{c.name}</p>
                    <p className="text-[10px] text-neutral-400">@{c.username}</p>
                    <p className="text-[11px] text-neutral-300 mt-1">{c.roleTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Section */}
        {(filterType === 'all' || filterType === 'events') && results.events.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Sessions & Challenges ({results.events.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">
                      {ev.type} • {ev.startTime}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{ev.title}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">{ev.description}</p>
                  </div>
                  <button
                    onClick={() => onNavigate('events')}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
