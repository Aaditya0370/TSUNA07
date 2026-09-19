import React from 'react';
import {
  Home,
  Users,
  Compass,
  MessageSquare,
  Calendar,
  Zap,
  User as UserIcon,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
} from 'lucide-react';
import { VoiceRoom, User } from '../types';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  activeVoiceRoom: VoiceRoom | null;
  currentUser: User | null;
  onLeaveVoiceRoom: () => void;
  onToggleMute: () => void;
  unreadChatCount?: number;
  isVoiceMuted?: boolean;
  isVoiceSpeaking?: boolean;
  voiceAudioLevel?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  activeVoiceRoom,
  currentUser,
  onLeaveVoiceRoom,
  onToggleMute,
  unreadChatCount = 0,
  isVoiceMuted = false,
  isVoiceSpeaking = false,
  voiceAudioLevel = 0,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'chat', label: 'Chats', icon: MessageSquare, badge: unreadChatCount > 0 ? unreadChatCount : undefined },
    { id: 'events', label: 'Events & Rooms', icon: Calendar },
    { id: 'flows', label: 'Flows', icon: Zap },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const currentParticipant = activeVoiceRoom?.participants.find(
    (p) => p.user.id === currentUser?.id
  );
  const isMuted = currentParticipant?.isMuted ?? false;

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col justify-between border-r border-neutral-900 bg-black/60 p-4 shrink-0">
        <div className="space-y-6">
          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold shadow-sm border border-neutral-800'
                      : 'text-neutral-400 hover:bg-neutral-950 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Collaborative Loop Philosophy Pill */}
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/80 p-3">
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400"></span>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Tsuna Loop
              </p>
            </div>
            <p className="mt-1 text-xs text-neutral-300 font-medium">
              Connect → Communicate → Share → Build
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Not just scrolling. Co-creating.
            </p>
          </div>
        </div>

        {/* Bottom Section: Active Voice Room Overlay */}
        <div className="space-y-3">
          {activeVoiceRoom ? (
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <p className="text-[11px] font-semibold text-emerald-400 font-mono">Voice Connected</p>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {activeVoiceRoom.participants.length} connected
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-medium text-white">
                {activeVoiceRoom.title}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                {activeVoiceRoom.communityName}
              </p>

              {/* Controls */}
              <div className="mt-3 flex items-center justify-between border-t border-emerald-900/40 pt-2">
                <button
                  onClick={onToggleMute}
                  className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    isVoiceMuted
                      ? 'bg-neutral-900 text-rose-400 hover:bg-neutral-800 border border-rose-900/40'
                      : isVoiceSpeaking
                      ? 'bg-emerald-900/70 text-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60'
                  }`}
                >
                  {isVoiceMuted ? (
                    <MicOff className="h-3.5 w-3.5" />
                  ) : (
                    <Mic className={`h-3.5 w-3.5 ${isVoiceSpeaking ? 'text-emerald-400 animate-pulse' : ''}`} />
                  )}
                  <span>{isVoiceMuted ? 'Muted' : isVoiceSpeaking ? 'Live Speaking' : 'Live Mic'}</span>
                  {!isVoiceMuted && (
                    <div className="flex items-end space-x-0.5 h-2.5 ml-1">
                      <span
                        className="w-0.5 bg-emerald-400 rounded-xs transition-all duration-75"
                        style={{ height: `${Math.max(20, voiceAudioLevel)}%` }}
                      />
                      <span
                        className="w-0.5 bg-emerald-400 rounded-xs transition-all duration-75"
                        style={{ height: `${Math.max(15, voiceAudioLevel * 0.7)}%` }}
                      />
                    </div>
                  )}
                </button>

                <button
                  onClick={onLeaveVoiceRoom}
                  className="rounded-lg bg-neutral-900 p-1.5 text-neutral-400 hover:bg-rose-950 hover:text-rose-400 transition cursor-pointer"
                  title="Disconnect"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>TSUNA PLATFORM</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">
                Crafted with black-first restraint, live code sharing, and persistent multi-user sync.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-900 bg-black/95 backdrop-blur-md md:hidden px-2 py-1">
        {activeVoiceRoom && (
          <div className="mb-1 flex items-center justify-between rounded-lg bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5">
            <div className="flex items-center space-x-2 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-white truncate">{activeVoiceRoom.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleMute}
                className="rounded p-1 text-xs text-emerald-300 bg-emerald-900/50"
              >
                {isVoiceMuted ? <MicOff className="h-3.5 w-3.5 text-rose-400" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={onLeaveVoiceRoom}
                className="rounded p-1 text-xs text-neutral-400 bg-neutral-900 hover:text-rose-400"
              >
                <PhoneOff className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center py-1 text-[10px] font-medium transition ${
                  isActive ? 'text-white' : 'text-neutral-500'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span className="mt-0.5 truncate max-w-full text-[9px]">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-0 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
