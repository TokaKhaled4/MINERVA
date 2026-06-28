import { useState } from "react";
import GenerateQuizButton from "../Components/GenerateQuizButton";
import QuizDeck, { QuizEmptyState } from "../Components/QuizDeck";
import type { TopicGroup } from "../Flashcard.types";
import "./Quiz.css";

export default function Quiz() {
  const [quizData, setQuizData] = useState<TopicGroup[] | null>(null);

  // Filter to only topics that have at least one multiple_choice card
  const handleGenerated = (raw: TopicGroup[]) => {
    const mcOnly = raw
      .map((group) => ({
        ...group,
        flashcards: group.flashcards.filter((c) => c.type === "multiple_choice"),
      }))
      .filter((group) => group.flashcards.length > 0);

    setQuizData(mcOnly);
  };

  return (
    <div className="qz-page">
      <div className="qz-page-header">
        <h1 className="qz-page-title">Quiz</h1>
      </div>

      {!quizData && <QuizEmptyState />}

      {quizData && (
        <div className="qz-canvas">
          <QuizDeck data={quizData} />
        </div>
      )}

      <div className="qz-gen-button">
        <GenerateQuizButton onGenerated={handleGenerated} />
      </div>
    </div>
  );
}