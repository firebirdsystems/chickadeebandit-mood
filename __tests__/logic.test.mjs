import { describe, it, expect } from "vitest";
import {
  promptForDate, PROMPTS,
  canViewTrends, sharedWithMe,
  dateDaysAgo, localDateStr, formatEntryDate,
  entriesInWindow, average, symptomFrequency,
  scaleEntry, MOOD_SCALE,
} from "../src/logic.js";

describe("promptForDate", () => {
  it("is deterministic for a given date", () => {
    expect(promptForDate("2026-06-07")).toBe(promptForDate("2026-06-07"));
  });

  it("rotates across consecutive days", () => {
    const a = promptForDate("2026-06-07");
    const b = promptForDate("2026-06-08");
    expect(a).not.toBe(b);
  });

  it("returns a prompt from the deck", () => {
    expect(PROMPTS).toContain(promptForDate("2026-01-01"));
  });

  it("returns empty string for missing date", () => {
    expect(promptForDate("")).toBe("");
  });
});

describe("scaleEntry", () => {
  it("finds the matching scale entry", () => {
    expect(scaleEntry(MOOD_SCALE, 4)).toEqual({ value: 4, emoji: "🙂", label: "Good" });
  });

  it("returns null for an out-of-range value", () => {
    expect(scaleEntry(MOOD_SCALE, 9)).toBeNull();
  });
});

describe("canViewTrends", () => {
  const shares = [{ owner_id: "alex", viewer_id: "sam" }];

  it("always allows viewing your own data", () => {
    expect(canViewTrends("alex", "alex", shares)).toBe(true);
  });

  it("allows the viewer named in a share row", () => {
    expect(canViewTrends("alex", "sam", shares)).toBe(true);
  });

  it("denies anyone not explicitly shared with", () => {
    expect(canViewTrends("alex", "jordan", shares)).toBe(false);
  });

  it("denies when ids are missing", () => {
    expect(canViewTrends("", "sam", shares)).toBe(false);
  });
});

describe("sharedWithMe", () => {
  const shares = [
    { owner_id: "alex", viewer_id: "sam" },
    { owner_id: "jordan", viewer_id: "sam" },
    { owner_id: "sam", viewer_id: "sam" },
  ];

  it("lists owners who shared with the viewer, excluding self", () => {
    expect(sharedWithMe("sam", shares).sort()).toEqual(["alex", "jordan"]);
  });

  it("returns an empty list when nobody has shared", () => {
    expect(sharedWithMe("alex", shares)).toEqual([]);
  });
});

describe("date helpers", () => {
  it("dateDaysAgo computes a local date string offset", () => {
    expect(dateDaysAgo(0, new Date(2026, 5, 7))).toBe("2026-06-07");
    expect(dateDaysAgo(7, new Date(2026, 5, 7))).toBe("2026-05-31");
  });

  it("localDateStr pads month and day", () => {
    expect(localDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("formatEntryDate renders a friendly date", () => {
    expect(formatEntryDate("2026-06-07")).toMatch(/Jun 7/);
  });

  it("formatEntryDate handles empty input", () => {
    expect(formatEntryDate("")).toBe("");
  });
});

describe("entriesInWindow", () => {
  const today = new Date(2026, 5, 10);
  const entries = [
    { entry_date: "2026-06-10", mood: 5, energy: 5 },
    { entry_date: "2026-06-05", mood: 3, energy: 3 },
    { entry_date: "2026-05-01", mood: 1, energy: 1 },
  ];

  it("keeps entries within the window, sorted oldest to newest", () => {
    const result = entriesInWindow(entries, 7, today);
    expect(result.map(e => e.entry_date)).toEqual(["2026-06-05", "2026-06-10"]);
  });

  it("excludes entries before the cutoff", () => {
    const result = entriesInWindow(entries, 7, today);
    expect(result.find(e => e.entry_date === "2026-05-01")).toBeUndefined();
  });
});

describe("average", () => {
  it("computes a rounded average", () => {
    expect(average([{ mood: 4 }, { mood: 5 }, { mood: 3 }], "mood")).toBe(4);
    expect(average([{ mood: 4 }, { mood: 5 }], "mood")).toBe(4.5);
  });

  it("returns null for an empty list", () => {
    expect(average([], "mood")).toBeNull();
  });
});

describe("symptomFrequency", () => {
  it("tallies and sorts by frequency descending", () => {
    const entries = [
      { symptoms: '["Anxious", "Tired"]' },
      { symptoms: '["Tired"]' },
      { symptoms: '["Calm"]' },
    ];
    expect(symptomFrequency(entries)).toEqual([
      { tag: "Tired", count: 2 },
      { tag: "Anxious", count: 1 },
      { tag: "Calm", count: 1 },
    ]);
  });

  it("ignores malformed symptom data", () => {
    expect(symptomFrequency([{ symptoms: "not json" }, { symptoms: "[]" }])).toEqual([]);
  });
});
