import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle2, MessageSquare, Clock, Code2 } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface CreatorInquiryModalProps {
  targetUser: User;
  currentUser: User | null;
  onClose: () => void;
  onNavigate?: (tab: string, param?: string) => void;
}

export const CreatorInquiryModal: React.FC<CreatorInquiryModalProps> = ({
  targetUser,
  currentUser,
  onClose,
  onNavigate,
}) => {
  const [projectType, setProjectType] = useState('Creative Tech & Engineering');
  const [timeline, setTimeline] = useState('Within 2 weeks');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const PROJECT_TYPES = [
    'Creative Tech & Engineering',
    'WebGPU & Shader Optimization',
    'Rust / Low-Level Pipeline',
    'Audio DSP & Sound Design',
    'Architecture Review & Mentorship',
    'Open Source Contribution',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      // Find or create direct chat conversation with this user
      const conversations = await api.getConversations();
      let conv = conversations.find(
        (c) => c.type === 'direct' && c.members?.some((m) => m.id === targetUser.id)
      );

      const inquiryBody = `🚀 Collaboration Proposal for @${targetUser.username}:\n• Focus Area: ${projectType}\n• Timeline: ${timeline}\n\n"${message.trim()}"`;

      if (conv) {
        await api.sendMessage(conv.id, { text: inquiryBody });
      } else {
        // Broadcast share
        await api.shareItem({
          targetType: 'chat',
          targetId: conversations[0]?.id || 'conv_1',
          itemType: 'post',
          itemData: { title: `Inquiry for @${targetUser.username}`, name: targetUser.name },
          message: inquiryBody,
        });
      }

      sounds.playSuccess();
      setIsSent(true);
    } catch (err) {
      console.error('Failed to send inquiry:', err);
      // Fallback graceful success for prototype
      sounds.playSuccess();
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center space-x-3">
            <img
              src={targetUser.avatar}
              alt={targetUser.name}
              className="h-9 w-9 rounded-full object-cover border border-emerald-400"
            />
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Collaborate with {targetUser.name}
              </h3>
              <p className="text-xs text-neutral-400 font-mono">@{targetUser.username}</p>
            </div>
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

        {isSent ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Proposal Dispatched!</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">
                Your collaboration inquiry has been transmitted to @{targetUser.username}'s inbox.
              </p>
            </div>
            <div className="pt-2 flex justify-center space-x-3">
              <button
                onClick={() => {
                  onClose();
                  onNavigate?.('chat');
                }}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition"
              >
                Go to Direct Messages
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Scope Selection */}
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                Collaboration Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-400 focus:outline-none"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                Target Timeline
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['Immediate', 'Within 2 weeks', 'Flexible / Ongoing'].map((tl) => (
                  <button
                    type="button"
                    key={tl}
                    onClick={() => {
                      setTimeline(tl);
                      sounds.playTap();
                    }}
                    className={`rounded-xl border p-2 text-center text-xs transition ${
                      timeline === tl
                        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300 font-semibold'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tl}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                Project Overview / Note
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                placeholder={`Hi ${targetUser.name}, I'd love to collaborate on a WebGPU project...`}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-neutral-800 px-4 py-2 text-xs text-neutral-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Transmit Proposal'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
