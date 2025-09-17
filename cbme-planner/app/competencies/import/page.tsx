"use client";
import { useState } from "react";

export default function ImportCompetenciesPage() {
  const [json, setJson] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setLog([]);
    try {
      const res = await fetch("/competencies/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json }),
      });
      const data = await res.json();
      setLog(data.messages ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-4">
      <h2 className="text-xl font-semibold">Import Competencies (JSON)</h2>
      <p className="text-sm text-gray-600">Paste an array of competencies with fields: code, title, description, domain, millerLevel, phase, subject, tags[].</p>
      <textarea
        className="h-64 w-full rounded border p-2 font-mono text-sm"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='[{"code":"AN 1.1","title":"...","description":"...","domain":"Knowledge","millerLevel":"Knows","phase":"I","subject":"Anatomy","tags":["MustKnow"]}]'
      />
      <button
        className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        onClick={submit}
        disabled={busy}
      >
        {busy ? "Importing..." : "Import"}
      </button>

      {!!log.length && (
        <div className="rounded border bg-gray-50 p-3 text-sm">
          <ul className="list-disc pl-5">
            {log.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

