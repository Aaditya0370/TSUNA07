import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Code2,
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
  Eye,
  Link2,
  Image as ImageIcon,
  Film,
  Video,
  Calendar,
  Users,
  Check,
  X,
  Upload,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Community, Post, TsunaEvent } from '../types';
import { api } from '../services/api';
import { savePostToFirestore } from '../services/firebase';
import { PostAttachments } from '../components/PostAttachments';

interface CreatePostViewProps {
  communities: Community[];
  onPostCreated: (post: Post) => void;
  onNavigate: (tab: string) => void;
  defaultCommunityId?: string;
}

type AttachmentTab = 'none' | 'code' | 'link' | 'image' | 'gif' | 'video' | 'event' | 'group';

const POPULAR_GIFS = [
  { title: 'Hacking / Coding', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },
  { title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { title: 'Rocket Launch', url: 'https://media.giphy.com/media/3o7btQ8jDTPGDpgc6I/giphy.gif' },
  { title: 'Celebration', url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif' },
  { title: 'Coffee Fuel', url: 'https://media.giphy.com/media/oOTTy46FV7J5CQWL0O/giphy.gif' },
  { title: 'It Compiles!', url: 'https://media.giphy.com/media/9K2nFglCAQClO/giphy.gif' },
  { title: 'Vibing', url: 'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif' },
  { title: '100% Shipped', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
];

export const CreatePostView: React.FC<CreatePostViewProps> = ({
  communities,
  onPostCreated,
  onNavigate,
  defaultCommunityId,
}) => {
  const [selectedCommunityId, setSelectedCommunityId] = useState(
    defaultCommunityId || communities[0]?.id || ''
  );
  const [isCommunityOnly, setIsCommunityOnly] = useState(Boolean(defaultCommunityId));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('react, typescript, creative-code');
  const [activeTab, setActiveTab] = useState<AttachmentTab>('code');

  // Available events
  const [eventsList, setEventsList] = useState<TsunaEvent[]>([]);

  // 1. Code snippet state
  const [hasCode, setHasCode] = useState(true);
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [codeFilename, setCodeFilename] = useState('shaderPass.ts');
  const [codeContent, setCodeContent] = useState(`// GLSL / Canvas post-processing pipeline
export function applyCRTFilter(gl: WebGLRenderingContext) {
  const time = performance.now() * 0.001;
  // Spatial distortion and scanline curvature
  return { time, active: true };
}`);

  // 2. Link state
  const [hasLink, setHasLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkImage, setLinkImage] = useState('');

  // 3. Image state
  const [hasImage, setHasImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // 4. GIF state
  const [hasGif, setHasGif] = useState(false);
  const [gifUrl, setGifUrl] = useState('');

  // 5. Video state
  const [hasVideo, setHasVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // 6. Event invite state
  const [hasEvent, setHasEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [customEventType, setCustomEventType] = useState('hackathon');
  const [customEventTime, setCustomEventTime] = useState('This Friday, 6:00 PM UTC');

  // 7. Group invite state
  const [hasGroup, setHasGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(communities[0]?.id || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Load events
  useEffect(() => {
    api.getEvents().then((evts) => {
      setEventsList(evts);
      if (evts.length > 0 && !selectedEventId) {
        setSelectedEventId(evts[0].id);
      }
    }).catch(() => {});
  }, []);

  // Image file upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        setHasImage(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Video file upload
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideoUrl(event.target.result as string);
        setHasVideo(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const postPayload: Partial<Post> = {
        communityId: selectedCommunityId || undefined,
        communityOnly: selectedCommunityId ? isCommunityOnly : false,
        title,
        content,
        postType: hasCode ? 'code' : hasImage || hasGif || hasVideo ? 'media' : hasLink ? 'link' : hasEvent ? 'event_invite' : 'general',
        tags: parsedTags,
      };

      // 1. Code
      if (hasCode && codeContent.trim()) {
        postPayload.codeSnippet = {
          language: codeLanguage,
          code: codeContent,
          filename: codeFilename || undefined,
        };
      }

      // 2. Link
      if (hasLink && linkUrl.trim()) {
        let siteName = '';
        try {
          siteName = new URL(linkUrl).hostname;
        } catch (_) {}
        postPayload.linkPreview = {
          url: linkUrl.trim(),
          title: linkTitle || linkUrl,
          description: linkDescription || undefined,
          image: linkImage || undefined,
          siteName: siteName || undefined,
        };
      }

      // 3. Image
      if (hasImage && imageUrl.trim()) {
        postPayload.image = imageUrl.trim();
      }

      // 4. GIF
      if (hasGif && gifUrl.trim()) {
        postPayload.gifUrl = gifUrl.trim();
      }

      // 5. Video
      if (hasVideo && videoUrl.trim()) {
        postPayload.videoUrl = videoUrl.trim();
      }

      // 6. Event Invite
      if (hasEvent) {
        const foundEvent = eventsList.find((ev) => ev.id === selectedEventId);
        if (foundEvent) {
          postPayload.eventInvite = {
            eventId: foundEvent.id,
            eventTitle: foundEvent.title,
            eventType: foundEvent.type,
            startTime: foundEvent.startTime || foundEvent.startDate || 'Upcoming',
            communityName: foundEvent.communityName,
            description: foundEvent.description,
          };
        } else if (customEventTitle.trim()) {
          postPayload.eventInvite = {
            eventId: `evt_custom_${Date.now()}`,
            eventTitle: customEventTitle,
            eventType: customEventType,
            startTime: customEventTime,
          };
        }
      }

      // 7. Group Invite
      if (hasGroup && selectedGroupId) {
        const foundGroup = communities.find((c) => c.id === selectedGroupId);
        if (foundGroup) {
          postPayload.groupInvite = {
            communityId: foundGroup.id,
            communityName: foundGroup.name,
            category: foundGroup.category,
            membersCount: foundGroup.membersCount,
            avatar: foundGroup.avatar,
            tagline: foundGroup.tagline,
          };
        }
      }

      const created = await api.createPost(postPayload);
      try {
        await savePostToFirestore(created);
      } catch (_) {}

      onPostCreated(created);
      onNavigate('home');
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedComm = communities.find((c) => c.id === selectedCommunityId);

  // Mock post object for live preview
  const previewPost: Post = {
    id: 'preview',
    author: {
      id: 'preview_author',
      name: 'You (Preview)',
      username: 'you',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AstroCadet&backgroundColor=b6e3f4,c0aede,d1d4f9',
      roleTitle: 'Creative Builder',
      skills: ['TypeScript', 'WebGL'],
      bio: 'Building on Tsuna',
      isOnline: true,
    },
    communityId: selectedComm?.id,
    communityName: selectedComm?.name,
    title: title || 'Real-time WebGPU Audio Shader Pipeline',
    content: content || 'Interactive post preview showing live attached code, links, images, video, and group/event invites.',
    postType: hasCode ? 'code' : 'general',
    codeSnippet: hasCode && codeContent.trim() ? {
      language: codeLanguage,
      filename: codeFilename || undefined,
      code: codeContent,
    } : undefined,
    linkPreview: hasLink && linkUrl.trim() ? {
      url: linkUrl.trim(),
      title: linkTitle || linkUrl,
      description: linkDescription || 'Shared resource and repository link on Tsuna.',
      siteName: linkUrl ? new URL(linkUrl).hostname : 'web.dev',
    } : undefined,
    image: hasImage && imageUrl.trim() ? imageUrl.trim() : undefined,
    gifUrl: hasGif && gifUrl.trim() ? gifUrl.trim() : undefined,
    videoUrl: hasVideo && videoUrl.trim() ? videoUrl.trim() : undefined,
    eventInvite: hasEvent ? {
      eventId: selectedEventId || 'preview_evt',
      eventTitle: eventsList.find((e) => e.id === selectedEventId)?.title || customEventTitle || 'HyperCraft WebGPU Jam',
      eventType: eventsList.find((e) => e.id === selectedEventId)?.type || customEventType,
      startTime: eventsList.find((e) => e.id === selectedEventId)?.startTime || eventsList.find((e) => e.id === selectedEventId)?.startDate || customEventTime,
      communityName: selectedComm?.name || 'Tsuna Collective',
    } : undefined,
    groupInvite: hasGroup && selectedGroupId ? {
      communityId: selectedGroupId,
      communityName: communities.find((c) => c.id === selectedGroupId)?.name || 'Guild',
      category: communities.find((c) => c.id === selectedGroupId)?.category || 'Engineering',
      membersCount: communities.find((c) => c.id === selectedGroupId)?.membersCount || 42,
      avatar: communities.find((c) => c.id === selectedGroupId)?.avatar,
      tagline: communities.find((c) => c.id === selectedGroupId)?.tagline,
    } : undefined,
    likes: 0,
    isLiked: false,
    commentsCount: 0,
    createdAt: 'Just now',
    tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Feed</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs transition cursor-pointer ${
                showPreview
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{showPreview ? 'Preview Active' : 'Show Preview'}</span>
            </button>
            <span className="text-xs font-mono text-neutral-500 hidden sm:inline-block">
              TSUNA // COMPOSER_STUDIO
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-12 gap-8' : ''}`}>
          {/* Main Form Area */}
          <div className={`${showPreview ? 'lg:col-span-7' : 'max-w-3xl mx-auto w-full'}`}>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
              <div className="border-b border-neutral-900 pb-5">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Create Collaborative Post</h1>
                    <p className="text-xs text-neutral-400">
                      Share code snippets, web links, images, animated GIFs, videos, and event/group invites.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-left">
                {/* Target Community */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Target Community / Collective
                  </label>
                  <select
                    value={selectedCommunityId}
                    onChange={(e) => setSelectedCommunityId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Public Stream (All Communities)</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.category})
                      </option>
                    ))}
                  </select>

                  {selectedCommunityId && (
                    <div className="mt-2.5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-white">In-Community Post Only</p>
                          <p className="text-[11px] text-neutral-400">
                            Exclusively visible inside this community. Will not appear on the public feed.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer select-none shrink-0 ml-3">
                        <input
                          type="checkbox"
                          checked={isCommunityOnly}
                          onChange={(e) => setIsCommunityOnly(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-700 bg-black text-white focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-neutral-200">Community Only</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. WebGPU Compute Shader: 100k Particles with Curl Noise"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Description / Context
                  </label>
                  <textarea
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Explain the architectural breakdown, performance metrics, or what feedback you need from other builders..."
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                {/* ATTACHMENT ACTION BAR */}
                <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                      Add Attachments
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Select below to customize
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {/* Code */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(activeTab === 'code' ? 'none' : 'code');
                        if (!hasCode) setHasCode(true);
                      }}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2.5 px-2 text-xs transition cursor-pointer ${
                        hasCode
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>Code</span>
                      {hasCode && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>

                    {/* Link */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(activeTab === 'link' ? 'none' : 'link');
                        if (!hasLink) setHasLink(true);
                      }}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2.5 px-2 text-xs transition cursor-pointer ${
                        hasLink
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span>Link</span>
                      {hasLink && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>

                    {/* Image */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(activeTab === 'image' ? 'none' : 'image');
                        if (!hasImage) setHasImage(true);
                      }}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2.5 px-2 text-xs transition cursor-pointer ${
                        hasImage
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Image</span>
                      {hasImage && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>

                    {/* GIF */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(activeTab === 'gif' ? 'none' : 'gif');
                        if (!hasGif) setHasGif(true);
                      }}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2.5 px-2 text-xs transition cursor-pointer ${
                        hasGif
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Film className="h-3.5 w-3.5" />
                      <span>GIF</span>
                      {hasGif && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>

                    {/* Video */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(activeTab === 'video' ? 'none' : 'video');
                        if (!hasVideo) setHasVideo(true);
                      }}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2.5 px-2 text-xs transition cursor-pointer ${
                        hasVideo
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Video</span>
                      {hasVideo && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>

                    {/* Event */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(activeTab === 'event' ? 'none' : 'event');
                        if (!hasEvent) setHasEvent(true);
                      }}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2.5 px-2 text-xs transition cursor-pointer ${
                        hasEvent
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Event</span>
                      {hasEvent && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>

                    {/* Group */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(activeTab === 'group' ? 'none' : 'group');
                        if (!hasGroup) setHasGroup(true);
                      }}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2.5 px-2 text-xs transition cursor-pointer ${
                        hasGroup
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Group</span>
                      {hasGroup && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>
                  </div>

                  {/* Active Attachment Chips */}
                  {(hasCode || hasLink || hasImage || hasGif || hasVideo || hasEvent || hasGroup) && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-neutral-800/80 pt-2.5">
                      <span className="text-[10px] font-mono text-neutral-400 self-center mr-1">Active:</span>
                      {hasCode && (
                        <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                          <span>Code ({codeLanguage})</span>
                          <button type="button" onClick={() => setHasCode(false)} className="text-neutral-400 hover:text-rose-400">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {hasLink && (
                        <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                          <span>Link</span>
                          <button type="button" onClick={() => setHasLink(false)} className="text-neutral-400 hover:text-rose-400">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {hasImage && (
                        <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                          <span>Image</span>
                          <button type="button" onClick={() => setHasImage(false)} className="text-neutral-400 hover:text-rose-400">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {hasGif && (
                        <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                          <span>GIF</span>
                          <button type="button" onClick={() => setHasGif(false)} className="text-neutral-400 hover:text-rose-400">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {hasVideo && (
                        <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                          <span>Video</span>
                          <button type="button" onClick={() => setHasVideo(false)} className="text-neutral-400 hover:text-rose-400">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {hasEvent && (
                        <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                          <span>Event Invite</span>
                          <button type="button" onClick={() => setHasEvent(false)} className="text-neutral-400 hover:text-rose-400">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {hasGroup && (
                        <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                          <span>Group Invite</span>
                          <button type="button" onClick={() => setHasGroup(false)} className="text-neutral-400 hover:text-rose-400">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CONFIG PANELS */}

                {/* 1. CODE */}
                {activeTab === 'code' && (
                  <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                      <div className="flex items-center space-x-1.5">
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Code Studio Spec</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                          Language
                        </label>
                        <select
                          value={codeLanguage}
                          onChange={(e) => setCodeLanguage(e.target.value)}
                          className="w-full rounded-lg border border-neutral-800 bg-black px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="typescript">TypeScript</option>
                          <option value="rust">Rust</option>
                          <option value="wgsl">WGSL / Shader</option>
                          <option value="glsl">GLSL</option>
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="go">Go</option>
                          <option value="cpp">C++</option>
                          <option value="css">CSS / Tailwind</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                          Filename (Optional)
                        </label>
                        <input
                          type="text"
                          value={codeFilename}
                          onChange={(e) => setCodeFilename(e.target.value)}
                          placeholder="e.g. pipeline.ts"
                          className="w-full rounded-lg border border-neutral-800 bg-black px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                        Source Code
                      </label>
                      <textarea
                        rows={6}
                        value={codeContent}
                        onChange={(e) => {
                          setCodeContent(e.target.value);
                          setHasCode(true);
                        }}
                        placeholder="// Enter or paste code here..."
                        className="w-full font-mono text-xs rounded-lg border border-neutral-800 bg-black p-3 text-neutral-200 focus:border-emerald-500 focus:outline-none resize-y"
                      />
                    </div>
                  </div>
                )}

                {/* 2. LINK */}
                {activeTab === 'link' && (
                  <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                      <div className="flex items-center space-x-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        <span>Link Preview Card</span>
                      </div>
                    </div>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => {
                        setLinkUrl(e.target.value);
                        setHasLink(true);
                        if (!linkTitle && e.target.value) {
                          try {
                            setLinkTitle(new URL(e.target.value).hostname);
                          } catch (_) {}
                        }
                      }}
                      placeholder="https://github.com/org/repo or https://threejs.org"
                      className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        placeholder="Link Title (optional)"
                        className="rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={linkDescription}
                        onChange={(e) => setLinkDescription(e.target.value)}
                        placeholder="Summary / Description (optional)"
                        className="rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. IMAGE */}
                {activeTab === 'image' && (
                  <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                      <div className="flex items-center space-x-1.5">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Image Attachment</span>
                      </div>
                      <label className="flex items-center space-x-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 cursor-pointer">
                        <Upload className="h-3 w-3" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setHasImage(true);
                      }}
                      placeholder="Or paste direct image URL (https://...)"
                      className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    {imageUrl && (
                      <div className="relative rounded-lg border border-neutral-800 overflow-hidden max-h-48 bg-black">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl('');
                            setHasImage(false);
                          }}
                          className="absolute top-2 right-2 rounded-full bg-black/80 p-1 text-white hover:bg-black"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. GIF */}
                {activeTab === 'gif' && (
                  <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                      <div className="flex items-center space-x-1.5">
                        <Film className="h-3.5 w-3.5" />
                        <span>Animated GIF</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={gifUrl}
                      onChange={(e) => {
                        setGifUrl(e.target.value);
                        setHasGif(true);
                      }}
                      placeholder="Paste any GIF URL (e.g. from Giphy, Tenor, or web)..."
                      className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {POPULAR_GIFS.map((g) => (
                        <button
                          key={g.title}
                          type="button"
                          onClick={() => {
                            setGifUrl(g.url);
                            setHasGif(true);
                          }}
                          className={`group relative rounded-lg border overflow-hidden text-left p-1 transition cursor-pointer ${
                            gifUrl === g.url
                              ? 'border-pink-500 bg-pink-950/30'
                              : 'border-neutral-900 bg-black hover:border-neutral-700'
                          }`}
                        >
                          <img src={g.url} alt={g.title} className="h-16 w-full object-cover rounded" />
                          <p className="text-[10px] font-medium text-neutral-300 mt-1 truncate">{g.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. VIDEO */}
                {activeTab === 'video' && (
                  <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                      <div className="flex items-center space-x-1.5">
                        <Video className="h-3.5 w-3.5" />
                        <span>Video Attachment (MP4 / WebM)</span>
                      </div>
                      <label className="flex items-center space-x-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 cursor-pointer">
                        <Upload className="h-3 w-3" />
                        <span>Upload Video</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setHasVideo(true);
                      }}
                      placeholder="Paste video URL (https://domain.com/sample.mp4)"
                      className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    {videoUrl && (
                      <div className="relative rounded-lg border border-neutral-800 overflow-hidden bg-black aspect-video max-h-48">
                        <video src={videoUrl} controls playsInline className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                )}

                {/* 6. EVENT INVITE */}
                {activeTab === 'event' && (
                  <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Event Invitation Attachment</span>
                      </div>
                    </div>
                    {eventsList.length > 0 && (
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                          Select Upcoming Platform Event
                        </label>
                        <select
                          value={selectedEventId}
                          onChange={(e) => {
                            setSelectedEventId(e.target.value);
                            setHasEvent(true);
                          }}
                          className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          {eventsList.map((evt) => (
                            <option key={evt.id} value={evt.id}>
                              {evt.title} ({evt.type}) • {evt.startTime || evt.startDate || 'Upcoming'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="border-t border-neutral-800 pt-2">
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                        Or Custom Event Info
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={customEventTitle}
                          onChange={(e) => {
                            setCustomEventTitle(e.target.value);
                            setHasEvent(true);
                          }}
                          placeholder="Event Title"
                          className="rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={customEventTime}
                          onChange={(e) => setCustomEventTime(e.target.value)}
                          placeholder="Time / Date"
                          className="rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. GROUP INVITE */}
                {activeTab === 'group' && (
                  <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                      <div className="flex items-center space-x-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>Group / Community Invitation</span>
                      </div>
                    </div>
                    <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                      Choose Community to Invite Builders
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => {
                        setSelectedGroupId(e.target.value);
                        setHasGroup(true);
                      }}
                      className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {communities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} • {c.membersCount} members ({c.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="react, webgl, creative, tools"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="flex items-center space-x-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Publishing to Feed...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Publish Post</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Live Preview Sidebar */}
          {showPreview && (
            <div className="lg:col-span-5 mt-6 lg:mt-0">
              <div className="sticky top-20 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400 uppercase tracking-wider pb-3 border-b border-neutral-900">
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Interactive Feed Card Preview</span>
                </div>

                {/* Preview Post Card */}
                <div className="rounded-xl border border-neutral-800 bg-black p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={previewPost.author.avatar}
                        alt="Avatar"
                        className="h-8 w-8 rounded-full object-cover border border-neutral-800"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{previewPost.author.name}</span>
                          <span className="text-[10px] text-neutral-500">@{previewPost.author.username}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {selectedComm?.name ? `in ${selectedComm.name}` : 'Public Stream'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug pt-1">
                    {title || 'Your Post Title Here'}
                  </h3>

                  <p className="text-xs text-neutral-400 whitespace-pre-line leading-relaxed">
                    {content || 'Your post context and technical description will appear here on the feed.'}
                  </p>

                  {/* Render all live attachments using PostAttachments component! */}
                  <PostAttachments post={previewPost} />

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-900">
                    {tags.split(',').filter(Boolean).map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
