import React from "react";

const Bubble = ({message}: {message: Message}) => {
  const {content,role} = message;
  return <div className={`bubble ${role}`}>{content}</div>;
};

export default Bubble;
