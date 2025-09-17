import { prisma } from "@/lib/prisma";

export default async function CoveragePage() {
  const batches = await prisma.batch.findMany({
    include: {
      subjects: true,
      schedules: { include: { sessions: { include: { mappings: true } } } },
    },
    orderBy: { year: "desc" },
  });

  const rows = batches.map((b) => {
    const sessions = b.schedules.flatMap((s) => s.sessions);
    const mapped = sessions.flatMap((s) => s.mappings);
    const uniqueCompetencies = new Set(mapped.map((m) => m.competencyId));
    return {
      id: b.id,
      name: b.name,
      totalSessions: sessions.length,
      competenciesCovered: uniqueCompetencies.size,
    };
  });

  return (
    <main className="space-y-4">
      <h2 className="text-xl font-semibold">Coverage Tracking</h2>
      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Batch</th>
              <th className="p-2">Sessions</th>
              <th className="p-2">Competencies covered</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-medium">{r.name}</td>
                <td className="p-2">{r.totalSessions}</td>
                <td className="p-2">{r.competenciesCovered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

