import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageCircle,
  Plus,
  ThumbsUp,
  CheckCircle2,
  CircleDot,
  EyeOff,
  User as UserIcon,
  Shield,
  Tag,
  Search,
  Filter,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CommunityQuestion, QuestionAnswer, User } from '../types';
import { api } from '../services/api';

interface CommunityQuestionsSectionProps {
  communityId: string;
  communityName: string;
  currentUser: User | null;
  onQuestionsCountChange?: (count: number) => void;
}

export const CommunityQuestionsSection: React.FC<CommunityQuestionsSectionProps> = ({
  communityId,
  communityName,
  currentUser,
  onQuestionsCountChange,
}) => {
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ask Question Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // Active expanded questions (for viewing and writing answers)
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [questionDetails, setQuestionDetails] = useState<Record<string, CommunityQuestion>>({});
  const [loadingQuestionId, setLoadingQuestionId] = useState<string | null>(null);

  // Answering states
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [answerAnonStates, setAnswerAnonStates] = useState<Record<string, boolean>>({});
  const [submittingAnswerId, setSubmittingAnswerId] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [communityId]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCommunityQuestions(communityId);
      setQuestions(data);
      onQuestionsCountChange?.(data.length);
    } catch (err) {
      console.error('Failed to load community questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = async (questionId: string) => {
    const nextState = !expandedQuestions[questionId];
    setExpandedQuestions((prev) => ({ ...prev, [questionId]: nextState }));

    if (nextState && !questionDetails[questionId]) {
      setLoadingQuestionId(questionId);
      try {
        const full = await api.getQuestion(questionId);
        setQuestionDetails((prev) => ({ ...prev, [questionId]: full }));
      } catch (err) {
        console.error('Failed to load question details:', err);
      } finally {
        setLoadingQuestionId(null);
      }
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmittingQuestion(true);
    try {
      const parsedTags = newTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const created = await api.createQuestion(communityId, {
        title: newTitle.trim(),
        details: newDetails.trim(),
        tags: parsedTags,
        isAnonymous,
      });

      setQuestions((prev) => [created, ...prev]);
      onQuestionsCountChange?.(questions.length + 1);
      // Auto expand the newly created question
      setExpandedQuestions((prev) => ({ ...prev, [created.id]: true }));
      setQuestionDetails((prev) => ({ ...prev, [created.id]: created }));

      // Reset form
      setNewTitle('');
      setNewDetails('');
      setNewTags('');
      setIsAnonymous(false);
      setIsAsking(false);
    } catch (err) {
      console.error('Failed to create question:', err);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = answerTexts[questionId]?.trim();
    if (!content) return;

    const isAnon = Boolean(answerAnonStates[questionId]);
    setSubmittingAnswerId(questionId);

    try {
      const answer = await api.addAnswer(questionId, { content, isAnonymous: isAnon });

      // Update question in local state
      setQuestionDetails((prev) => {
        const existing = prev[questionId];
        if (!existing) return prev;
        return {
          ...prev,
          [questionId]: {
            ...existing,
            answersCount: (existing.answersCount || 0) + 1,
            answers: [...(existing.answers || []), answer],
          },
        };
      });

      // Update answers count in questions list
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, answersCount: (q.answersCount || 0) + 1 } : q
        )
      );

      // Clear input
      setAnswerTexts((prev) => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  const handleUpvoteQuestion = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.toggleUpvoteQuestion(questionId);
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? updated : q)));
      setQuestionDetails((prev) =>
        prev[questionId] ? { ...prev, [questionId]: { ...prev[questionId], ...updated } } : prev
      );
    } catch (err) {
      console.error('Failed to upvote question:', err);
    }
  };

  const handleUpvoteAnswer = async (questionId: string, answerId: string) => {
    try {
      const updatedAnswer = await api.toggleUpvoteAnswer(questionId, answerId);
      setQuestionDetails((prev) => {
        const existing = prev[questionId];
        if (!existing || !existing.answers) return prev;
        return {
          ...prev,
          [questionId]: {
            ...existing,
            answers: existing.answers.map((a) => (a.id === answerId ? updatedAnswer : a)),
          },
        };
      });
    } catch (err) {
      console.error('Failed to upvote answer:', err);
    }
  };

  const handleToggleResolve = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.toggleResolveQuestion(questionId);
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? updated : q)));
      setQuestionDetails((prev) =>
        prev[questionId] ? { ...prev, [questionId]: { ...prev[questionId], ...updated } } : prev
      );
    } catch (err) {
      console.error('Failed to toggle resolve:', err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'open' && q.isResolved) return false;
    if (filter === 'resolved' && !q.isResolved) return false;
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const matchesTitle = q.title.toLowerCase().includes(s);
      const matchesDetails = q.details?.toLowerCase().includes(s);
      const matchesTags = q.tags?.some((t) => t.toLowerCase().includes(s));
      return matchesTitle || matchesDetails || matchesTags;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <HelpCircle className="h-4 w-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {communityName} Questions &amp; Answers
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Ask technical questions, share architecture solutions, or troubleshoot together.
            <span className="text-neutral-300 font-medium ml-1">
              You can ask or answer anonymously at any time.
            </span>
          </p>
        </div>

        <button
          onClick={() => setIsAsking(!isAsking)}
          className={`flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition active:scale-95 shrink-0 ${
            isAsking
              ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          {isAsking ? (
            <span>Cancel</span>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Ask a Question</span>
            </>
          )}
        </button>
      </div>

      {/* ASK QUESTION FORM */}
      {isAsking && (
        <form
          onSubmit={handleCreateQuestion}
          className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4 shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Submit a New Question</h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">In {communityName}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Question Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. How do I optimize compute shader workgroup barrier synchronization?"
              className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Details, Logs, or Code Context (Optional)
            </label>
            <textarea
              rows={4}
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="Include error stack traces, specific hardware constraints, or relevant code snippet..."
              className="w-full rounded-xl border border-neutral-800 bg-black p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="wgsl, webgpu, performance, shaders"
              className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* ANONYMOUS TOGGLE BOX */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  isAnonymous
                    ? 'border-purple-500/40 bg-purple-500/10 text-purple-400'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                }`}
              >
                <EyeOff className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Post Anonymously</p>
                <p className="text-[11px] text-neutral-400">
                  Your identity will be masked as{' '}
                  <span className="font-mono text-neutral-300">Anonymous Builder</span>. Real
                  username, avatar, and profile remain completely private.
                </p>
              </div>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-black text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-neutral-200">
                {isAnonymous ? 'Anonymous Mode Active' : 'Stay Anonymous'}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAsking(false)}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingQuestion || !newTitle.trim()}
              className="flex items-center space-x-2 rounded-xl bg-white px-5 py-2 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50 transition active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmittingQuestion ? 'Publishing...' : 'Publish Question'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-neutral-900 pb-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or tags..."
            className="w-full rounded-xl border border-neutral-900 bg-neutral-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 self-start sm:self-auto">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'open', label: 'Open' },
            { id: 'resolved', label: 'Resolved' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === item.id
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* QUESTIONS LIST */}
      {isLoading ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-12 text-center text-xs text-neutral-400 font-mono">
          Loading community questions...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/60 text-neutral-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No questions found</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No questions matched your search query.'
                : 'Be the first to post a question or technical dilemma in this community.'}
            </p>
          </div>
          <button
            onClick={() => setIsAsking(true)}
            className="mt-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition"
          >
            Ask a Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isExpanded = Boolean(expandedQuestions[q.id]);
            const details = questionDetails[q.id] || q;
            const answers = details.answers || [];
            const answerInput = answerTexts[q.id] || '';
            const isAnonAnswer = Boolean(answerAnonStates[q.id]);

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-neutral-900 bg-neutral-950/80 transition hover:border-neutral-800 overflow-hidden"
              >
                {/* Question Header & Summary */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Vote & Content */}
                    <div className="flex items-start space-x-3.5 flex-1">
                      {/* Upvote Pill */}
                      <button
                        onClick={(e) => handleUpvoteQuestion(q.id, e)}
                        className={`flex flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 transition shrink-0 ${
                          q.upvotedBy?.includes(currentUser?.id || '')
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                            : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                        title="Upvote question"
                      >
                        <ThumbsUp className="h-3.5 w-3.5 mb-0.5" />
                        <span className="text-[11px] font-mono font-bold">{q.upvotes || 0}</span>
                      </button>

                      {/* Main Title & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {q.isResolved ? (
                            <span className="inline-flex items-center space-x-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Solved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                              <CircleDot className="h-3 w-3 text-amber-400" />
                              <span>Open</span>
                            </span>
                          )}

                          {/* Author Info */}
                          <div className="flex items-center space-x-1.5 text-xs">
                            {q.isAnonymous ? (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                                <EyeOff className="h-2.5 w-2.5" />
                                <span>Anonymous Builder</span>
                              </span>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                <img
                                  src={q.author.avatar}
                                  alt={q.author.name}
                                  className="h-4 w-4 rounded-full object-cover border border-neutral-800"
                                />
                                <span className="font-semibold text-neutral-300">{q.author.name}</span>
                              </div>
                            )}
                            <span className="text-neutral-500">•</span>
                            <span className="text-[11px] text-neutral-500">{q.createdAt}</span>
                          </div>
                        </div>

                        <h3
                          onClick={() => handleToggleExpand(q.id)}
                          className="text-sm sm:text-base font-bold text-white hover:text-emerald-400 cursor-pointer transition leading-snug"
                        >
                          {q.title}
                        </h3>

                        {q.details && (
                          <p className="text-xs text-neutral-300 mt-2 font-mono bg-black/50 p-3 rounded-xl border border-neutral-900/80 whitespace-pre-wrap">
                            {q.details}
                          </p>
                        )}

                        {/* Tags */}
                        {q.tags && q.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {q.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-black border border-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Expand / Resolve buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={(e) => handleToggleResolve(q.id, e)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                          q.isResolved
                            ? 'border border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                            : 'border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900'
                        }`}
                        title="Toggle question resolution"
                      >
                        {q.isResolved ? 'Mark Open' : 'Mark Solved'}
                      </button>

                      <button
                        onClick={() => handleToggleExpand(q.id)}
                        className="flex items-center space-x-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-neutral-200 hover:bg-neutral-800"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{q.answersCount || 0} Answers</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXPANDED ANSWERS THREAD */}
                {isExpanded && (
                  <div className="border-t border-neutral-900 bg-black/40 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                      </h4>
                      <span className="text-[11px] text-neutral-500">
                        Community solutions &amp; guidance
                      </span>
                    </div>

                    {/* Answers List */}
                    {loadingQuestionId === q.id ? (
                      <p className="text-xs font-mono text-neutral-500 py-3">Loading answers...</p>
                    ) : answers.length === 0 ? (
                      <div className="rounded-xl border border-neutral-900/60 bg-neutral-950/60 p-5 text-center">
                        <p className="text-xs font-semibold text-neutral-300">
                          No answers submitted yet.
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Share your knowledge or technical solution below!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {answers.map((ans) => (
                          <div
                            key={ans.id}
                            className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {ans.isAnonymous ? (
                                  <span className="inline-flex items-center space-x-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                                    <EyeOff className="h-2.5 w-2.5" />
                                    <span>Anonymous Builder</span>
                                  </span>
                                ) : (
                                  <div className="flex items-center space-x-1.5">
                                    <img
                                      src={ans.author.avatar}
                                      alt={ans.author.name}
                                      className="h-5 w-5 rounded-full object-cover border border-neutral-800"
                                    />
                                    <span className="text-xs font-bold text-white">
                                      {ans.author.name}
                                    </span>
                                    {ans.author.roleTitle && (
                                      <span className="text-[10px] text-neutral-500 font-mono">
                                        ({ans.author.roleTitle})
                                      </span>
                                    )}
                                  </div>
                                )}
                                <span className="text-neutral-500">•</span>
                                <span className="text-[10px] text-neutral-500">{ans.createdAt}</span>
                              </div>

                              <button
                                onClick={() => handleUpvoteAnswer(q.id, ans.id)}
                                className={`flex items-center space-x-1 rounded-lg border px-2 py-0.5 text-[11px] font-mono transition ${
                                  ans.upvotedBy?.includes(currentUser?.id || '')
                                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                    : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                                }`}
                                title="Upvote this answer"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                <span>{ans.upvotes || 0}</span>
                              </button>
                            </div>

                            <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
                              {ans.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* WRITE ANSWER COMPOSER */}
                    <form
                      onSubmit={(e) => handleAnswerSubmit(q.id, e)}
                      className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-3 pt-4"
                    >
                      <label className="block text-xs font-semibold text-neutral-300">
                        Write an Answer
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={answerInput}
                        onChange={(e) =>
                          setAnswerTexts((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Write your explanation, code snippet, or guidance..."
                        className="w-full rounded-xl border border-neutral-800 bg-black p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 font-sans"
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* ANONYMOUS CHECKBOX FOR ANSWER */}
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAnonAnswer}
                            onChange={(e) =>
                              setAnswerAnonStates((prev) => ({
                                ...prev,
                                [q.id]: e.target.checked,
                              }))
                            }
                            className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-white focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-neutral-300 flex items-center space-x-1">
                            <EyeOff className="h-3 w-3 text-purple-400" />
                            <span>Answer Anonymously (Hide Name &amp; Profile)</span>
                          </span>
                        </label>

                        <button
                          type="submit"
                          disabled={submittingAnswerId === q.id || !answerInput.trim()}
                          className="flex items-center justify-center space-x-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 disabled:opacity-50 transition active:scale-95 shrink-0"
                        >
                          <Send className="h-3 w-3" />
                          <span>
                            {submittingAnswerId === q.id ? 'Submitting...' : 'Post Answer'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
