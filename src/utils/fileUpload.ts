/**
 * Universal computer file reader and uploader utility
 * Allows files and images to be uploaded from computer everywhere
 */

export interface ProcessedFile {
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
  dataUrl: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Reads any computer file selected via input or drag-and-drop
 */
export function readFileFromComputer(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      resolve({
        name: file.name,
        size: formatBytes(file.size),
        sizeBytes: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        isImage,
        isVideo,
        isAudio,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads computer file to the backend /api/upload
 */
export async function uploadFileToServer(file: File): Promise<ProcessedFile> {
  const processed = await readFileFromComputer(file);
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: processed.name,
        type: processed.type,
        size: processed.size,
        dataUrl: processed.dataUrl,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return {
        ...processed,
        dataUrl: json.url || processed.dataUrl,
      };
    }
  } catch (err) {
    console.warn('Direct upload route fallback to local dataUrl:', err);
  }
  return processed;
}
