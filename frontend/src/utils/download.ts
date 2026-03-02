import type { AxiosResponse } from 'axios';

/**
 * Trigger a browser download from an Axios blob response.
 * Reads filename from Content-Disposition header when available.
 */
export function downloadFromResponse(response: AxiosResponse<Blob>, fallbackFilename: string) {
  // Try to extract filename from Content-Disposition header
  const disposition = response.headers['content-disposition'] as string | undefined;
  let filename = fallbackFilename;
  if (disposition) {
    // filename*=UTF-8''encoded_name
    const utf8Match = disposition.match(/filename\*=UTF-8''(.+)/i);
    if (utf8Match) {
      filename = decodeURIComponent(utf8Match[1]);
    } else {
      // filename="name"
      const match = disposition.match(/filename="?([^";\n]+)"?/i);
      if (match) {
        filename = match[1].trim();
      }
    }
  }

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] as string || 'application/octet-stream',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
