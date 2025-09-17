"use client";
import { useState } from "react";

export default function AIPage() {
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState("LessonPlan");
  const [competencies, setCompetencies] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          topic,
          competencies: competencies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          audience: "MBBS",
          durationMin,
        }),
      });
      const data = await res.json();
      setOutput(data.content ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <h2 className="text-xl font-semibold">AI-generated Teaching Materials</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <div className="text-sm font-medium">Kind</div>
          <select
            className="mt-1 w-full rounded border p-2"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option>LessonPlan</option>
            <option>Case</option>
            <option>MCQs</option>
            <option>OSCE</option>
            <option>Reflection</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-medium">Topic</div>
          <input
            className="mt-1 w-full rounded border p-2"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Cardiac cycle"
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium">Competency codes (comma separated)</div>
          <input
            className="mt-1 w-full rounded border p-2"
            value={competencies}
            onChange={(e) => setCompetencies(e.target.value)}
            placeholder="e.g., PY 1.1, AT 1.1"
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium">Duration (min)</div>
          <input
            type="number"
            className="mt-1 w-full rounded border p-2"
            value={durationMin}
            onChange={(e) => setDurationMin(parseInt(e.target.value || "0", 10))}
          />
        </label>
      </div>

      <button
        className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        onClick={generate}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {output && (
        <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-4 text-sm">
          {output}
        </pre>
      )}
    </main>
  );
}

