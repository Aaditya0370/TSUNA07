import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Sparkles,
  CheckCircle2,
  Loader2,
  Tag,
  FolderPlus,
} from 'lucide-react';
import { Community } from '../types';
import { api } from '../services/api';

interface CreateCommunityViewProps {
  onCreated: (comm: Community) => void;
  onNavigate: (tab: string, communityId?: string) => void;
}

export const CreateCommunityView: React.FC<CreateCommunityViewProps> = ({
  onCreated,
  onNavigate,
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [tags, setTags] = useState('build, webgl, shaders, rust');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await api.createCommunity({
        name,
        tagline,
        description,
        category,
        tags: parsedTags,
      });

      onCreated(created);
      onNavigate('community-detail', created.id);
    } catch (err) {
      console.error('Failed to create community:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('communities')}
            className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Communities</span>
          </button>

          <span className="text-xs font-mono text-neutral-500">
            TSUNA // NEW_COLLECTIVE
          </span>
        </div>

        {/* Page Container */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-neutral-900 pb-5 text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Create New Community</h1>
                <p className="text-xs text-neutral-400">
                  Establish a specialized guild or collective for builders and creators.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Community Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HyperCraft Shaders"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
              {slug && (
                <p className="mt-1 text-[11px] font-mono text-neutral-500">
                  Channel slug: #{slug}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Engineering">Engineering & Code</option>
                <option value="Design">Visual Design & UI</option>
                <option value="Generative Art">Generative Art & Shaders</option>
                <option value="Audio / Synth">Audio Synthesis & Music</option>
                <option value="AI / Research">AI & Research</option>
                <option value="Indie Hackers">Indie Hackers & Founders</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                One-Line Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Realtime graphics, GLSL, raymarching, and procedural beauty"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Description & Mission
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this collective about? What do members build or discuss together?"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="webgl, threejs, shaders, open-source"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-5 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => onNavigate('communities')}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex items-center space-x-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Establishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Establish Community</span>
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
