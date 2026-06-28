import { useState } from "react";
import GenerateFlashcardsButton from "../Components/GenerateFlashcardsButton";
import FlashcardDeck, { FlashcardEmptyState } from "../Components/Flashcarddeck";
import type { TopicGroup, QACard, QATopicGroup } from "../Flashcard.types";
import "./Flashcards.css";

// ─── Filter: keep fill_blank + short_answer cards, drop topics that become
//     empty. multiple_choice cards are excluded — they live in the separate
//     Quiz deck instead. ────────────────────────────────────────────────────
function toQAOnly(raw: TopicGroup[]): QATopicGroup[] {
  return raw
    .map((group) => ({
      ...group,
      flashcards: group.flashcards.filter(
        (c): c is QACard => c.type === "fill_blank" || c.type === "short_answer"
      ),
    }))
    .filter((group) => group.flashcards.length > 0);
}

export default function Flashcard() {
  const [flashcardData, setFlashcardData] = useState<QATopicGroup[] | null>(null);

  // Receive raw API data → keep fill_blank + short_answer, drop multiple_choice
  const handleGenerated = (raw: TopicGroup[]) => {
    setFlashcardData(toQAOnly(raw));
  };

  return (
    <div className="fc-page">
      {/* ── Header — title style taken from .mm-page-title ── */}
      <div className="fc-page-header">
        <h1 className="fc-page-title">Flashcards</h1>
      </div>

      {!flashcardData && <FlashcardEmptyState />}

      {flashcardData && (
        <div className="fc-canvas">
          <FlashcardDeck data={flashcardData} />
        </div>
      )}

      {/* ── Generate button pinned bottom — button style from .mm-gen-btn ── */}
      <div className="fc-gen-button">
        <GenerateFlashcardsButton onGenerated={handleGenerated} />
      </div>
    </div>
  );
}