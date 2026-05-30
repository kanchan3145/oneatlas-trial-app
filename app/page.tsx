"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");

  async function generateAppSpec() {
    setResult("Generating...");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f3f4f6", padding: "40px" }}>
      <h1 style={{ fontSize: "40px", fontWeight: "bold", color: "black", marginBottom: "24px" }}>
        OneAtlas AppSpec Generator
      </h1>

      <section style={{ background: "white", padding: "24px", borderRadius: "12px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "black" }}>
          Prompt Input
        </h2>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{
            width: "100%",
            minHeight: "150px",
            color: "black",
            background: "white",
            border: "2px solid black",
            padding: "12px",
            fontSize: "18px",
            marginTop: "12px",
          }}
          placeholder="Describe your application..."
        />

        <button
          onClick={generateAppSpec}
          style={{
            marginTop: "16px",
            background: "blue",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Generate AppSpec
        </button>
      </section>

      <section style={{ marginTop: "24px", background: "white", padding: "24px", borderRadius: "12px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "black" }}>
          Output
        </h2>

        <pre style={{ color: "black", background: "#f9fafb", padding: "16px", marginTop: "12px", whiteSpace: "pre-wrap" }}>
          {result || "No output yet."}
        </pre>
      </section>
    </main>
  );
}
