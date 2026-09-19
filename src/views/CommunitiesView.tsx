import React, { useState } from 'react';
import { Community } from '../types';
import { Users, Plus, Shield, ArrowRight, Check } from 'lucide-react';
import { api } from '../services/api';

interface CommunitiesViewProps {
  communities: Community[];
  onSelectCommunity: (id: string) => void;
  onOpenCreateCommunity: () => void;
  onRefreshCommunities: () => void;
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  communities,
  onSelectCommunity,
  onOpenCreateCommunity,
  onRefreshCommunities,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Engineering',
    'Audio & Sound',
    'Design & 3D',
    'Creative Tech',
    'Open Source',
  ];

  const filtered = communities.filter((c) => {
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleToggleJoin = async (e: React.MouseEvent, comm: Community) => {
    e.stopPropagation();
    try {
      if (comm.isJoined) {
        await api.leaveCommunity(comm.id);
      } else {
        await api.joinCommunity(comm.id);
      }
      onRefreshCommunities();
    } catch (err) {
      console.error('Failed to toggle community membership:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-white" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Tsuna Communities
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Dedicated spaces where creators gather, talk in voice rooms, exchange code, and build products together.
          </p>
        </div>

        <button
          onClick={onOpenCreateCommunity}
          className="flex items-center space-x-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition active:scale-95 self-start sm:self-auto shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Found a Community</span>
        </button>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white border border-neutral-800'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter communities..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
          />
        </div>
      </div>

      {/* Community Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((comm) => (
          <div
            key={comm.id}
            onClick={() => onSelectCommunity(comm.id)}
            className="group cursor-pointer rounded-2xl border border-neutral-900 bg-neutral-950/80 overflow-hidden transition-all hover:border-neutral-700 flex flex-col justify-between"
          >
            <div>
              {/* Banner */}
              <div className="relative h-28 w-full overflow-hidden bg-neutral-900">
                <img
                  src={comm.banner}
                  alt={comm.name}
                  className="h-full w-full object-cover opacity-70 group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                <span className="absolute top-3 right-3 rounded bg-black/80 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                  {comm.category}
                </span>
              </div>

              {/* Avatar + Title */}
              <div className="px-5 pt-0 relative -mt-6">
                <div className="flex items-end justify-between mb-3">
                  <img
                    src={comm.avatar}
                    alt={comm.name}
                    className="h-14 w-14 rounded-xl border-2 border-neutral-950 object-cover bg-neutral-900 shadow-md"
                  />

                  <button
                    onClick={(e) => handleToggleJoin(e, comm)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      comm.isJoined
                        ? 'border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                        : 'bg-white text-black hover:bg-neutral-200'
                    }`}
                  >
                    {comm.isJoined ? 'Joined' : 'Join'}
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white group-hover:text-neutral-200">
                    {comm.name}
                  </h3>
                  {comm.currentUserRole && (
                    <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 text-[9px] font-mono text-neutral-300">
                      {comm.currentUserRole}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-300 font-medium mt-1 leading-snug">
                  {comm.tagline}
                </p>

                <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                  {comm.description}
                </p>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {comm.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-black border border-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="mt-5 border-t border-neutral-900/80 px-5 py-3 flex items-center justify-between text-[11px] font-mono text-neutral-400 bg-black/30">
              <div className="flex items-center space-x-3">
                <span>{comm.membersCount} members</span>
                <span>•</span>
                <span className="text-emerald-400">{comm.activeBuildingCount} building</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white transition" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
