// ─── Shared types mirrored from FastAPI /flashcards response ─────────────────

export interface MultipleChoiceCard {
  type: "multiple_choice";
  question: string;
  options: [string, string, string, string];
  correct_answer: string;
}

export interface FillBlankCard {
  type: "fill_blank";
  question: string;
  correct_answer: string;
}

// NEW — open-ended question, same shape as FillBlankCard but no literal
// blank in the question text (full sentence, full-sentence answer).
export interface ShortAnswerCard {
  type: "short_answer";
  question: string;
  correct_answer: string;
}

export type FlashCard = MultipleChoiceCard | FillBlankCard | ShortAnswerCard;

export interface TopicGroup {
  topic_index: number;
  topic: string;
  first_timestamp: number | null;
  last_timestamp: number | null;
  info_score: number;
  flashcards: FlashCard[];
}

// ─── Q&A-style variant used by the deck display ──────────────────────────────
// Renamed from FillBlankTopicGroup: now holds BOTH fill_blank and
// short_answer cards, since they share the same flip-card UI and only
// multiple_choice is excluded.
export type QACard = FillBlankCard | ShortAnswerCard;

export interface QATopicGroup {
  topic_index: number;
  topic: string;
  first_timestamp: number | null;
  last_timestamp: number | null;
  info_score: number;
  flashcards: QACard[];   // fill_blank + short_answer cards only
}

/** @deprecated use QATopicGroup — kept temporarily so existing imports don't break */
export type FillBlankTopicGroup = QATopicGroup;