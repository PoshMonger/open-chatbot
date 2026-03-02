import React from "react";
import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionsRow = ({onPromptClick}: {onPromptClick: (prompt: string) => void}) => {
  const prompts = [
    "What is the best way to stay healthy?",
    "What are the bio-markers of aging",
    "What are the best foods for longevity",
    "What are coexisting conditions that are common in the elderly",
    "What are the best exercises for longevity",
  ];
  return (
    <div className="prompt-suggestions-row">
      {prompts.map((prompt: string, index: number) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      ))}
    </div>
  );
};

export default PromptSuggestionsRow;
