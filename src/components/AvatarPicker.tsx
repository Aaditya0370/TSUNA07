import React, { useState, useRef } from 'react';
import { Sparkles, Upload, RefreshCw, Check, Image as ImageIcon, Smile, Swords, PenTool } from 'lucide-react';
import { AVATAR_PRESETS, AVATAR_CATEGORIES, AvatarCategory, generateAvatarUrl } from '../data/avatarPresets';
import { sounds } from '../utils/audio';

interface AvatarPickerProps {
  currentAvatar: string;
  onSelectAvatar: (url: string) => void;
  className?: string;
  showUploadButton?: boolean;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatar,
  onSelectAvatar,
  className = '',
  showUploadButton = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AvatarCategory | 'all'>('all');
  const [randomSeed, setRandomSeed] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredPresets = selectedCategory === 'all'
    ? AVATAR_PRESETS
    : AVATAR_PRESETS.filter((p) => p.category === selectedCategory);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP, GIF).');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onSelectAvatar(dataUrl);
        sounds.playSuccess();
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleGenerateRandom = (category: AvatarCategory) => {
    const nextSeed = `avatar_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setRandomSeed((prev) => prev + 1);
    const newUrl = generateAvatarUrl(category, nextSeed);
    onSelectAvatar(newUrl);
    sounds.playTap();
  };

  const getCategoryIcon = (cat: AvatarCategory) => {
    switch (cat) {
      case 'cartoon':
        return <Smile className="h-3.5 w-3.5" />;
      case 'anime':
        return <Swords className="h-3.5 w-3.5" />;
      case 'doodle':
        return <PenTool className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Category Tabs: Cartoon, Anime, Doodle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              sounds.playTap();
            }}
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-neutral-800 text-white shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <span>All Styles</span>
            <span className="text-[10px] font-mono text-neutral-500">({AVATAR_PRESETS.length})</span>
          </button>

          {AVATAR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                sounds.playTap();
              }}
              className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Shuffle / Generator */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => {
              const activeCat = selectedCategory === 'all' ? 'cartoon' : selectedCategory;
              handleGenerateRandom(activeCat);
            }}
            className="flex items-center space-x-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-mono text-neutral-300 hover:border-neutral-700 hover:text-white transition shadow-sm"
            title="Generate new illustrated avatar"
          >
            <RefreshCw className="h-3 w-3 text-emerald-400" />
            <span>Shuffle {selectedCategory === 'all' ? 'Avatar' : selectedCategory}</span>
          </button>
        </div>
      </div>

      {/* Grid of Cartoon, Anime, and Doodle Avatars */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1 py-1">
        {filteredPresets.map((preset) => {
          const isSelected = currentAvatar === preset.url;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                onSelectAvatar(preset.url);
                sounds.playTap();
              }}
              className={`group relative flex flex-col items-center rounded-xl p-1.5 border transition cursor-pointer ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-600 hover:bg-neutral-850'
              }`}
              title={`${preset.name} (${preset.category}) - ${preset.description || ''}`}
            >
              <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-neutral-950 flex items-center justify-center">
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="rounded-full bg-emerald-500 p-0.5 text-black shadow">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>
              <span className="mt-1 text-[9px] font-mono text-neutral-400 truncate w-full text-center group-hover:text-neutral-200">
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Upload From Computer Option (Everywhere) */}
      {showUploadButton && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex items-center justify-between rounded-xl border border-dashed px-3.5 py-2.5 transition ${
            isDragOver
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
              <Upload className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Upload from Computer</p>
              <p className="text-[10px] text-neutral-400 font-mono">
                Drag and drop your own photo, cartoon, or doodle file here
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 hover:border-neutral-600 transition shrink-0"
          >
            {isUploading ? 'Loading...' : 'Browse Computer'}
          </button>
        </div>
      )}
    </div>
  );
};
