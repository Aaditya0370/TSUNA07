import React, { useState, useEffect, useRef } from 'react';
import { Community, Post, VoiceRoom, TsunaEvent, User, ChatMessage, ChatConversation, Comment } from '../types';
import {
  Users,
  MessageSquare,
  Radio,
  Calendar,
  FileText,
  Plus,
  ArrowLeft,
  Share2,
  Code2,
  Shield,
  Heart,
  Download,
  Copy,
  Check,
  Send,
  HelpCircle,
  Lock,
  Sparkles,
  MessageCircle,
  EyeOff,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../services/api';
import { triggerFileDownload } from '../utils/download';
import { PostAttachments } from '../components/PostAttachments';
import { CommunityQuestionsSection } from '../components/CommunityQuestionsSection';

interface CommunityDetailViewProps {
  communityId: string;
  currentUser: User | null;
  onBack: () => void;
  onOpenCreatePost: (commId: string) => void;
  onOpenShareModal: (item: any) => void;
  onJoinVoiceRoom: (roomId: string) => void;
  onJoinEvent: (eventId: string) => void;
  onNavigate?: (tab: string) => void;
}

type SubPartTab = 'chat' | 'questions' | 'posts' | 'voice' | 'events' | 'members';

export const CommunityDetailView: React.FC<CommunityDetailViewProps> = ({
  communityId,
  currentUser,
  onBack,
  onOpenCreatePost,
  onOpenShareModal,
  onJoinVoiceRoom,
  onJoinEvent,
  onNavigate,
}) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<SubPartTab>('chat');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [questionsCount, setQuestionsCount] = useState<number>(0);

  // Group chat states
  const [chatConversation, setChatConversation] = useState<ChatConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Post comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Quick In-Community Post state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [isCreatingQuickPost, setIsCreatingQuickPost] = useState(false);
  const [showQuickPostForm, setShowQuickPostForm] = useState(false);

  // Community Voice rooms & events
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>([]);
  const [events, setEvents] = useState<TsunaEvent[]>([]);

  useEffect(() => {
    loadCommunityData();
  }, [communityId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const loadCommunityData = async () => {
    try {
      const data = await api.getCommunity(communityId);
      setCommunity(data.community);
      setPosts(data.posts);

      // Load group chat for this community
      try {
        const chatData = await api.getCommunityChat(data.community.id);
        setChatConversation(chatData.conversation);
        setChatMessages(chatData.messages);
      } catch (err) {
        console.error('Failed to load community chat:', err);
      }

      // Load questions count
      try {
        const qs = await api.getCommunityQuestions(data.community.id);
        setQuestionsCount(qs.length);
      } catch (_) {}

      // Load voice rooms and events
      try {
        const vrs = await api.getVoiceRooms();
        setVoiceRooms(vrs.filter((r) => r.communityId === data.community.id));
      } catch (_) {}

      try {
        const evs = await api.getEvents();
        setEvents(evs.filter((e) => e.communityId === data.community.id));
      } catch (_) {}
    } catch (err) {
      console.error('Failed to load community:', err);
    }
  };

  const handleToggleJoin = async () => {
    if (!community) return;
    try {
      if (community.isJoined) {
        const updated = await api.leaveCommunity(community.id);
        setCommunity(updated);
      } else {
        const updated = await api.joinCommunity(community.id);
        setCommunity(updated);
      }
    } catch (err) {
      console.error('Failed to toggle join:', err);
    }
  };

  const handleSendCommunityMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !community) return;

    setIsSendingMessage(true);
    try {
      let convId = chatConversation?.id;
      if (!convId) {
        const chatData = await api.getCommunityChat(community.id);
        setChatConversation(chatData.conversation);
        convId = chatData.conversation.id;
      }

      const sent = await api.sendMessage(convId, { text: chatInput.trim() });
      setChatMessages((prev) => [...prev, sent]);
      setChatInput('');
    } catch (err) {
      console.error('Failed to send community message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleToggleLikePost = async (postId: string) => {
    try {
      const updated = await api.toggleLikePost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));

    if (nextState && !postComments[postId]) {
      try {
        const comments = await api.getComments(postId);
        setPostComments((prev) => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const comment = await api.addComment(postId, content);
      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCreateQuickInCommunityPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !community) return;

    setIsCreatingQuickPost(true);
    try {
      const created = await api.createPost({
        communityId: community.id,
        communityOnly: true, // Specifically marked as communityOnly
        title: quickTitle.trim(),
        content: quickContent.trim(),
        postType: 'general',
        tags: [community.slug || 'community', 'build'],
      });

      setPosts((prev) => [created, ...prev]);
      setQuickTitle('');
      setQuickContent('');
      setShowQuickPostForm(false);
    } catch (err) {
      console.error('Failed to create in-community post:', err);
    } finally {
      setIsCreatingQuickPost(false);
    }
  };

  const handleCopyLink = (postId: string) => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  if (!community) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-xs font-mono text-neutral-400">Loading community workspace...</p>
      </div>
    );
  }

  // 3 Primary Sub-Parts Requested by User
  const PRIMARY_SUB_PARTS = [
    {
      id: 'chat' as SubPartTab,
      label: 'Group Chat',
      badge: chatMessages.length,
      icon: MessageSquare,
      desc: 'Live community channel',
    },
    {
      id: 'questions' as SubPartTab,
      label: 'Questions',
      badge: questionsCount,
      icon: HelpCircle,
      desc: 'Q&A with anonymous option',
    },
    {
      id: 'posts' as SubPartTab,
      label: 'In-Community Posts',
      badge: posts.length,
      icon: Lock,
      desc: 'Community-only feed',
    },
  ];

  const SECONDARY_TABS = [
    { id: 'voice' as SubPartTab, label: 'Voice Rooms', count: voiceRooms.length, icon: Radio },
    { id: 'events' as SubPartTab, label: 'Events & Jams', count: events.length, icon: Calendar },
    { id: 'members' as SubPartTab, label: 'Members', count: community.membersCount, icon: Users },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-xs font-medium text-neutral-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Communities</span>
      </button>

      {/* Community Banner & Header */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950 overflow-hidden shadow-2xl">
        {/* Banner */}
        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-neutral-900">
          <img
            src={community.banner}
            alt={community.name}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        {/* Info row */}
        <div className="px-6 pb-6 relative -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end space-x-4">
              <img
                src={community.avatar}
                alt={community.name}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-neutral-950 object-cover bg-neutral-900 shadow-xl"
              />
              <div className="mb-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">{community.name}</h1>
                  {community.currentUserRole && (
                    <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                      {community.currentUserRole}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 font-medium mt-0.5">
                  {community.tagline}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onOpenCreatePost(community.id)}
                className="flex items-center space-x-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New In-Community Post</span>
              </button>
              <button
                onClick={handleToggleJoin}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  community.isJoined
                    ? 'border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
              >
                {community.isJoined ? 'Member' : 'Join Community'}
              </button>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-xs sm:text-sm text-neutral-400 leading-relaxed">
            {community.description}
          </p>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {community.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-black border border-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* PRIMARY 3 SUB-PARTS NAVIGATION (Group Chat, Questions, In-Community Posts) */}
        <div className="border-t border-neutral-900 bg-black/40 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mr-1 hidden sm:inline-block">
              Community Sub-Parts:
            </span>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {PRIMARY_SUB_PARTS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-white text-black shadow-md'
                        : 'bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800/80'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isActive ? 'bg-black/15 text-black' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary links (Voice, Events, Members) */}
          <div className="flex items-center space-x-3 text-xs text-neutral-400 border-l border-neutral-800 pl-4 py-1">
            {SECONDARY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`transition flex items-center space-x-1.5 text-xs ${
                    isActive ? 'text-white font-bold underline underline-offset-4' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[10px]">({tab.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* ======================================================== */}
        {/* SUB-PART 1: GROUP CHAT                                   */}
        {/* ======================================================== */}
        {activeTab === 'chat' && (
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950 overflow-hidden flex flex-col h-[600px] shadow-2xl">
            {/* Chat Room Header */}
            <div className="border-b border-neutral-900 bg-black/80 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-neutral-500">#</span>
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      {community.slug}-group-chat
                    </h3>
                    <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-mono text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Real-time conversation between members of {community.name}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-neutral-500">
                {chatMessages.length} {chatMessages.length === 1 ? 'Message' : 'Messages'}
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-neutral-950/40">
              {chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-400">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No messages yet</h4>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                      Welcome to #{community.slug} group chat! Say hello to start the discussion.
                    </p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isCurrentUser = currentUser && msg.sender.id === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <img
                        src={msg.sender.avatar}
                        alt={msg.sender.name}
                        className="h-8 w-8 rounded-full object-cover border border-neutral-800 shrink-0 mt-0.5"
                      />
                      <div
                        className={`rounded-2xl border p-3.5 max-w-xl ${
                          isCurrentUser
                            ? 'border-neutral-800 bg-neutral-900/90 text-white'
                            : 'border-neutral-900 bg-black/80 text-neutral-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2 text-[11px] mb-1">
                          <span className="font-bold text-white">{msg.sender.name}</span>
                          <span className="text-neutral-500 font-mono text-[10px]">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-neutral-200">
                          {msg.text}
                        </p>

                        {msg.codeSnippet && (
                          <div className="mt-2.5 rounded-xl border border-neutral-800 bg-black p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                            <code>{msg.codeSnippet.code}</code>
                          </div>
                        )}

                        {msg.attachment && (
                          <div className="mt-2.5 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 flex items-center justify-between text-xs">
                            <span className="text-neutral-300 font-mono text-[11px]">
                              {msg.attachment.name}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {msg.attachment.size}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Input Composer */}
            <form
              onSubmit={handleSendCommunityMessage}
              className="border-t border-neutral-900 bg-black p-3.5 flex items-center space-x-2.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Message #${community.slug} group chat...`}
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
              />
              <button
                type="submit"
                disabled={isSendingMessage || !chatInput.trim()}
                className="flex items-center space-x-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-40 transition active:scale-95 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUB-PART 2: QUESTIONS (Q&A with ANONYMOUS option)         */}
        {/* ======================================================== */}
        {activeTab === 'questions' && (
          <CommunityQuestionsSection
            communityId={community.id}
            communityName={community.name}
            currentUser={currentUser}
            onQuestionsCountChange={setQuestionsCount}
          />
        )}

        {/* ======================================================== */}
        {/* SUB-PART 3: IN-COMMUNITY POSTS (Community-Only Feed)     */}
        {/* ======================================================== */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Banner explicitly indicating In-Community scope */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/90 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">In-Community Posts Feed</h3>
                    <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                      Community Only
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Posts created here are exclusive to members of #{community.name} and will not
                    appear on the public global feed.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setShowQuickPostForm(!showQuickPostForm)}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition"
                >
                  {showQuickPostForm ? 'Close Composer' : 'Quick Post'}
                </button>
                <button
                  onClick={() => onOpenCreatePost(community.id)}
                  className="flex items-center space-x-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Rich Post</span>
                </button>
              </div>
            </div>

            {/* Quick In-Community Post Form */}
            {showQuickPostForm && (
              <form
                onSubmit={handleCreateQuickInCommunityPost}
                className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-3.5 shadow-2xl transition-all"
              >
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Create In-Community Post</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
                    <Lock className="h-3 w-3" />
                    <span>Only visible to this community</span>
                  </span>
                </div>

                <input
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Post title or milestone update..."
                  className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                />

                <textarea
                  rows={3}
                  value={quickContent}
                  onChange={(e) => setQuickContent(e.target.value)}
                  placeholder="Share updates, architecture thoughts, or progress with your community members..."
                  className="w-full rounded-xl border border-neutral-800 bg-black p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                />

                <div className="flex items-center justify-end space-x-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickPostForm(false)}
                    className="rounded-xl border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingQuickPost || !quickTitle.trim()}
                    className="flex items-center space-x-1.5 rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50 transition active:scale-95"
                  >
                    <Send className="h-3 w-3" />
                    <span>{isCreatingQuickPost ? 'Posting...' : 'Post to Community'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Posts List */}
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/60 text-neutral-400">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No community posts yet</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                    Share code breakdowns, project milestones, or discussion posts exclusive to this
                    community.
                  </p>
                </div>
                <button
                  onClick={() => onOpenCreatePost(community.id)}
                  className="mt-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200"
                >
                  Create First In-Community Post
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const comments = postComments[post.id] || [];
                  const isCommentsExpanded = Boolean(expandedComments[post.id]);
                  const isLiked = post.isLiked;
                  const isSubmitting = Boolean(submittingComment[post.id]);

                  return (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-5 sm:p-6 transition hover:border-neutral-800"
                    >
                      {/* Author row & Community Exclusive tag */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="h-9 w-9 rounded-full object-cover border border-neutral-800"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-white">
                                {post.author.name}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                @{post.author.username}
                              </span>
                              <span className="text-neutral-500">•</span>
                              <span className="text-[11px] text-neutral-500">{post.createdAt}</span>
                            </div>
                            <p className="text-[11px] text-neutral-400">{post.author.roleTitle}</p>
                          </div>
                        </div>

                        {/* In-Community Post Badge */}
                        <span className="inline-flex items-center space-x-1 rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Community Exclusive</span>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mt-3.5">{post.title}</h3>
                      <p className="text-xs text-neutral-300 mt-1.5 whitespace-pre-line leading-relaxed">
                        {post.content}
                      </p>

                      {/* Rich Post Attachments (Code snippet, links, etc.) */}
                      <div className="mt-3">
                        <PostAttachments post={post} onNavigate={onNavigate} />
                      </div>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-black border border-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Bar (Likes, Comments, Share) */}
                      <div className="mt-4 pt-3.5 border-t border-neutral-900 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4">
                          {/* Like Button */}
                          <button
                            onClick={() => handleToggleLikePost(post.id)}
                            className={`flex items-center space-x-1.5 transition ${
                              isLiked ? 'text-rose-400 font-bold' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                            <span>{post.likes || 0}</span>
                          </button>

                          {/* Comments Trigger */}
                          <button
                            onClick={() => handleToggleComments(post.id)}
                            className="flex items-center space-x-1.5 text-neutral-400 hover:text-white transition"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.commentsCount || 0} Comments</span>
                            {isCommentsExpanded ? (
                              <ChevronUp className="h-3 w-3 ml-0.5" />
                            ) : (
                              <ChevronDown className="h-3 w-3 ml-0.5" />
                            )}
                          </button>
                        </div>

                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyLink(post.id)}
                          className="flex items-center space-x-1 text-neutral-500 hover:text-neutral-300 transition text-[11px]"
                        >
                          {copiedPostId === post.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5" />
                              <span>Share</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* EXPANDED COMMENTS SECTION */}
                      {isCommentsExpanded && (
                        <div className="mt-4 pt-4 border-t border-neutral-900/80 space-y-3">
                          {/* Existing comments */}
                          {comments.length > 0 && (
                            <div className="space-y-2.5">
                              {comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="rounded-xl border border-neutral-900 bg-black/60 p-3 text-xs"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                      <img
                                        src={comment.author.avatar}
                                        alt={comment.author.name}
                                        className="h-4 w-4 rounded-full object-cover border border-neutral-800"
                                      />
                                      <span className="font-bold text-neutral-200">
                                        {comment.author.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-neutral-500">
                                      {comment.createdAt}
                                    </span>
                                  </div>
                                  <p className="text-neutral-300 ml-6 whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add comment input */}
                          <form
                            onSubmit={(e) => handleAddComment(post.id, e)}
                            className="flex items-center space-x-2 pt-1"
                          >
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              placeholder="Write a comment..."
                              className="flex-1 rounded-xl border border-neutral-800 bg-black px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                            />
                            <button
                              type="submit"
                              disabled={isSubmitting || !commentInputs[post.id]?.trim()}
                              className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-200 disabled:opacity-40 transition"
                            >
                              Post
                            </button>
                          </form>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY: VOICE ROOMS                                   */}
        {/* ======================================================== */}
        {activeTab === 'voice' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voiceRooms.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-neutral-900 bg-neutral-950 p-8 text-center">
                <Radio className="h-6 w-6 text-neutral-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">No active voice rooms currently.</p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Start a spontaneous audio work session!
                </p>
              </div>
            ) : (
              voiceRooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="uppercase">{room.isLive ? 'LIVE' : 'AUDIO'}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{room.title}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">{room.communityName}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-900">
                    <span className="text-[11px] font-mono text-neutral-400">
                      {room.participants.length} builders online
                    </span>
                    <button
                      onClick={() => onJoinVoiceRoom(room.id)}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 transition"
                    >
                      Join Audio Room
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY: EVENTS TAB                                    */}
        {/* ======================================================== */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-8 text-center text-xs text-neutral-400">
                No events scheduled yet.
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {ev.type} • {ev.startTime}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{ev.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xl">{ev.description}</p>
                  </div>
                  <button
                    onClick={() => onJoinEvent(ev.id)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
                  >
                    {ev.isJoined ? 'Joined' : 'RSVP'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY: MEMBERS TAB                                   */}
        {/* ======================================================== */}
        {activeTab === 'members' && (
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-4">
              Community Roster &amp; Roles
            </h3>
            {currentUser && community?.isJoined ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-3 rounded-xl border border-neutral-900 bg-black/60 p-3">
                  <div className="relative">
                    <img
                      src={
                        currentUser.avatar ||
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                          currentUser.username || 'builder'
                        )}`
                      }
                      alt={currentUser.name}
                      className="h-10 w-10 rounded-full object-cover border border-neutral-800"
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-white">{currentUser.name} (You)</p>
                      <span className="rounded bg-neutral-900 px-1.5 py-0.2 text-[9px] font-mono text-neutral-400">
                        {currentUser.roleTitle || 'Builder'}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400">@{currentUser.username}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-900 bg-black/40 p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-white">No members roster available</p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Join this community to become an active contributor and collaborate with other
                  builders.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
