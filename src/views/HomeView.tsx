import React, { useState } from 'react';
import {
  Post,
  Community,
  VoiceRoom,
  TsunaEvent,
  User,
  Comment,
} from '../types';
import {
  Heart,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Download,
  Code2,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  Radio,
} from 'lucide-react';
import { api } from '../services/api';
import { triggerFileDownload } from '../utils/download';
import { PostAttachments } from '../components/PostAttachments';

interface HomeViewProps {
  posts: Post[];
  communities: Community[];
  voiceRooms: VoiceRoom[];
  events: TsunaEvent[];
  currentUser: User | null;
  onSelectCommunity: (communityId: string) => void;
  onOpenShareModal: (item: any) => void;
  onJoinVoiceRoom: (roomId: string) => void;
  onJoinEvent: (eventId: string) => void;
  onOpenVideoMeeting: (title: string) => void;
  onNavigate: (tab: string, param?: string) => void;
  onRefreshPosts: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  posts,
  communities,
  voiceRooms,
  events,
  currentUser,
  onSelectCommunity,
  onOpenShareModal,
  onJoinVoiceRoom,
  onJoinEvent,
  onOpenVideoMeeting,
  onNavigate,
  onRefreshPosts,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'code' | 'media' | 'event' | 'group' | 'file'>('all');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === 'code') return !!p.codeSnippet;
    if (activeFilter === 'media') return !!(p.image || p.gifUrl || p.videoUrl || p.linkPreview);
    if (activeFilter === 'event') return !!p.eventInvite;
    if (activeFilter === 'group') return !!p.groupInvite;
    if (activeFilter === 'file') return !!p.attachment;
    return true;
  });

  const handleCopyCode = (postId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await api.toggleLikePost(postId);
      onRefreshPosts();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleOpenComments = async (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
      return;
    }
    setExpandedCommentsPostId(postId);
    try {
      const comments = await api.getComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    setIsSubmittingComment(true);
    try {
      const newComm = await api.addComment(postId, commentInput);
      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComm],
      }));
      setCommentInput('');
      onRefreshPosts();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const joinedCommunities = communities.filter((c) => c.isJoined);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Main Grid: Feed + Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Center Column: Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Your Communities Strip */}
          {joinedCommunities.length > 0 && (
            <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Your Active Communities
                </span>
                <button
                  onClick={() => onNavigate('communities')}
                  className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                {joinedCommunities.map((comm) => (
                  <button
                    key={comm.id}
                    onClick={() => onSelectCommunity(comm.id)}
                    className="flex items-center space-x-3 rounded-xl border border-neutral-900 bg-black/80 px-3.5 py-2.5 text-left transition hover:border-neutral-700 shrink-0"
                  >
                    <img
                      src={comm.avatar}
                      alt={comm.name}
                      className="h-8 w-8 rounded-lg object-cover border border-neutral-800"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white truncate max-w-[130px]">{comm.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {comm.activeBuildingCount} building now
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {[
                { id: 'all', label: 'All Creations' },
                { id: 'code', label: 'Code Snippets' },
                { id: 'media', label: 'Media & Links' },
                { id: 'event', label: 'Event Invites' },
                { id: 'group', label: 'Group Invites' },
                { id: 'file', label: 'Files' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-neutral-900 text-white border border-neutral-800'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline-block">
              {filteredPosts.length} collaborative posts
            </span>
          </div>

          {/* Posts Stream */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-10 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 text-emerald-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">No posts shared yet</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                    Be the first to share your work, shaders, code snippets, or project updates!
                  </p>
                </div>
              </div>
            ) : (
              filteredPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-xl border border-neutral-900 bg-neutral-950/70 p-5 transition hover:border-neutral-800"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => post.author?.username && onNavigate('user-landing', post.author.username)}
                    className="flex items-center space-x-3 cursor-pointer group/author"
                    title={`Visit @${post.author?.username}'s personal landing page`}
                  >
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="h-9 w-9 rounded-full object-cover border border-neutral-800 group-hover/author:border-emerald-400 transition"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white group-hover/author:text-emerald-300 transition">
                          {post.author.name}
                        </span>
                        <span className="text-[11px] text-neutral-400">@{post.author.username}</span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-[11px] text-neutral-400">{post.createdAt}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate max-w-sm">
                        {post.author.roleTitle}
                      </p>
                    </div>
                  </div>

                  {post.communityName && (
                    <button
                      onClick={() => post.communityId && onSelectCommunity(post.communityId)}
                      className="rounded-md border border-neutral-900 bg-black/60 px-2.5 py-1 text-[10px] font-mono text-neutral-300 hover:border-neutral-700"
                    >
                      {post.communityName}
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <div className="mt-3.5 space-y-2.5">
                  <h3 className="text-sm sm:text-base font-bold text-white">{post.title}</h3>
                  <p className="text-xs sm:text-sm text-neutral-300 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Rich Post Attachments (Code, Link, Image, GIF, Video, Event, Group, File) */}
                <PostAttachments
                  post={post}
                  onNavigate={onNavigate}
                  onSelectCommunity={onSelectCommunity}
                />

                {/* Post Footer Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-neutral-900/80 pt-3 text-xs text-neutral-400">
                  <div className="flex items-center space-x-4">
                    {/* Like Button */}
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center space-x-1.5 transition ${
                        post.isLiked ? 'text-rose-500 font-semibold' : 'hover:text-white'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    {/* Comments Toggle */}
                    <button
                      onClick={() => handleOpenComments(post.id)}
                      className="flex items-center space-x-1.5 hover:text-white transition"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.commentsCount} Discussion</span>
                    </button>

                    {/* Share Modal Trigger */}
                    <button
                      onClick={() =>
                        onOpenShareModal({
                          type: 'post',
                          title: post.title,
                          description: post.content,
                          codeSnippet: post.codeSnippet,
                          attachment: post.attachment,
                        })
                      }
                      className="flex items-center space-x-1.5 hover:text-white transition"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="hidden sm:flex items-center space-x-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Discussion Drawer (Comments) */}
                {expandedCommentsPostId === post.id && (
                  <div className="mt-4 border-t border-neutral-900 pt-3 space-y-3">
                    <p className="text-xs font-semibold text-neutral-300">Technical Discussion</p>

                    {/* Existing comments */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {(postComments[post.id] || []).length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">
                          No comments yet. Start the discussion!
                        </p>
                      ) : (
                        (postComments[post.id] || []).map((c) => (
                          <div
                            key={c.id}
                            className="rounded-lg border border-neutral-900 bg-black/60 p-3"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-white">{c.author.name}</span>
                              <span className="text-neutral-400">{c.createdAt}</span>
                            </div>
                            <p className="mt-1 text-xs text-neutral-300">{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add comment input */}
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                        placeholder="Add technical feedback or question..."
                        className="flex-1 rounded-lg border border-neutral-800 bg-black px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={isSubmittingComment || !commentInput.trim()}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-neutral-200 transition disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )))}
          </div>
        </div>

        {/* Right Column: Live Opportunities & Voice Rooms (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Voice Rooms Widget */}
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/70 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                  Live Voice Rooms
                </h3>
              </div>
              <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
                Realtime
              </span>
            </div>

            <div className="space-y-3">
              {voiceRooms.length === 0 ? (
                <div className="rounded-xl border border-neutral-900 bg-black/40 p-4 text-center">
                  <p className="text-xs text-neutral-400">No voice rooms currently live.</p>
                  <button
                    onClick={() => onNavigate('events')}
                    className="mt-2 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Host a room in Events →
                  </button>
                </div>
              ) : (
                voiceRooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-xl border border-neutral-900 bg-black p-3.5 transition hover:border-neutral-800"
                  >
                    <p className="text-xs font-bold text-white leading-snug">{room.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{room.communityName}</p>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Participant avatars */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {room.participants.map((p, idx) => (
                          <img
                            key={idx}
                            src={
                              p.user?.avatar ||
                              `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                                p.user?.username || `user_${idx}`
                              )}`
                            }
                            alt={p.user?.name || 'Participant'}
                            className="h-6 w-6 rounded-full border border-black object-cover"
                            title={`${p.user?.name || 'Participant'} (${p.isSpeaking ? 'Speaking' : 'Listening'})`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => onJoinVoiceRoom(room.id)}
                        className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800 transition"
                      >
                        Join Room
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submission Event Spotlight */}
          {events.length > 0 && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-5">
              <div className="flex items-center space-x-2 text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Featured Challenge</span>
              </div>
              <h4 className="text-sm font-bold text-white">{events[0].title}</h4>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                {events[0].description}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs font-mono text-neutral-400">
                <span>{events[0].startTime}</span>
                <span>{events[0].submissionsCount ?? 0} Submissions</span>
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('events')}
                  className="flex-1 rounded-lg bg-white py-2 text-center text-xs font-semibold text-black hover:bg-neutral-200 transition"
                >
                  View & Vote
                </button>
                <button
                  onClick={() => onOpenVideoMeeting(events[0].title)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white"
                  title="Open live video jam session"
                >
                  Join Video Jam
                </button>
              </div>
            </div>
          )}

          {/* Tsuna Manifesto / Info Card */}
          <div className="rounded-xl border border-neutral-900 bg-black/40 p-4 text-xs space-y-2">
            <p className="font-semibold text-white">Tsuna Platform Note</p>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              Built for seamless creator collaboration. Every post has runnable code, downloadable
              assets, and instant cross-posting to group chats and communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
