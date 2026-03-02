"use client";

import Image from "next/image";
import { useState } from "react";
import germanAmericanLogo from "./assets/german_american.png";
import healthCareIcon from "./assets/healthcareicon.svg";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { UIMessage } from "ai";
import Bubble from "./components/Bubble/Bubble";
import PromptSuggestionsRow from "./components/Bubble/PromptSuggestion/PromptSuggestionsRow";
import LoadingAnimation from "./components/LoadingBubble/loadingAnimation";

const Home = () => {
  const [input, setInput] = useState("");
  const {
    sendMessage,
    messages,
    status,
    error,
  } = useChat({
    transport: new TextStreamChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "streaming" || status === "submitted";
  const noMessages = !messages || messages.length === 0;

  const handlePromptClick = (prompt: string) => {
    sendMessage({ text: prompt });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <main>
      <Image
        src={healthCareIcon}
        alt="German American Logo"
        width={100}
        height={100}
      />
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              The Ultimate place for learning about longevity and health.
            </p>
            <br />
            <PromptSuggestionsRow onPromptClick={handlePromptClick} />
          </>
        ) : (
          <>
            {messages.map((message: UIMessage, index: number) => (
              <Bubble key={message.id ?? `message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingAnimation />}
          </>
        )}
      </section>
      {error && <p className="error">{error.message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me anything..."
        />
        <button type="submit">Send</button>
      </form>
    </main>
  );
};

export default Home;
