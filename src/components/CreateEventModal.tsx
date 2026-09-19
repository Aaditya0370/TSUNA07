import React, { useState, useRef } from 'react';
import { X, Calendar, Radio, Video, Trophy, Sparkles, Plus, Upload, FileArchive, Trash2 } from 'lucide-react';
import { Community, TsunaEvent, EventType, EventFileAttachment } from '../types';
import { api } from '../services/api';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: Community[];
  onCreated: (event: TsunaEvent) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  communities,
  onCreated,
}) => {
  const [communityId, setCommunityId] = useState(communities[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('submission');
  const [startTime, setStartTime] = useState('Live Now — Ends in 24h');
  const [submissionsPrompt, setSubmissionsPrompt] = useState(
    'Submit your procedural shader, repo link, or playable interactive demo.'
  );
  const [eventFiles, setEventFiles] = useState<EventFileAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const newFile: EventFileAttachment = {
        id: `file-${Date.now()}`,
        name: selectedFile.name,
        size: formatBytes(selectedFile.size),
        type: selectedFile.type || 'application/octet-stream',
        url: (e.target?.result as string) || '#',
        uploadedBy: 'Organizer',
        uploadedAt: 'Just now',
        description: 'Starter resource pack',
      };
      setEventFiles((prev) => [...prev, newFile]);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await api.createEvent({
        communityId,
        title,
        description,
        type,
        startTime,
        submissionsPrompt: type === 'submission' || type === 'competition' ? submissionsPrompt : undefined,
        files: eventFiles.length > 0 ? eventFiles : undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create event:', err);
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
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Host a Collaborative Session</h3>
              <p className="text-[11px] text-neutral-400">Voice rooms, video jams, or community submission challenges</p>
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
          {/* Format selector */}
          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Event Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'submission', label: 'Submission', icon: Trophy },
                { id: 'voice_room', label: 'Voice Room', icon: Radio },
                { id: 'video_meeting', label: 'Video Jam', icon: Video },
                { id: 'competition', label: 'Competition', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setType(item.id as EventType)}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center text-xs transition ${
                      type === item.id
                        ? 'border-neutral-600 bg-neutral-900 text-white font-medium'
                        : 'border-neutral-900 bg-black text-neutral-400 hover:border-neutral-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Community
            </label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Session Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. WebGPU Shader Sprint & Community Showcase"
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Time / Status
            </label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="Live Now or e.g. Tomorrow 3:00 PM"
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Description & Expectations
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will builders collaborate on? What are the rules?"
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none resize-none"
            />
          </div>

          {(type === 'submission' || type === 'competition') && (
            <div>
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                Submission Guidelines
              </label>
              <input
                type="text"
                value={submissionsPrompt}
                onChange={(e) => setSubmissionsPrompt(e.target.value)}
                placeholder="e.g. Provide WGSL shader code and preview snapshot."
                className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
              />
            </div>
          )}

          {/* Starter Files & Starter Kits */}
          <div className="rounded-xl border border-neutral-800/80 bg-black/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Event Starter Files & Starter Kits
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {eventFiles.length} file{eventFiles.length === 1 ? '' : 's'}
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-dashed border-neutral-800 p-2.5 text-center cursor-pointer hover:border-neutral-700 transition flex items-center justify-center space-x-2 bg-neutral-950/80"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <Upload className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-neutral-300">
                Click to attach starter kit (ZIP, textures, shader templates, docs)
              </span>
            </div>

            {eventFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {eventFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-xs text-neutral-300"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileArchive className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400">({f.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEventFiles((prev) => prev.filter((item) => item.id !== f.id))}
                      className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={isSubmitting || !title.trim()}
              className="flex items-center space-x-1.5 rounded-lg bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Scheduling...' : 'Launch Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
