import React, { useState, useEffect, useRef } from 'react';
import { TsunaEvent, VoiceRoom, User, EventSubmission, EventFileAttachment } from '../types';
import {
  ArrowLeft,
  Calendar,
  Radio,
  Video,
  Trophy,
  Plus,
  Users,
  Mic,
  MicOff,
  Flame,
  Sparkles,
  ArrowRight,
  Code2,
  ExternalLink,
  Send,
  Upload,
  FileArchive,
  Download,
  Trash2,
  Layers,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { EventFilesSection } from '../components/EventFilesSection';

interface EventsViewProps {
  events: TsunaEvent[];
  voiceRooms: VoiceRoom[];
  currentUser: User | null;
  activeVoiceRoomId: string | null;
  onJoinVoiceRoom: (roomId: string) => void;
  onLeaveVoiceRoom: () => void;
  onOpenVideoMeeting: (title: string) => void;
  onOpenCreateEvent: () => void;
  onRefreshEvents: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  voiceRooms,
  currentUser,
  activeVoiceRoomId,
  onJoinVoiceRoom,
  onLeaveVoiceRoom,
  onOpenVideoMeeting,
  onOpenCreateEvent,
  onRefreshEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'submissions' | 'voice' | 'video'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // New submission state
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitCode, setSubmitCode] = useState(`// Raymarching distance estimator
float map(vec3 p) {
    return length(p) - 1.0;
}`);
  const [submitFiles, setSubmitFiles] = useState<EventFileAttachment[]>([]);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const submissionFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedEventId) {
      loadSubmissions(selectedEventId);
    }
  }, [selectedEventId]);

  const loadSubmissions = async (eventId: string) => {
    try {
      const list = await api.getSubmissions(eventId);
      setSubmissions(list);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  const handleVote = async (submissionId: string) => {
    try {
      const updated = await api.voteSubmission(submissionId);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? updated : s))
      );
      // Trigger celebrate confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ffffff', '#10b981', '#6366f1'],
      });
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleSubmissionFileSelect = (selectedFile: File) => {
    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const newAttachment: EventFileAttachment = {
        id: `sub-file-${Date.now()}`,
        name: selectedFile.name,
        size: formatBytes(selectedFile.size),
        type: selectedFile.type || 'application/octet-stream',
        url: (e.target?.result as string) || '#',
        uploadedBy: currentUser?.name || 'Submitter',
        uploadedAt: 'Just now',
        description: 'Submission asset',
      };
      setSubmitFiles((prev) => [...prev, newAttachment]);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTitle.trim() || !selectedEventId) return;

    setIsSubmittingWork(true);
    try {
      const created = await api.createSubmission(selectedEventId, {
        title: submitTitle,
        description: submitDescription,
        codeSnippet: submitCode.trim()
          ? {
              language: 'wgsl',
              filename: 'custom_shader.wgsl',
              code: submitCode,
            }
          : undefined,
        files: submitFiles.length > 0 ? submitFiles : undefined,
      });

      setSubmissions((prev) => [created, ...prev]);
      setShowSubmitModal(false);
      setSubmitTitle('');
      setSubmitDescription('');
      setSubmitFiles([]);
      onRefreshEvents();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to submit work:', err);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      await api.joinEvent(eventId);
      onRefreshEvents();
    } catch (err) {
      console.error('Failed to join event:', err);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  if (showSubmitModal) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 text-left">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setShowSubmitModal(false)}
            className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Challenge Details</span>
          </button>
          <span className="text-xs font-mono text-neutral-500">
            TSUNA // CHALLENGE_SUBMIT
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white">Submit Work to Challenge</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Share your shader code, repo link, or playable interactive demo for {selectedEvent?.title}.
          </p>

          <form onSubmit={handleCreateSubmission} className="mt-6 space-y-4">
            <div>
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                Submission Title
              </label>
              <input
                type="text"
                required
                value={submitTitle}
                onChange={(e) => setSubmitTitle(e.target.value)}
                placeholder="e.g. Volumetric Cloud Marcher in 120 lines"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={submitDescription}
                onChange={(e) => setSubmitDescription(e.target.value)}
                placeholder="Tell the community how you tackled the challenge..."
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                Shader Code / Runnable Snippet
              </label>
              <textarea
                rows={6}
                value={submitCode}
                onChange={(e) => setSubmitCode(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black p-3.5 font-mono text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Project Files Attachment for Submission */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Attach Project Files (ZIP, WGSL, Textures, Specs)
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {submitFiles.length} attached
                </span>
              </div>

              <div
                onClick={() => submissionFileInputRef.current?.click()}
                className="rounded-lg border border-dashed border-neutral-800 bg-black/60 p-3 text-center cursor-pointer hover:border-neutral-700 transition flex items-center justify-center space-x-2"
              >
                <input
                  ref={submissionFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSubmissionFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-neutral-300">Click to upload files or project archive</span>
              </div>

              {submitFiles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {submitFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-800 bg-black px-2.5 py-1.5 text-xs text-neutral-300"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileArchive className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400">({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmitFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingWork || !submitTitle.trim()}
                className="flex items-center space-x-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmittingWork ? 'Submitting...' : 'Post Submission'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Collaborative Sessions & Events
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time live jams, voice rooms, video meetings, and community build challenges.
          </p>
        </div>

        <button
          onClick={onOpenCreateEvent}
          className="flex items-center space-x-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition active:scale-95 shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Host a Session</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-900 pb-3">
        {[
          { id: 'all', label: 'All Sessions' },
          { id: 'submissions', label: 'Submission Jams' },
          { id: 'voice', label: 'Voice Rooms' },
          { id: 'video', label: 'Video Meetings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white border border-neutral-800'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACTIVE VOICE ROOMS SPOTLIGHT (If any exist) */}
      {(activeTab === 'all' || activeTab === 'voice') && voiceRooms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
              <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span>Live Spontaneous Voice Rooms</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">Spatial Audio On</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voiceRooms.map((room) => {
              const isCurrent = activeVoiceRoomId === room.id;
              return (
                <div
                  key={room.id}
                  className={`rounded-2xl border p-5 transition ${
                    isCurrent
                      ? 'border-emerald-500 bg-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      : 'border-neutral-900 bg-neutral-950/80 hover:border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                        {room.communityName}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5">{room.title}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">Host: {room.host.name}</p>
                    </div>

                    <button
                      onClick={() => (isCurrent ? onLeaveVoiceRoom() : onJoinVoiceRoom(room.id))}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                        isCurrent
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-white text-black hover:bg-neutral-200'
                      }`}
                    >
                      {isCurrent ? 'Leave Voice' : 'Join Voice'}
                    </button>
                  </div>

                  {/* Active speakers waveform simulation */}
                  <div className="mt-4 pt-3 border-t border-neutral-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {room.participants.map((p, idx) => (
                          <img
                            key={idx}
                            src={p.user.avatar}
                            alt={p.user.name}
                            className={`h-7 w-7 rounded-full border-2 object-cover ${
                              p.isSpeaking ? 'border-emerald-400' : 'border-black'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {room.participants.length} builders in room
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="h-3 w-1 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="h-5 w-1 bg-emerald-400 rounded-full animate-pulse delay-75" />
                      <span className="h-2 w-1 bg-emerald-400 rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBMISSION JAMS & CHALLENGES SECTION */}
      {(activeTab === 'all' || activeTab === 'submissions') && selectedEvent && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
                <Trophy className="h-4 w-4" />
                <span>Live Community Challenge & Showcase</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {selectedEvent.title}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => onOpenVideoMeeting(selectedEvent.title)}
                className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:text-white transition"
              >
                <Video className="h-4 w-4 text-emerald-400" />
                <span>Open Jam Room</span>
              </button>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center space-x-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Submit Work</span>
              </button>
            </div>
          </div>

          {/* EVENT FILES & RESOURCES REPOSITORY */}
          <EventFilesSection
            eventId={selectedEvent.id}
            initialFiles={selectedEvent.files}
            currentUser={currentUser}
            onFilesUpdated={(newFiles) => {
              selectedEvent.files = newFiles;
            }}
          />

          {/* Submissions Gallery */}
          <div className="space-y-4 pt-4 border-t border-neutral-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Community Submissions ({submissions.length})
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">
                Click vote to cheer for top creations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-neutral-900 bg-black p-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={sub.author.avatar}
                          alt={sub.author.name}
                          className="h-8 w-8 rounded-full object-cover border border-neutral-800"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{sub.title}</p>
                          <p className="text-[10px] text-neutral-400">by {sub.author.name}</p>
                        </div>
                      </div>

                      {/* Vote Button */}
                      <button
                        onClick={() => handleVote(sub.id)}
                        className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs font-mono text-neutral-300 hover:border-neutral-600 hover:text-white transition active:scale-95"
                      >
                        <Flame className="h-3.5 w-3.5 text-amber-400" />
                        <span>{sub.votes} votes</span>
                      </button>
                    </div>

                    <p className="text-xs text-neutral-300 mb-3">{sub.description}</p>

                    {/* Code Snippet if present */}
                    {sub.codeSnippet && (
                      <div className="rounded-lg border border-neutral-900 bg-neutral-950 p-3 font-mono text-xs text-neutral-200 overflow-x-auto max-h-48">
                        <code>{sub.codeSnippet.code}</code>
                      </div>
                    )}

                    {/* Attached Submission Files */}
                    {sub.files && sub.files.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                          Attached Submission Files:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {sub.files.map((file) => (
                            <a
                              key={file.id}
                              href={file.url}
                              download={file.name}
                              className="inline-flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 px-2.5 py-1 text-xs text-neutral-200 hover:border-neutral-700 hover:text-white transition cursor-pointer"
                            >
                              <Download className="h-3 w-3 text-emerald-400" />
                              <span className="truncate max-w-[140px] font-mono text-[11px]">{file.name}</span>
                              <span className="text-[9px] font-mono text-neutral-500">({file.size})</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-900/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Submitted {sub.submittedAt || sub.createdAt}</span>
                    <span className="text-emerald-400">Verified Submission</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULED SESSIONS LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          Upcoming Schedule
        </h3>

        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-neutral-900 bg-neutral-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black border border-neutral-800 text-white">
                  {ev.type === 'voice_room' ? (
                    <Radio className="h-5 w-5 text-emerald-400" />
                  ) : ev.type === 'video_meeting' ? (
                    <Video className="h-5 w-5 text-indigo-400" />
                  ) : (
                    <Trophy className="h-5 w-5 text-amber-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{ev.title}</span>
                    <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 text-[9px] font-mono uppercase text-neutral-400">
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">{ev.description}</p>
                  <p className="text-[10px] font-mono text-neutral-400 mt-1">{ev.startTime}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  onClick={() => handleJoinEvent(ev.id)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    ev.isJoined
                      ? 'border border-neutral-800 bg-neutral-900 text-neutral-300'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {ev.isJoined ? 'Attending' : 'RSVP'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
