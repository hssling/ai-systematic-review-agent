import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are an assistant that generates CBME-aligned teaching resources per NMC GMER and AETCOM.
Return structured, practical outputs (lesson plans, case vignettes, MCQs with keys, OSCE stations) with alignment/integration notes and assessment blueprinting.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kind, topic, competencies, audience, durationMin } = body ?? {};

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userPrompt = [
    `Kind: ${kind ?? "LessonPlan"}`,
    `Topic: ${topic ?? ""}`,
    `Competencies: ${(competencies ?? []).join(", ")}`,
    `Audience: ${audience ?? "MBBS Phase I"}`,
    `Duration: ${durationMin ?? 60} min`,
    "Format:",
    "- Objectives mapped to competencies (Miller level, domain)",
    "- Teaching-learning methods (innovative: SDL/DOAP/TBL/CBL/flipped)",
    "- Alignment/Integration notes (horizontal/vertical)",
    "- Assessment blueprint (method, weight)",
    "- Resources and facilitation notes",
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices?.[0]?.message?.content ?? "";
  return NextResponse.json({ content });
}

