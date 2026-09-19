import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Community,
  Post,
  VoiceRoom,
  TsunaEvent,
  ChatConversation,
  TsunaNotification,
} from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingHero } from './components/LandingHero';
import { auth, getUserFromFirestore, saveUserToFirestore } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Views
import { HomeView } from './views/HomeView';
import { CommunitiesView } from './views/CommunitiesView';
import { CommunityDetailView } from './views/CommunityDetailView';
import { ChatsView } from './views/ChatsView';
import { EventsView } from './views/EventsView';
import { FlowsView } from './views/FlowsView';
import { DiscoverView } from './views/DiscoverView';
import { ProfileView } from './views/ProfileView';
import { AuthView } from './views/AuthView';
import { CreatePostView } from './views/CreatePostView';
import { CreateCommunityView } from './views/CreateCommunityView';
import { CreateEventView } from './views/CreateEventView';
import { VideoMeetingView } from './views/VideoMeetingView';
import { ShareView } from './views/ShareView';
import { CreatorLandingView } from './views/CreatorLandingView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [showLandingHero, setShowLandingHero] = useState(false);

  // Core platform states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>([]);
  const [events, setEvents] = useState<TsunaEvent[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [notifications, setNotifications] = useState<TsunaNotification[]>([]);

  // Active Voice Room & Video Meeting
  const [activeVoiceRoomId, setActiveVoiceRoomId] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [voiceAudioLevel, setVoiceAudioLevel] = useState(0);

  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceAudioCtxRef = useRef<AudioContext | null>(null);
  const voiceAnalyserRef = useRef<AnalyserNode | null>(null);
  const voiceAnimRef = useRef<number | null>(null);
  const voiceSpeechTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time live audio for active voice rooms
  useEffect(() => {
    let active = true;

    if (activeVoiceRoomId) {
      setIsVoiceMuted(false);
      const getAudioStream = async () => {
        try {
          return await navigator.mediaDevices?.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch {
          return await navigator.mediaDevices?.getUserMedia({ audio: true });
        }
      };

      getAudioStream()
        .then(async (stream) => {
          if (!stream) return;
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          voiceStreamRef.current = stream;

          const AudioCtxClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtxClass();
          if (ctx.state === 'suspended') {
            await ctx.resume().catch(() => {});
          }
          voiceAudioCtxRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.7;
          voiceAnalyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const tick = () => {
            if (!active || !voiceAnalyserRef.current) return;
            const bufferLength = voiceAnalyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            voiceAnalyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            const level = Math.min(100, Math.round((avg / 255) * 160));
            setVoiceAudioLevel(level);

            if (level > 12) {
              setIsVoiceSpeaking(true);
              if (voiceSpeechTimerRef.current) clearTimeout(voiceSpeechTimerRef.current);
              voiceSpeechTimerRef.current = setTimeout(() => {
                if (active) setIsVoiceSpeaking(false);
              }, 350);
            }

            voiceAnimRef.current = requestAnimationFrame(tick);
          };

          voiceAnimRef.current = requestAnimationFrame(tick);
        })
        .catch((err) => {
          console.warn('Voice room mic capture error:', err);
        });
    } else {
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        voiceStreamRef.current = null;
      }
      if (voiceAudioCtxRef.current && voiceAudioCtxRef.current.state !== 'closed') {
        try {
          voiceAudioCtxRef.current.close();
        } catch {}
      }
      if (voiceAnimRef.current) {
        cancelAnimationFrame(voiceAnimRef.current);
      }
      if (voiceSpeechTimerRef.current) {
        clearTimeout(voiceSpeechTimerRef.current);
      }
      setIsVoiceSpeaking(false);
      setVoiceAudioLevel(0);
    }

    return () => {
      active = false;
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      }
      if (voiceAudioCtxRef.current && voiceAudioCtxRef.current.state !== 'closed') {
        try {
          voiceAudioCtxRef.current.close();
        } catch {}
      }
      if (voiceAnimRef.current) {
        cancelAnimationFrame(voiceAnimRef.current);
      }
      if (voiceSpeechTimerRef.current) {
        clearTimeout(voiceSpeechTimerRef.current);
      }
    };
  }, [activeVoiceRoomId]);

  const handleToggleVoiceMute = () => {
    setIsVoiceMuted((prev) => {
      const next = !prev;
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getAudioTracks().forEach((track: MediaStreamTrack) => {
          track.enabled = !next;
        });
      }
      if (next) {
        setIsVoiceSpeaking(false);
        setVoiceAudioLevel(0);
      }
      return next;
    });
  };

  // Navigation & session parameters
  const [shareModalItem, setShareModalItem] = useState<any>(null);
  const [createPostCommunityId, setCreatePostCommunityId] = useState<string | undefined>(undefined);
  const [selectedUserHandle, setSelectedUserHandle] = useState<string | null>(null);

  // Multi-page routing helper
  const getTabFromPath = (pathname: string): { tab: string; communityId?: string; targetHandle?: string } => {
    const clean = pathname.replace(/^\/+|\/+$/g, '');
    if (!clean || clean === 'home') return { tab: 'home' };
    if (clean === 'communities') return { tab: 'communities' };
    if (clean.startsWith('community/') || clean.startsWith('c/')) {
      const parts = clean.split('/');
      return { tab: 'community-detail', communityId: parts[1] };
    }
    if (clean === 'chat' || clean === 'messages') return { tab: 'chat' };
    if (clean.startsWith('chat/')) {
      return { tab: 'chat' };
    }
    if (clean === 'events' || clean === 'voice') return { tab: 'events' };
    if (clean.startsWith('event/') || clean.startsWith('events/')) {
      return { tab: 'events' };
    }
    if (clean === 'flows') return { tab: 'flows' };
    if (clean.startsWith('flow/')) {
      return { tab: 'flows' };
    }
    if (clean === 'discover' || clean === 'search') return { tab: 'discover' };
    if (clean === 'profile') return { tab: 'profile' };
    if (clean === 'auth' || clean === 'login' || clean === 'signin') return { tab: 'auth' };
    if (clean === 'create-post' || clean === 'new-post' || clean === 'share-work') return { tab: 'create-post' };
    if (clean === 'create-community' || clean === 'new-community') return { tab: 'create-community' };
    if (clean === 'create-event' || clean === 'host-event') return { tab: 'create-event' };
    if (clean === 'meeting' || clean === 'room' || clean === 'video') return { tab: 'meeting' };
    if (clean === 'share') return { tab: 'share' };

    // Explicit user handles (@username, u/username, user/username)
    if (clean.startsWith('@')) {
      return { tab: 'user-landing', targetHandle: clean.slice(1) };
    }
    if (clean.startsWith('u/') || clean.startsWith('user/')) {
      const parts = clean.split('/');
      return { tab: 'user-landing', targetHandle: parts[1] };
    }

    // Dynamic direct single-segment handle (e.g. /user-handel, /elena_gpu)
    if (!clean.includes('/')) {
      return { tab: 'user-landing', targetHandle: clean };
    }

    return { tab: 'home' };
  };

  const navigateTo = (tab: string, param?: string) => {
    let path = '/';
    let title = 'Tsuna — Connect & Build Together';
    if (tab === 'home') {
      path = '/';
      title = 'Tsuna — Connect & Build Together';
    } else if (tab === 'communities') {
      path = '/communities';
      title = 'Tsuna — Communities & Collectives';
    } else if (tab === 'community-detail' && param) {
      path = `/community/${param}`;
      title = 'Tsuna — Community Workspace';
    } else if (tab === 'chat') {
      path = '/chat';
      title = 'Tsuna — Live Collaboration & Messages';
    } else if (tab === 'events') {
      path = '/events';
      title = 'Tsuna — Live Events & Audio Rooms';
    } else if (tab === 'flows') {
      path = '/flows';
      title = 'Tsuna — Interactive Flows & Shaders';
    } else if (tab === 'discover') {
      path = '/discover';
      title = 'Tsuna — Universal Discovery';
    } else if (tab === 'profile') {
      path = '/profile';
      title = 'Tsuna — Creator Profile & Storage';
    } else if (tab === 'auth') {
      path = '/auth';
      title = 'Tsuna — Connect Account';
    } else if (tab === 'create-post') {
      path = '/create-post';
      title = 'Tsuna — Share Work & Code';
    } else if (tab === 'create-community') {
      path = '/create-community';
      title = 'Tsuna — Establish Collective';
    } else if (tab === 'create-event') {
      path = '/create-event';
      title = 'Tsuna — Host Live Session';
    } else if (tab === 'meeting') {
      path = '/meeting';
      title = 'Tsuna — Live Collaborative Room';
    } else if (tab === 'share') {
      path = '/share';
      title = 'Tsuna — Share Creation';
    } else if (tab === 'user-landing' && param) {
      const cleanH = param.replace(/^[@/]+/, '');
      path = `/@${cleanH}`;
      title = `@${cleanH} — Tsuna Creator Landing`;
    }

    if (window.location.pathname !== path) {
      window.history.pushState({ tab, param }, '', path);
    }
    document.title = title;
    setActiveTab(tab);
    if (tab === 'community-detail') {
      setSelectedCommunityId(param || null);
    } else {
      setSelectedCommunityId(null);
    }

    if (tab === 'user-landing') {
      setSelectedUserHandle(param?.replace(/^[@/]+/, '') || null);
    } else {
      setSelectedUserHandle(null);
    }
  };

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initial route resolution from browser URL
    const route = getTabFromPath(window.location.pathname);
    setActiveTab(route.tab);
    if (route.communityId) setSelectedCommunityId(route.communityId);
    if (route.targetHandle) setSelectedUserHandle(route.targetHandle);

    // 2. Browser Back / Forward button multi-page listener
    const handlePopState = () => {
      const currentRoute = getTabFromPath(window.location.pathname);
      setActiveTab(currentRoute.tab);
      if (currentRoute.communityId) {
        setSelectedCommunityId(currentRoute.communityId);
      } else if (currentRoute.tab !== 'community-detail') {
        setSelectedCommunityId(null);
      }
      if (currentRoute.targetHandle) {
        setSelectedUserHandle(currentRoute.targetHandle);
      } else if (currentRoute.tab !== 'user-landing') {
        setSelectedUserHandle(null);
      }
    };

    // 3. Global hotkey for Search (Cmd+K / Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigateTo('discover');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    loadInitialData();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 3. Synchronize with Firebase Auth & particular user ID data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Authenticated with Google or Email
        const firestoreProfile = await getUserFromFirestore(firebaseUser.uid);
        if (firestoreProfile) {
          setCurrentUser(firestoreProfile);
          if (firestoreProfile.preferredTheme) {
            setTheme(firestoreProfile.preferredTheme);
            try {
              localStorage.setItem('tsuna_theme', firestoreProfile.preferredTheme);
            } catch (_) {}
          }
          try {
            localStorage.setItem('tsuna_user_profile', JSON.stringify(firestoreProfile));
            await api.updateProfile(firestoreProfile);
          } catch (_) {}
        } else {
          // Initialize fresh user profile tied to this particular ID
          const cleanName = firebaseUser.displayName || 'Tsuna Creator';
          const cleanUsername = (firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 6)}`)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '');
          const newProfile: User = {
            id: firebaseUser.uid,
            name: cleanName,
            username: cleanUsername,
            avatar: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=TsunaPioneer&backgroundColor=b6e3f4,c0aede,d1d4f9',
            banner: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
            bio: 'Collaborative builder and creative technologist on Tsuna.',
            roleTitle: 'Creator & Technologist',
            skills: ['TypeScript', 'WebGPU', 'Creative Tech'],
            links: {},
            externalAccounts: {},
            isOnline: true,
            isDemo: false,
            customStatus: 'Connected via Google Account',
            statusEmoji: '⚡',
            availability: 'available',
          };
          await saveUserToFirestore(newProfile);
          setCurrentUser(newProfile);
          try {
            await api.updateProfile(newProfile);
          } catch (_) {}
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Check local persistent storage for registered user profile
      let localUserProfile: User | null = null;
      try {
        const stored = localStorage.getItem('tsuna_user_profile');
        if (stored) {
          localUserProfile = JSON.parse(stored);
          if (localUserProfile && localUserProfile.id) {
            api.syncLocalUser(localUserProfile).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Could not parse local user profile:', e);
      }

      // 2. Load core platform data
      const [serverUser, comms, postList, vRooms, evs, convs, notifs] = await Promise.all([
        api.getCurrentUser().catch(() => null),
        api.getCommunities().catch(() => []),
        api.getPosts().catch(() => []),
        api.getVoiceRooms().catch(() => []),
        api.getEvents().catch(() => []),
        api.getConversations().catch(() => []),
        api.getNotifications().catch(() => []),
      ]);

      const activeUser = localUserProfile || serverUser || null;
      setCurrentUser(activeUser);
      if (activeUser?.preferredTheme) {
        setTheme(activeUser.preferredTheme);
        try {
          localStorage.setItem('tsuna_theme', activeUser.preferredTheme);
        } catch (_) {}
      }
      if (serverUser && !localUserProfile) {
        try {
          localStorage.setItem('tsuna_user_profile', JSON.stringify(serverUser));
        } catch (_) {}
      }
      setCommunities(comms);
      setPosts(postList);
      setVoiceRooms(vRooms);
      setEvents(evs);
      setConversations(convs);
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await api.markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleSimulateNotification = async () => {
    try {
      const newNotif = await api.simulateNotification();
      setNotifications((prev) => [newNotif, ...prev]);
    } catch (err) {
      console.error('Failed to simulate notification:', err);
    }
  };

  const unreadChatCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const handleSelectCommunity = (commId: string) => {
    navigateTo('community-detail', commId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinVoiceRoom = (roomId: string) => {
    setActiveVoiceRoomId(roomId);
  };

  const handleLeaveVoiceRoom = () => {
    setActiveVoiceRoomId(null);
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      await api.joinEvent(eventId);
      const evs = await api.getEvents();
      setEvents(evs);
    } catch (err) {
      console.error('Failed to join event:', err);
    }
  };

  const [theme, setTheme] = useState<'dark' | 'high-contrast' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('tsuna_theme');
      if (saved === 'dark' || saved === 'high-contrast' || saved === 'light') {
        return saved;
      }
    } catch (e) {}
    return 'dark';
  });

  // Apply theme to document element and body
  useEffect(() => {
    try {
      localStorage.setItem('tsuna_theme', theme);
    } catch (e) {}

    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark', 'theme-dark', 'theme-high-contrast', 'high-contrast');
      document.documentElement.classList.add('light', 'theme-light');
      document.body.classList.remove('dark', 'theme-dark', 'theme-high-contrast', 'high-contrast');
      document.body.classList.add('light', 'theme-light');
    } else if (theme === 'high-contrast') {
      document.documentElement.classList.remove('light', 'theme-light');
      document.documentElement.classList.add('dark', 'theme-high-contrast', 'high-contrast');
      document.body.classList.remove('light', 'theme-light');
      document.body.classList.add('dark', 'theme-high-contrast', 'high-contrast');
    } else {
      document.documentElement.classList.remove('light', 'theme-light', 'theme-high-contrast', 'high-contrast');
      document.documentElement.classList.add('dark', 'theme-dark');
      document.body.classList.remove('light', 'theme-light', 'theme-high-contrast', 'high-contrast');
      document.body.classList.add('dark', 'theme-dark');
    }
  }, [theme]);

  const handleToggleTheme = (t: 'dark' | 'high-contrast' | 'light') => {
    setTheme(t);
    try {
      localStorage.setItem('tsuna_theme', t);
    } catch (e) {}
    if (currentUser) {
      const updatedUser = { ...currentUser, preferredTheme: t };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('tsuna_user_profile', JSON.stringify(updatedUser));
      } catch (e) {}
      api.updateProfile({ preferredTheme: t }).catch(() => {});
      saveUserToFirestore(updatedUser).catch(() => {});
    }
  };

  const activeVoiceRoom = voiceRooms.find((r) => r.id === activeVoiceRoomId) || null;

  return (
    <div className="min-h-screen bg-black text-neutral-100 selection:bg-neutral-800 selection:text-white flex flex-col font-sans transition-colors duration-200">
      {/* Top Fixed Header with Search and Share Work */}
      <Navbar
        currentUser={currentUser}
        onOpenCreatePost={() => {
          if (!currentUser) {
            navigateTo('auth');
            return;
          }
          setCreatePostCommunityId(communities[0]?.id);
          navigateTo('create-post');
        }}
        onOpenSearch={() => navigateTo('discover')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onNavigate={(tab) => navigateTo(tab)}
        onOpenAuthModal={() => navigateTo('auth')}
        onSignOut={async () => {
          localStorage.removeItem('tsuna_user_profile');
          await api.logout();
          setCurrentUser(null);
        }}
        notifications={notifications}
        unreadNotificationCount={unreadNotificationCount}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onSimulateNotification={handleSimulateNotification}
      />

      {/* Hero Banner for Entry & Value Prop (can be dismissed or kept on home) */}
      {showLandingHero && activeTab === 'home' && (
        <LandingHero
          onEnter={() => setShowLandingHero(false)}
          onExploreCommunities={() => {
            setShowLandingHero(false);
            navigateTo('communities');
          }}
        />
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical App Sidebar */}
        <Sidebar
          currentTab={activeTab}
          onNavigate={(tab: string) => navigateTo(tab)}
          activeVoiceRoom={activeVoiceRoom}
          currentUser={currentUser}
          onLeaveVoiceRoom={handleLeaveVoiceRoom}
          onToggleMute={handleToggleVoiceMute}
          unreadChatCount={unreadChatCount}
          isVoiceMuted={isVoiceMuted}
          isVoiceSpeaking={isVoiceSpeaking}
          voiceAudioLevel={voiceAudioLevel}
        />

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-8">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center space-x-2 text-neutral-400 font-mono text-xs">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>INITIALIZING TSUNA CLIENT...</span>
            </div>
          ) : (
            <>
              {/* Tab: Home / Activity Hub */}
              {activeTab === 'home' && (
                <HomeView
                  posts={posts}
                  communities={communities}
                  voiceRooms={voiceRooms}
                  events={events}
                  currentUser={currentUser}
                  onSelectCommunity={handleSelectCommunity}
                  onOpenShareModal={(item) => {
                    setShareModalItem(item);
                    navigateTo('share');
                  }}
                  onJoinVoiceRoom={handleJoinVoiceRoom}
                  onJoinEvent={handleJoinEvent}
                  onOpenVideoMeeting={(title) => {
                    setActiveVideoTitle(title);
                    navigateTo('meeting');
                  }}
                  onNavigate={(tab) => navigateTo(tab)}
                  onRefreshPosts={async () => {
                    const updated = await api.getPosts();
                    setPosts(updated);
                  }}
                />
              )}

              {/* Tab: Communities Catalog */}
              {activeTab === 'communities' && (
                <CommunitiesView
                  communities={communities}
                  onSelectCommunity={handleSelectCommunity}
                  onOpenCreateCommunity={() => navigateTo('create-community')}
                  onRefreshCommunities={async () => {
                    const updated = await api.getCommunities();
                    setCommunities(updated);
                  }}
                />
              )}

              {/* Tab: Community Detail Workspace */}
              {activeTab === 'community-detail' && selectedCommunityId && (
                <CommunityDetailView
                  communityId={selectedCommunityId}
                  currentUser={currentUser}
                  onBack={() => {
                    navigateTo('communities');
                  }}
                  onOpenCreatePost={(commId) => {
                    setCreatePostCommunityId(commId);
                    navigateTo('create-post');
                  }}
                  onOpenShareModal={(item) => {
                    setShareModalItem(item);
                    navigateTo('share');
                  }}
                  onJoinVoiceRoom={handleJoinVoiceRoom}
                  onJoinEvent={handleJoinEvent}
                  onNavigate={(tab) => navigateTo(tab)}
                />
              )}

              {/* Tab: Realtime Chat & Messages */}
              {activeTab === 'chat' && (
                <ChatsView
                  currentUser={currentUser}
                  onNavigate={(tab) => navigateTo(tab)}
                  onConversationRead={(convId) => {
                    setConversations((prev) =>
                      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
                    );
                  }}
                  onMarkAllConversationsRead={() => {
                    setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
                  }}
                  onConversationsUpdated={(updated) => {
                    setConversations(updated);
                  }}
                />
              )}

              {/* Tab: Events, Voice & Competitions */}
              {activeTab === 'events' && (
                <EventsView
                  events={events}
                  voiceRooms={voiceRooms}
                  currentUser={currentUser}
                  activeVoiceRoomId={activeVoiceRoomId}
                  onJoinVoiceRoom={handleJoinVoiceRoom}
                  onLeaveVoiceRoom={handleLeaveVoiceRoom}
                  onOpenVideoMeeting={(title) => {
                    setActiveVideoTitle(title);
                    navigateTo('meeting');
                  }}
                  onOpenCreateEvent={() => navigateTo('create-event')}
                  onRefreshEvents={async () => {
                    const evs = await api.getEvents();
                    setEvents(evs);
                  }}
                />
              )}

              {/* Tab: Flows / Micro Walkthroughs */}
              {activeTab === 'flows' && (
                <FlowsView
                  currentUser={currentUser}
                  onOpenShareModal={(item) => {
                    setShareModalItem(item);
                    navigateTo('share');
                  }}
                  onNavigate={(tab, param) => navigateTo(tab, param)}
                />
              )}

              {/* Tab: Universal Discovery Search */}
              {activeTab === 'discover' && (
                <DiscoverView
                  onSelectCommunity={handleSelectCommunity}
                  onSelectPost={(post) => {
                    navigateTo('home');
                  }}
                  onNavigate={(tab) => navigateTo(tab)}
                />
              )}

              {/* Tab: Creator Profile */}
              {activeTab === 'profile' && (
                <ProfileView
                  currentUser={currentUser}
                  posts={posts}
                  communities={communities}
                  onSelectCommunity={handleSelectCommunity}
                  onRefreshUser={async () => {
                    const [user, updatedPosts] = await Promise.all([
                      api.getCurrentUser(),
                      api.getPosts(),
                    ]);
                    setCurrentUser(user);
                    setPosts(updatedPosts);
                    if (user) {
                      try {
                        localStorage.setItem('tsuna_user_profile', JSON.stringify(user));
                      } catch (_) {}
                    }
                  }}
                  onNavigate={(tab) => navigateTo(tab)}
                />
              )}

              {/* Tab: Auth & Connect */}
              {activeTab === 'auth' && (
                <AuthView
                  currentUser={currentUser}
                  onAuthSuccess={async (authedUser) => {
                    setCurrentUser(authedUser);
                    try {
                      await api.syncLocalUser(authedUser);
                      const updatedPosts = await api.getPosts();
                      setPosts(updatedPosts);
                    } catch (_) {}
                    navigateTo('home');
                  }}
                  onNavigate={(tab) => navigateTo(tab)}
                />
              )}

              {/* Tab: Create Post */}
              {activeTab === 'create-post' && (
                <CreatePostView
                  communities={communities}
                  defaultCommunityId={createPostCommunityId}
                  onPostCreated={(newPost) => {
                    setPosts((prev) => [newPost, ...prev]);
                  }}
                  onNavigate={(tab) => navigateTo(tab)}
                />
              )}

              {/* Tab: Create Community */}
              {activeTab === 'create-community' && (
                <CreateCommunityView
                  onCreated={(newComm) => {
                    setCommunities((prev) => [newComm, ...prev]);
                    handleSelectCommunity(newComm.id);
                  }}
                  onNavigate={(tab) => navigateTo(tab)}
                />
              )}

              {/* Tab: Create Event */}
              {activeTab === 'create-event' && (
                <CreateEventView
                  communities={communities}
                  onCreated={(newEvent) => {
                    setEvents((prev) => [newEvent, ...prev]);
                    navigateTo('events');
                  }}
                  onNavigate={(tab) => navigateTo(tab)}
                />
              )}

              {/* Tab: Video Meeting Room */}
              {activeTab === 'meeting' && (
                <VideoMeetingView
                  currentUser={currentUser}
                  sessionTitle={activeVideoTitle || 'Tsuna Live Room'}
                  onLeave={() => {
                    setActiveVideoTitle(null);
                    navigateTo('home');
                  }}
                />
              )}

              {/* Tab: Share Creation */}
              {activeTab === 'share' && (
                <ShareView
                  item={shareModalItem}
                  conversations={conversations}
                  communities={communities}
                  onNavigate={(tab, id) => {
                    if (id) handleSelectCommunity(id);
                    else navigateTo(tab);
                  }}
                  onShareSuccess={(targetType, targetId) => {
                    if (targetType === 'chat') {
                      navigateTo('chat');
                    } else {
                      handleSelectCommunity(targetId);
                    }
                  }}
                />
              )}

              {/* Tab: Dedicated Creator Landing Page (@handle or /handle) */}
              {activeTab === 'user-landing' && selectedUserHandle && (
                <CreatorLandingView
                  handle={selectedUserHandle}
                  currentUser={currentUser}
                  onCurrentUserUpdated={(updatedUser) => {
                    setCurrentUser(updatedUser);
                  }}
                  onNavigate={(tab, param) => navigateTo(tab, param)}
                  onOpenShareModal={(item) => {
                    setShareModalItem(item);
                    navigateTo('share');
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
