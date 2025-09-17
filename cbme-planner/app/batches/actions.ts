"use server";
import { prisma } from "@/lib/prisma";

export async function createBatch(formData: FormData): Promise<void> {
  const name = String(formData.get("name") || "").trim();
  const phase = String(formData.get("phase") || "").trim();
  const year = Number(formData.get("year") || 0);
  const students = Number(formData.get("students") || 150);
  if (!name || !phase || !year) return;
  await prisma.batch.create({ data: { name, phase, year, students } });
}

