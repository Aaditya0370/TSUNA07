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
    const a = document.createElement('a');
    a.download = filename || 'download';

    if (content.startsWith('data:') || content.startsWith('blob:') || content.startsWith('http')) {
      a.href = content;
    } else {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Failed to trigger download:', err);
  }
}
