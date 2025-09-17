import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { createBatch } from "./actions";

export default async function BatchesPage() {
  const batches = await prisma.batch.findMany({
    include: { subjects: true, schedules: true },
    orderBy: { year: "desc" },
  });

  return (
    <main className="space-y-4">
      <h2 className="text-xl font-semibold">Batches & Timetables</h2>
      <form action={createBatch} className="rounded border p-4 grid gap-3 sm:grid-cols-5">
        <input name="name" placeholder="Batch name" className="rounded border p-2" />
        <input name="phase" placeholder="Phase (I/II/III)" className="rounded border p-2" />
        <input name="year" type="number" placeholder="Year" className="rounded border p-2" />
        <input name="students" type="number" placeholder="Students" className="rounded border p-2" />
        <button className="rounded bg-gray-900 px-4 py-2 text-white">Create</button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        {batches.map((b) => (
          <div key={b.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{b.name}</div>
              <div className="text-sm text-gray-600">Phase {b.phase} · {b.year}</div>
            </div>
            <div className="mt-2 text-sm text-gray-700">Subjects: {b.subjects.map(s => s.name).join(", ") || "—"}</div>
            <div className="mt-1 text-sm text-gray-700">
              Schedules: {b.schedules.length ? b.schedules.map(s => `${format(s.startDate, 'dd MMM')}–${format(s.endDate, 'dd MMM')}`).join(", ") : "—"}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

