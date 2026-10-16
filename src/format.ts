const pad = (n: number) => String(n).padStart(2, "0");

// 125000 -> "2:05", 4000000 -> "1:06:40", 43200000 -> "12:00:00"
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}