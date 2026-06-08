export { esc } from "./shared.js";

// ── Mood / energy scales ──────────────────────────────────────────────────────

export const MOOD_SCALE = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export const ENERGY_SCALE = [
  { value: 1, emoji: "🪫", label: "Drained" },
  { value: 2, emoji: "😴", label: "Tired" },
  { value: 3, emoji: "🙂", label: "Steady" },
  { value: 4, emoji: "⚡", label: "Energized" },
  { value: 5, emoji: "🔋", label: "Full tank" },
];

export const SYMPTOM_TAGS = [
  "Anxious", "Stressed", "Sore", "Headache", "Tired",
  "Restless", "Calm", "Grateful", "Irritable", "Hopeful",
];

export function scaleEntry(scale, value) {
  return scale.find(s => s.value === value) ?? null;
}

// ── Gentle prompts ────────────────────────────────────────────────────────────

export const PROMPTS = [
  "What's one thing that went well today?",
  "What's weighing on you right now?",
  "Who or what made you smile today?",
  "What's something you're looking forward to?",
  "What helped you feel calm today?",
  "Is there something you need more of this week?",
  "What's a small win you can celebrate today?",
  "What drained your energy today, and why?",
  "What's one thing you'd like tomorrow to look like?",
  "What are you grateful for right now?",
];

/**
 * Deterministically picks a prompt for a given date string ("YYYY-MM-DD"),
 * rotating through the deck so the same prompt doesn't repeat on consecutive days.
 */
export function promptForDate(dateStr, deck = PROMPTS) {
  if (!dateStr || !deck.length) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return deck[dayNumber % deck.length];
}

// ── Sharing ───────────────────────────────────────────────────────────────────

/**
 * True if `ownerId` has an opt-in share row granting `viewerId` access to their
 * trend data. Self always has access to their own data.
 * @param {Array<{owner_id: string, viewer_id: string}>} shares
 */
export function canViewTrends(ownerId, viewerId, shares) {
  if (!ownerId || !viewerId) return false;
  if (ownerId === viewerId) return true;
  return shares.some(s => s.owner_id === ownerId && s.viewer_id === viewerId);
}

/**
 * Returns the list of member IDs that have shared their trends with `viewerId`
 * (excluding the viewer themselves).
 * @param {Array<{owner_id: string, viewer_id: string}>} shares
 */
export function sharedWithMe(viewerId, shares) {
  return shares
    .filter(s => s.viewer_id === viewerId && s.owner_id !== viewerId)
    .map(s => s.owner_id);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" for the local date `daysAgo` days before today. */
export function dateDaysAgo(daysAgo, today = new Date()) {
  const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  dt.setDate(dt.getDate() - daysAgo);
  return localDateStr(dt);
}

export function localDateStr(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatEntryDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ── Trend aggregation ─────────────────────────────────────────────────────────

/**
 * Filters entries to the last `days` days (inclusive of today) and returns
 * them sorted oldest → newest, ready for charting.
 * @param {Array<{entry_date: string, mood: number, energy: number}>} entries
 */
export function entriesInWindow(entries, days, today = new Date()) {
  const cutoff = dateDaysAgo(days - 1, today);
  return entries
    .filter(e => e.entry_date >= cutoff)
    .slice()
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

/**
 * Average of a numeric field across entries, rounded to 1 decimal.
 * Returns null for an empty list.
 */
export function average(entries, field) {
  if (!entries.length) return null;
  const sum = entries.reduce((s, e) => s + (e[field] ?? 0), 0);
  return Math.round((sum / entries.length) * 10) / 10;
}

/**
 * Tally how often each symptom tag appears across entries, sorted by
 * frequency descending. Each entry's `symptoms` is a JSON array string.
 * @returns {Array<{tag: string, count: number}>}
 */
export function symptomFrequency(entries) {
  const counts = new Map();
  for (const e of entries) {
    let tags;
    try { tags = JSON.parse(e.symptoms || "[]"); } catch { tags = []; }
    if (!Array.isArray(tags)) continue;
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
