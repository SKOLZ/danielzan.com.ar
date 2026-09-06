export function extractYouTubeId(value: string): string | null {
  const url = value.trim();
  if (!url) return null;
  const match = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*[?&])?v=|embed\/|shorts\/|live\/|v\/|e\/)|youtu\.be\/)([\w-]{11})/i
  );
  return match ? match[1] : null;
}