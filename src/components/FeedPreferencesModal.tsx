import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Sparkles,
  Sliders,
  Cpu,
  Bot,
  Layers,
  Shield,
  Wrench,
  Rocket,
  Volume2,
  Terminal,
  Code2,
  Zap,
  Box,
  Eye,
  Shapes,
  Gamepad2,
  Palette,
  Headphones,
  Radio,
  Disc,
  Workflow,
  Database,
  Scan,
  Type,
  MousePointer,
  LayoutGrid,
  ShieldCheck,
  HardDrive,
  Lock,
  Share2,
  Key,
  FolderGit2,
  UserCheck,
  FileCode,
  RadioTower,
  Keyboard,
  Monitor,
  Cloud,
  GitPullRequest,
  Binary,
  Server,
  Network,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  ELABORATE_50_FEED_PREFERENCES,
  FEED_CATEGORIES,
  PRESET_CURATIONS,
  FeedPreference,
} from '../data/feedPreferences';

interface FeedPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: string[];
  currentFeedTuning?: {
    codeWeight?: number;
    mediaWeight?: number;
    discussionWeight?: number;
    exploreVsFollowing?: 'balanced' | 'mostly_following' | 'mostly_explore';
    boostedTags?: string[];
    penalizedTags?: string[];
  };
  onSave: (preferences: string[], tuning: any) => Promise<void>;
  isInitialOnboarding?: boolean;
}

// Icon mapper for safe dynamic rendering
const ICON_MAP: Record<string, React.ElementType> = {
  Cpu,
  Sparkles,
  Volume2,
  Bot,
  Layers,
  Shield,
  Wrench,
  Rocket,
  Terminal,
  Binary,
  Server,
  Network,
  Zap,
  Box,
  Eye,
  Shapes,
  Gamepad2,
  Palette,
  Sliders,
  Headphones,
  Radio,
  Disc,
  Code2,
  Database,
  Scan,
  Type,
  MousePointer,
  LayoutGrid,
  ShieldCheck,
  HardDrive,
  Lock,
  Share2,
  Key,
  FolderGit2,
  UserCheck,
  FileCode,
  RadioTower,
  Keyboard,
  Monitor,
  Cloud,
  Flame: Rocket,
  GitPullRequest,
  Workflow,
};

