import React from 'react';
import { Radio, Users, Sparkles, Flame, Mic } from 'lucide-react';
import { ActiveStats } from '../types';

interface ActiveNowBannerProps {
  stats: ActiveStats | null;
  onJoinVoiceRoomPrompt: () => void;
  onExploreEventsPrompt: () => void;
}

export const ActiveNowBanner: React.FC<ActiveNowBannerProps> = ({
  stats,
  onJoinVoiceRoomPrompt,
  onExploreEventsPrompt,
}) => {
  return (
    <div className="mb-8 rounded-xl border border-neutral-900 bg-neutral-950/70 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left header */}
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-black text-white">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                ACTIVE NOW ACROSS TSUNA
              </h2>
              <span className="rounded bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 text-[10px] font-mono text-emerald-400">
                LIVE
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">
              Real-time collaboration opportunities & open rooms
            </p>
          </div>
        </div>

        {/* Right metrics & quick actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center space-x-2 rounded-lg border border-neutral-800/90 bg-black/60 px-3 py-1.5 text-xs text-neutral-300">
            <Users className="h-3.5 w-3.5 text-neutral-400" />
            <span>
              <strong className="text-white font-medium">{stats?.onlineCreators ?? 1}</strong> creators online
            </span>
          </div>

          <button
            onClick={onJoinVoiceRoomPrompt}
            className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800 hover:text-white cursor-pointer"
          >
            <Mic className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {stats?.liveVoiceRooms ? `${stats.liveVoiceRooms} Voice Rooms Live` : 'Voice Rooms Ready'}
            </span>
          </button>

          <button
            onClick={onExploreEventsPrompt}
            className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800 hover:text-white cursor-pointer"
          >
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {(stats?.upcomingEvents || 0) > 0
                ? `${stats?.upcomingEvents} Active Session${stats?.upcomingEvents === 1 ? '' : 's'}`
                : 'Browse Sessions'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
