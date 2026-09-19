import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Radio,
  Video,
  Trophy,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Community, TsunaEvent, EventType } from '../types';
import { api } from '../services/api';

interface CreateEventViewProps {
  communities: Community[];
  onCreated: (event: TsunaEvent) => void;
  onNavigate: (tab: string) => void;
}

export const CreateEventView: React.FC<CreateEventViewProps> = ({
  communities,
  onCreated,
  onNavigate,
}) => {
  const [communityId, setCommunityId] = useState(communities[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('submission');
  const [startTime, setStartTime] = useState('Live Now — Ends in 24h');
  const [submissionsPrompt, setSubmissionsPrompt] = useState(
    'Submit your procedural shader, repo link, or playable interactive demo.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        submissionsPrompt:
          type === 'submission' || type === 'competition'
            ? submissionsPrompt
            : undefined,
      });
      onCreated(created);
      onNavigate('events');
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('events')}
            className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events & Voice</span>
          </button>

          <span className="text-xs font-mono text-neutral-500">
            TSUNA // EVENT_DISPATCH
          </span>
        </div>

        {/* Page Container */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-neutral-900 pb-5 text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Host Live Session or Event</h1>
                <p className="text-xs text-neutral-400">
                  Launch a collaborative audio room, design jam, or code challenge.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-left">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Host Community
              </label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Event Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'voice_room',
                    label: 'Live Voice & Screen Room',
                    icon: Radio,
                    desc: 'Real-time peer spatial audio',
                  },
                  {
                    id: 'submission',
                    label: 'Creative Code Challenge',
                    icon: Trophy,
                    desc: 'Participants submit demo snippets',
                  },
                  {
                    id: 'showcase',
                    label: 'Portfolio Showcase',
                    icon: Video,
                    desc: 'Screen presentations & critique',
                  },
                  {
                    id: 'competition',
                    label: 'Timed Hackathon',
                    icon: Sparkles,
                    desc: 'Time-boxed build sprint',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id as EventType)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 text-xs font-semibold mb-1">
                        <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-400' : 'text-neutral-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Raymarching Optimization & Spatial Sound Co-Work"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Timing / Schedule
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Live Now — Ends in 24h"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Session Description & Goals
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will builders collaborate on or present?"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            {(type === 'submission' || type === 'competition') && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                  Submission Prompt / Instructions
                </label>
                <textarea
                  rows={2}
                  value={submissionsPrompt}
                  onChange={(e) => setSubmissionsPrompt(e.target.value)}
                  placeholder="What deliverables should creators submit?"
                  className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none resize-none font-mono text-[11px]"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-5 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => onNavigate('events')}
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
                    <span>Launching Event...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Launch Event / Room</span>
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
