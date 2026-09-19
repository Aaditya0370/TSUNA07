import React, { useState } from 'react';
import { X, Users, Sparkles, Plus } from 'lucide-react';
import { Community } from '../types';
import { api } from '../services/api';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (comm: Community) => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [tags, setTags] = useState('Build, Collaboration, OpenSource');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
      onClose();
    } catch (err) {
      console.error('Failed to create community:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-white">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Found a Community</h3>
              <p className="text-[11px] text-neutral-400">Create a collaborative home for builders, artists, or researchers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Community Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Distributed Shaders Guild"
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
            >
              <option value="Engineering">Engineering & Systems</option>
              <option value="Audio & Sound">Audio, DSP & Modular</option>
              <option value="Design & 3D">Design & 3D Systems</option>
              <option value="Creative Tech">Creative Technology</option>
              <option value="Open Source">Open Source & Cryptography</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Real-time compute shaders and distributed GPU pipelines."
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Description / Manifesto
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are people building here? Who should join?"
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="WGSL, WebGPU, Rust, Compute"
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 border-t border-neutral-900 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center space-x-1.5 rounded-lg bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Founding...' : 'Launch Community'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
