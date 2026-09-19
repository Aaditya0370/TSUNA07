import React, { useState } from 'react';
import { X, Share2, MessageSquare, Users, Check, ArrowRight } from 'lucide-react';
import { ChatConversation, Community } from '../types';
import { api } from '../services/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    type: 'post' | 'code' | 'file' | 'flow' | 'event';
    title: string;
    description?: string;
    codeSnippet?: any;
    attachment?: any;
  } | null;
  conversations: ChatConversation[];
  communities: Community[];
  onShareSuccess?: (targetType: 'chat' | 'community', targetId: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  item,
  conversations,
  communities,
  onShareSuccess,
}) => {
  const [selectedType, setSelectedType] = useState<'chat' | 'community'>('chat');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    conversations[0]?.id || ''
  );
  const [note, setNote] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedDone, setSharedDone] = useState(false);

  if (!isOpen || !item) return null;

  const handleShare = async () => {
    if (!selectedTargetId) return;
    setIsSharing(true);
    try {
      await api.shareItem({
        targetType: selectedType,
        targetId: selectedTargetId,
        itemType: item.type,
        itemData: item,
        message: note,
      });
      setSharedDone(true);
      setTimeout(() => {
        setIsSharing(false);
        setSharedDone(false);
        onClose();
        if (onShareSuccess) {
          onShareSuccess(selectedType, selectedTargetId);
        }
      }, 700);
    } catch (err) {
      console.error('Failed to share:', err);
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-white">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share within Tsuna</h3>
              <p className="text-[11px] text-neutral-400">Collaborate directly in chat or cross-post to a community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Item preview card */}
        <div className="mt-4 rounded-xl border border-neutral-900 bg-black/60 p-3.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span className="uppercase tracking-wider">Item: {item.type}</span>
            {item.codeSnippet && <span className="text-neutral-400 font-mono">[{item.codeSnippet.language}]</span>}
          </div>
          <p className="mt-1 text-xs font-semibold text-white truncate">{item.title}</p>
          {item.description && (
            <p className="mt-0.5 text-[11px] text-neutral-400 line-clamp-2">{item.description}</p>
          )}
        </div>

        {/* Target Selector Tabs */}
        <div className="mt-5">
          <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-2">
            Share Destination
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                setSelectedType('chat');
                setSelectedTargetId(conversations[0]?.id || '');
              }}
              className={`flex items-center justify-center space-x-2 rounded-lg border py-2 text-xs font-medium transition ${
                selectedType === 'chat'
                  ? 'border-neutral-600 bg-neutral-900 text-white'
                  : 'border-neutral-900 bg-black text-neutral-400 hover:border-neutral-800'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Direct / Group Chat</span>
            </button>

            <button
              onClick={() => {
                setSelectedType('community');
                setSelectedTargetId(communities[0]?.id || '');
              }}
              className={`flex items-center justify-center space-x-2 rounded-lg border py-2 text-xs font-medium transition ${
                selectedType === 'community'
                  ? 'border-neutral-600 bg-neutral-900 text-white'
                  : 'border-neutral-900 bg-black text-neutral-400 hover:border-neutral-800'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Community Feed</span>
            </button>
          </div>

          {/* List of destinations */}
          <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-neutral-900 bg-black p-2">
            {selectedType === 'chat' ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedTargetId(conv.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                    selectedTargetId === conv.id
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-neutral-400 text-xs">
                      {conv.type === 'group' ? '#' : '@'}
                    </span>
                    <span className="truncate">{conv.name}</span>
                  </div>
                  {selectedTargetId === conv.id && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))
            ) : (
              communities.map((comm) => (
                <button
                  key={comm.id}
                  onClick={() => setSelectedTargetId(comm.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                    selectedTargetId === comm.id
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <span className="truncate">{comm.name}</span>
                  {selectedTargetId === comm.id && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Optional note */}
        <div className="mt-4">
          <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
            Add Message or Context (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Check out this shader kernel for the upcoming sprint..."
            className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="mt-6 flex items-center justify-end space-x-2 border-t border-neutral-900 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || !selectedTargetId}
            className="flex items-center space-x-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
          >
            {sharedDone ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Shared!</span>
              </>
            ) : (
              <>
                <span>Send to {selectedType === 'chat' ? 'Chat' : 'Community'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
