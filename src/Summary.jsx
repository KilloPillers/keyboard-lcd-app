import React from "react";
import Markdown from "react-markdown";
import readme from "../README.md?raw";

function Summary() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        alignSelf: "self-start",
        justifyContent: "flex-start",
        width: "100%",
        marginTop: "375px",
        textAlign: "left",
        gap: "2.5rem"
      }}
    >
      <div
        style={{
          flex: 6,
        }}
      >
        <Markdown>{readme}</Markdown>
      </div>
      <img
        style={{
          flex: 4,
          width: 600,
          height: 600,
        }}
        src="collage_small.png"
        alt="Images"
      ></img>
    </div>
  );
}

export default Summary;
