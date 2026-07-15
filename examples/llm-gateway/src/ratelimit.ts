// Rate-limit fixed-window / phút. Pure, không phụ thuộc — test được độc lập.
export type Window = { count: number; resetAt: number };

export function rateLimit(win: Window | undefined, rpm: number, now: number): {
  allowed: boolean;
  win: Window;
} {
  if (!win || now >= win.resetAt) win = { count: 0, resetAt: now + 60_000 };
  if (win.count >= rpm) return { allowed: false, win };
  return { allowed: true, win: { ...win, count: win.count + 1 } };
}
