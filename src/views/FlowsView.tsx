import React, { useState, useEffect, useRef } from 'react';
import { Flow, User, PostCodeSnippet } from '../types';
import {
  Play,
  Pause,
  Clock,
  Share2,
  Heart,
  Bookmark,
  UserPlus,
  UserCheck,
  MessageSquare,
  Code2,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Plus,
  Search,
  Volume2,
  Layers,
  Cpu,
  Eye,
  Send,
  X,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';

interface FlowsViewProps {
  currentUser: User | null;
  onOpenShareModal: (item: any) => void;
  onNavigate?: (tab: string, param?: string) => void;
}

export const FlowsView: React.FC<FlowsViewProps> = ({ currentUser, onOpenShareModal, onNavigate }) => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'saved' | 'code_walkthrough' | 'sound_design' | 'ui_prototype' | 'build_in_public'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFlowCode, setCopiedFlowCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [hoveringFollow, setHoveringFollow] = useState(false);

  // Walkthrough simulation playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100%
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Content viewer tabs: Overview / Breakdown vs Code vs Comments
  const [activeContentTab, setActiveContentTab] = useState<'breakdown' | 'code' | 'comments'>('breakdown');
  const [newCommentText, setNewCommentText] = useState('');
  const [localComments, setLocalComments] = useState<
    { id: string; author: User; text: string; createdAt: string }[]
  >([]);

  // Publish new flow modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState('02:30');
  const [newType, setNewType] = useState<Flow['type']>('code_walkthrough');
  const [newLanguage, setNewLanguage] = useState('typescript');
  const [newFilename, setNewFilename] = useState('demo.ts');
  const [newCode, setNewCode] = useState('');
  const [newTags, setNewTags] = useState('WebGPU, Shader, Tech');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const list = await api.getFlows();
      setFlows(list);
      if (list.length > 0 && !selectedFlow) {
        setSelectedFlow(list[0]);
      } else if (selectedFlow) {
        // Keep selectedFlow in sync with any updated properties
        const updated = list.find((f) => f.id === selectedFlow.id);
        if (updated) setSelectedFlow(updated);
      }
    } catch (err) {
      console.error('Failed to load flows:', err);
    }
  };

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1.2;
        });
      }, 500);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying]);

  // Toggle playback
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (playbackProgress >= 100) setPlaybackProgress(0);
      setIsPlaying(true);
    }
  };

  // 1. LIKE FEATURE
  const handleToggleLike = async (flowId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    const updatedFlows = flows.map((f) => {
      if (f.id === flowId) {
        const nextLiked = !f.isLiked;
        return {
          ...f,
          isLiked: nextLiked,
          likes: Math.max(0, f.likes + (nextLiked ? 1 : -1)),
        };
      }
      return f;
    });
    setFlows(updatedFlows);

    if (selectedFlow?.id === flowId) {
      const nextLiked = !selectedFlow.isLiked;
      setSelectedFlow({
        ...selectedFlow,
        isLiked: nextLiked,
        likes: Math.max(0, selectedFlow.likes + (nextLiked ? 1 : -1)),
      });
    }

    try {
      const res = await api.toggleLikeFlow(flowId);
      // Synchronize with server response
      setFlows((prev) => prev.map((item) => (item.id === flowId ? { ...item, ...res } : item)));
      if (selectedFlow?.id === flowId) {
        setSelectedFlow((prev) => (prev ? { ...prev, ...res } : null));
      }
    } catch (err) {
      console.error('Failed to toggle like on flow:', err);
      // Revert on error
      loadFlows();
    }
  };

  // 2. SAVE (BOOKMARK) FEATURE
  const handleToggleSave = async (flowId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    const updatedFlows = flows.map((f) => {
      if (f.id === flowId) {
        const nextSaved = !f.isSaved;
        return {
          ...f,
          isSaved: nextSaved,
          savesCount: Math.max(0, (f.savesCount || 0) + (nextSaved ? 1 : -1)),
        };
      }
      return f;
    });
    setFlows(updatedFlows);

    if (selectedFlow?.id === flowId) {
      const nextSaved = !selectedFlow.isSaved;
      setSelectedFlow({
        ...selectedFlow,
        isSaved: nextSaved,
        savesCount: Math.max(0, (selectedFlow.savesCount || 0) + (nextSaved ? 1 : -1)),
      });
    }

    try {
      const res = await api.toggleSaveFlow(flowId);
      setFlows((prev) => prev.map((item) => (item.id === flowId ? { ...item, ...res } : item)));
      if (selectedFlow?.id === flowId) {
        setSelectedFlow((prev) => (prev ? { ...prev, ...res } : null));
      }
    } catch (err) {
      console.error('Failed to toggle save on flow:', err);
      loadFlows();
    }
  };

  // 3. SHARE FEATURE
  const handleShareFlow = async (
    flow: Flow,
    method: 'copy' | 'chat' | 'twitter' | 'native',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setShareDropdownOpen(false);

    // Optimistic share count increment
    const nextSharesCount = (flow.sharesCount || 0) + 1;
    setFlows((prev) =>
      prev.map((f) => (f.id === flow.id ? { ...f, sharesCount: nextSharesCount } : f))
    );
    if (selectedFlow?.id === flow.id) {
      setSelectedFlow((prev) => (prev ? { ...prev, sharesCount: nextSharesCount } : null));
    }

    // Call server to record share metric
    api.trackFlowShare(flow.id).catch((err) => console.warn('Share track error:', err));

    const flowUrl = `${window.location.origin}/flows?id=${flow.id}`;

    if (method === 'copy') {
      navigator.clipboard.writeText(flowUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else if (method === 'chat') {
      onOpenShareModal({
        type: 'flow',
        title: flow.title,
        description: flow.content || flow.description,
        id: flow.id,
      });
    } else if (method === 'twitter') {
      const tweetText = encodeURIComponent(
        `Check out "${flow.title}" by ${(flow.creator || flow.author).name} on Tsuna Flows!\n\n${flowUrl}`
      );
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
    } else if (method === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: flow.title,
            text: flow.description,
            url: flowUrl,
          });
        } catch {
          // fallback to clipboard
          navigator.clipboard.writeText(flowUrl);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2500);
        }
      } else {
        navigator.clipboard.writeText(flowUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    }
  };

  // 4. FOLLOW FEATURE
  const handleToggleFollow = async (authorId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Determine current follow state of this author
    const currentFollowState = Boolean(
      (selectedFlow?.creator?.id === authorId
        ? selectedFlow.creator.isFollowing
        : selectedFlow?.author.isFollowing) ||
        flows.find((f) => (f.creator?.id || f.author.id) === authorId)?.author.isFollowing
    );
    const nextFollowState = !currentFollowState;

    // Optimistic update across all flows authored by this creator
    setFlows((prev) =>
      prev.map((f) => {
        const fAuthorId = (f.creator || f.author).id;
        if (fAuthorId === authorId) {
          const currentCount = (f.creator || f.author).followersCount || 100;
          const nextCount = Math.max(0, currentCount + (nextFollowState ? 1 : -1));
          return {
            ...f,
            author: {
              ...f.author,
              isFollowing: nextFollowState,
              followersCount: nextCount,
            },
            creator: f.creator
              ? {
                  ...f.creator,
                  isFollowing: nextFollowState,
                  followersCount: nextCount,
                }
              : undefined,
          };
        }
        return f;
      })
    );

    if (selectedFlow && (selectedFlow.creator || selectedFlow.author).id === authorId) {
      const currentCount = (selectedFlow.creator || selectedFlow.author).followersCount || 100;
      const nextCount = Math.max(0, currentCount + (nextFollowState ? 1 : -1));
      setSelectedFlow({
        ...selectedFlow,
        author: {
          ...selectedFlow.author,
          isFollowing: nextFollowState,
          followersCount: nextCount,
        },
        creator: selectedFlow.creator
          ? {
              ...selectedFlow.creator,
              isFollowing: nextFollowState,
              followersCount: nextCount,
            }
          : undefined,
      });
    }

    try {
      const res = await api.toggleFollowUser(authorId);
      // Synchronize with server response
      setFlows((prev) =>
        prev.map((f) => {
          if ((f.creator || f.author).id === authorId) {
            return {
              ...f,
              author: {
                ...f.author,
                isFollowing: res.isFollowing,
                followersCount: res.followersCount,
              },
            };
          }
          return f;
        })
      );
    } catch (err) {
      console.error('Failed to follow/unfollow author:', err);
      loadFlows();
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFlowCode(true);
    setTimeout(() => setCopiedFlowCode(false), 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newC = {
      id: `c_${Date.now()}`,
      author: currentUser || {
        id: 'usr_guest',
        name: 'Tsuna Builder',
        username: 'builder',
        roleTitle: 'Creator',
        avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=tsuna_builder',
        bio: 'Active builder on Tsuna',
        skills: ['TypeScript'],
        isOnline: true,
      },
      text: newCommentText.trim(),
      createdAt: 'Just now',
    };

    setLocalComments([newC, ...localComments]);
    setNewCommentText('');

    if (selectedFlow) {
      setSelectedFlow({
        ...selectedFlow,
        commentsCount: (selectedFlow.commentsCount || 0) + 1,
      });
      setFlows((prev) =>
        prev.map((f) =>
          f.id === selectedFlow.id
            ? { ...f, commentsCount: (f.commentsCount || 0) + 1 }
            : f
        )
      );
    }
  };

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setIsSubmitting(true);
    try {
      let codeSnippet: PostCodeSnippet | undefined = undefined;
      if (newCode.trim()) {
        codeSnippet = {
          language: newLanguage,
          filename: newFilename.trim() || 'snippet.txt',
          code: newCode.trim(),
        };
      }

      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const created = await api.createFlow({
        title: newTitle.trim(),
        description: newDescription.trim(),
        content: newDescription.trim(),
        duration: newDuration.trim() || '02:00',
        type: newType,
        codeSnippet,
        tags: tagsArray.length > 0 ? tagsArray : ['Tsuna', 'Flow'],
      });

      setFlows([created, ...flows]);
      setSelectedFlow(created);
      setIsPublishModalOpen(false);

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewCode('');
    } catch (err) {
      console.error('Failed to create flow:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered flows computation
  const filteredFlows = flows.filter((f) => {
    // Filter Tab
    if (filterTab === 'saved' && !f.isSaved) return false;
    if (
      filterTab !== 'all' &&
      filterTab !== 'saved' &&
      f.type !== filterTab
    ) {
      return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const authorName = (f.creator || f.author).name.toLowerCase();
      const title = f.title.toLowerCase();
      const desc = (f.content || f.description || '').toLowerCase();
      const hasTag = f.tags.some((t) => t.toLowerCase().includes(q));
      return authorName.includes(q) || title.includes(q) || desc.includes(q) || hasTag;
    }

    return true;
  });

  const savedFlowsCount = flows.filter((f) => f.isSaved).length;
  const activeAuthor = selectedFlow ? selectedFlow.creator || selectedFlow.author : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Toast for Copied Link */}
      {copiedLink && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-neutral-900/95 px-4 py-2.5 text-xs font-medium text-emerald-300 shadow-2xl backdrop-blur">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Flow link copied to clipboard!</span>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="border-b border-neutral-900 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Technical Micro-Walkthroughs (&lt; 4 mins)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Tsuna Flows
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Dense, bite-sized compute walkthroughs, shader breakdowns, and procedural sound design.
            Like, bookmark, share, and follow top creators.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center space-x-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Publish Flow</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category / Saved Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterTab('all')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterTab === 'all'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-900'
            }`}
          >
            All Flows ({flows.length})
          </button>

          <button
            onClick={() => setFilterTab('saved')}
            className={`flex items-center space-x-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterTab === 'saved'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-800/80 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 hover:text-amber-300/80 border border-neutral-900'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${filterTab === 'saved' ? 'fill-amber-400' : ''}`} />
            <span>Saved ({savedFlowsCount})</span>
          </button>

          <button
            onClick={() => setFilterTab('code_walkthrough')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterTab === 'code_walkthrough'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-900'
            }`}
          >
            Compute & Shaders
          </button>

          <button
            onClick={() => setFilterTab('sound_design')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterTab === 'sound_design'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-900'
            }`}
          >
            DSP & Audio
          </button>

          <button
            onClick={() => setFilterTab('ui_prototype')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterTab === 'ui_prototype'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-900'
            }`}
          >
            UI Physics
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search flows, tags, creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main layout: Featured Flow viewer + Flows List */}
      {flows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-12 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 text-emerald-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No technical flows published yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
              Flows are bite-sized micro-walkthroughs and compute breakdowns shared by creators.
            </p>
          </div>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-black hover:bg-emerald-400 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Flow</span>
          </button>
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-12 text-center space-y-3">
          <p className="text-sm text-neutral-300 font-medium">No flows match your current filter.</p>
          {filterTab === 'saved' ? (
            <p className="text-xs text-neutral-400">
              Bookmark flows using the save button on any walkthrough card to curate your library.
            </p>
          ) : (
            <p className="text-xs text-neutral-400">Try adjusting your search keywords or tags.</p>
          )}
          <button
            onClick={() => {
              setFilterTab('all');
              setSearchQuery('');
            }}
            className="text-xs text-emerald-400 underline hover:text-emerald-300 mt-2"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Active Flow Player & Interactive Breakdown (7 cols) */}
          {selectedFlow && (
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
                {/* Media Preview Box & Video Simulation */}
                <div className="relative aspect-video w-full bg-black flex items-center justify-center border-b border-neutral-900 group">
                  <img
                    src={
                      selectedFlow.previewMedia ||
                      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={selectedFlow.title}
                    className="h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/50" />

                  {/* Play/Pause Button in Center */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <button
                      onClick={handleTogglePlay}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-black shadow-2xl hover:scale-110 active:scale-95 transition cursor-pointer"
                      title={isPlaying ? 'Pause Walkthrough' : 'Play Walkthrough'}
                    >
                      {isPlaying ? (
                        <Pause className="h-7 w-7 fill-current" />
                      ) : (
                        <Play className="h-7 w-7 fill-current ml-1" />
                      )}
                    </button>
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="rounded bg-black/85 px-2.5 py-0.5 font-mono text-[11px] text-white border border-white/10 shadow-lg">
                        {isPlaying ? 'Playing • ' : ''}
                        {selectedFlow.duration} Breakdown
                      </span>
                      {isPlaying && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scrubber / Progress Timeline at bottom of player */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300 mb-1">
                      <span>{isPlaying ? 'Interactive Walkthrough Progress' : 'Walkthrough Ready'}</span>
                      <span>{Math.round(playbackProgress)}%</span>
                    </div>
                    <div
                      className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                        setPlaybackProgress(pct);
                      }}
                    >
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${playbackProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Flow Details & Interactivity */}
                <div className="p-6 space-y-5">
                  {/* Top Bar: Author Info + Follow Button + Share Dropdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-4">
                    {/* Creator Identity & Follow */}
                    <div
                      onClick={() => activeAuthor?.username && onNavigate?.('user-landing', activeAuthor.username)}
                      className="flex items-center space-x-3 cursor-pointer group/creator"
                      title={`Visit @${activeAuthor?.username}'s personal landing page`}
                    >
                      <img
                        src={activeAuthor?.avatar}
                        alt={activeAuthor?.name}
                        className="h-11 w-11 rounded-full object-cover border border-neutral-700/80 shadow-md group-hover/creator:border-emerald-400 transition"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-bold text-white group-hover/creator:text-emerald-300 transition leading-tight">
                            {activeAuthor?.name}
                          </p>
                          <span className="text-xs text-neutral-400">
                            @{activeAuthor?.username}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-0.5">
                          <span>{activeAuthor?.roleTitle}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400/90">
                            {activeAuthor?.followersCount || 100} followers
                          </span>
                        </div>
                      </div>

                      {/* Follow / Following Button */}
                      {activeAuthor && activeAuthor.id !== currentUser?.id && (
                        <button
                          onClick={(e) => handleToggleFollow(activeAuthor.id, e)}
                          onMouseEnter={() => setHoveringFollow(true)}
                          onMouseLeave={() => setHoveringFollow(false)}
                          className={`ml-2 flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                            activeAuthor.isFollowing
                              ? hoveringFollow
                                ? 'border border-rose-900/60 bg-rose-950/40 text-rose-300'
                                : 'border border-emerald-700/80 bg-emerald-950/30 text-emerald-300'
                              : 'bg-white text-black hover:bg-neutral-200'
                          }`}
                        >
                          {activeAuthor.isFollowing ? (
                            hoveringFollow ? (
                              <>
                                <X className="h-3.5 w-3.5 text-rose-400" />
                                <span>Unfollow</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Following</span>
                              </>
                            )
                          ) : (
                            <>
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Action Hub: Like, Save, Share */}
                    <div className="flex items-center space-x-2 relative">
                      {/* LIKE BUTTON */}
                      <button
                        onClick={(e) => handleToggleLike(selectedFlow.id, e)}
                        className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                          selectedFlow.isLiked
                            ? 'border-rose-900/80 bg-rose-950/40 text-rose-400 shadow-sm shadow-rose-950'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-rose-400 hover:border-neutral-700'
                        }`}
                        title={selectedFlow.isLiked ? 'Unlike' : 'Like this flow'}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            selectedFlow.isLiked ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                        <span>{selectedFlow.likes || 0}</span>
                      </button>

                      {/* SAVE (BOOKMARK) BUTTON */}
                      <button
                        onClick={(e) => handleToggleSave(selectedFlow.id, e)}
                        className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                          selectedFlow.isSaved
                            ? 'border-amber-800/80 bg-amber-950/40 text-amber-300 shadow-sm shadow-amber-950'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-amber-300 hover:border-neutral-700'
                        }`}
                        title={selectedFlow.isSaved ? 'Remove from Saved' : 'Save for later'}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${
                            selectedFlow.isSaved ? 'fill-amber-400 text-amber-400' : ''
                          }`}
                        />
                        <span>{selectedFlow.isSaved ? 'Saved' : 'Save'}</span>
                        {selectedFlow.savesCount ? (
                          <span className="font-mono text-[10px] opacity-80">
                            ({selectedFlow.savesCount})
                          </span>
                        ) : null}
                      </button>

                      {/* SHARE BUTTON WITH DROPDOWN */}
                      <div className="relative">
                        <button
                          onClick={() => setShareDropdownOpen(!shareDropdownOpen)}
                          className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 transition active:scale-95"
                        >
                          <Share2 className="h-4 w-4 text-emerald-400" />
                          <span>Share</span>
                          {selectedFlow.sharesCount ? (
                            <span className="font-mono text-[10px] text-neutral-400">
                              ({selectedFlow.sharesCount})
                            </span>
                          ) : null}
                        </button>

                        {/* Share Menu Popover */}
                        {shareDropdownOpen && (
                          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-900/95 p-1.5 shadow-2xl backdrop-blur z-30 space-y-1">
                            <button
                              onClick={(e) => handleShareFlow(selectedFlow, 'copy', e)}
                              className="flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 hover:text-white transition text-left"
                            >
                              <Copy className="h-3.5 w-3.5 text-neutral-400" />
                              <span>Copy Flow Link</span>
                            </button>

                            <button
                              onClick={(e) => handleShareFlow(selectedFlow, 'chat', e)}
                              className="flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 hover:text-white transition text-left"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Share to Community Chat</span>
                            </button>

                            <button
                              onClick={(e) => handleShareFlow(selectedFlow, 'twitter', e)}
                              className="flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 hover:text-white transition text-left"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                              <span>Share to X (Twitter)</span>
                            </button>

                            {typeof navigator.share === 'function' && (
                              <button
                                onClick={(e) => handleShareFlow(selectedFlow, 'native', e)}
                                className="flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 hover:text-white transition text-left border-t border-neutral-800 pt-1.5"
                              >
                                <Share2 className="h-3.5 w-3.5 text-neutral-300" />
                                <span>More Share Options...</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flow Title & Metadata */}
                  <div>
                    <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 mb-1.5">
                      <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 uppercase tracking-wider">
                        {selectedFlow.type.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="text-neutral-400">{selectedFlow.createdAt}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-neutral-400">
                        <Eye className="h-3 w-3" />
                        <span>{selectedFlow.views} views</span>
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                      {selectedFlow.title}
                    </h2>
                  </div>

                  {/* Tabs: Breakdown vs Code vs Comments */}
                  <div className="flex border-b border-neutral-900 space-x-4 text-xs font-medium">
                    <button
                      onClick={() => setActiveContentTab('breakdown')}
                      className={`pb-2.5 transition border-b-2 ${
                        activeContentTab === 'breakdown'
                          ? 'border-emerald-400 text-white'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Walkthrough Steps
                    </button>

                    {selectedFlow.codeSnippet && (
                      <button
                        onClick={() => setActiveContentTab('code')}
                        className={`flex items-center space-x-1.5 pb-2.5 transition border-b-2 ${
                          activeContentTab === 'code'
                            ? 'border-emerald-400 text-white'
                            : 'border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Code ({selectedFlow.codeSnippet.language})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveContentTab('comments')}
                      className={`flex items-center space-x-1.5 pb-2.5 transition border-b-2 ${
                        activeContentTab === 'comments'
                          ? 'border-emerald-400 text-white'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Discussion ({selectedFlow.commentsCount || localComments.length})</span>
                    </button>
                  </div>

                  {/* Tab 1: Walkthrough Steps */}
                  {activeContentTab === 'breakdown' && (
                    <div className="space-y-4">
                      <p className="text-xs sm:text-sm text-neutral-300 whitespace-pre-line leading-relaxed">
                        {selectedFlow.content || selectedFlow.description}
                      </p>

                      {/* Technical Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {selectedFlow.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400 hover:text-neutral-200 transition"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Runnable / Copyable Code */}
                  {activeContentTab === 'code' && selectedFlow.codeSnippet && (
                    <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden">
                      <div className="flex items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4 py-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                          <span className="font-mono text-xs text-neutral-300 font-semibold">
                            {selectedFlow.codeSnippet.filename || 'source_code'}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            selectedFlow.codeSnippet &&
                            handleCopyCode(selectedFlow.codeSnippet.code)
                          }
                          className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:text-white font-mono transition"
                        >
                          {copiedFlowCode ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Source</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed max-h-96">
                        <code>{selectedFlow.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Tab 3: Creator Discussion / Comments */}
                  {activeContentTab === 'comments' && (
                    <div className="space-y-4">
                      {/* New Comment Input */}
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ask a technical question or share insights..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-500/70 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!newCommentText.trim()}
                          className="flex items-center space-x-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3.5 py-2 text-xs font-semibold text-black transition"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Reply</span>
                        </button>
                      </form>

                      {/* Comments Feed */}
                      <div className="space-y-3 pt-2">
                        {localComments.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={c.author.avatar}
                                  alt={c.author.name}
                                  className="h-6 w-6 rounded-full object-cover border border-neutral-800"
                                />
                                <span className="text-xs font-bold text-white">
                                  {c.author.name}
                                </span>
                                <span className="text-[10px] text-neutral-500">
                                  @{c.author.username}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {c.createdAt}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-300 pl-8 leading-relaxed">
                              {c.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right: Browse Flows List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                {filterTab === 'saved' ? 'Saved Bookmarks' : 'Explore Flows'} ({filteredFlows.length})
              </h3>
              {filterTab === 'saved' && (
                <span className="text-[11px] text-amber-400 font-mono">
                  {savedFlowsCount} Bookmarked
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
              {filteredFlows.map((f) => {
                const isSelected = selectedFlow?.id === f.id;
                const author = f.creator || f.author;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFlow(f)}
                    className={`cursor-pointer rounded-xl border p-4 transition duration-200 relative group ${
                      isSelected
                        ? 'border-emerald-500/80 bg-neutral-900/80 shadow-lg shadow-emerald-950/20'
                        : 'border-neutral-900 bg-neutral-950/70 hover:border-neutral-800 hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Top meta row */}
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-neutral-400 mb-1.5 flex-wrap">
                          <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                            <Clock className="h-3 w-3" />
                            <span>{f.duration}</span>
                          </span>
                          <span>•</span>
                          <span className="text-neutral-300 font-medium truncate max-w-[120px]">
                            {author.name}
                          </span>
                          {author.isFollowing && (
                            <span className="text-[9px] rounded bg-emerald-950/60 border border-emerald-800/80 px-1 text-emerald-300">
                              Following
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-emerald-300 transition">
                          {f.title}
                        </h4>

                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                          {f.content || f.description}
                        </p>

                        {/* Interactive action pills on flow card */}
                        <div className="flex items-center space-x-3 mt-3 pt-2 border-t border-neutral-900/80 text-xs">
                          {/* Like button on card */}
                          <button
                            onClick={(e) => handleToggleLike(f.id, e)}
                            className={`flex items-center space-x-1 transition ${
                              f.isLiked ? 'text-rose-400 font-semibold' : 'text-neutral-400 hover:text-rose-400'
                            }`}
                            title="Like flow"
                          >
                            <Heart
                              className={`h-3.5 w-3.5 ${f.isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                            />
                            <span className="text-[11px]">{f.likes || 0}</span>
                          </button>

                          {/* Save / Bookmark button on card */}
                          <button
                            onClick={(e) => handleToggleSave(f.id, e)}
                            className={`flex items-center space-x-1 transition ${
                              f.isSaved ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-amber-300'
                            }`}
                            title="Bookmark flow"
                          >
                            <Bookmark
                              className={`h-3.5 w-3.5 ${f.isSaved ? 'fill-amber-400 text-amber-400' : ''}`}
                            />
                            <span className="text-[11px]">{f.isSaved ? 'Saved' : 'Save'}</span>
                          </button>

                          {/* Share button on card */}
                          <button
                            onClick={(e) => handleShareFlow(f, 'chat', e)}
                            className="flex items-center space-x-1 text-neutral-400 hover:text-emerald-400 transition ml-auto"
                            title="Share to chat"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            <span className="text-[11px]">{f.sharesCount || 0}</span>
                          </button>
                        </div>
                      </div>

                      {/* Thumbnail with overlay play icon */}
                      <div className="relative h-20 w-24 rounded-lg overflow-hidden border border-neutral-800 shrink-0 bg-neutral-900">
                        <img
                          src={
                            f.previewMedia ||
                            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80'
                          }
                          alt={f.title}
                          className="h-full w-full object-cover opacity-75 group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                          <div className="h-6 w-6 rounded-full bg-white/90 text-black flex items-center justify-center shadow">
                            <Play className="h-3 w-3 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH NEW FLOW MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Publish a Technical Flow</h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFlow} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Flow Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100k GPU Particles with WGSL Compute Shaders"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="02:30"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Category Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as Flow['type'])}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="code_walkthrough">Code Walkthrough</option>
                    <option value="sound_design">Sound Design (DSP)</option>
                    <option value="ui_prototype">UI Prototype / Physics</option>
                    <option value="build_in_public">Build In Public</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Step-by-step Walkthrough Breakdown
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail the technical architecture, mathematical insights, or algorithmic steps..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Code snippet block */}
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                  <span>Attached Code Snippet (Optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Filename: e.g. shader.wgsl"
                    value={newFilename}
                    onChange={(e) => setNewFilename(e.target.value)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Language: wgsl, typescript, etc."
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <textarea
                  rows={4}
                  placeholder="// Paste key algorithm or compute shader here..."
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-black font-mono px-3 py-2 text-xs text-emerald-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="WebGPU, WGSL, Performance"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-5 py-2 text-xs font-semibold text-black shadow-lg transition"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Flow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
