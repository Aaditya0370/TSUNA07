import React, { useState, useEffect, useRef } from 'react';
import {
  ChatConversation,
  ChatMessage,
  User,
  PostCodeSnippet,
  PostAttachment,
} from '../types';
import {
  Send,
  Code2,
  Paperclip,
  Smile,
  Palette,
  Users,
  Copy,
  Check,
  Download,
  Search,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { triggerFileDownload } from '../utils/download';

interface ChatsViewProps {
  currentUser: User | null;
  initialConversationId?: string;
  onNavigate: (tab: string) => void;
  onConversationRead?: (conversationId: string) => void;
  onMarkAllConversationsRead?: () => void;
  onConversationsUpdated?: (conversations: ChatConversation[]) => void;
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  currentUser,
  initialConversationId,
  onNavigate,
  onConversationRead,
  onMarkAllConversationsRead,
  onConversationsUpdated,
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>(
    initialConversationId || ''
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showCodeComposer, setShowCodeComposer] = useState(false);
  const [codeLang, setCodeLang] = useState('wgsl');
  const [codeSnippetContent, setCodeSnippetContent] = useState('');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>('default');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      onConversationsUpdated?.(list);

      const targetId = activeConversationId || (list.length > 0 ? list[0].id : '');
      if (targetId) {
        setActiveConversationId(targetId);
        const targetConv = list.find((c) => c.id === targetId);
        if (targetConv?.backgroundTheme) {
          setActiveTheme(targetConv.backgroundTheme);
        }
        // Auto mark selected conversation as read if unread exists
        if (targetConv && targetConv.unreadCount && targetConv.unreadCount > 0) {
          const updated = list.map((c) =>
            c.id === targetId ? { ...c, unreadCount: 0 } : c
          );
          setConversations(updated);
          onConversationsUpdated?.(updated);
          onConversationRead?.(targetId);
          api.markConversationRead(targetId).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    const targetConv = conversations.find((c) => c.id === convId);
    if (targetConv && targetConv.unreadCount && targetConv.unreadCount > 0) {
      const updated = conversations.map((c) =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      );
      setConversations(updated);
      onConversationsUpdated?.(updated);
      onConversationRead?.(convId);
      try {
        await api.markConversationRead(convId);
      } catch (err) {
        console.error('Failed to mark conversation as read:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    const updated = conversations.map((c) => ({ ...c, unreadCount: 0 }));
    setConversations(updated);
    onConversationsUpdated?.(updated);
    onMarkAllConversationsRead?.();
    try {
      await api.markAllConversationsRead();
    } catch (err) {
      console.error('Failed to mark all chats read:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs);
      const conv = conversations.find((c) => c.id === convId);
      if (conv?.backgroundTheme) {
        setActiveTheme(conv.backgroundTheme);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !codeSnippetContent.trim()) return;

    try {
      const payload: any = {
        text: messageText,
      };

      if (showCodeComposer && codeSnippetContent.trim()) {
        payload.codeSnippet = {
          language: codeLang,
          code: codeSnippetContent,
        };
      }

      const sent = await api.sendMessage(activeConversationId, payload);
      setMessages((prev) => [...prev, sent]);
      setMessageText('');
      setCodeSnippetContent('');
      setShowCodeComposer(false);

      // Refresh conversations list to update last message preview
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleUpdateTheme = async (themeName: string) => {
    try {
      await api.updateChatTheme(activeConversationId, themeName);
      setActiveTheme(themeName);
      setShowThemePicker(false);
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        const existing = msg.reactions?.find((r) => r.emoji === emoji);
        if (existing) {
          existing.count += 1;
        } else {
          msg.reactions = [...(msg.reactions || []), { emoji, count: 1, users: [currentUser?.id || 'me'] }];
        }
        return { ...msg };
      })
    );
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const getThemeClass = (theme: string) => {
    switch (theme) {
      case 'obsidian':
        return 'chat-bg-obsidian';
      case 'charcoal':
        return 'chat-bg-charcoal';
      case 'mono-grid':
        return 'chat-bg-mono-grid';
      default:
        return 'chat-bg-default';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 h-[calc(100vh-5rem)]">
      <div className="flex h-full overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 shadow-2xl">
        {/* Left: Conversations sidebar */}
        <div className="w-full sm:w-80 border-r border-neutral-900 bg-black/80 flex flex-col justify-between shrink-0">
          <div className="p-3.5 border-b border-neutral-900">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Conversations
                </h2>
                {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0) > 0 && (
                  <span
                    id="chats-total-unread-badge"
                    className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black font-mono shadow-sm"
                  >
                    {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {conversations.some((c) => (c.unreadCount || 0) > 0) && (
                  <button
                    onClick={handleMarkAllRead}
                    id="chats-mark-all-read-btn"
                    className="flex items-center space-x-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                    title="Mark all conversations as read"
                  >
                    <CheckCheck className="h-3 w-3 text-neutral-400" />
                    <span>Read all</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const hasUnread = conv.unreadCount !== undefined && conv.unreadCount > 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`flex w-full items-center space-x-3 rounded-xl p-2.5 text-left transition ${
                    isActive
                      ? 'bg-neutral-900 border border-neutral-800'
                      : 'hover:bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={conv.name}
                      className="h-9 w-9 rounded-xl object-cover border border-neutral-800"
                    />
                    {conv.type === 'direct' && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${hasUnread ? 'font-bold text-white' : 'font-semibold text-neutral-200'}`}>
                        {conv.name}
                      </p>
                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        {hasUnread && (
                          <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black font-mono shadow-sm animate-in fade-in zoom-in duration-150">
                            {conv.unreadCount}
                          </span>
                        )}
                        {conv.lastMessage && (
                          <span className="text-[10px] font-mono text-neutral-400">
                            {conv.lastMessage.timestamp}
                          </span>
                        )}
                      </div>
                    </div>
                    {conv.lastMessage && (
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        <span className="text-neutral-300 font-medium">
                          {conv.lastMessage.senderName.split(' ')[0]}:{' '}
                        </span>
                        {conv.lastMessage.text}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom user status */}
          <div className="p-3 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>SYNC ENGINE ACTIVE</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Connected</span>
            </span>
          </div>
        </div>

        {/* Right: Active Message Thread */}
        <div className="hidden sm:flex flex-1 flex-col justify-between overflow-hidden bg-black">
          {/* Thread Header */}
          <div className="h-14 border-b border-neutral-900 bg-neutral-950/70 px-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-neutral-400">
                  {activeConv?.type === 'group' ? '#' : '@'}
                </span>
                <h3 className="text-sm font-bold text-white">{activeConv?.name}</h3>
              </div>
              {activeConv?.communityName && (
                <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                  {activeConv.communityName}
                </span>
              )}
            </div>

            {/* Chat customization controls */}
            <div className="relative flex items-center space-x-2">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-black px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
                title="Change chat background surface"
              >
                <Palette className="h-3.5 w-3.5" />
                <span className="capitalize">{activeTheme}</span>
              </button>

              {showThemePicker && (
                <div className="absolute right-0 top-10 w-44 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl z-50">
                  {[
                    { id: 'default', label: 'Dot Matrix' },
                    { id: 'obsidian', label: 'Obsidian Black' },
                    { id: 'charcoal', label: 'Charcoal Slate' },
                    { id: 'mono-grid', label: 'Mono Grid' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleUpdateTheme(t.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                        activeTheme === t.id
                          ? 'bg-neutral-800 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{t.label}</span>
                      {activeTheme === t.id && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${getThemeClass(activeTheme)}`}>
            {messages.map((msg) => {
              const isMe = msg.sender.id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-3xl ${
                    isMe ? 'ml-auto' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">{msg.sender.name}</span>
                    <span>•</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-xl shadow-md ${
                      isMe
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'bg-neutral-950 text-neutral-200 border border-neutral-900'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Code Snippet in Chat */}
                    {msg.codeSnippet && (
                      <div className="mt-2.5 rounded-xl border border-neutral-900 bg-black overflow-hidden">
                        <div className="flex items-center justify-between border-b border-neutral-900 bg-neutral-950 px-3 py-1 text-[10px] font-mono text-neutral-400">
                          <span className="uppercase">{msg.codeSnippet.language}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.codeSnippet!.code);
                              setCopiedMsgId(msg.id);
                              setTimeout(() => setCopiedMsgId(null), 1500);
                            }}
                            className="flex items-center space-x-1 text-neutral-400 hover:text-white"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="p-3 font-mono text-xs text-neutral-200 overflow-x-auto">
                          <code>{msg.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Attachment in Chat */}
                    {msg.attachment && (
                      <div className="mt-2 flex items-center justify-between rounded-lg border border-neutral-800 bg-black/60 p-2.5">
                        <div className="flex items-center space-x-2 truncate">
                          <Paperclip className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="truncate font-mono">{msg.attachment.name}</span>
                          <span className="text-[10px] text-neutral-400">({msg.attachment.size})</span>
                        </div>
                        <button
                          onClick={() => {
                            triggerFileDownload(
                              msg.attachment?.name || 'chat_attachment.txt',
                              `Tsuna Chat Attachment: ${msg.attachment?.name || 'File'}\nSize: ${msg.attachment?.size || 'N/A'}`
                            );
                          }}
                          className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] text-white hover:bg-neutral-800 cursor-pointer transition"
                        >
                          Download
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Emoji reactions bar */}
                  <div className="flex items-center space-x-1.5 mt-1 px-1">
                    {(msg.reactions || []).map((r, i) => (
                      <button
                        key={i}
                        onClick={() => handleAddReaction(msg.id, r.emoji)}
                        className="rounded-full border border-neutral-900 bg-black/80 px-2 py-0.5 text-[10px] text-neutral-300 hover:border-neutral-700"
                      >
                        {r.emoji} {r.count}
                      </button>
                    ))}
                    <div className="flex space-x-0.5 opacity-0 hover:opacity-100 transition">
                      {['🚀', '⚡', '🔥', '👀'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(msg.id, emoji)}
                          className="rounded p-0.5 text-xs hover:scale-125 transition"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-neutral-900 bg-neutral-950 p-4">
            {/* Optional code snippet drawer */}
            {showCodeComposer && (
              <div className="mb-3 rounded-xl border border-neutral-900 bg-black p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-neutral-400">Add Code Snippet</span>
                  <select
                    value={codeLang}
                    onChange={(e) => setCodeLang(e.target.value)}
                    className="rounded border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-xs text-neutral-300 font-mono"
                  >
                    <option value="wgsl">WGSL</option>
                    <option value="rust">Rust</option>
                    <option value="typescript">TypeScript</option>
                    <option value="glsl">GLSL</option>
                  </select>
                </div>
                <textarea
                  rows={4}
                  value={codeSnippetContent}
                  onChange={(e) => setCodeSnippetContent(e.target.value)}
                  placeholder="// Paste or write code to send into chat..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 font-mono text-xs text-neutral-200 focus:outline-none"
                />
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowCodeComposer(!showCodeComposer)}
                className={`rounded-lg p-2 transition ${
                  showCodeComposer
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
                title="Attach code snippet"
              >
                <Code2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessageText((prev) => prev ? `${prev} [Attachment: engine_spec.json]` : '[Attachment: engine_spec.json]');
                }}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message ${activeConv?.name || 'chat'}...`}
                className="flex-1 rounded-xl border border-neutral-800 bg-black px-4 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
              />

              <button
                type="submit"
                disabled={!messageText.trim() && !codeSnippetContent.trim()}
                className="rounded-xl bg-white p-2 text-black hover:bg-neutral-200 transition disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
