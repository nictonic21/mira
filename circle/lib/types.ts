export type Effort = "me" | "them" | "mutual";

export const TAGS = [
  "vented",
  "laughed",
  "felt judged",
  "felt supported",
  "one sided",
  "fun",
  "heavy",
] as const;

export type Tag = (typeof TAGS)[number];

export interface Friend {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  relationship_type: string | null;
  created_at: string;
  archived: boolean;
}

export interface Entry {
  id: string;
  friend_id: string;
  user_id: string;
  created_at: string;
  energy_score: number; // 1 (drained) to 10 (energised)
  effort: Effort;
  tags: string[];
  what_happened: string | null;
  how_i_felt: string | null;
}

export interface EntryAnalysis {
  id: string;
  entry_id: string;
  sentiment_score: number; // -1 to 1
  themes: string[];
  ai_note: string;
  processed_at: string;
}

export const RELATIONSHIP_TYPES = [
  "close friend",
  "friend",
  "family",
  "partner",
  "colleague",
  "other",
] as const;

// Don't show a score until there are at least this many entries for a friend.
export const MIN_ENTRIES_FOR_SCORE = 5;
