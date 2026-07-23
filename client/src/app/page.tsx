'use client';

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsDownloading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({url, format}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Download failed');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDownloading(false);
    }
  };

return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-zinc-900 dark:text-zinc-100">
            YouTube UDownloader
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-700 dark:text-zinc-100 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Format
              </label>
              <select
                value={format}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormat(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-700 dark:text-zinc-100 outline-none transition-colors"
              >
                <option value="mp3">MP3 (Audio only)</option>
                <option value="mp4_best">MP4 (Best quality)</option>
                <option value="mp4_1080">MP4 1080p</option>
                <option value="mp4_720">MP4 720p</option>
                <option value="mp4_480">MP4 480p</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isDownloading || !url}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                'Download'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Hanya untuk penggunaan pribadi. Jangan gunakan untuk keperluan komersial.
          </p>
        </div>
      </div>
    </div>
  );
}
