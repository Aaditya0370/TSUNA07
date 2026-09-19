import React, { useState, useEffect } from 'react';
import {
  X,
  Code2,
  FileText,
  Image as ImageIcon,
  Send,
  Link2,
  Film,
  Video,
  Calendar,
  Users,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Upload,
  Lock,
} from 'lucide-react';
import { Community, Post, TsunaEvent, PostLinkPreview, PostGroupInvite, PostEventInvite } from '../types';
import { api } from '../services/api';
import { savePostToFirestore } from '../services/firebase';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: Community[];
  onPostCreated: (post: Post) => void;
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

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  communities,
  onPostCreated,
  defaultCommunityId,
}) => {
  const [selectedCommunityId, setSelectedCommunityId] = useState(
    defaultCommunityId || communities[0]?.id || ''
  );
  const [isCommunityOnly, setIsCommunityOnly] = useState(Boolean(defaultCommunityId));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('Build, Tsuna, Collab');
  const [activeTab, setActiveTab] = useState<AttachmentTab>('code');

  // Available events for event invite attachment
  const [eventsList, setEventsList] = useState<TsunaEvent[]>([]);

  // 1. Code attachment
  const [hasCode, setHasCode] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [codeFilename, setCodeFilename] = useState('pipeline.ts');
  const [codeContent, setCodeContent] = useState('');

  // 2. Link attachment
  const [hasLink, setHasLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkImage, setLinkImage] = useState('');

  // 3. Image attachment
  const [hasImage, setHasImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // 4. GIF attachment
  const [hasGif, setHasGif] = useState(false);
  const [gifUrl, setGifUrl] = useState('');

  // 5. Video attachment
  const [hasVideo, setHasVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // 6. Event invite attachment
  const [hasEvent, setHasEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [customEventType, setCustomEventType] = useState('hackathon');
  const [customEventTime, setCustomEventTime] = useState('Tomorrow, 6:00 PM UTC');

  // 7. Group invite attachment
  const [hasGroup, setHasGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load events
  useEffect(() => {
    if (isOpen) {
      api.getEvents().then((evts) => {
        setEventsList(evts);
        if (evts.length > 0 && !selectedEventId) {
          setSelectedEventId(evts[0].id);
        }
      }).catch(() => {});

      if (communities.length > 0 && !selectedGroupId) {
        setSelectedGroupId(communities[0].id);
      }
    }
  }, [isOpen, communities]);

  if (!isOpen) return null;

  // Image file upload helper
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

  // Video file upload helper
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
          filename: codeFilename || undefined,
          code: codeContent,
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
      onClose();

      // Reset
      setTitle('');
      setContent('');
      setCodeContent('');
      setLinkUrl('');
      setImageUrl('');
      setGifUrl('');
      setVideoUrl('');
      setHasCode(false);
      setHasLink(false);
      setHasImage(false);
      setHasGif(false);
      setHasVideo(false);
      setHasEvent(false);
      setHasGroup(false);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create New Post</h3>
              <p className="text-[11px] text-neutral-400">
                Attach code, link, image, gif, video, event, or group invite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body with scrolling */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Target Community */}
          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Post to Community / Stream
            </label>
            <select
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
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
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Real-time Raymarching Shader with Audio Reactivity"
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          {/* Content Notes */}
          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Post Body / Description
            </label>
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share context, architectural breakdown, questions, or updates..."
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none resize-none"
            />
          </div>

          {/* ATTACHMENT ACTION BAR */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Attach to Post
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Click to configure attachments
              </span>
            </div>

            {/* Attachment Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {/* Code */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === 'code' ? 'none' : 'code');
                  if (!hasCode) setHasCode(true);
                }}
                className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2 px-2 text-xs transition cursor-pointer ${
                  hasCode
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
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
                className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2 px-2 text-xs transition cursor-pointer ${
                  hasLink
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
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
                className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2 px-2 text-xs transition cursor-pointer ${
                  hasImage
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
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
                className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2 px-2 text-xs transition cursor-pointer ${
                  hasGif
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
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
                className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2 px-2 text-xs transition cursor-pointer ${
                  hasVideo
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Video</span>
                {hasVideo && <Check className="h-3 w-3 text-emerald-400" />}
              </button>

              {/* Event Invite */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === 'event' ? 'none' : 'event');
                  if (!hasEvent) setHasEvent(true);
                }}
                className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2 px-2 text-xs transition cursor-pointer ${
                  hasEvent
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Event</span>
                {hasEvent && <Check className="h-3 w-3 text-emerald-400" />}
              </button>

              {/* Group Invite */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === 'group' ? 'none' : 'group');
                  if (!hasGroup) setHasGroup(true);
                }}
                className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2 px-2 text-xs transition cursor-pointer ${
                  hasGroup
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Group</span>
                {hasGroup && <Check className="h-3 w-3 text-emerald-400" />}
              </button>
            </div>

            {/* Active Attachment Chips */}
            {(hasCode || hasLink || hasImage || hasGif || hasVideo || hasEvent || hasGroup) && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-neutral-800/80 pt-2.5">
                <span className="text-[10px] font-mono text-neutral-400 self-center mr-1">Attached:</span>
                {hasCode && (
                  <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                    <span>Code ({codeLanguage})</span>
                    <button
                      type="button"
                      onClick={() => setHasCode(false)}
                      className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {hasLink && (
                  <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                    <span>Link</span>
                    <button
                      type="button"
                      onClick={() => setHasLink(false)}
                      className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {hasImage && (
                  <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                    <span>Image</span>
                    <button
                      type="button"
                      onClick={() => setHasImage(false)}
                      className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {hasGif && (
                  <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                    <span>GIF</span>
                    <button
                      type="button"
                      onClick={() => setHasGif(false)}
                      className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {hasVideo && (
                  <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                    <span>Video</span>
                    <button
                      type="button"
                      onClick={() => setHasVideo(false)}
                      className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {hasEvent && (
                  <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                    <span>Event Invite</span>
                    <button
                      type="button"
                      onClick={() => setHasEvent(false)}
                      className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {hasGroup && (
                  <span className="flex items-center space-x-1 rounded-md bg-neutral-800 px-2 py-1 text-[10px] text-white">
                    <span>Group Invite</span>
                    <button
                      type="button"
                      onClick={() => setHasGroup(false)}
                      className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ATTACHMENT CONFIG PANELS */}

          {/* 1. CODE PANEL */}
          {activeTab === 'code' && (
            <div className="rounded-xl border border-neutral-800 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                    Code Snippet
                  </span>
                  <input
                    type="text"
                    value={codeFilename}
                    onChange={(e) => setCodeFilename(e.target.value)}
                    placeholder="filename.ext"
                    className="rounded border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-xs text-neutral-300 font-mono focus:outline-none"
                  />
                </div>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="rounded border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-xs text-neutral-300 font-mono focus:outline-none"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="rust">Rust</option>
                  <option value="wgsl">WGSL</option>
                  <option value="glsl">GLSL</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="go">Go</option>
                  <option value="cpp">C++</option>
                  <option value="html">HTML / CSS</option>
                </select>
              </div>
              <textarea
                rows={4}
                value={codeContent}
                onChange={(e) => {
                  setCodeContent(e.target.value);
                  setHasCode(true);
                }}
                placeholder="// Paste code snippet here..."
                className="w-full rounded-lg border border-neutral-800/80 bg-neutral-950 p-3 font-mono text-xs text-neutral-200 focus:border-neutral-700 focus:outline-none"
              />
            </div>
          )}

          {/* 2. LINK PANEL */}
          {activeTab === 'link' && (
            <div className="rounded-xl border border-neutral-800 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  Link Preview Card
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">URLs with auto-preview</span>
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
                placeholder="https://github.com/my-repo or https://threejs.org"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Link Title (optional)"
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  placeholder="Summary / Description (optional)"
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              {linkUrl && (
                <div className="rounded-lg border border-neutral-900 bg-neutral-950 p-2.5 flex items-center space-x-2 text-xs">
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate text-neutral-300 font-mono text-[11px]">{linkUrl}</span>
                </div>
              )}
            </div>
          )}

          {/* 3. IMAGE PANEL */}
          {activeTab === 'image' && (
            <div className="rounded-xl border border-neutral-800 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  Image Attachment
                </span>
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
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
              />
              {imageUrl && (
                <div className="relative rounded-lg border border-neutral-800 overflow-hidden max-h-48 bg-neutral-900">
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

          {/* 4. GIF PANEL */}
          {activeTab === 'gif' && (
            <div className="rounded-xl border border-neutral-800 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  Animated GIF
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Select preset or paste URL</span>
              </div>
              <input
                type="text"
                value={gifUrl}
                onChange={(e) => {
                  setGifUrl(e.target.value);
                  setHasGif(true);
                }}
                placeholder="Paste any GIF URL (e.g. from Giphy, Tenor, or web)..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
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
                        : 'border-neutral-900 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <img src={g.url} alt={g.title} className="h-16 w-full object-cover rounded" />
                    <p className="text-[10px] font-medium text-neutral-300 mt-1 truncate">{g.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. VIDEO PANEL */}
          {activeTab === 'video' && (
            <div className="rounded-xl border border-neutral-800 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  Video Attachment (MP4 / WebM)
                </span>
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
                placeholder="Or paste direct video URL (e.g. https://domain.com/clip.mp4)"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
              />
              {videoUrl && (
                <div className="relative rounded-lg border border-neutral-800 overflow-hidden bg-black aspect-video max-h-44">
                  <video src={videoUrl} controls playsInline className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          )}

          {/* 6. EVENT INVITE PANEL */}
          {activeTab === 'event' && (
            <div className="rounded-xl border border-neutral-800 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  Attach Event Invite
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">RSVP card directly on post</span>
              </div>

              {eventsList.length > 0 && (
                <div>
                  <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                    Select From Upcoming Platform Events
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      setHasEvent(true);
                    }}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {eventsList.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.type}) • {evt.startTime || evt.startDate || 'Upcoming'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="border-t border-neutral-900 pt-2">
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  Or Custom Event Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customEventTitle}
                    onChange={(e) => {
                      setCustomEventTitle(e.target.value);
                      setHasEvent(true);
                    }}
                    placeholder="Custom Event Title"
                    className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={customEventTime}
                    onChange={(e) => setCustomEventTime(e.target.value)}
                    placeholder="Time / Date (e.g. This Friday, 7 PM)"
                    className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. GROUP INVITE PANEL */}
          {activeTab === 'group' && (
            <div className="rounded-xl border border-neutral-800 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  Attach Group / Community Invite
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">1-click Join on post</span>
              </div>
              <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                Select Community to Invite Builders
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setHasGroup(true);
                }}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} • {c.membersCount} members ({c.category})
                  </option>
                ))}
              </select>
              {selectedGroupId && (
                (() => {
                  const comm = communities.find((c) => c.id === selectedGroupId);
                  if (!comm) return null;
                  return (
                    <div className="flex items-center space-x-3 rounded-lg border border-neutral-900 bg-neutral-950 p-2.5">
                      <img src={comm.avatar} alt={comm.name} className="h-9 w-9 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-bold text-white">{comm.name}</p>
                        <p className="text-[10px] text-neutral-400 line-clamp-1">{comm.tagline}</p>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="WebGPU, Rust, Shaders, Creative"
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none font-mono"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-neutral-900 pt-4 shrink-0">
            <span className="text-[11px] font-mono text-neutral-500">
              Ready to publish to Tsuna
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex items-center space-x-1.5 rounded-lg bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Post'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
