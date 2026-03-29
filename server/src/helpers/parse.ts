/** Clamp a query‑param to a safe positive integer. */
export const safeInt = (value: unknown, fallback: number, max = 100): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
};

/** Parse a comma‑separated string into a trimmed, non‑empty array. */
export const parseCSV = (value: unknown): string[] => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};
