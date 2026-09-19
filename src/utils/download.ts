/**
 * Utility for triggering browser-native file downloads
 * without popups or blocked alert dialogs.
 */
export function triggerFileDownload(
  filename: string,
  content: string = 'Tsuna Verified Asset Payload',
  mimeType: string = 'text/plain'
) {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to trigger download:', err);
  }
}
