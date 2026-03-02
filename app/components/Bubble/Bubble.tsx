import React from "react";
import type { UIMessage } from "ai";
import "./Bubble.css";
function getMessageText(message: UIMessage): string {
  const parts = message.parts ?? [];
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && "text" in p)
    .map((p) => p.text)
    .join("");
}

const Bubble = ({ message }: { message: UIMessage }) => {
  const content = getMessageText(message);
  const { role } = message;
  return <div className={`bubble ${role}`}>{content}</div>;
};

export default Bubble;
