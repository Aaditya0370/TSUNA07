import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  User as UserIcon,
  ChevronDown,
  Moon,
  Sun,
  Contrast,
  LogIn,
  ShieldCheck,
  Settings,
  LogOut,
  Bell,
  CheckCheck,
  Heart,
  MessageSquare,
  Calendar,
  Zap,
} from 'lucide-react';
import { User, TsunaNotification } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onOpenCreatePost: () => void;
  onOpenSearch: () => void;
  theme: 'dark' | 'high-contrast' | 'light';
  onToggleTheme: (theme: 'dark' | 'high-contrast' | 'light') => void;
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuthModal: () => void;
  onSignOut?: () => void;
  notifications?: TsunaNotification[];
  unreadNotificationCount?: number;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onSimulateNotification?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenCreatePost,
  onOpenSearch,
  theme,
  onToggleTheme,
  onNavigate,
  onOpenAuthModal,
  onSignOut,
  notifications = [],
  unreadNotificationCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSimulateNotification,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isRegistered = !!currentUser && !currentUser.isDemo;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'reaction':
        return <Heart className="h-3.5 w-3.5 text-rose-400" />;
      case 'comment':
      case 'reply':
        return <MessageSquare className="h-3.5 w-3.5 text-blue-400" />;
      case 'event':
        return <Calendar className="h-3.5 w-3.5 text-amber-400" />;
      case 'collab':
      case 'mention':
        return <Zap className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-neutral-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-900 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2.5 transition hover:opacity-80 text-left"
            id="navbar-brand-logo"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block leading-none">
                TSUNA
              </span>
              <p className="hidden text-[10px] text-neutral-400 lg:block mt-0.5 font-mono">
                Platform
              </p>
            </div>
          </button>
        </div>

        {/* Center: Search Trigger (Option to Search) */}
        <div className="flex flex-1 max-w-md mx-4 sm:mx-8">
          <button
            onClick={onOpenSearch}
            id="navbar-search-btn"
            className="flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200"
          >
            <div className="flex items-center space-x-2">
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <span>Search posts, projects, code, communities...</span>
            </div>
            <kbd className="hidden rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Share Work as a Post & Profile / Auth */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Share Work button */}
          <button
            onClick={onOpenCreatePost}
            id="navbar-share-work-btn"
            className="flex items-center space-x-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-neutral-200 active:scale-95 shadow-sm"
            title="Share Work as a Post"
          >
            <Plus className="h-3.5 w-3.5 text-black" />
            <span className="font-medium">Share Work</span>
          </button>

          {/* Notification Center Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowThemeMenu(false);
                setShowUserMenu(false);
              }}
              id="navbar-notifications-btn"
              className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-400 transition hover:border-neutral-700 hover:text-white"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 && (
                <span
                  id="navbar-notification-badge"
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black font-mono shadow-sm animate-in fade-in zoom-in duration-200"
                >
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                id="navbar-notifications-dropdown"
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Notifications
                    </span>
                    {unreadNotificationCount > 0 ? (
                      <span className="rounded-full bg-neutral-900 border border-neutral-800 px-2 py-0.2 text-[10px] font-mono text-neutral-200 font-semibold">
                        {unreadNotificationCount} unread
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-950 border border-neutral-900 px-2 py-0.2 text-[10px] font-mono text-neutral-500">
                        All read
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {unreadNotificationCount > 0 && onMarkAllNotificationsRead && (
                      <button
                        onClick={() => {
                          onMarkAllNotificationsRead();
                        }}
                        id="navbar-notifications-mark-all-read"
                        className="flex items-center space-x-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[10px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-850 transition"
                        title="Mark all as read"
                      >
                        <CheckCheck className="h-3 w-3 text-neutral-400" />
                        <span>Mark read</span>
                      </button>
                    )}

                    {onSimulateNotification && (
                      <button
                        onClick={() => {
                          onSimulateNotification();
                        }}
                        id="navbar-notifications-simulate-btn"
                        className="flex items-center space-x-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[10px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-850 transition"
                        title="Simulate incoming collaborative event"
                      >
                        <Sparkles className="h-3 w-3 text-emerald-400" />
                        <span>+ Alert</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="h-6 w-6 text-neutral-600 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-neutral-400 font-medium">You're all caught up</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                        No activity alerts at this time.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => {
                          if (!notif.isRead && onMarkNotificationRead) {
                            onMarkNotificationRead(notif.id);
                          }
                          if (notif.linkTab) {
                            onNavigate(notif.linkTab);
                            setShowNotifications(false);
                          }
                        }}
                        className={`group flex w-full items-start space-x-2.5 rounded-xl p-2.5 text-left transition ${
                          notif.isRead
                            ? 'bg-transparent text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-300'
                            : 'bg-neutral-900/80 border border-neutral-800/80 text-white hover:bg-neutral-900'
                        }`}
                      >
                        {/* Actor avatar or icon */}
                        <div className="relative shrink-0 mt-0.5">
                          {notif.actor?.avatar ? (
                            <img
                              src={notif.actor.avatar}
                              alt={notif.actor.name}
                              className="h-7 w-7 rounded-lg object-cover border border-neutral-800"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
                              {getNotifIcon(notif.type)}
                            </div>
                          )}
                          {!notif.isRead && (
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-white shadow-sm ring-2 ring-black" />
                          )}
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold truncate text-neutral-200 group-hover:text-white">
                              {notif.title}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400 shrink-0 ml-1">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug line-clamp-2 group-hover:text-neutral-300">
                            {notif.description}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer hint */}
                <div className="mt-2 pt-2 border-t border-neutral-900/80 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Dynamic live sync</span>
                  <span className="text-neutral-400">Symbols clear when read</span>
                </div>
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              id="navbar-theme-toggle-btn"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-400 transition hover:border-neutral-700 hover:text-white"
              title="Interface theme"
            >
              {theme === 'dark' ? (
                <Moon className="h-3.5 w-3.5" />
              ) : theme === 'high-contrast' ? (
                <Contrast className="h-3.5 w-3.5" />
              ) : (
                <Sun className="h-3.5 w-3.5" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl z-50">
                <button
                  onClick={() => {
                    onToggleTheme('dark');
                    setShowThemeMenu(false);
                  }}
                  className={`flex w-full items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs ${
                    theme === 'dark' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark (Default)</span>
                </button>
                <button
                  onClick={() => {
                    onToggleTheme('high-contrast');
                    setShowThemeMenu(false);
                  }}
                  className={`flex w-full items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs ${
                    theme === 'high-contrast' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Contrast className="h-3.5 w-3.5" />
                  <span>High Contrast</span>
                </button>
                <button
                  onClick={() => {
                    onToggleTheme('light');
                    setShowThemeMenu(false);
                  }}
                  className={`flex w-full items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs ${
                    theme === 'light' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Clean Light</span>
                </button>
              </div>
            )}
          </div>

          {/* User Account / Profile */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                id="navbar-profile-menu-btn"
                className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-950 pl-1.5 pr-2.5 py-1 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-white"
              >
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                      currentUser.username || 'user'
                    )}`
                  }
                  alt={currentUser.name}
                  className="h-6 w-6 rounded-lg object-cover border border-neutral-800"
                />
                <span className="hidden md:inline max-w-[100px] truncate font-medium">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl z-50">
                  <div className="border-b border-neutral-800 px-3 py-2">
                    <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate font-mono">@{currentUser.username}</p>
                    {isRegistered ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1 mt-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Registered Profile</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-mono block mt-1">
                        Guest Session
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('user-landing', currentUser.username);
                      }}
                      id="navbar-my-landing-btn"
                      className="w-full flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs text-emerald-400 hover:bg-neutral-900 transition font-medium"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>My Landing (@{currentUser.username})</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      id="navbar-view-profile-btn"
                      className="w-full flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
                      <span>View & Edit Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAuthModal();
                      }}
                      id="navbar-account-settings-btn"
                      className="w-full flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition"
                    >
                      <Settings className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Account & Sync</span>
                    </button>
                  </div>

                  {onSignOut && (
                    <div className="mt-2 border-t border-neutral-800 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSignOut();
                        }}
                        id="navbar-logout-btn"
                        className="w-full flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-neutral-900 hover:text-red-300 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              id="navbar-login-btn"
              className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5 text-emerald-400" />
              <span>Register / Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