export const FeedPreferencesModal: React.FC<FeedPreferencesModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  currentFeedTuning,
  onSave,
  isInitialOnboarding = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(currentPreferences || []);
  const [activeTab, setActiveTab] = useState<'preferences' | 'tuning'>('preferences');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Algorithmic format affinities (Instagram / Facebook architecture)
  const [codeWeight, setCodeWeight] = useState<number>(currentFeedTuning?.codeWeight ?? 80);
  const [mediaWeight, setMediaWeight] = useState<number>(currentFeedTuning?.mediaWeight ?? 75);
  const [discussionWeight, setDiscussionWeight] = useState<number>(currentFeedTuning?.discussionWeight ?? 65);
  const [exploreBalance, setExploreBalance] = useState<'balanced' | 'mostly_following' | 'mostly_explore'>(
    currentFeedTuning?.exploreVsFollowing ?? 'balanced'
  );

  if (!isOpen) return null;

  const togglePreference = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const applyPreset = (presetIds: string[]) => {
    const combined = Array.from(new Set([...selectedIds, ...presetIds]));
    setSelectedIds(combined);
  };

  const selectAllInCategory = (catName: string) => {
    const idsInCat = ELABORATE_50_FEED_PREFERENCES.filter((p) => p.category === catName).map((p) => p.id);
    const combined = Array.from(new Set([...selectedIds, ...idsInCat]));
    setSelectedIds(combined);
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const filteredPreferences = useMemo(() => {
    return ELABORATE_50_FEED_PREFERENCES.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedIds, {
        codeWeight,
        mediaWeight,
        discussionWeight,
        exploreVsFollowing: exploreBalance,
      });
      onClose();
    } catch (e) {
      console.error('Failed to save preferences:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="feed-preferences-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="feed-preferences-modal-container"
        className="relative w-full max-w-4xl bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-100 tracking-tight flex items-center gap-2">
                  Customize Your AI Feed
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                    50 Preferences
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                  Multi-signal feed customizer with topic affinities, code weights, and creator suggestions.
                </p>
              </div>
            </div>
          </div>

          <button
            id="close-preferences-modal-btn"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 px-5 sm:px-6 bg-stone-900/90 shrink-0 gap-6">
          <button
            id="tab-50-preferences"
            onClick={() => setActiveTab('preferences')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'preferences'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>50 Topic Preferences</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
              {selectedIds.length}/50
            </span>
          </button>

          <button
            id="tab-format-tuning"
            onClick={() => setActiveTab('tuning')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tuning'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Algorithmic Weights & Structure</span>
          </button>
        </div>

        {/* Tab 1: 50 Elaborate Preferences */}
        {activeTab === 'preferences' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Quick Presets Bar */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2 flex items-center justify-between">
                <span>Starter Curations (1-Click Packs)</span>
                {selectedIds.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-stone-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear Selection
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_CURATIONS.map((preset) => {
                  const allActive = preset.preferenceIds.every((id) => selectedIds.includes(id));
                  return (
                    <button
                      key={preset.id}
                      id={`preset-btn-${preset.id}`}
                      onClick={() => applyPreset(preset.preferenceIds)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                        allActive
                          ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300 font-medium'
                          : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:border-stone-600 hover:bg-stone-800'
                      }`}
                    >
                      {allActive && <Check className="w-3 h-3 text-indigo-400" />}
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  id="search-preferences-input"
                  type="text"
                  placeholder="Search among all 50 preferences, languages, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-950/70 border border-stone-800 rounded-xl pl-9 pr-8 py-2 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                id="filter-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-stone-950/70 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All 8 Domains ({ELABORATE_50_FEED_PREFERENCES.length})</option>
                {FEED_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Quick Selector Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                All Domains
              </button>
              {FEED_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedCategory === cat.name
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span>{cat.name.split('&')[0].trim()}</span>
                </button>
              ))}
            </div>

            {/* 50 Preferences Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {filteredPreferences.map((pref) => {
                const isSelected = selectedIds.includes(pref.id);
                const IconComp = ICON_MAP[pref.icon] || Sparkles;

                return (
                  <div
                    key={pref.id}
                    id={`preference-card-${pref.id}`}
                    onClick={() => togglePreference(pref.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-600/90 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-stone-950/40 border-stone-800 hover:border-stone-700 hover:bg-stone-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            isSelected
                              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4
                            className={`text-sm font-semibold leading-tight ${
                              isSelected ? 'text-indigo-200' : 'text-stone-200'
                            }`}
                          >
                            {pref.label}
                          </h4>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 block mt-0.5">
                            {pref.category.split('&')[0].trim()}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-stone-700 bg-stone-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </div>
                    </div>

                    <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                      {pref.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-stone-800/60">
                      {pref.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredPreferences.length === 0 && (
              <div className="text-center py-10 text-stone-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No preferences match "{searchQuery}"</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 text-xs text-indigo-400 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Algorithmic Format Tuning (Instagram/Facebook style) */}
        {activeTab === 'tuning' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 leading-relaxed">
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1 text-sm">
                <Sliders className="w-4 h-4" /> Multi-Signal Feed Customization
              </div>
              Tune how the AI scores candidates. Adjust the format affinities below to customize how much of
              each content type appears in your feed, alongside your {selectedIds.length} chosen topic preferences.
            </div>

            {/* Slider 1: Code Snippets Weight */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-stone-200">Code Snippets & Walkthroughs</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{codeWeight}% Affinity</span>
              </div>
              <input
                id="slider-code-weight"
                type="range"
                min="0"
                max="100"
                value={codeWeight}
                onChange={(e) => setCodeWeight(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-xs text-stone-400">
                Prioritizes posts featuring WGSL, Rust, WebAssembly, GLSL, and TypeScript snippets.
              </p>
            </div>

            {/* Slider 2: Media & Interactive Canvas */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-stone-200">Visual Demos & Interactive Canvas</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">{mediaWeight}% Affinity</span>
              </div>
              <input
                id="slider-media-weight"
                type="range"
                min="0"
                max="100"
                value={mediaWeight}
                onChange={(e) => setMediaWeight(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-xs text-stone-400">
                Prioritizes visual renders, 3D prototypes, audio synthesis recordings, and UI motion.
              </p>
            </div>

            {/* Slider 3: Technical Discussions */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-stone-200">Discussions, RFCs & Ideas</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400">{discussionWeight}% Affinity</span>
              </div>
              <input
                id="slider-discussion-weight"
                type="range"
                min="0"
                max="100"
                value={discussionWeight}
                onChange={(e) => setDiscussionWeight(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <p className="text-xs text-stone-400">
                Prioritizes architectural writeups, benchmarks, community questions, and collaboration invites.
              </p>
            </div>

            {/* Discovery Ratio */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-3">
              <span className="text-sm font-semibold text-stone-200 block">Discovery vs Following Balance</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mostly_following', label: 'Mostly Following', desc: 'Focus on people you follow' },
                  { id: 'balanced', label: 'Balanced (Recommended)', desc: 'Mix following with topic recommendations' },
                  { id: 'mostly_explore', label: 'Explore Heavy', desc: 'Discover new builders and communities' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setExploreBalance(opt.id as any)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      exploreBalance === opt.id
                        ? 'bg-indigo-950/50 border-indigo-600 text-indigo-200 ring-1 ring-indigo-500'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                    }`}
                  >
                    <span className="text-xs font-bold block">{opt.label}</span>
                    <span className="text-[11px] text-stone-500 mt-1 block leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-400">
            <span className="font-semibold text-stone-200">{selectedIds.length}</span> of 50 preferences selected
          </div>

          <div className="flex items-center gap-3">
            <button
              id="cancel-preferences-btn"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cancel
            </button>

            <button
              id="save-feed-preferences-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Applying AI Model...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Apply AI Feed</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
