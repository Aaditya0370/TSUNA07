import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import {
  ArrowLeft,
  Edit3,
  MapPin,
  Clock,
  Github,
  Globe,
  Twitter,
  Code2,
  Check,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Shield,
  AtSign,
  User as UserIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Cloud,
  Database,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { uploadUserFileToStorage, saveUserToFirestore } from '../services/firebase';

interface ProfileCustomizerViewProps {
  currentUser: User;
  initialTab?: 'visuals' | 'identity' | 'bio' | 'skills' | 'socials';
  onClose: () => void;
  onRefreshUser: () => void;
}

export const ProfileCustomizerView: React.FC<ProfileCustomizerViewProps> = ({
  currentUser,
  initialTab = 'visuals',
  onClose,
  onRefreshUser,
}) => {
  const [modalTab, setModalTab] = useState<'visuals' | 'identity' | 'bio' | 'skills' | 'socials'>(
    initialTab
  );

  // Form states
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [roleTitle, setRoleTitle] = useState(currentUser.roleTitle || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [banner, setBanner] = useState(currentUser.banner || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [availability, setAvailability] = useState<'available' | 'busy' | 'stealth' | 'mentoring'>(
    currentUser.availability || 'available'
  );
  const [skillsList, setSkillsList] = useState<string[]>(currentUser.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [github, setGithub] = useState(currentUser.links?.github || '');
  const [twitter, setTwitter] = useState(currentUser.links?.twitter || '');
  const [website, setWebsite] = useState(currentUser.links?.website || '');

  // Image validation states
  const [avatarStatus, setAvatarStatus] = useState<'valid' | 'invalid' | 'checking'>('checking');
  const [bannerStatus, setBannerStatus] = useState<'valid' | 'invalid' | 'checking'>('checking');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Avatar presets
  const avatarPresets = [
    { name: 'Cyber Wave', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
    { name: 'Voxel Punk', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80' },
    { name: 'Neon Glitch', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80' },
    { name: 'Vector Geo', url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(username || 'tsuna')}` },
    { name: 'Bot Sprite', url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'robot')}` },
  ];

  // Banner presets
  const bannerPresets = [
    { name: 'Dark Aurora', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80' },
    { name: 'Digital Grid', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80' },
    { name: 'Procedural Noise', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80' },
    { name: 'Cyberpunk City', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&auto=format&fit=crop&q=80' },
  ];

  // Validate avatar URL live
  useEffect(() => {
    if (!avatar.trim()) {
      setAvatarStatus('invalid');
      return;
    }
    setAvatarStatus('checking');
    const img = new Image();
    img.onload = () => setAvatarStatus('valid');
    img.onerror = () => setAvatarStatus('invalid');
    img.src = avatar.trim();
  }, [avatar]);

  // Validate banner URL live
  useEffect(() => {
    if (!banner.trim()) {
      setBannerStatus('invalid');
      return;
    }
    setBannerStatus('checking');
    const img = new Image();
    img.onload = () => setBannerStatus('valid');
    img.onerror = () => setBannerStatus('invalid');
    img.src = banner.trim();
  }, [banner]);

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

  // Local file upload for Avatar
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setStorageNotice('Uploading avatar to Cloud Storage & Firebase...');
    try {
      const publicUrl = await uploadUserFileToStorage(currentUser.id, file, 'avatars');
      setAvatar(publicUrl);
      setStorageNotice('Avatar stored successfully!');
    } catch (err) {
      console.warn('Fallback to local data url:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingAvatar(false);
      setTimeout(() => setStorageNotice(null), 3000);
    }
  };

  // Local file upload for Banner
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setStorageNotice('Uploading banner to Cloud Storage & Firebase...');
    try {
      const publicUrl = await uploadUserFileToStorage(currentUser.id, file, 'banners');
      setBanner(publicUrl);
      setStorageNotice('Banner stored successfully!');
    } catch (err) {
      console.warn('Fallback to local data url:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBanner(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingBanner(false);
      setTimeout(() => setStorageNotice(null), 3000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedUserPayload = {
        name: name.trim() || currentUser.name,
        username: username.trim().replace(/^@/, '') || currentUser.username,
        roleTitle: roleTitle.trim() || currentUser.roleTitle,
        bio: bio.trim(),
        avatar: avatar.trim() || currentUser.avatar,
        banner: banner.trim() || currentUser.banner,
        location: location.trim(),
        availability,
        skills: skillsList,
        links: {
          github: github.trim(),
          twitter: twitter.trim(),
          website: website.trim(),
        },
      };

      // 1. Sync through API
      await api.updateProfile(updatedUserPayload);

      // 2. Persist to Firestore
      await saveUserToFirestore({
        ...currentUser,
        ...updatedUserPayload,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onRefreshUser();
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl text-left space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Profile</span>
          </button>
          <span className="text-xs font-mono text-neutral-500">
            TSUNA // PROFILE_STUDIO
          </span>
        </div>

        <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span>Customize Creator Profile</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Configure your digital presence, avatar, banner, skills, and portfolio handles.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] font-mono text-neutral-400">
                <Database className="h-3 w-3 text-emerald-400" />
                <span>Firestore Synced</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-900 overflow-x-auto py-3 gap-2">
            {[
              { id: 'visuals', label: 'PFP & Banner', icon: Camera },
              { id: 'identity', label: 'Identity & Status', icon: UserIcon },
              { id: 'bio', label: 'Bio & Manifesto', icon: Edit3 },
              { id: 'skills', label: 'Skills & Tags', icon: Code2 },
              { id: 'socials', label: 'Links & Socials', icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = modalTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 text-white font-semibold shadow-sm border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Area */}
          <form onSubmit={handleSaveProfile} className="py-6 space-y-6">
            {/* Storage notice */}
            {storageNotice && (
              <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <Cloud className="h-4 w-4 shrink-0" />
                <span>{storageNotice}</span>
              </div>
            )}

            {/* TAB 1: VISUALS */}
            {modalTab === 'visuals' && (
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Profile Avatar (PFP)
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Paste any web image address or upload directly.
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      {avatarStatus === 'valid' && (
                        <span className="flex items-center space-x-1 text-emerald-400 font-mono text-[11px]">
                          <Check className="h-3.5 w-3.5" />
                          <span>Image Valid</span>
                        </span>
                      )}
                      {avatarStatus === 'invalid' && (
                        <span className="flex items-center space-x-1 text-amber-400 font-mono text-[11px]">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Check Link</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={avatarStatus === 'valid' ? avatar : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(username || 'creator')}`}
                        alt="Avatar Preview"
                        className="h-20 w-20 rounded-2xl border-2 border-neutral-700 object-cover shadow-md"
                      />
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
                        <input
                          type="url"
                          value={avatar}
                          onChange={(e) => setAvatar(e.target.value)}
                          placeholder="Paste image link: https://..."
                          className="w-full rounded-xl border border-neutral-800 bg-black pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          ref={avatarFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Image'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-2">
                      Quick Preset Styles:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {avatarPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset.url)}
                          className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-black px-2.5 py-1 text-[11px] text-neutral-300 hover:border-emerald-500/50 hover:text-white transition"
                        >
                          <img src={preset.url} alt="" className="h-4 w-4 rounded-full object-cover" />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Banner Section */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Profile Cover Banner
                      </h4>
                      <p className="text-xs text-neutral-400">
                        High-resolution 16:9 or panoramic banner for your creative profile header.
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      {bannerStatus === 'valid' && (
                        <span className="flex items-center space-x-1 text-emerald-400 font-mono text-[11px]">
                          <Check className="h-3.5 w-3.5" />
                          <span>Banner Valid</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative h-28 w-full rounded-xl border border-neutral-800 overflow-hidden bg-black">
                    <img
                      src={bannerStatus === 'valid' ? banner : 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80'}
                      alt="Banner Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
                      <input
                        type="url"
                        value={banner}
                        onChange={(e) => setBanner(e.target.value)}
                        placeholder="Paste banner image link: https://..."
                        className="w-full rounded-xl border border-neutral-800 bg-black pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        disabled={isUploadingBanner}
                        className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{isUploadingBanner ? 'Uploading...' : 'Upload Banner'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Banner Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-2">
                      Preset Background Environments:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {bannerPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBanner(preset.url)}
                          className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-black p-1.5 text-[11px] text-neutral-300 hover:border-emerald-500/50 hover:text-white transition"
                        >
                          <img src={preset.url} alt="" className="h-6 w-8 rounded object-cover" />
                          <span className="truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IDENTITY */}
            {modalTab === 'identity' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                      Username (@handle)
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-xl border border-neutral-800 bg-black pl-9 pr-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Creative Title / Role
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Shader Developer & Generative Artist"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                      Location / Timezone
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Tokyo / UTC+9"
                        className="w-full rounded-xl border border-neutral-800 bg-black pl-9 pr-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                      Collaboration Status
                    </label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value as any)}
                      className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="available">Available for Collabs</option>
                      <option value="busy">Focused / DND</option>
                      <option value="stealth">Building Stealth</option>
                      <option value="mentoring">Open to Mentoring</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BIO */}
            {modalTab === 'bio' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Bio & Manifesto
                  </label>
                  <textarea
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the collective what systems, algorithms, and mediums you craft..."
                    className="w-full rounded-xl border border-neutral-800 bg-black p-3.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                    {bio.length} characters
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: SKILLS */}
            {modalTab === 'skills' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Skills & Tech Stack Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(newSkillInput);
                        }
                      }}
                      placeholder="Add tag (e.g. WebGPU, WGSL, Rust, Three.js)..."
                      className="flex-1 rounded-xl border border-neutral-800 bg-black px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkill(newSkillInput)}
                      className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-200"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-neutral-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SOCIALS */}
            {modalTab === 'socials' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                    GitHub Username or Profile URL
                  </label>
                  <div className="relative">
                    <Github className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="username or https://github.com/..."
                      className="w-full rounded-xl border border-neutral-800 bg-black pl-9 pr-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Twitter / X Handle
                  </label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="@username or https://x.com/..."
                      className="w-full rounded-xl border border-neutral-800 bg-black pl-9 pr-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Portfolio / Website Link
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      className="w-full rounded-xl border border-neutral-800 bg-black pl-9 pr-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-900">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Profile Saved!</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
