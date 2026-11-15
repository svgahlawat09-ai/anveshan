// Local-storage persistence for the frontend prototype: investigation history
// and saved reports. All data stays in the browser — demo only.

export interface HistoryEntry {
  id: string;
  claim: string;
  mode: "text" | "url" | "document";
  date: string; // ISO
}

export interface SavedReport {
  id: string;
  title: string;
  claim: string;
  assessment: string;
  savedAt: string; // ISO
}

const HISTORY_KEY = "anveshan_investigation_history_v1";
const SAVED_KEY = "anveshan_saved_reports_v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode / quota) — prototype degrades silently
  }
}

export function getHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(HISTORY_KEY, []);
}

export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const list = [entry, ...getHistory().filter((e) => e.id !== entry.id)].slice(0, 20);
  write(HISTORY_KEY, list);
  return list;
}

export function clearHistory(): void {
  write(HISTORY_KEY, []);
}

export function getSavedReports(): SavedReport[] {
  return read<SavedReport[]>(SAVED_KEY, []);
}

export function saveReport(report: SavedReport): {
  list: SavedReport[];
  alreadySaved: boolean;
} {
  const existing = getSavedReports();
  if (existing.some((r) => r.id === report.id)) {
    return { list: existing, alreadySaved: true };
  }
  const list = [report, ...existing].slice(0, 50);
  write(SAVED_KEY, list);
  return { list, alreadySaved: false };
}

export function deleteSavedReport(id: string): SavedReport[] {
  const list = getSavedReports().filter((r) => r.id !== id);
  write(SAVED_KEY, list);
  return list;
}

export function clearAllDemoData(): void {
  write(HISTORY_KEY, []);
  write(SAVED_KEY, []);
}
