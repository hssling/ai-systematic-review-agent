import { prisma } from "@/lib/prisma";

export default async function CompetenciesPage() {
  const competencies = await prisma.competency.findMany({
    orderBy: { code: "asc" },
    include: { tags: true },
  });

  return (
    <main className="space-y-4">
      <h2 className="text-xl font-semibold">Competencies</h2>
      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Code</th>
              <th className="p-2">Title</th>
              <th className="p-2">Domain</th>
              <th className="p-2">Miller</th>
              <th className="p-2">Phase</th>
              <th className="p-2">Must</th>
              <th className="p-2">Tags</th>
            </tr>
          </thead>
          <tbody>
            {competencies.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 font-medium">{c.code}</td>
                <td className="p-2">{c.title}</td>
                <td className="p-2">{c.domain}</td>
                <td className="p-2">{c.millerLevel}</td>
                <td className="p-2">{c.phase}</td>
                <td className="p-2">{c.mustKnow ? "Yes" : "No"}</td>
                <td className="p-2">{c.tags.map(t => t.value).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

