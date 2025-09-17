export default function HomePage() {
  return (
    <main className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CBME Curriculum Planner</h1>
        <div className="text-sm text-gray-600">Aligned to NMC GMER & AETCOM</div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/competencies" className="rounded-md border p-4 hover:bg-gray-50">
          <div className="font-medium">Competencies</div>
          <div className="text-sm text-gray-600">Manage GMER/AETCOM competencies</div>
        </a>
        <a href="/batches" className="rounded-md border p-4 hover:bg-gray-50">
          <div className="font-medium">Batches & Timetables</div>
          <div className="text-sm text-gray-600">Create schedules with alignment/integration</div>
        </a>
        <a href="/coverage" className="rounded-md border p-4 hover:bg-gray-50">
          <div className="font-medium">Coverage Tracking</div>
          <div className="text-sm text-gray-600">Track coverage by batch, subject, competency</div>
        </a>
        <a href="/ai" className="rounded-md border p-4 hover:bg-gray-50">
          <div className="font-medium">AI Materials</div>
          <div className="text-sm text-gray-600">Generate plans, cases, MCQs, OSCE</div>
        </a>
      </section>
    </main>
  );
}

