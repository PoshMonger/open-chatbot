"use client";
import Image from "next/image";
import germanAmericanLogo from "./assets/german_american.png";
import healthCareIcon from "./assets/healthcareicon.svg";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";
import Bubble from "./components/Bubble";
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
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
  const noMessages = false;
  return (
    <main>
      <Image
        src={healthCareIcon}
        alt="German American Logo"
        width={100}
        height={100}
        alt="German American Logo"
      />
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              The Ultimate place for learning about longevity and health.
            </p>
            <br/>
            <PromptSuggestionsRow />
          </>
        ) : (
          <>
          <LoadingAnimation />
            <form onSubmit={handleSubmit}>
              <input
              
                className="question-box"
                onChange={handleInputChange}
                value={input}
                placeholder="Ask me anything..."
              />
              <input type="submit" />
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default Home;
