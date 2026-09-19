import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  File,
  FileText,
  FileCode,
  FileArchive,
  Music,
  Image as ImageIcon,
  Download,
  Trash2,
  ExternalLink,
  Plus,
  Check,
  Search,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { EventFileAttachment, User } from '../types';
import { api } from '../services/api';

interface EventFilesSectionProps {
  eventId: string;
  initialFiles?: EventFileAttachment[];
  currentUser: User | null;
  onFilesUpdated?: (files: EventFileAttachment[]) => void;
}

export const EventFilesSection: React.FC<EventFilesSectionProps> = ({
  eventId,
  initialFiles = [],
  currentUser,
  onFilesUpdated,
}) => {
  const [files, setFiles] = useState<EventFileAttachment[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<'all' | 'code' | 'archive' | 'audio' | 'spec'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const [uploadFileType, setUploadFileType] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load files for event
  useEffect(() => {
    if (eventId) {
      api.getEventFiles(eventId)
        .then((data) => {
          setFiles(data);
          onFilesUpdated?.(data);
        })
        .catch(() => {
          // fallback to initialFiles
          setFiles(initialFiles);
        });
    }
  }, [eventId]);

  const getFileCategory = (type: string, name: string): 'code' | 'archive' | 'audio' | 'image' | 'doc' | 'other' => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['ts', 'js', 'wgsl', 'rs', 'py', 'cpp', 'json'].includes(ext) || type.includes('typescript') || type.includes('javascript') || type.includes('json')) {
      return 'code';
    }
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext) || type.includes('zip') || type.includes('compressed')) {
      return 'archive';
    }
    if (['wav', 'mp3', 'ogg', 'flac'].includes(ext) || type.includes('audio')) {
      return 'audio';
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext) || type.includes('image')) {
      return 'image';
    }
    if (['pdf', 'md', 'txt', 'doc'].includes(ext) || type.includes('pdf')) {
      return 'doc';
    }
    return 'other';
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'code':
        return <FileCode className="h-5 w-5 text-indigo-400" />;
      case 'archive':
        return <FileArchive className="h-5 w-5 text-amber-400" />;
      case 'audio':
        return <Music className="h-5 w-5 text-rose-400" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-emerald-400" />;
      case 'doc':
        return <FileText className="h-5 w-5 text-cyan-400" />;
      default:
        return <File className="h-5 w-5 text-neutral-400" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleNativeFileSelect = (selectedFile: File) => {
    setUploadFileName(selectedFile.name);
    setUploadFileSize(formatFileSize(selectedFile.size));
    setUploadFileType(selectedFile.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadFileUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleNativeFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    setIsUploading(true);
    try {
      const newFile = await api.uploadEventFile(eventId, {
        name: uploadFileName.trim(),
        size: uploadFileSize || '1.2 MB',
        type: uploadFileType || 'application/octet-stream',
        url: uploadFileUrl || '#',
        description: uploadDescription.trim() || undefined,
        uploadedBy: currentUser?.name || 'Tsuna Builder',
      });

      const updated = [newFile, ...files];
      setFiles(updated);
      onFilesUpdated?.(updated);

      // Reset
      setShowUploadModal(false);
      setUploadFileName('');
      setUploadFileSize('');
      setUploadFileType('');
      setUploadFileUrl('');
      setUploadDescription('');
    } catch (err) {
      console.error('Failed to upload file to event:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.deleteEventFile(eventId, fileId);
      const updated = files.filter((f) => f.id !== fileId);
      setFiles(updated);
      onFilesUpdated?.(updated);
    } catch (err) {
      console.error('Failed to delete file from event:', err);
    }
  };

  const handleDownload = (file: EventFileAttachment) => {
    if (file.url && file.url !== '#') {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create mock downloadable text representation
      const blob = new Blob([`Tsuna Event Resource: ${file.name}\nDescription: ${file.description || ''}\nUploaded: ${file.uploadedAt}`], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (fileFilter === 'all') return true;
    const cat = getFileCategory(file.type, file.name);
    if (fileFilter === 'code') return cat === 'code';
    if (fileFilter === 'archive') return cat === 'archive';
    if (fileFilter === 'audio') return cat === 'audio';
    if (fileFilter === 'spec') return cat === 'doc';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header with Title and Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-white">
              Event Files & Shared Resources ({files.length})
            </h3>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Download starter kits, WGSL compute pipelines, audio impulse stems, and specs. Anyone in the session can share files.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          id="upload-event-file-btn"
          className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 transition cursor-pointer shadow-md self-start sm:self-auto"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'code', label: 'Code & Shaders' },
            { id: 'archive', label: 'ZIP Starter Kits' },
            { id: 'audio', label: 'Audio & DSP Stems' },
            { id: 'spec', label: 'Specs & Docs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFileFilter(tab.id as any)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer shrink-0 ${
                fileFilter === tab.id
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white bg-black border border-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full rounded-lg border border-neutral-800 bg-black pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Files Grid / List */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-8 text-center">
          <Upload className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-neutral-300">No event files uploaded yet</p>
          <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
            Share starter code repositories, benchmarks, shader textures, or sound samples with other builders in this event.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-3.5 inline-flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>Upload First File</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFiles.map((file) => {
            const cat = getFileCategory(file.type, file.name);
            return (
              <div
                key={file.id}
                className="group rounded-xl border border-neutral-900 bg-neutral-950 p-3.5 hover:border-neutral-800 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black border border-neutral-800 shrink-0">
                        {getFileIcon(cat)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate max-w-[210px] sm:max-w-[240px]">
                          {file.name}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-neutral-400 mt-0.5">
                          <span className="text-emerald-400">{file.size}</span>
                          <span>•</span>
                          <span>by {file.uploadedBy}</span>
                          <span>•</span>
                          <span>{file.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-black text-neutral-300 hover:text-white hover:border-neutral-700 transition cursor-pointer"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-black text-neutral-500 hover:text-red-400 hover:border-red-900/50 transition cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {file.description && (
                    <p className="text-[11px] text-neutral-300 line-clamp-2 bg-black/40 rounded-lg p-2 border border-neutral-900 font-mono">
                      {file.description}
                    </p>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-900/60 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span className="uppercase">{cat} archive / asset</span>
                  <span>{file.downloadCount ? `${file.downloadCount} downloads` : 'Ready to download'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD FILE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Upload File to Event</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-neutral-800 bg-black/60 hover:border-neutral-700'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleNativeFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="h-6 w-6 text-neutral-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-white">
                  {uploadFileName ? uploadFileName : 'Drag & drop file or click to browse'}
                </p>
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  {uploadFileSize ? `${uploadFileSize} selected` : 'Supports ZIP, WGSL, TS, WAV, PDF, Images, JSON'}
                </p>
              </div>

              {/* File Name */}
              <div>
                <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                  File Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g. webgpu-compute-starter.zip"
                  className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                  File Description / Instructions
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="e.g. Starter kit boilerplate with hot-reload compute shader pass"
                  className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFileName.trim()}
                  className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
                >
                  {isUploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Attach to Event</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
