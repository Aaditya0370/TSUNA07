import React, { useState } from 'react';
import { X, Check, Save, Sparkles, Plus, Trash2, Globe, Github, Twitter } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface CreatorEditProfileModalProps {
  user: User;
  onClose: () => void;
  onSaved: (updatedUser: User) => void;
}

export const CreatorEditProfileModal: React.FC<CreatorEditProfileModalProps> = ({
  user,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(user.name || '');
  const [roleTitle, setRoleTitle] = useState(user.roleTitle || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [banner, setBanner] = useState(user.banner || '');
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [github, setGithub] = useState(user.externalAccounts?.github || user.links?.github || '');
  const [twitter, setTwitter] = useState(user.externalAccounts?.x || user.links?.twitter || '');
  const [website, setWebsite] = useState(user.externalAccounts?.website || user.links?.website || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
      sounds.playTap();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    sounds.playTap();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateProfile({
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        banner: banner.trim(),
        skills,
        links: {
          ...user.links,
          github: github.trim(),
          twitter: twitter.trim(),
          website: website.trim(),
        },
        externalAccounts: {
          ...user.externalAccounts,
          github: github.trim(),
          x: twitter.trim(),
          website: website.trim(),
        },
      });

      sounds.playSuccess();
      onSaved(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Customize Creator Profile</h3>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Display Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">Role Title / Headline</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. WebGPU Shader Engineer"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">Bio / Statement</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="What are you building or exploring?"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-xs text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {/* Skills Chips */}
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">Skills & Technologies</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center space-x-1 rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-xs text-emerald-400"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-neutral-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e);
                  }
                }}
                placeholder="Add technology (e.g. WGSL, Rust, WebAssembly)"
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-300 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* External Links */}
          <div className="space-y-2 pt-2 border-t border-neutral-900">
            <span className="block text-xs font-mono text-neutral-400">Socials & Repositories</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5">
                <Github className="h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="GitHub username"
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5">
                <Twitter className="h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="X / Twitter handle"
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5">
                <Globe className="h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Personal website / blog"
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Avatar & Banner URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-900">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">Banner Image URL</label>
              <input
                type="url"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs text-neutral-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Updating...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
