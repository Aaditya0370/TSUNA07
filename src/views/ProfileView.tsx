import React, { useState, useEffect, useRef } from 'react';
import { User, Post, Community } from '../types';
import {
  ArrowLeft,
  Edit3,
  MapPin,
  Clock,
  Github,
  Globe,
  Twitter,
  Code2,
  Users,
  Trophy,
  X,
  Check,
  Calendar,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  Sparkles,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Shield,
  AtSign,
  User as UserIcon,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { uploadUserFileToStorage, saveUserToFirestore } from '../services/firebase';
import { Cloud, Database } from 'lucide-react';
import { ProfileCustomizerView } from './ProfileCustomizerView';
import { PostAttachments } from '../components/PostAttachments';

interface ProfileViewProps {
  currentUser: User | null;
  posts: Post[];
  communities: Community[];
  onSelectCommunity: (id: string) => void;
  onRefreshUser: () => void;
  onNavigate?: (tab: string) => void;
}

// Curated avatar presets with high-resolution developer and creative aesthetics
const PRESET_AVATARS = [
  {
    name: 'Cyberpunk Shader',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Systems Architect',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Minimal Monolith',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Generative Coder',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'WebGPU Engineer',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sound Architect',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: '3D Raymarcher',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Creative Technologist',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
  },
];

// Curated banner presets
const PRESET_BANNERS = [
  {
    name: 'Obsidian Matrix',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tokyo Neon Cyber',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ambient Synth Glow',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Deep Quantum Void',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Analog DSP Synth',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Generative Cyber Grid',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
  },
];

// Quick suggestion skills
const POPULAR_SKILLS = [
  'WebGPU',
  'GLSL',
  'Rust',
  'Audio DSP',
  'Three.js',
  'WGSL',
  'React',
  'TypeScript',
  'PyTorch',
  'Creative Coding',
  'Shaders',
  'Generative Art',
];

// Status emoji options
const STATUS_EMOJIS = ['⚡', '🎧', '🚀', '💻', '☕', '🧪', '🎨', '👾', '🔥', '🌌'];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  posts,
  communities,
  onSelectCommunity,
  onRefreshUser,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'communities' | 'submissions'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalTab, setModalTab] = useState<'visuals' | 'identity' | 'bio' | 'skills' | 'socials'>('visuals');

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [bio, setBio] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [statusEmoji, setStatusEmoji] = useState('⚡');
  const [availability, setAvailability] = useState<'available' | 'busy' | 'stealth' | 'mentoring'>('available');
  const [pronouns, setPronouns] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Social Links
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [discord, setDiscord] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Image validation states for web image link address
  const [avatarStatus, setAvatarStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [bannerStatus, setBannerStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opening edit modal or when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setAvatar(currentUser.avatar || '');
      setBanner(currentUser.banner || '');
      setBio(currentUser.bio || '');
      setRoleTitle(currentUser.roleTitle || '');
      setLocation(currentUser.location || '');
      setTimezone(currentUser.timezone || '');
      setCustomStatus(currentUser.customStatus || '');
      setStatusEmoji(currentUser.statusEmoji || '⚡');
      setAvailability(currentUser.availability || 'available');
      setPronouns(currentUser.pronouns || '');
      setSkillsList(currentUser.skills || []);

      setGithub(currentUser.links?.github || currentUser.externalAccounts?.github || '');
      setWebsite(currentUser.links?.website || currentUser.externalAccounts?.website || '');
      setTwitter(currentUser.links?.twitter || currentUser.externalAccounts?.x || '');
      setDiscord(currentUser.links?.discord || '');
      setLinkedin(currentUser.links?.linkedin || currentUser.externalAccounts?.linkedin || '');
    }
  }, [currentUser, showEditModal]);

  // Validate avatar web link address
  useEffect(() => {
    if (!avatar || !avatar.trim()) {
      setAvatarStatus('idle');
      return;
    }
    setAvatarStatus('loading');
    const img = new Image();
    img.onload = () => setAvatarStatus('valid');
    img.onerror = () => setAvatarStatus('invalid');
    img.src = avatar.trim();
  }, [avatar]);

  // Validate banner web link address
  useEffect(() => {
    if (!banner || !banner.trim()) {
      setBannerStatus('idle');
      return;
    }
    setBannerStatus('loading');
    const img = new Image();
    img.onload = () => setBannerStatus('valid');
    img.onerror = () => setBannerStatus('invalid');
    img.src = banner.trim();
  }, [banner]);

  if (!currentUser) return null;

  const handleOpenEdit = (tab: 'visuals' | 'identity' | 'bio' | 'skills' | 'socials' = 'visuals') => {
    setModalTab(tab);
    setShowEditModal(true);
  };

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const [isUploadingToStorage, setIsUploadingToStorage] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  // Google Storage & local file upload support
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingToStorage(true);
    setStorageNotice('Uploading to Google Storage under ID: ' + currentUser.id + '...');
    try {
      // Store in Google Firebase Storage under user's particular ID folder
      const downloadUrl = await uploadUserFileToStorage(currentUser.id, file, 'avatars');
      setAvatar(downloadUrl);
      setStorageNotice('Stored in Google Cloud Storage bucket!');
      setTimeout(() => setStorageNotice(null), 3500);
    } catch (storageErr) {
      console.warn('Google Storage upload fallback to client image reader:', storageErr);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      setStorageNotice('Loaded local image asset.');
      setTimeout(() => setStorageNotice(null), 3000);
    } finally {
      setIsUploadingToStorage(false);
    }
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingToStorage(true);
    setStorageNotice('Uploading banner to Google Storage under ID: ' + currentUser.id + '...');
    try {
      const downloadUrl = await uploadUserFileToStorage(currentUser.id, file, 'banners');
      setBanner(downloadUrl);
      setStorageNotice('Banner saved to Google Cloud Storage bucket!');
      setTimeout(() => setStorageNotice(null), 3500);
    } catch (storageErr) {
      console.warn('Google Storage upload fallback to client image reader:', storageErr);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBanner(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      setStorageNotice('Loaded local banner image.');
      setTimeout(() => setStorageNotice(null), 3000);
    } finally {
      setIsUploadingToStorage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUserPayload = {
        name: name.trim() || currentUser.name,
        username: username.trim() || currentUser.username,
        avatar: avatar.trim() || currentUser.avatar,
        banner: banner.trim() || currentUser.banner,
        bio: bio.trim(),
        roleTitle: roleTitle.trim(),
        location: location.trim(),
        timezone: timezone.trim(),
        customStatus: customStatus.trim(),
        statusEmoji,
        availability,
        pronouns: pronouns.trim(),
        skills: skillsList,
        links: {
          github: github.trim(),
          website: website.trim(),
          twitter: twitter.trim(),
          discord: discord.trim(),
          linkedin: linkedin.trim(),
        },
        externalAccounts: {
          github: github.trim(),
          website: website.trim(),
          x: twitter.trim(),
          linkedin: linkedin.trim(),
        },
      };

      await api.updateProfile(updatedUserPayload);
      // Synchronize to Google Firestore under this particular user ID
      await saveUserToFirestore({
        ...currentUser,
        ...updatedUserPayload,
      });

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
      setShowEditModal(false);
      onRefreshUser();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const userPosts = posts.filter((p) => p.author.id === currentUser.id);
  const userCommunities = communities.filter((c) => c.isJoined);
  const defaultBanner = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80';

  const availabilityLabels = {
    available: { label: 'Available for Collabs', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    busy: { label: 'Focused / DND', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    stealth: { label: 'Building Stealth', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    mentoring: { label: 'Open to Mentoring', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  };

  if (showEditModal) {
    return (
      <ProfileCustomizerView
        currentUser={currentUser}
        initialTab={modalTab}
        onClose={() => setShowEditModal(false)}
        onRefreshUser={onRefreshUser}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Save notification toast */}
      {saveSuccessNotice && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-neutral-900/95 px-4 py-3 text-xs font-medium text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Profile & images updated successfully!</span>
        </div>
      )}

      {/* Profile Banner & Bio Card */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950 overflow-hidden shadow-2xl">
        {/* Banner Area with quick-action button */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-neutral-900 group">
          <img
            src={currentUser.banner || defaultBanner}
            alt={currentUser.name}
            className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.01]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

          {/* Change Banner Quick Button */}
          <button
            onClick={() => handleOpenEdit('visuals')}
            className="absolute top-4 right-4 flex items-center space-x-1.5 rounded-lg border border-neutral-700/60 bg-black/70 px-3 py-1.5 text-xs font-mono text-neutral-200 backdrop-blur-md hover:bg-neutral-900 hover:text-white hover:border-neutral-500 transition shadow-lg"
          >
            <ImageIcon className="h-3.5 w-3.5 text-neutral-300" />
            <span>Change Cover</span>
          </button>
        </div>

        {/* Info Area with Interactive Avatar */}
        <div className="px-6 pb-6 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end space-x-4 sm:space-x-5">
              {/* Interactive Avatar with hover overlay */}
              <div className="relative group cursor-pointer" onClick={() => handleOpenEdit('visuals')}>
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-neutral-950 overflow-hidden bg-neutral-900 shadow-2xl relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Camera className="h-6 w-6 text-white mb-1" />
                    <span className="text-[10px] font-mono tracking-wide uppercase font-semibold">Change PFP</span>
                  </div>
                </div>

                {/* Online status indicator */}
                <div
                  className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-neutral-950 bg-emerald-500 shadow-md flex items-center justify-center"
                  title="Online on Tsuna"
                >
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              {/* Name & Titles */}
              <div className="mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {currentUser.name}
                  </h1>
                  {currentUser.pronouns && (
                    <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[11px] font-mono text-neutral-400">
                      {currentUser.pronouns}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400 font-mono">@{currentUser.username}</span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-neutral-300 mt-1">
                  {currentUser.roleTitle || 'Creative Builder'}
                </p>

                {/* Custom Status & Availability */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {currentUser.customStatus && (
                    <div className="flex items-center space-x-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 px-2.5 py-0.5 text-xs text-neutral-200">
                      <span>{currentUser.statusEmoji || '⚡'}</span>
                      <span className="font-mono text-[11px]">{currentUser.customStatus}</span>
                    </div>
                  )}

                  {currentUser.availability && (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                        availabilityLabels[currentUser.availability]?.color ||
                        availabilityLabels.available.color
                      }`}
                    >
                      {availabilityLabels[currentUser.availability]?.label || 'Active'}
                    </span>
                  )}

                  {/* Google Storage ID Badge */}
                  <div
                    className="flex items-center space-x-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-mono text-sky-300"
                    title={`Stored in Google Cloud Storage & Firestore under particular User ID: ${currentUser.id}`}
                  >
                    <Cloud className="h-3 w-3 text-sky-400" />
                    <span>UID: <span className="text-white font-semibold">{currentUser.id.length > 12 ? `${currentUser.id.slice(0, 8)}...` : currentUser.id}</span></span>
                    <span className="text-emerald-400 font-semibold">• Google Cloud</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={() => handleOpenEdit('visuals')}
                className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition shadow-sm"
              >
                <Camera className="h-3.5 w-3.5 text-neutral-300" />
                <span>PFP & Visuals</span>
              </button>
              <button
                onClick={() => handleOpenEdit('identity')}
                className="flex items-center space-x-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition shadow-md"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Bio / Manifesto */}
          {currentUser.bio && (
            <p className="mt-4 max-w-3xl text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {currentUser.bio}
            </p>
          )}

          {/* Location, Timezone, Social Links */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
            {currentUser.location && (
              <div className="flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span>{currentUser.location}</span>
              </div>
            )}
            {currentUser.timezone && (
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                <span>{currentUser.timezone}</span>
              </div>
            )}
            {(currentUser.links?.github || currentUser.externalAccounts?.github) && (
              <a
                href={currentUser.links?.github || currentUser.externalAccounts?.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-neutral-300 hover:text-white transition"
              >
                <Github className="h-3.5 w-3.5" />
                <span>GitHub</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>
            )}
            {(currentUser.links?.website || currentUser.externalAccounts?.website) && (
              <a
                href={currentUser.links?.website || currentUser.externalAccounts?.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-neutral-300 hover:text-white transition"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Portfolio</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>
            )}
            {(currentUser.links?.twitter || currentUser.externalAccounts?.x) && (
              <a
                href={currentUser.links?.twitter || currentUser.externalAccounts?.x}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-neutral-300 hover:text-white transition"
              >
                <Twitter className="h-3.5 w-3.5" />
                <span>X / Twitter</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>
            )}
            {currentUser.links?.discord && (
              <div className="flex items-center space-x-1 text-neutral-300">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{currentUser.links.discord}</span>
              </div>
            )}
          </div>

          {/* Skills / Interests tags */}
          {currentUser.skills && currentUser.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {currentUser.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-neutral-900/90 border border-neutral-800/80 px-2.5 py-1 text-[11px] font-mono text-neutral-300 flex items-center space-x-1"
                >
                  <span className="text-emerald-400">#</span>
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Profile Tabs */}
        <div className="border-t border-neutral-900 px-6 flex space-x-6 text-xs font-medium">
          {[
            { id: 'posts', label: 'Creations & Code', count: userPosts.length },
            { id: 'communities', label: 'Communities Joined', count: userCommunities.length },
            { id: 'submissions', label: 'Challenge Submissions', count: 1 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 border-b-2 transition flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="rounded bg-neutral-900 px-1.5 py-0.2 text-[10px] font-mono text-neutral-400">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-8 text-center text-xs text-neutral-400">
                No creations published yet.
              </div>
            ) : (
              userPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <h3 className="font-bold text-white">{post.title}</h3>
                    <span className="text-[11px] font-mono text-neutral-400">{post.createdAt}</span>
                  </div>
                  <p className="text-xs text-neutral-300">{post.content}</p>

                  <PostAttachments
                    post={post}
                    onNavigate={onNavigate}
                    onSelectCommunity={onSelectCommunity}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'communities' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userCommunities.map((comm) => (
              <div
                key={comm.id}
                onClick={() => onSelectCommunity(comm.id)}
                className="cursor-pointer rounded-xl border border-neutral-900 bg-neutral-950 p-4 hover:border-neutral-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={comm.avatar}
                    alt={comm.name}
                    className="h-10 w-10 rounded-xl object-cover border border-neutral-800"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{comm.name}</p>
                    <p className="text-[11px] text-neutral-400">{comm.membersCount} members</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase">
                  HyperCraft WebGPU Shader Jam
                </span>
                <h4 className="text-xs font-bold text-white mt-0.5">
                  Raymarched Gyroid Fractal with Audio Reactive Bloom
                </h4>
              </div>
              <span className="rounded bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-xs font-mono text-emerald-400">
                19 Votes
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Submitted to community challenge sprint. Built in WebGPU compute shader pipeline.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
