"use client";
import Image from "next/image";
import germanAmericanLogo from "./assets/german_american.png";
import healthCareIcon from "./assets/healthcareicon.svg";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";

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
              The Ultime place for learning about longevity and health.
            </p>
          </>
        ) : (
          <>
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
