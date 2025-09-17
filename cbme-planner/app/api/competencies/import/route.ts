import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { json } = await req.json();
  const messages: string[] = [];
  try {
    const arr = JSON.parse(json ?? "[]");
    if (!Array.isArray(arr)) {
      return NextResponse.json({ messages: ["Invalid JSON: expected array"] }, { status: 400 });
    }
    for (const item of arr) {
      const { code, title, description, domain, millerLevel, phase, subject, tags } = item ?? {};
      if (!code || !title) {
        messages.push(`Skipped: missing code/title`);
        continue;
      }
      const comp = await prisma.competency.upsert({
        where: { code },
        update: { title, description, domain, millerLevel, phase, subject },
        create: { code, title, description: description ?? "", domain: domain ?? "", millerLevel: millerLevel ?? "", phase: phase ?? "", subject: subject ?? null },
      });
      if (Array.isArray(tags)) {
        await prisma.competencyTag.deleteMany({ where: { competencyId: comp.id } });
        for (const t of tags) {
          if (typeof t === "string" && t.trim()) {
            await prisma.competencyTag.create({ data: { competencyId: comp.id, value: t.trim() } });
          }
        }
      }
      messages.push(`Upserted ${code}`);
    }
  } catch (e: any) {
    messages.push(`Error: ${e.message ?? String(e)}`);
    return NextResponse.json({ messages }, { status: 400 });
  }
  return NextResponse.json({ messages });
}

