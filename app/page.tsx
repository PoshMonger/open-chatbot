"use client";
import Image from "next/image";
import germanAmericanLogo from "./assets/german_american.png";
import healthCareIcon from "./assets/healthcareicon.svg";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";
import Bubble from "./components/Bubble/Bubble";
import PromptSuggestionsRow from "./components/Bubble/PromptSuggestion/PromptSuggestionsRow";
import LoadingAnimation from "./components/LoadingBubble/loadingAnimation";
const Home = () => {
  const {
    append,
    isLoading,
    messages,
    input,
    handleInputChange,
    handleSubmit,
  } = useChat();
  const noMessages = true;
  const handlePromptClick = (prompt: string) => {
    const msg = {
      id: crypto.randomUUID(),
      content: prompt,
      role: "user",
    };
    append(msg);
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
            {messages.map((message: Message, index: number) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingAnimation />}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me anything..."
        />
        <input type="submit" />
      </form>
    </main>
  );
};

export default Home;
